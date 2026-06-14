import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Plus, Minus, Trash2, Check, ChevronRight,
  Banknote, Smartphone, CreditCard, AlertTriangle, RotateCcw,
  User, ShoppingBag, Zap, ScanLine, Camera, Tag, Split, Store,
  CalendarRange, TrendingUp, ListOrdered, X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$ } from '../utils/formatters'
import { WHOLESALE_PRICES } from '../data/wholesalePrices'
import CameraScanner from './CameraScanner'

const PAY_METHODS = [
  { id: 'efectivo',      label: 'Efectivo',      icon: Banknote,   color: '#34D399' },
  { id: 'transferencia', label: 'Transferencia',  icon: Smartphone, color: '#60A5FA' },
  { id: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard, color: '#A78BFA' },
]

const getWholesalePrice = (product) => WHOLESALE_PRICES[product.id] ?? product.price

function SuccessOverlay({ sale, onNew }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-md text-center p-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-500" strokeWidth={2.5} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">¡Venta mayorista registrada!</h2>
        <p className="text-sm text-gray-400 mb-5">
          {sale.customer?.name && <><strong className="text-gray-600">{sale.customer.name}</strong> · </>}
          <span className="capitalize">{sale.paymentMethod}</span>
          {sale.secondPaymentMethod && <> + <span className="capitalize">{sale.secondPaymentMethod}</span></>}
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
          {sale.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 truncate mr-2">{item.quantity}× {item.productName}</span>
              <span className="font-semibold text-gray-800 flex-shrink-0">{fmt$(item.price * item.quantity)}</span>
            </div>
          ))}
          {sale.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento</span><span>-{fmt$(sale.discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
            <span>Total</span><span>{fmt$(sale.total)}</span>
          </div>
        </div>
        <button onClick={onNew}
          className="w-full py-3.5 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-brand-red/90 transition flex items-center justify-center gap-2">
          <Zap size={16} /> Nueva venta mayorista
        </button>
      </div>
    </div>
  )
}

function DailyStats({ sales }) {
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')

  const dayKey = (iso) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const filtered = useMemo(() => sales.filter(s => {
    const key = dayKey(s.date)
    if (from && key < from) return false
    if (to   && key > to)   return false
    return true
  }), [sales, from, to])

  const byDay = useMemo(() => {
    const map = {}
    filtered.forEach(s => {
      const key = dayKey(s.date)
      if (!map[key]) map[key] = { date: key, count: 0, total: 0 }
      map[key].count += 1
      map[key].total += s.total
    })
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
  }, [filtered])

  const totals = useMemo(() => ({
    count: filtered.length,
    total: filtered.reduce((a, s) => a + s.total, 0),
  }), [filtered])

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange size={15} className="text-brand-red" />
          <h2 className="text-sm font-semibold text-gray-700">Estadísticas por día</h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition"
          />
          <span className="text-xs text-gray-400">a</span>
          <input
            type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition"
          />
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo('') }}
              className="text-gray-400 hover:text-red-400 transition" title="Limpiar filtro">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ED534018' }}>
            <ListOrdered size={15} style={{ color: '#ED5340' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ventas</p>
            <p className="text-base font-bold text-gray-800">{totals.count}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#34D39918' }}>
            <TrendingUp size={15} style={{ color: '#34D399' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Valor total</p>
            <p className="text-base font-bold text-gray-800 truncate">{fmt$(totals.total)}</p>
          </div>
        </div>
      </div>

      {/* Per-day table */}
      {byDay.length === 0 ? (
        <div className="py-10 text-center border-t border-gray-50">
          <CalendarRange size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-300">No hay ventas en el rango seleccionado</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-gray-50">
          <table className="w-full min-w-[360px]">
            <thead>
              <tr className="bg-gray-50/70">
                {['Día', 'Ventas', 'Valor del día'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {byDay.map(d => (
                <tr key={d.date} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                    {new Date(`${d.date}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.count}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800 whitespace-nowrap">{fmt$(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function WholesaleSales() {
  const { products, wholesaleSales, addWholesaleSale } = useApp()

  const [scanMode,     setScanMode]     = useState(false)
  const [cameraOpen,   setCameraOpen]   = useState(false)
  const [scanError,    setScanError]    = useState(null)
  const [lastAdded,    setLastAdded]    = useState(null)
  const [cart,         setCart]         = useState([])
  const [customer,     setCustomer]     = useState({ name: '', phone: '' })
  const [payMethod,    setPayMethod]    = useState('efectivo')
  const [discount,     setDiscount]     = useState(0)
  const [splitPay,     setSplitPay]     = useState(false)
  const [secondMethod, setSecondMethod] = useState('transferencia')
  const [secondAmount, setSecondAmount] = useState('')
  const [success,      setSuccess]      = useState(null)
  const [formError,    setFormError]    = useState(null)
  const [saving,       setSaving]       = useState(false)

  const scanInputRef = useRef(null)

  const refocus = useCallback(() => {
    setTimeout(() => scanInputRef.current?.focus(), 0)
  }, [])

  const addToCart = useCallback((product) => {
    const price = getWholesalePrice(product)
    setCart(prev => {
      const exists = prev.find(i => i.productId === product.id)
      if (exists) return prev.map(i =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      )
      return [...prev, { productId: product.id, productName: product.name, price, quantity: 1 }]
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
  const subtotal   = cart.reduce((a, i) => a + i.price * i.quantity, 0)
  const finalTotal = Math.max(0, subtotal - discount)
  const secondAmt  = parseFloat(secondAmount) || 0

  const handleFinalize = async () => {
    if (cart.length === 0)          { setFormError('Agrega al menos un producto.'); return }
    if (splitPay && secondAmt <= 0) { setFormError('Indica el monto del segundo pago.'); return }
    if (splitPay && secondAmt >= finalTotal) { setFormError('El segundo pago no puede ser mayor o igual al total.'); return }
    setFormError(null)
    setSaving(true)
    try {
      const sale = await addWholesaleSale({
        items:               cart,
        customer,
        paymentMethod:       payMethod,
        total:               finalTotal,
        discount,
        secondPaymentMethod: splitPay ? secondMethod : null,
        secondPaymentAmount: splitPay ? secondAmt    : null,
      })
      setSuccess(sale)
    } catch (err) {
      setFormError(err?.message || 'Error al guardar la venta. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleNewSale = () => {
    setSuccess(null); setCart([])
    setCustomer({ name: '', phone: '' })
    setPayMethod('efectivo'); setScanMode(false)
    setDiscount(0); setSplitPay(false); setSecondAmount('')
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Store size={18} className="text-brand-red" />
        <div>
          <h1 className="text-lg font-bold text-gray-800">Ventas Mayoristas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Registro interno — sin factura electrónica</p>
        </div>
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
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setCameraOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-brand-light text-brand-red hover:bg-brand-red hover:text-white transition"
                  title="Escanear con cámara"
                >
                  <Camera size={15} />
                  <span className="hidden sm:inline">Cámara</span>
                </button>
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
                <img src={`/${lastAdded.id}.webp`} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0 bg-gray-100" onError={e => { e.target.onerror = null; e.target.style.visibility = 'hidden' }} />
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
                    <img src={`/${p.id}.webp`} alt="" className="w-5 h-5 rounded object-cover bg-gray-100" onError={e => { e.target.onerror = null; e.target.style.visibility = 'hidden' }} />
                    <span className="truncate max-w-[80px]">{p.name}</span>
                    <span className="text-[10px] text-gray-400">{fmt$(getWholesalePrice(p))}</span>
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
                        className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0 bg-gray-100" onError={e => { e.target.onerror = null; e.target.style.visibility = 'hidden' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        <p className="text-xs mt-0.5 text-gray-400">
                          {fmt$(item.price)} / ud. (mayorista)
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
                  <span className="text-sm font-semibold text-gray-600">Subtotal</span>
                  <span className="text-xl font-bold text-brand-red">{fmt$(subtotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Daily stats */}
          <DailyStats sales={wholesaleSales} />
        </div>

        {/* ── RIGHT ────────────────────────────────────── */}
        <div className="space-y-4 xl:sticky xl:top-4">

          {/* Customer form */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={14} className="text-brand-red flex-shrink-0" />
              Datos del mayorista (opcional)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              {[
                { key: 'name',  label: 'Nombre / Negocio', placeholder: 'Distribuciones XYZ', type: 'text' },
                { key: 'phone', label: 'Celular',           placeholder: '3001234567',         type: 'tel'  },
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

          {/* Discount */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Tag size={14} className="text-brand-red flex-shrink-0" />
              Descuento
            </h2>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number" min="0" value={discount || ''}
                onChange={e => { setDiscount(Math.max(0, Number(e.target.value))); if (scanMode) refocus() }}
                onMouseDown={e => e.stopPropagation()}
                data-customer-field="true"
                placeholder="0"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition"
              />
            </div>
            {discount > 0 && (
              <p className="text-xs text-brand-red mt-1.5 font-medium">
                Total con descuento: {fmt$(finalTotal)}
              </p>
            )}
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

            {/* Split payment toggle */}
            <label
              onMouseDown={e => e.preventDefault()}
              className="flex items-center gap-2.5 mt-3 pt-3 border-t border-gray-50 cursor-pointer select-none"
            >
              <input type="checkbox" checked={splitPay}
                onChange={e => { setSplitPay(e.target.checked); if (scanMode) refocus() }}
                className="rounded accent-brand-red w-3.5 h-3.5" />
              <Split size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">Pago dividido</span>
            </label>

            {splitPay && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Segundo método</p>
                  <div className="grid grid-cols-3 xl:grid-cols-1 gap-2">
                    {PAY_METHODS.filter(m => m.id !== payMethod).map(({ id, label, icon: Icon, color }) => (
                      <button key={id}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setSecondMethod(id); if (scanMode) refocus() }}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 transition-all text-left ${
                          secondMethod === id ? 'border-brand-red bg-brand-soft' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: color + '18' }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        <span className={`text-xs font-semibold truncate ${secondMethod === id ? 'text-brand-red' : 'text-gray-600'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Monto {PAY_METHODS.find(m => m.id === secondMethod)?.label}
                  </p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" min="0" value={secondAmount}
                      onChange={e => { setSecondAmount(e.target.value); if (scanMode) refocus() }}
                      onMouseDown={e => e.stopPropagation()}
                      data-customer-field="true"
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition" />
                  </div>
                  {secondAmt > 0 && finalTotal > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      {PAY_METHODS.find(m => m.id === payMethod)?.label}: {fmt$(Math.max(0, finalTotal - secondAmt))}
                      {' · '}
                      {PAY_METHODS.find(m => m.id === secondMethod)?.label}: {fmt$(secondAmt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Total + Finalize */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Total a cobrar</span>
              <span className="text-2xl font-bold text-brand-red">{fmt$(finalTotal)}</span>
            </div>
            {discount > 0 && (
              <p className="text-xs text-green-600 font-medium mb-3 text-right">Descuento aplicado: -{fmt$(discount)}</p>
            )}
            {!discount && <div className="mb-4" />}

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
                : <><Check size={16} strokeWidth={2.5} /> Registrar venta <ChevronRight size={15} /></>
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
