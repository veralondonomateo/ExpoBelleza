import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, ShoppingCart, DollarSign, Users, Banknote, Smartphone, CreditCard, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$, fmtDate, isToday } from '../utils/formatters'

const CHART_COLORS = ['#ED5340', '#FF9DA3', '#FBBF24', '#34D399', '#60A5FA']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
      <p className="text-[11px] font-medium text-gray-400 mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: e.color }}>
          {e.name === 'ingresos' ? fmt$(e.value) : `${e.value} ventas`}
        </p>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-card overflow-hidden">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '18' }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</p>
          <p className="text-base font-bold text-gray-800 leading-tight mt-0.5 truncate">{value}</p>
        </div>
      </div>
    </div>
  )
}

function PayCard({ icon: Icon, label, amount, count, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-card flex items-center gap-3 overflow-hidden">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '15' }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 truncate">{label}</p>
        <p className="text-base font-bold text-gray-800 truncate">{fmt$(amount)}</p>
        <p className="text-[10px] text-gray-400">{count} {count === 1 ? 'venta' : 'ventas'}</p>
      </div>
    </div>
  )
}

export default function Analytics() {
  const { sales, products, userRole } = useApp()
  const isAdmin = userRole === 'admin'

  const stats = useMemo(() => {
    const total = sales.length
    const todaySales = sales.filter(s => isToday(s.date))
    const revenue = sales.reduce((a, s) => a + s.total, 0)
    const avg = total ? revenue / total : 0
    const byPay = {
      efectivo:      sales.filter(s => s.paymentMethod === 'efectivo'),
      transferencia: sales.filter(s => s.paymentMethod === 'transferencia'),
      tarjeta:       sales.filter(s => s.paymentMethod === 'tarjeta'),
    }
    return { total, todaySales, revenue, avg, byPay }
  }, [sales])

  const dailyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const ds = d.toDateString()
    const day = sales.filter(s => new Date(s.date).toDateString() === ds)
    return {
      dia: d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit' }),
      ingresos: day.reduce((a, s) => a + s.total, 0),
      ventas: day.length,
    }
  }), [sales])

  const productData = useMemo(() =>
    products.map(p => ({
      name: p.name,
      value: sales.reduce((acc, s) => {
        const it = s.items?.find(i => i.productId === p.id)
        return acc + (it ? it.quantity : 0)
      }, 0),
    })).filter(p => p.value > 0),
    [sales, products]
  )

  const recent = useMemo(() =>
    [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
    [sales]
  )

  const byUser = useMemo(() => {
    const map = {}
    sales.forEach(s => {
      const key = s.userId || '__unknown__'
      if (!map[key]) map[key] = { name: s.userName || 'Sin nombre', count: 0, revenue: 0, items: 0 }
      map[key].count += 1
      map[key].revenue += s.total
      map[key].items += (s.items ?? []).reduce((a, i) => a + i.quantity, 0)
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [sales])

  const todayStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-800">Analíticas</h1>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{todayStr}</p>
      </div>

      {/* Stats — 2 cols on mobile/tablet, 4 on desktop */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={ShoppingCart} label="Total Ventas"     value={String(stats.total)}              color="#ED5340" />
        <StatCard icon={TrendingUp}   label="Ventas Hoy"      value={String(stats.todaySales.length)}   color="#FF9DA3" />
        <StatCard icon={DollarSign}   label="Ticket Promedio" value={fmt$(stats.avg)}                   color="#FBBF24" />
        <StatCard icon={Users}        label="Ingresos Total"  value={fmt$(stats.revenue)}               color="#34D399" />
      </div>

      {/* Payment cards — 1 col on mobile, 3 on tablet+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PayCard icon={Banknote}   label="Efectivo"      amount={stats.byPay.efectivo.reduce((a,s)=>a+s.total,0)}      count={stats.byPay.efectivo.length}      color="#34D399" />
        <PayCard icon={Smartphone} label="Transferencia" amount={stats.byPay.transferencia.reduce((a,s)=>a+s.total,0)} count={stats.byPay.transferencia.length} color="#60A5FA" />
        <PayCard icon={CreditCard} label="Tarjeta"       amount={stats.byPay.tarjeta.reduce((a,s)=>a+s.total,0)}       count={stats.byPay.tarjeta.length}       color="#A78BFA" />
      </div>

      {/* Charts — stacked on tablet, side by side on xl */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Area chart */}
        <div className="xl:col-span-2 bg-white rounded-xl p-4 shadow-card overflow-hidden">
          <p className="text-sm font-semibold text-gray-700">Ingresos por día</p>
          <p className="text-[11px] text-gray-400 mb-4">Últimos 7 días</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ED5340" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ED5340" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={38} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingresos" name="ingresos" stroke="#ED5340" strokeWidth={2}
                fill="url(#grad)" dot={{ fill: '#ED5340', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl p-4 shadow-card overflow-hidden">
          <p className="text-sm font-semibold text-gray-700">Por producto</p>
          <p className="text-[11px] text-gray-400 mb-2">Unidades vendidas</p>
          {productData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={productData} cx="50%" cy="40%" innerRadius={42} outerRadius={65}
                  paddingAngle={3} dataKey="value">
                  {productData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} uds.`, n]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '11px', fontFamily: 'Poppins' }} />
                <Legend iconType="circle" iconSize={6}
                  formatter={v => <span style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'Poppins' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center gap-2">
              <ShoppingCart size={28} className="text-gray-200" />
              <p className="text-xs text-gray-300">Sin ventas aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Bar chart */}
      {productData.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-card overflow-hidden">
          <p className="text-sm font-semibold text-gray-700 mb-0.5">Unidades vendidas por producto</p>
          <p className="text-[11px] text-gray-400 mb-4">Total acumulado</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={productData} margin={{ top: 0, right: 4, left: -8, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={22} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '11px', fontFamily: 'Poppins' }} />
              <Bar dataKey="value" name="Unidades" fill="#ED5340" radius={[5, 5, 0, 0]}>
                {productData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-user breakdown — admin only, always visible */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Rendimiento por vendedora</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Ingresos y unidades vendidas</p>
            </div>
            <span className="text-xs text-gray-400">{byUser.length} {byUser.length === 1 ? 'vendedora' : 'vendedoras'}</span>
          </div>

          {byUser.length === 0 ? (
            <div className="py-10 text-center">
              <User size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Sin ventas registradas aún</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {byUser.map((u, i) => {
                const initials = (u.name || '?').slice(0, 2).toUpperCase()
                const USER_COLORS = ['#ED5340', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA']
                const color = USER_COLORS[i % USER_COLORS.length]
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    {/* User header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                        style={{ backgroundColor: color }}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-[11px] text-gray-400">{u.count} {u.count === 1 ? 'transacción' : 'transacciones'}</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ingresos</p>
                        <p className="text-base font-bold text-gray-800 leading-tight">{fmt$(u.revenue)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Unidades</p>
                        <p className="text-base font-bold text-gray-800 leading-tight">{u.items} <span className="text-xs font-medium text-gray-400">uds.</span></p>
                      </div>
                    </div>

                    {/* Revenue bar */}
                    {stats.revenue > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>% del total</span>
                          <span className="font-semibold" style={{ color }}>{((u.revenue / stats.revenue) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(u.revenue / stats.revenue) * 100}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent sales */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Ventas Recientes</p>
          <span className="text-xs text-gray-400">{sales.length} total</span>
        </div>
        {recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-gray-50/70">
                  {['Cliente', 'Productos', 'Pago', 'Total', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[120px]">{sale.customer?.name || '—'}</p>
                      <p className="text-[11px] text-gray-400">{sale.customer?.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-xs text-gray-600 truncate">
                        {sale.items?.map(i => `${i.quantity}× ${i.productName}`).join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        sale.paymentMethod === 'efectivo'      ? 'bg-green-50 text-green-700' :
                        sale.paymentMethod === 'transferencia' ? 'bg-blue-50 text-blue-700' :
                                                                 'bg-purple-50 text-purple-700'
                      }`}>
                        {sale.paymentMethod === 'transferencia' ? 'Transfer.' : sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-800 whitespace-nowrap">{fmt$(sale.total)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(sale.date)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center">
            <ShoppingCart size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No hay ventas registradas aún</p>
          </div>
        )}
      </div>
    </div>
  )
}
