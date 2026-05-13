import { useState, useMemo } from 'react'
import { Banknote, Smartphone, CreditCard, Check, AlertTriangle, Clock, ChevronDown, ChevronUp, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$, isToday } from '../utils/formatters'

const K = 'eb_cierres'
const loadCierres  = () => { try { return JSON.parse(localStorage.getItem(K)) ?? [] } catch { return [] } }
const saveCierres  = (v) => localStorage.setItem(K, JSON.stringify(v))

const PAY = [
  { id: 'efectivo',      label: 'Efectivo',      icon: Banknote,   color: '#34D399', desc: 'Billetes y monedas' },
  { id: 'transferencia', label: 'Transferencia',  icon: Smartphone, color: '#60A5FA', desc: 'Nequi, Daviplata, etc.' },
  { id: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard, color: '#A78BFA', desc: 'Débito / crédito' },
]

function DiffBadge({ diff }) {
  if (Math.abs(diff) < 1) return <span className="text-xs text-green-600 font-semibold">✓ Cuadra</span>
  const neg = diff < 0
  return (
    <span className={`text-xs font-semibold ${neg ? 'text-red-500' : 'text-amber-500'}`}>
      {neg ? '↓ Falta ' : '↑ Sobra '}{fmt$(Math.abs(diff))}
    </span>
  )
}

export default function CierreCaja() {
  const { sales } = useApp()

  const [contado, setContado] = useState('')
  const [notas,   setNotas]   = useState('')
  const [saved,   setSaved]   = useState(false)
  const [history, setHistory] = useState(loadCierres)
  const [showHistory, setShowHistory] = useState(false)

  // Sales from today only
  const todaySales = useMemo(() => sales.filter(s => isToday(s.date)), [sales])

  const byPay = useMemo(() => {
    const result = {}
    PAY.forEach(p => {
      const items = todaySales.filter(s => s.paymentMethod === p.id)
      result[p.id] = { count: items.length, total: items.reduce((a, s) => a + s.total, 0) }
    })
    return result
  }, [todaySales])

  const totalDay   = todaySales.reduce((a, s) => a + s.total, 0)
  const efectivoEsperado = byPay.efectivo?.total ?? 0
  const contadoNum = parseFloat(contado.replace(/[^0-9.]/g, '')) || 0
  const diff       = contadoNum - efectivoEsperado

  const handleCierre = () => {
    const cierre = {
      id:         Date.now().toString(),
      fecha:      new Date().toISOString(),
      totalDia:   totalDay,
      ventas:     todaySales.length,
      efectivo:   byPay.efectivo?.total ?? 0,
      transfer:   byPay.transferencia?.total ?? 0,
      tarjeta:    byPay.tarjeta?.total ?? 0,
      contado:    contadoNum,
      diferencia: diff,
      notas,
    }
    const next = [cierre, ...history]
    setHistory(next)
    saveCierres(next)
    setSaved(true)
  }

  const fmtFecha = (iso) => new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-gray-800">Cierre de Caja</h1>
        <p className="text-sm text-gray-400 mt-0.5 capitalize">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Resumen del día */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Clock size={15} className="text-brand-red" />
            Resumen del día
          </h2>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total del día</p>
            <p className="text-2xl font-bold text-brand-red">{fmt$(totalDay)}</p>
            <p className="text-[11px] text-gray-400">{todaySales.length} ventas</p>
          </div>
        </div>

        <div className="space-y-3">
          {PAY.map(({ id, label, icon: Icon, color, desc }) => {
            const data = byPay[id] ?? { count: 0, total: 0 }
            return (
              <div key={id} className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color + '18' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc} · {data.count} ventas</p>
                </div>
                <p className="text-base font-bold text-gray-800">{fmt$(data.total)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Arqueo de caja (efectivo) */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <Banknote size={15} className="text-brand-red" />
          Arqueo de efectivo
        </h2>
        <p className="text-xs text-gray-400 mb-5">Cuenta los billetes y escribe el total físico en caja</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3.5">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Sistema espera</p>
            <p className="text-xl font-bold text-green-700 mt-1">{fmt$(efectivoEsperado)}</p>
            <p className="text-[11px] text-green-600 mt-0.5">{byPay.efectivo?.count ?? 0} ventas en efectivo</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Contado físico</p>
            <div className="relative mt-1">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
              <input
                type="number"
                value={contado}
                onChange={e => { setContado(e.target.value); setSaved(false) }}
                placeholder="0"
                className="w-full pl-4 text-xl font-bold text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-300"
              />
            </div>
            {contado && <DiffBadge diff={diff} />}
          </div>
        </div>

        {contado && Math.abs(diff) >= 1 && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium mb-4 ${
            diff < 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            <AlertTriangle size={13} className="flex-shrink-0" />
            {diff < 0
              ? `Faltan ${fmt$(Math.abs(diff))} en caja respecto al sistema`
              : `Hay ${fmt$(Math.abs(diff))} de más en caja respecto al sistema`}
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            Notas del cierre (opcional)
          </label>
          <textarea
            value={notas}
            onChange={e => { setNotas(e.target.value); setSaved(false) }}
            placeholder="Ej: se devolvió un producto, hubo un descuento, etc."
            rows={2}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Guardar cierre */}
      <button
        onClick={handleCierre}
        disabled={saved}
        className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          saved
            ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
            : 'bg-brand-red text-white hover:bg-brand-red/90 shadow-sm'
        }`}
      >
        {saved ? <><Check size={16} /> Cierre guardado</> : <><Wallet size={16} /> Guardar cierre del día</>}
      </button>

      {/* Historial de cierres */}
      {history.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition mb-3"
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Historial de cierres ({history.length})
          </button>

          {showHistory && (
            <div className="space-y-3">
              {history.map(c => (
                <div key={c.id} className="bg-white rounded-2xl shadow-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 capitalize">{fmtFecha(c.fecha)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.ventas} ventas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">{fmt$(c.totalDia)}</p>
                      {Math.abs(c.diferencia) >= 1
                        ? <DiffBadge diff={c.diferencia} />
                        : <span className="text-xs text-green-600 font-semibold">✓ Cuadró</span>
                      }
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Efectivo',      val: c.efectivo, color: '#34D399' },
                      { label: 'Transferencia', val: c.transfer, color: '#60A5FA' },
                      { label: 'Tarjeta',       val: c.tarjeta,  color: '#A78BFA' },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                        <p className="text-[10px] text-gray-400 font-medium">{item.label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: item.color }}>{fmt$(item.val)}</p>
                      </div>
                    ))}
                  </div>
                  {c.notas && (
                    <p className="text-xs text-gray-400 mt-3 bg-gray-50 rounded-lg px-3 py-2 italic">"{c.notas}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
