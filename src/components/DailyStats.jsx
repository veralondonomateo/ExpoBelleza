import { useState, useMemo } from 'react'
import { CalendarRange, TrendingUp, ListOrdered, X } from 'lucide-react'
import { fmt$ } from '../utils/formatters'

const dayKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DailyStats({ sales, title = 'Estadísticas por día' }) {
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')

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
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
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
