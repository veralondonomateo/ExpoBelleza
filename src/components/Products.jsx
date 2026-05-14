import { useState } from 'react'
import { Edit2, X, Check, ChevronUp, ChevronDown, Package, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$ } from '../utils/formatters'

function EditModal({ product, onSave, onClose }) {
  const [price, setPrice]      = useState(String(product.price || ''))
  const [toAdd, setToAdd]      = useState(0)
  const [resetStock, setReset] = useState(false)

  const newStock = resetStock ? Number(toAdd) : product.stock + Number(toAdd)

  const handleSave = () => {
    onSave({ ...product, price: Number(price), stock: newStock })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-[380px]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <img src={`/${product.id}.webp`} alt={product.name}
              className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{product.name}</p>
              <p className="text-[11px] text-gray-400">Editar producto</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0 ml-2">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Precio de venta</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
                className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Inventario</label>
              <span className="text-[11px] text-gray-400">Actual: <strong className="text-gray-600">{product.stock}</strong> uds.</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setToAdd(Math.max(0, toAdd - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition flex-shrink-0">
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              <input type="number" value={toAdd} onChange={e => setToAdd(Math.max(0, Number(e.target.value)))}
                className="flex-1 text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition" />
              <button onClick={() => setToAdd(toAdd + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition flex-shrink-0">
                <ChevronUp size={16} className="text-gray-500" />
              </button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={resetStock} onChange={e => setReset(e.target.checked)} className="rounded accent-brand-red" />
              <span className="text-xs text-gray-500">Reemplazar stock (no sumar)</span>
            </label>
            {toAdd > 0 && <p className="text-xs text-brand-red mt-2 font-medium">Nuevo stock: {newStock} unidades</p>}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-brand-red text-white text-sm font-semibold hover:bg-brand-red/90 transition flex items-center justify-center gap-2">
            <Check size={14} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const { products, updateProduct } = useApp()
  const [editing, setEditing] = useState(null)

  const totalStock = products.reduce((a, p) => a + p.stock, 0)
  const noPrice    = products.filter(p => p.price === 0).length

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Productos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona precios e inventario</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {noPrice > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-600 font-medium whitespace-nowrap">{noPrice} sin precio</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-soft border border-brand-light rounded-xl">
            <Package size={13} className="text-brand-red flex-shrink-0" />
            <span className="text-xs font-semibold text-brand-red whitespace-nowrap">{totalStock} uds.</span>
          </div>
        </div>
      </div>

      {/* Grid: 1 col on small, 2 on tablet, 3 on lg, 5 on xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow group">
            {/* Image */}
            <div className="relative bg-brand-soft aspect-[4/3] overflow-hidden">
              <img src={`/${p.id}.webp`} alt={p.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                p.stock > 5 ? 'bg-green-500 text-white' :
                p.stock > 0 ? 'bg-amber-400 text-white' :
                              'bg-red-100 text-red-500'
              }`}>
                {p.stock > 0 ? `${p.stock} uds.` : 'Sin stock'}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-semibold text-gray-800 text-sm leading-snug mb-0.5 line-clamp-2">{p.name}</p>
              <p className="text-[11px] text-gray-400 mb-3 font-mono truncate">{p.barcode}</p>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold ${p.price > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                  {p.price > 0 ? fmt$(p.price) : 'Sin precio'}
                </span>
              </div>
              <button onClick={() => setEditing(p)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:border-brand-pink hover:text-brand-red hover:bg-brand-soft transition-all">
                <Edit2 size={11} /> Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && <EditModal product={editing} onSave={updateProduct} onClose={() => setEditing(null)} />}
    </div>
  )
}
