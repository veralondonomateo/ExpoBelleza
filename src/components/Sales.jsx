import { useState, useRef, useCallback } from 'react'
import {
  Scan, X, Plus, Minus, Trash2, Check, ChevronRight,
  Banknote, Smartphone, CreditCard, AlertTriangle, RotateCcw,
  User, ShoppingBag, Zap, ScanLine,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$ } from '../utils/formatters'

const PAY_METHODS = [
  { id: 'efectivo',      label: 'Efectivo',      icon: Banknote,   color: '#34D399' },
  { id: 'transferencia', label: 'Transferencia',  icon: Smartphone, color: '#60A5FA' },
  { id: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard, color: '#A78BFA' },
]

function SuccessOverlay({ sale, onNew }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-md text-center p-10">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <Check size={36} className="text-green-500" strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">¡Venta completada!</h2>
        <p className="text-sm text-gray-400 mb-6">
          {sale.customer?.name && <><strong className="text-gray-600">{sale.customer.name}</strong> · </>}
          {fmt$(sale.total)} · <span className="capitalize">{sale.paymentMethod}</span>
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 mb-7 text-left space-y-2">
          {sale.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{item.quantity}× {item.productName}</span>
              <span className="font-semibold text-gray-800">{fmt$(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
            <span>Total</span><span>{fmt$(sale.total)}</span>
          </div>
        </div>
        <button onClick={onNew}
          className="w-full py-3.5 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-brand-red/90 transition flex items-center justify-center gap-2">
          <Zap size={16} />
          Nueva venta
        </button>
      </div>
    </div>
  )
}

export default function Sales({ onNav }) {
  const { products, addSale } = useApp()

  const [scanMode,  setScanMode]  = useState(false)
  const [scanError, setScanError] = useState(null)
  const [lastAdded, setLastAdded] = useState(null)
  const [cart,      setCart]      = useState([])
  const [customer,  setCustomer]  = useState({ name: '', phone: '', email: '', document: '' })
  const [payMethod, setPayMethod] = useState('efectivo')
  const [success,   setSuccess]   = useState(null)
  const [formError, setFormError] = useState(null)

  const scanInputRef = useRef(null)

  // Re-focus the scanner input (used after every button click while in scan mode)
  const refocus = useCallback(() => {
    setTimeout(() => scanInputRef.current?.focus(), 0)
  }, [])

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const exists = prev.find(i => i.productId === product.id)
      if (exists) return prev.map(i =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      )
      return [...prev, {
        productId:   product.id,
        productName: product.name,
        price:       product.price,
        quantity:    1,
      }]
    })
    setLastAdded(product)
    setTimeout(() => setLastAdded(null), 2500)
  }, [])

  // Called with the raw barcode string
  const processBarcode = useCallback((code) => {
    if (!code || code.length < 4) return
    const product = products.find(p => p.barcode === code)
    if (!product) {
      setScanError(`Código "${code}" no encontrado`)
      setTimeout(() => setScanError(null), 3500)
      return
    }
    setScanError(null)
    addToCart(product)
  }, [products, addToCart])

  // ── Scanner input handlers (uncontrolled) ──────────────────
  const handleScanKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const code = e.target.value.trim()
    e.target.value = ''              // clear directly on DOM node
    processBarcode(code)
  }

  const handleScanPaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text').trim()
    e.target.value = ''
    processBarcode(text)
  }

  // If scanner input loses focus, get it back — UNLESS a customer field took it
  const handleScanBlur = (e) => {
    const next = e.relatedTarget
    const isCustomerField = next?.dataset?.customerField === 'true'
    if (!isCustomerField) {
      requestAnimationFrame(() => scanInputRef.current?.focus())
    }
  }

  const toggleScanMode = () => {
    const next = !scanMode
    setScanMode(next)
    setScanError(null)
    if (next) {
      // Focus AFTER render so the input exists in the DOM
      setTimeout(() => scanInputRef.current?.focus(), 0)
    }
  }

  const updateQty  = (id, d) => setCart(p => p.map(i => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))
  const removeItem = (id)    => setCart(p => p.filter(i => i.productId !== id))
  const total      = cart.reduce((a, i) => a + i.price * i.quantity, 0)
  const noPrice    = cart.some(i => i.price === 0)

  const handleFinalize = () => {
    if (cart.length === 0)     { setFormError('Agrega al menos un producto.'); return }
    if (!customer.name.trim()) { setFormError('El nombre del cliente es obligatorio.'); return }
    setFormError(null)
    const sale = addSale({ items: cart, customer, paymentMethod: payMethod, total })
    setSuccess(sale)
  }

  const handleNewSale = () => {
    setSuccess(null); setCart([])
    setCustomer({ name: '', phone: '', email: '', document: '' })
    setPayMethod('efectivo'); setScanMode(false)
  }

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-gray-800">Nueva Venta</h1>
        <p className="text-sm text-gray-400 mt-0.5">Escanea los productos y completa el formulario</p>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── LEFT ─────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Scanner card */}
          <div className={`bg-white rounded-2xl shadow-card p-6 border-2 transition-all duration-200 ${
            scanMode ? 'border-brand-red/40' : 'border-transparent'
          }`}>

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Escáner de productos</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {scanMode ? 'Apunta el lector al código ahora' : 'Activa y apunta el lector'}
                </p>
              </div>
              {/* onMouseDown preventDefault evita que el botón robe el foco */}
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={toggleScanMode}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  scanMode
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'bg-brand-light text-brand-red hover:bg-brand-red hover:text-white'
                }`}
              >
                <ScanLine size={16} className={scanMode ? 'animate-pulse' : ''} />
                {scanMode ? 'Escaneando...' : 'Activar escáner'}
              </button>
            </div>

            {/* ── Scanner input — visible, uncontrolled ── */}
            {scanMode && (
              <div className="mb-4 space-y-2">
                <input
                  ref={scanInputRef}
                  // uncontrolled: no value / onChange
                  autoFocus
                  onKeyDown={handleScanKeyDown}
                  onPaste={handleScanPaste}
                  onBlur={handleScanBlur}
                  placeholder="Esperando código de barras..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-brand-red/40 bg-brand-soft font-mono text-sm text-brand-red placeholder:text-gray-300 focus:outline-none focus:border-brand-red transition"
                />

                {scanError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                    <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-500 font-medium">{scanError}</p>
                  </div>
                )}

                {lastAdded && (
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl">
                    <img src={`/${lastAdded.id}.webp`} alt=""
                      className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                    <p className="text-xs text-green-700 font-semibold">
                      {lastAdded.name}{' '}
                      <span className="font-normal text-green-600">agregado al carrito ✓</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick-add manual */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                Agregar manualmente
              </p>
              <div className="flex flex-wrap gap-2">
                {products.map(p => (
                  <button
                    key={p.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { addToCart(p); if (scanMode) refocus() }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand-pink hover:bg-brand-soft transition text-xs font-medium text-gray-600"
                  >
                    <img src={`/${p.id}.webp`} alt="" className="w-5 h-5 rounded object-cover" />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-brand-red" />
                <h2 className="text-sm font-semibold text-gray-700">Carrito</h2>
                {cart.length > 0 && (
                  <span className="bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cart.reduce((a, i) => a + i.quantity, 0)}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setCart([]); if (scanMode) refocus() }}
                  className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition"
                >
                  <RotateCcw size={12} /> Vaciar
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-14 text-center">
                <ShoppingBag size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-300">El carrito está vacío</p>
                <p className="text-xs text-gray-200 mt-1">Escanea o agrega productos arriba</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map(item => {
                  const prod = products.find(p => p.id === item.productId)
                  return (
                    <div key={item.productId} className="px-6 py-4 flex items-center gap-4">
                      <img src={`/${item.productId}.webp`} alt={item.productName}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        <p className={`text-xs mt-0.5 ${item.price > 0 ? 'text-gray-400' : 'text-amber-500 font-medium'}`}>
                          {item.price > 0 ? `${fmt$(item.price)} / ud.` : 'Sin precio configurado'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { updateQty(item.productId, -1); if (scanMode) refocus() }}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                        >
                          <Minus size={12} className="text-gray-500" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-gray-700">{item.quantity}</span>
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { updateQty(item.productId, +1); if (scanMode) refocus() }}
                          disabled={prod && prod.stock > 0 && item.quantity >= prod.stock}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-30"
                        >
                          <Plus size={12} className="text-gray-500" />
                        </button>
                      </div>
                      <div className="w-20 text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-800">{fmt$(item.price * item.quantity)}</p>
                      </div>
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { removeItem(item.productId); if (scanMode) refocus() }}
                        className="text-gray-300 hover:text-red-400 transition flex-shrink-0 ml-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                })}
                <div className="px-6 py-4 bg-gray-50/60 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Total</span>
                  <span className="text-xl font-bold text-brand-red">{fmt$(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ────────────────────────────────────── */}
        <div className="space-y-5 sticky top-8">

          {/* Customer form */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User size={15} className="text-brand-red" />
              Datos del cliente
            </h2>
            <div className="space-y-3">
              {[
                { key: 'name',     label: 'Nombre completo *', placeholder: 'María García',    type: 'text'  },
                { key: 'phone',    label: 'Celular',            placeholder: '3001234567',      type: 'tel'   },
                { key: 'email',    label: 'Correo electrónico', placeholder: 'maria@email.com', type: 'email' },
                { key: 'document', label: 'Cédula / NIT',       placeholder: '1234567890',      type: 'text'  },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={customer[key]}
                    onChange={e => setCustomer({ ...customer, [key]: e.target.value })}
                    placeholder={placeholder}
                    data-customer-field="true"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <CreditCard size={15} className="text-brand-red" />
              Método de pago
            </h2>
            <div className="space-y-2">
              {PAY_METHODS.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setPayMethod(id); if (scanMode) refocus() }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    payMethod === id ? 'border-brand-red bg-brand-soft' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '18' }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <span className={`text-sm font-semibold ${payMethod === id ? 'text-brand-red' : 'text-gray-600'}`}>
                    {label}
                  </span>
                  {payMethod === id && <Check size={15} className="ml-auto text-brand-red" />}
                </button>
              ))}
            </div>
          </div>

          {/* Total + Finalize */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-gray-500">Total a cobrar</span>
              <span className="text-2xl font-bold text-brand-red">{fmt$(total)}</span>
            </div>

            {noPrice && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Hay productos sin precio. Ve a{' '}
                  <button onClick={() => onNav('products')} className="underline font-semibold">Productos</button>
                  {' '}para configurarlos.
                </p>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl mb-4">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}

            <button
              onClick={handleFinalize}
              disabled={cart.length === 0}
              className="w-full py-4 bg-brand-red text-white rounded-xl font-bold text-sm hover:bg-brand-red/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Check size={17} strokeWidth={2.5} />
              Finalizar compra
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {success && <SuccessOverlay sale={success} onNew={handleNewSale} />}
    </div>
  )
}
