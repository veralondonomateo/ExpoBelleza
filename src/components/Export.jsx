import { useState } from 'react'
import { Download, FileSpreadsheet, Users, Package, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$, fmtDate } from '../utils/formatters'

function downloadCSV(filename, headers, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ExportCard({ icon: Icon, color, title, description, count, countLabel, preview, onExport, disabled }) {
  const [done, setDone] = useState(false)

  const handle = () => {
    onExport()
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 lg:p-6 flex flex-col gap-4 lg:gap-5">
      <div className="flex items-start gap-3 lg:gap-4">
        <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '18' }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl lg:text-2xl font-bold text-gray-800">{count}</p>
          <p className="text-[10px] text-gray-400">{countLabel}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl px-3 lg:px-4 py-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Columnas incluidas</p>
        <div className="flex flex-wrap gap-1.5">
          {preview.map(col => (
            <span key={col} className="bg-white border border-gray-200 text-gray-500 text-[10px] font-medium px-2 py-1 rounded-lg">
              {col}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handle}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
          done
            ? 'bg-green-50 text-green-600 border border-green-200'
            : disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-brand-red text-white hover:bg-brand-red/90 shadow-sm'
        }`}
      >
        {done
          ? <><Check size={15} /> Descargado</>
          : <><Download size={15} /> Descargar CSV</>
        }
      </button>
    </div>
  )
}

export default function Export() {
  const { sales, products } = useApp()

  const exportSales = () => {
    const headers = ['Fecha', 'Hora', 'Pedido #', 'Cliente', 'Celular', 'Correo', 'Cédula/NIT',
                     'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Total Pedido', 'Método de Pago']
    const rows = []
    sales.forEach(s => {
      const d = new Date(s.date)
      const fecha = d.toLocaleDateString('es-CO')
      const hora  = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      const id    = s.id.slice(-6).toUpperCase();
      (s.items ?? []).forEach(item => {
        rows.push([
          fecha, hora, id,
          s.customer?.name     ?? '',
          s.customer?.phone    ?? '',
          s.customer?.email    ?? '',
          s.customer?.document ?? '',
          item.productName,
          item.quantity,
          item.price,
          item.price * item.quantity,
          s.total,
          s.paymentMethod,
        ])
      })
    })
    downloadCSV(`expobelleza_ventas_${today()}.csv`, headers, rows)
  }

  const exportClientes = () => {
    const map = {}
    sales.forEach(s => {
      const key = s.customer?.document || s.customer?.phone || s.customer?.email || s.customer?.name || 'sin-id'
      if (!map[key]) {
        map[key] = { name: s.customer?.name ?? '', phone: s.customer?.phone ?? '',
                     email: s.customer?.email ?? '', document: s.customer?.document ?? '',
                     count: 0, total: 0 }
      }
      map[key].count++
      map[key].total += s.total
    })
    const headers = ['Nombre', 'Celular', 'Correo', 'Cédula/NIT', 'N° Compras', 'Total Gastado']
    const rows = Object.values(map).map(c => [c.name, c.phone, c.email, c.document, c.count, c.total])
    downloadCSV(`expobelleza_clientes_${today()}.csv`, headers, rows)
  }

  const exportInventory = () => {
    const headers = ['Producto', 'Código de Barras', 'Stock Actual', 'Precio', 'Valor en Inventario']
    const rows = products.map(p => [p.name, p.barcode, p.stock, p.price, p.stock * p.price])
    downloadCSV(`expobelleza_inventario_${today()}.csv`, headers, rows)
  }

  const today = () => new Date().toISOString().slice(0, 10)

  const uniqueCustomers = new Set(
    sales.map(s => s.customer?.document || s.customer?.phone || s.customer?.email)
  ).size

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl lg:text-[22px] font-bold text-gray-800">Exportar datos</h1>
        <p className="text-sm text-gray-400 mt-0.5">Descarga la información en formato CSV compatible con Excel</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-5 max-w-2xl">
        <ExportCard
          icon={FileSpreadsheet}
          color="#ED5340"
          title="Ventas completas"
          description="Todas las transacciones con detalle de cliente y productos"
          count={sales.length}
          countLabel="ventas registradas"
          preview={['Fecha', 'Hora', 'Cliente', 'Celular', 'Correo', 'Cédula', 'Producto', 'Cantidad', 'Total', 'Pago']}
          onExport={exportSales}
          disabled={sales.length === 0}
        />
        <ExportCard
          icon={Users}
          color="#60A5FA"
          title="Base de clientes"
          description="Lista única de compradores con historial y total gastado"
          count={uniqueCustomers}
          countLabel="clientes únicos"
          preview={['Nombre', 'Celular', 'Correo', 'Cédula/NIT', 'N° Compras', 'Total Gastado']}
          onExport={exportClientes}
          disabled={sales.length === 0}
        />
        <ExportCard
          icon={Package}
          color="#34D399"
          title="Inventario actual"
          description="Estado del stock y precios de los 5 productos"
          count={products.reduce((a, p) => a + p.stock, 0)}
          countLabel="unidades en stock"
          preview={['Producto', 'Código de Barras', 'Stock Actual', 'Precio', 'Valor en Inventario']}
          onExport={exportInventory}
          disabled={false}
        />
      </div>

      <div className="mt-6 lg:mt-8 max-w-2xl bg-brand-soft border border-brand-light rounded-2xl px-4 lg:px-5 py-4">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-700">Tip:</strong> Abre el CSV en Excel → selecciona la columna A → usa{' '}
          <em>Datos › Texto en columnas</em> con delimitador <strong>coma</strong>.
          En Google Sheets simplemente importa el archivo.
        </p>
      </div>
    </div>
  )
}
