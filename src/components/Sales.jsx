import { useState, useRef, useCallback } from 'react'
import {
  X, Plus, Minus, Trash2, Check, ChevronRight,
  Banknote, Smartphone, CreditCard, AlertTriangle, RotateCcw,
  User, ShoppingBag, Zap, ScanLine, Camera,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$ } from '../utils/formatters'
import CameraScanner from './CameraScanner'

const PAY_METHODS = [
  { id: 'efectivo',      label: 'Efectivo',      icon: Banknote,   color: '#34D399' },
  { id: 'transferencia', label: 'Transferencia',  icon: Smartphone, color: '#60A5FA' },
  { id: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard, color: '#A78BFA' },
]

function SuccessOverlay({ sale, onNew }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-md text-center p-8">
        <div className="w-18 h-18 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-500" strokeWidth={2.5} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">¡Venta completada!</h2>
        <p className="text-sm text-gray-400 mb-5">
          {sale.customer?.name && <><strong className="text-gray-600">{sale.customer.name}</strong> · </>}
          {fmt$(sale.total)} · <span className="capitalize">{sale.paymentMethod}</span>
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
          {sale.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 truncate mr-2">{item.quantity}× {item.productName}</span>
              <span className="font-semibold text-gray-800 flex-shrink-0">{fmt$(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
            <span>Total</span><span>{fmt$(sale.total)}</span>
          </div>
        </div>
        <button onClick={onNew}
          className="w-full py-3.5 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-brand-red/90 transition flex items-center justify-center gap-2">
          <Zap size={16} /> Nueva venta
        </button>
      </div>
    </div>
  )
}

export default function Sales({ onNav }) {
  const { products, addSale } = useApp()

  const [scanMode,    setScanMode]    = useState(false)
  const [cameraOpen,  setCameraOpen]  = useState(false)
  const [scanError,   setScanError]   = useState(null)
  const [lastAdded,   setLastAdded]   = useState(null)
  const [cart,        setCart]        = useState([])
  const [customer,    setCustomer]    = useState({ name: '', phone: '', email: '', document: '' })
  const [payMethod,   setPayMethod]   = useState('efectivo')
  const [success,     setSuccess]     = useState(null)
  const [formError,   setFormError]   = useState(null)
  const [saving,      setSaving]      = useState(false)

  const scanInputRef = useRef(null)

  const refocus = useCallback(() => {
    setTimeout(() => scanInputRef.current?.focus(), 0)
  }, [])

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const exists = prev.find(i => i.productId === product.id)
      if (exists) return prev.map(i =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      )
      return [...prev, { productId: product.id, productName: product.name, price: product.price, quantity: 1 }]
    })
    setLastAdded(product)
    setTimeout(() => setLastAdded(null), 2500)
  }, [])

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

  const handleCameraDetect = useCallback((code) => {
    processBarcode(code)
  }, [processBarcode])

  const handleScanKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const code = e.target.value.trim()
    e.target.value = ''
    processBarcode(code)
  }
  const handleScanPaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text').trim()
    e.target.value = ''
    processBarcode(text)
  }
  const handleScanBlur = (e) => {
    const next = e.relatedTarget
    if (!next?.dataset?.customerField) requestAnimationFrame(() => scanInputRef.current?.focus())
  }

  const toggleScanMode = () => {
    const next = !scanMode
    setScanMode(next)
    setScanError(null)
    if (next) setTimeout(() => scanInputRef.current?.focus(), 0)
  }

  const updateQty  = (id, d) => setCart(p => p.map(i => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))
  const removeItem = (id)    => setCart(p => p.filter(i => i.productId !== id))
  const total      = cart.reduce((a, i) => a + i.price * i.quantity, 0)
  const noPrice    = cart.some(i => i.price === 0)

  const handleFinalize = async () => {
    if (cart.length === 0)     { setFormError('Agrega al menos un producto.'); return }
    if (!customer.name.trim()) { setFormError('El nombre del cliente es obligatorio.'); return }
    setFormError(null)
    setSaving(true)
    try {
      const sale = await addSale({ items: cart, customer, paymentMethod: payMethod, total })
      setSuccess(sale)
    } catch {
      setFormError('Error al guardar la venta. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleNewSale = () => {
    setSuccess(null); setCart([])
    setCustomer({ name: '', phone: '', email: '', document: '' })
    setPayMethod('efectivo'); setScanMode(false)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-800">Nueva Venta</h1>
        <p className="text-sm text-gray-400 mt-0.5">Escanea los productos y completa el formulario</p>
      </div>

      <div className="flex flex-col xl:grid xl:grid-cols-[1fr_340px] gap-4">

        {/* ── LEFT ─────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Scanner card */}
          <div className={`bg-white rounded-2xl shadow-card p-4 border-2 transition-all duration-200 ${scanMode ? 'border-brand-red/40' : 'border-transparent'}`}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-700">Agregar productos</h2>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {scanMode ? 'Lector activo — apunta el escáner' : 'Usa el lector o la cámara del dispositivo'}
                </p>
              </div>
              {/* Scanner buttons */}
              <div className="flex gap-2 flex-shrink-0">
                {/* Camera button */}
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setCameraOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-brand-light text-brand-red hover:bg-brand-red hover:text-white transition"
                  title="Escanear con cámara"
                >
                  <Camera size={15} />
                  <span className="hidden sm:inline">Cámara</span>
                </button>
                {/* Keyboard scanner button */}
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={toggleScanMode}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    scanMode ? 'bg-brand-red text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Lector de barras USB/Bluetooth"
                >
                  <ScanLine size={15} className={scanMode ? 'animate-pulse' : ''} />
                  <span className="hidden sm:inline">{scanMode ? 'Activo' : 'Lector'}</span>
                </button>
              </div>
            </div>

            {/* Keyboard scanner input */}
            {scanMode && (
              <div className="mb-3 space-y-2">
                <input
                  ref={scanInputRef}
                  autoFocus
                  onKeyDown={handleScanKeyDown}
                  onPaste={handleScanPaste}
                  onBlur={handleScanBlur}
                  placeholder="Esperando código de barras..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-brand-red/40 bg-brand-soft font-mono text-sm text-brand-red placeholder:text-gray-300 focus:outline-none focus:border-brand-red transition"
                />
                {scanError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                    <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-500 font-medium truncate">{scanError}</p>
                  </div>
                )}
              </div>
            )}

            {lastAdded && (
              <div className="flex items-center gap-2.5 px-3 py-2 bg-green-50 border border-green-100 rounded-xl mb-3">
                <img src={`/${lastAdded.id}.webp`} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                <p className="text-xs text-green-700 font-semibold truncate">
                  {lastAdded.name} <span className="font-normal text-green-600">agregado ✓</span>
                </p>
              </div>
            )}

            {/* Quick-add manual */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Agregar manualmente</p>
              <div className="flex flex-wrap gap-2">
                {products.map(p => (
                  <button
                    key={p.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { addToCart(p); if (scanMode) refocus() }}
                    className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand-pink hover:bg-brand-soft transition text-xs font-medium text-gray-600"
                  >
                    <img src={`/${p.id}.webp`} alt="" className="w-5 h-5 rounded object-cover" />
                    <span className="truncate max-w-[80px]">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-brand-red" />
                <h2 className="text-sm font-semibold text-gray-700">Carrito</h2>
                {cart.length > 0 && (
                  <span className="bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cart.reduce((a, i) => a + i.quantity, 0)}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button onMouseDown={e => e.preventDefault()}
                  onClick={() => { setCart([]); if (scanMode) refocus() }}
                  className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition">
                  <RotateCcw size={11} /> Vaciar
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingBag size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-300">El carrito está vacío</p>
                <p className="text-xs text-gray-200 mt-1">Usa el escáner o agrega manualmente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map(item => {
                  const prod = products.find(p => p.id === item.productId)
                  return (
                    <div key={item.productId} className="px-4 py-3 flex items-center gap-3">
                      <img src={`/${item.productId}.webp`} alt={item.productName}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        <p className={`text-xs mt-0.5 ${item.price > 0 ? 'text-gray-400' : 'text-amber-500 font-medium'}`}>
                          {item.price > 0 ? `${fmt$(item.price)} / ud.` : 'Sin precio'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onMouseDown={e => e.preventDefault()}
                          onClick={() => { updateQty(item.productId, -1); if (scanMode) refocus() }}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
                          <Minus size={11} className="text-gray-500" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-700">{item.quantity}</span>
                        <button onMouseDown={e => e.preventDefault()}
                          onClick={() => { updateQty(item.productId, +1); if (scanMode) refocus() }}
                          disabled={prod && prod.stock > 0 && item.quantity >= prod.stock}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-30">
                          <Plus size={11} className="text-gray-500" />
                        </button>
                      </div>
                      <span className="w-16 text-right text-sm font-bold text-gray-800 flex-shrink-0">
                        {fmt$(item.price * item.quantity)}
                      </span>
                      <button onMouseDown={e => e.preventDefault()}
                        onClick={() => { removeItem(item.productId); if (scanMode) refocus() }}
                        className="text-gray-300 hover:text-red-400 transition flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
                <div className="px-4 py-3 bg-gray-50/60 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Total</span>
                  <span className="text-xl font-bold text-brand-red">{fmt$(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ────────────────────────────────────── */}
        <div className="space-y-4 xl:sticky xl:top-4">

          {/* Customer form */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={14} className="text-brand-red flex-shrink-0" />
              Datos del cliente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              {[
                { key: 'name',     label: 'Nombre completo *', placeholder: 'María García',    type: 'text'  },
                { key: 'phone',    label: 'Celular',            placeholder: '3001234567',      type: 'tel'   },
                { key: 'email',    label: 'Correo electrónico', placeholder: 'maria@email.com', type: 'email' },
                { key: 'document', label: 'Cédula / NIT',       placeholder: '1234567890',      type: 'text'  },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={customer[key]}
                    onChange={e => setCustomer({ ...customer, [key]: e.target.value })}
                    placeholder={placeholder}
                    data-customer-field="true"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard size={14} className="text-brand-red flex-shrink-0" />
              Método de pago
            </h2>
            <div className="grid grid-cols-3 xl:grid-cols-1 gap-2">
              {PAY_METHODS.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setPayMethod(id); if (scanMode) refocus() }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                    payMethod === id ? 'border-brand-red bg-brand-soft' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '18' }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className={`text-xs font-semibold truncate ${payMethod === id ? 'text-brand-red' : 'text-gray-600'}`}>
                    {label}
                  </span>
                  {payMethod === id && <Check size={13} className="ml-auto text-brand-red flex-shrink-0 hidden xl:block" />}
                </button>
              ))}
            </div>
          </div>

          {/* Total + Finalize */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Total a cobrar</span>
              <span className="text-2xl font-bold text-brand-red">{fmt$(total)}</span>
            </div>

            {noPrice && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Hay productos sin precio.{' '}
                  <button onClick={() => onNav('products')} className="underline font-semibold">Configurar</button>
                </p>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl mb-3">
                <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-500">{formError}</p>
              </div>
            )}

            <button
              onClick={handleFinalize}
              disabled={cart.length === 0 || saving}
              className="w-full py-3.5 bg-brand-red text-white rounded-xl font-bold text-sm hover:bg-brand-red/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Check size={16} strokeWidth={2.5} /> Finalizar compra <ChevronRight size={15} /></>
              }
            </button>
          </div>
        </div>
      </div>

      {success && <SuccessOverlay sale={success} onNew={handleNewSale} />}
      {cameraOpen && (
        <CameraScanner
          onDetect={handleCameraDetect}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  )
}
