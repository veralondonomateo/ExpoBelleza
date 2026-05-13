import { BarChart2, Package, ShoppingBag, ClipboardList, Download, Wallet } from 'lucide-react'

const GROUPS = [
  {
    label: 'Ventas',
    items: [
      { id: 'analytics', icon: BarChart2,     label: 'Analíticas'    },
      { id: 'products',  icon: Package,       label: 'Productos'     },
      { id: 'sales',     icon: ShoppingBag,   label: 'Nueva Venta'   },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { id: 'orders',    icon: ClipboardList, label: 'Pedidos'       },
      { id: 'export',    icon: Download,      label: 'Exportar'      },
      { id: 'caja',      icon: Wallet,        label: 'Cierre de Caja'},
    ],
  },
]

export default function Sidebar({ active, onNav }) {
  return (
    <aside className="w-[240px] h-screen bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 pt-7 pb-5 border-b border-gray-50">
        <div className="flex items-center justify-center">
          <img src="/logo2.jpg" alt="ExpoBelleza" className="h-20 w-auto object-contain" />
        </div>
        <p className="text-center text-[10px] font-semibold tracking-[0.2em] text-gray-300 uppercase mt-3">
          Sistema de Inventario
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {GROUPS.map(({ label, items }) => (
          <div key={label}>
            <p className="px-4 mb-1.5 text-[9px] font-bold text-gray-300 uppercase tracking-[0.18em]">
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(({ id, icon: Icon, label: name }) => {
                const on = active === id
                return (
                  <button
                    key={id}
                    onClick={() => onNav(id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      on
                        ? 'bg-brand-light text-brand-red'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={16} className={on ? 'text-brand-red' : 'text-gray-400'} />
                    <span>{name}</span>
                    {on && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-red" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <p className="text-xs text-gray-400">ExpoBelleza · 2026</p>
        </div>
      </div>
    </aside>
  )
}
