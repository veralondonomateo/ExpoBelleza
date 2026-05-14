import { useState, useMemo } from 'react'
import { Search, X, Eye, ClipboardList, Banknote, Smartphone, CreditCard, User, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$, fmtDate, isToday } from '../utils/formatters'

const PAY_COLORS = {
  efectivo:      { bg: 'bg-green-50',  text: 'text-green-700'  },
  transferencia: { bg: 'bg-blue-50',   text: 'text-blue-700'   },
  tarjeta:       { bg: 'bg-purple-50', text: 'text-purple-700' },
}
const PAY_ICONS = { efectivo: Banknote, transferencia: Smartphone, tarjeta: CreditCard }

function DetailModal({ sale, onClose }) {
  const Icon = PAY_ICONS[sale.paymentMethod] || Banknote
  const col  = PAY_COLORS[sale.paymentMethod] || PAY_COLORS.efectivo
  const shortId = sale.id.slice(-6).toUpperCase()

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 lg:px-6 pt-5 lg:pt-6 pb-4 border-b border-gray-50">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Pedido #{shortId}
            </p>
            <p className="text-xs text-gray-400">{fmtDate(sale.date)}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 lg:px-6 py-5 space-y-5">
          {/* Cliente */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User size={11} /> Cliente
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Nombre',   sale.customer?.name     || '—'],
                ['Celular',  sale.customer?.phone    || '—'],
                ['Correo',   sale.customer?.email    || '—'],
                ['Cédula',   sale.customer?.document || '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 font-medium">{k}</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5 truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Productos */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Package size={11} /> Productos
            </p>
            <div className="space-y-2">
              {sale.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                  <img src={`/${item.productId}.webp`} alt=""
                    className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.quantity} ud. × {fmt$(item.price)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                    {fmt$(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total + pago */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${col.bg}`}>
              <Icon size={13} className={col.text} />
              <span className={`text-xs font-semibold capitalize ${col.text}`}>
                {sale.paymentMethod}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-brand-red">{fmt$(sale.total)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const { sales } = useApp()
  const [search,    setSearch]    = useState('')
  const [filterPay, setFilterPay] = useState('all')
  const [selected,  setSelected]  = useState(null)

  const todaySales   = useMemo(() => sales.filter(s => isToday(s.date)), [sales])
  const todayRevenue = useMemo(() => todaySales.reduce((a, s) => a + s.total, 0), [todaySales])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return sales
      .filter(s => {
        if (!q) return true
        return (
          s.customer?.name?.toLowerCase().includes(q)     ||
          s.customer?.document?.includes(q)               ||
          s.customer?.phone?.includes(q)                  ||
          s.items?.some(i => i.productName.toLowerCase().includes(q))
        )
      })
      .filter(s => filterPay === 'all' || s.paymentMethod === filterPay)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [sales, search, filterPay])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5 lg:mb-7">
        <div>
          <h1 className="text-xl lg:text-[22px] font-bold text-gray-800">Pedidos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Historial completo de ventas</p>
        </div>
        <div className="flex gap-2 lg:gap-3 flex-wrap">
          <div className="bg-white rounded-xl shadow-card px-3 lg:px-4 py-2.5 lg:py-3 text-center min-w-[64px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Hoy</p>
            <p className="text-lg lg:text-xl font-bold text-brand-red mt-0.5">{todaySales.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card px-3 lg:px-4 py-2.5 lg:py-3 text-center min-w-[64px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-lg lg:text-xl font-bold text-gray-800 mt-0.5">{sales.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card px-3 lg:px-4 py-2.5 lg:py-3 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ingresos hoy</p>
            <p className="text-lg lg:text-xl font-bold text-gray-800 mt-0.5">{fmt$(todayRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card p-3 lg:p-4 mb-4 lg:mb-5 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2.5 bg-gray-50 border border-transparent rounded-xl px-3.5 focus-within:border-brand-red/30 focus-within:bg-white transition">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula, celular, producto..."
            className="flex-1 py-2.5 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Payment filter */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: 'all',           label: 'Todos'   },
            { id: 'efectivo',      label: 'Efectivo' },
            { id: 'transferencia', label: 'Transfer' },
            { id: 'tarjeta',       label: 'Tarjeta'  },
          ].map(opt => (
            <button key={opt.id} onClick={() => setFilterPay(opt.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                filterPay === opt.id
                  ? 'bg-brand-red text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 lg:py-20 text-center">
            <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {sales.length === 0 ? 'No hay pedidos registrados aún' : 'Ningún pedido coincide con la búsqueda'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-50">
                  {['#', 'Fecha', 'Cliente', 'Productos', 'Pago', 'Total', ''].map(h => (
                    <th key={h} className="px-4 lg:px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(sale => {
                  const col  = PAY_COLORS[sale.paymentMethod] || PAY_COLORS.efectivo
                  const Icon = PAY_ICONS[sale.paymentMethod]  || Banknote
                  const shortId = sale.id.slice(-6).toUpperCase()
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 lg:px-5 py-3 lg:py-4">
                        <span className="text-[11px] font-bold text-gray-400 font-mono">#{shortId}</span>
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 whitespace-nowrap">
                        <p className="text-xs text-gray-500">{fmtDate(sale.date)}</p>
                        {isToday(sale.date) && (
                          <span className="text-[9px] font-bold text-brand-red bg-brand-light px-1.5 py-0.5 rounded-full mt-1 inline-block">
                            HOY
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">
                        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{sale.customer?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{sale.customer?.phone || ''}</p>
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {sale.items?.slice(0, 2).map((item, i) => (
                            <span key={i} className="inline-flex items-center bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap">
                              {item.quantity}× {item.productName}
                            </span>
                          ))}
                          {(sale.items?.length ?? 0) > 2 && (
                            <span className="text-[10px] text-gray-400 px-1 py-1">+{sale.items.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${col.bg} ${col.text}`}>
                          <Icon size={10} />
                          <span className="capitalize">{sale.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">
                        <p className="text-sm font-bold text-gray-800 whitespace-nowrap">{fmt$(sale.total)}</p>
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4">
                        <button
                          onClick={() => setSelected(sale)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-brand-light hover:text-brand-red flex items-center justify-center text-gray-400 transition opacity-0 group-hover:opacity-100"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <DetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
