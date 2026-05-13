import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, ShoppingCart, DollarSign, Users, Banknote, Smartphone, CreditCard } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmt$, fmtDate, isToday } from '../utils/formatters'

const CHART_COLORS = ['#ED5340', '#FF9DA3', '#FBBF24', '#34D399', '#60A5FA']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card-hover px-4 py-3">
      <p className="text-[11px] font-medium text-gray-400 mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: e.color }}>
          {e.name === 'ingresos' ? fmt$(e.value) : `${e.value} ventas`}
        </p>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1.5 leading-none">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '18' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function PayCard({ icon: Icon, label, amount, count, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '15' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5">{fmt$(amount)}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{count} {count === 1 ? 'venta' : 'ventas'}</p>
      </div>
    </div>
  )
}

export default function Analytics() {
  const { sales, products } = useApp()

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

  const todayStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-gray-800">Analíticas</h1>
        <p className="text-sm text-gray-400 mt-0.5 capitalize">{todayStr}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={ShoppingCart} label="Total Ventas"    value={stats.total}              color="#ED5340" sub="Todas las transacciones" />
        <StatCard icon={TrendingUp}   label="Ventas Hoy"     value={stats.todaySales.length}   color="#FF9DA3" sub="Transacciones del día" />
        <StatCard icon={DollarSign}   label="Ticket Promedio" value={fmt$(stats.avg)}           color="#FBBF24" sub="Por transacción" />
        <StatCard icon={Users}        label="Total Ingresos"  value={fmt$(stats.revenue)}       color="#34D399" sub="Ingresos acumulados" />
      </div>

      {/* Payment methods */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <PayCard icon={Banknote}    label="Efectivo"       amount={stats.byPay.efectivo.reduce((a,s)=>a+s.total,0)}      count={stats.byPay.efectivo.length}      color="#34D399" />
        <PayCard icon={Smartphone}  label="Transferencia"  amount={stats.byPay.transferencia.reduce((a,s)=>a+s.total,0)} count={stats.byPay.transferencia.length} color="#60A5FA" />
        <PayCard icon={CreditCard}  label="Tarjeta"        amount={stats.byPay.tarjeta.reduce((a,s)=>a+s.total,0)}       count={stats.byPay.tarjeta.length}       color="#A78BFA" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Area chart */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-semibold text-gray-700">Ingresos por día</h3>
          <p className="text-[11px] text-gray-400 mb-5">Últimos 7 días</p>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ED5340" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ED5340" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingresos" name="ingresos" stroke="#ED5340" strokeWidth={2.5}
                fill="url(#grad)" dot={{ fill: '#ED5340', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-semibold text-gray-700">Por producto</h3>
          <p className="text-[11px] text-gray-400 mb-3">Unidades vendidas</p>
          {productData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={productData} cx="50%" cy="42%" innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value">
                  {productData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} uds.`, n]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '12px', fontFamily: 'Poppins' }} />
                <Legend iconType="circle" iconSize={7}
                  formatter={v => <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Poppins' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[210px] flex flex-col items-center justify-center gap-2">
              <ShoppingCart size={32} className="text-gray-200" />
              <p className="text-xs text-gray-300">Sin ventas aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Ventas por producto (bar) */}
      {productData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-card mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Unidades vendidas por producto</h3>
          <p className="text-[11px] text-gray-400 mb-5">Total acumulado</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={productData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '12px', fontFamily: 'Poppins' }} />
              <Bar dataKey="value" name="Unidades" fill="#ED5340" radius={[6, 6, 0, 0]}>
                {productData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sales */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Ventas Recientes</h3>
          <span className="text-xs text-gray-400">{sales.length} total</span>
        </div>
        {recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60">
                  {['Cliente', 'Productos', 'Método de pago', 'Total', 'Fecha'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{sale.customer?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{sale.customer?.phone || ''}</p>
                    </td>
                    <td className="px-6 py-4 max-w-[220px]">
                      <p className="text-xs text-gray-600 truncate">
                        {sale.items?.map(i => `${i.quantity}× ${i.productName}`).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        sale.paymentMethod === 'efectivo'      ? 'bg-green-50 text-green-700' :
                        sale.paymentMethod === 'transferencia' ? 'bg-blue-50 text-blue-700' :
                                                                 'bg-purple-50 text-purple-700'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800">{fmt$(sale.total)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(sale.date)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No hay ventas registradas aún</p>
            <p className="text-xs text-gray-300 mt-1">Las ventas aparecerán aquí en tiempo real</p>
          </div>
        )}
      </div>
    </div>
  )
}
