import { BarChart2, Package, ShoppingBag, ClipboardList, Download, Wallet, ChevronLeft, ChevronRight, Users, LogOut } from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Ventas',
    items: [
      { id: 'analytics', icon: BarChart2,     label: 'Analíticas'     },
      { id: 'products',  icon: Package,       label: 'Productos'      },
      { id: 'sales',     icon: ShoppingBag,   label: 'Nueva Venta'    },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { id: 'orders',    icon: ClipboardList, label: 'Pedidos'        },
      { id: 'export',    icon: Download,      label: 'Exportar'       },
      { id: 'caja',      icon: Wallet,        label: 'Cierre de Caja' },
    ],
  },
]

const ADMIN_ITEMS = [
  { id: 'users', icon: Users, label: 'Usuarios' },
]

export default function Sidebar({ active, onNav, collapsed, onToggle, userRole, user, onLogout }) {
  const displayName = user?.email?.split('@')[0] ?? ''
  const isAdmin = userRole === 'admin'

  return (
    <aside
      className={`${collapsed ? 'w-[60px]' : 'w-[220px]'} h-screen bg-white border-r border-gray-100 flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden`}
    >
      {/* Logo */}
      <div className={`flex flex-col items-center border-b border-gray-50 transition-all duration-200 ${collapsed ? 'px-2 pt-4 pb-3' : 'px-5 pt-6 pb-4'}`}>
        <img
          src="/logo2.jpg"
          alt="ExpoBelleza"
          className={`object-contain transition-all duration-200 ${collapsed ? 'h-8 w-8 rounded-lg' : 'h-16 w-auto'}`}
        />
        {!collapsed && (
          <p className="text-center text-[9px] font-semibold tracking-[0.2em] text-gray-300 uppercase mt-2.5 whitespace-nowrap">
            Sistema de Inventario
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-3 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-1.5' : 'px-2.5'}`}>
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1 text-[9px] font-bold text-gray-300 uppercase tracking-[0.18em] whitespace-nowrap">
                {label}
              </p>
            )}
            {collapsed && <div className="h-px bg-gray-100 mx-1 mb-2" />}
            <div className="space-y-0.5">
              {items.map(({ id, icon: Icon, label: name }) => {
                const on = active === id
                return (
                  <button
                    key={id}
                    onClick={() => onNav(id)}
                    title={collapsed ? name : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'
                    } ${
                      on
                        ? 'bg-brand-light text-brand-red'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={17} className={`flex-shrink-0 ${on ? 'text-brand-red' : 'text-gray-400'}`} />
                    {!collapsed && (
                      <>
                        <span className="truncate">{name}</span>
                        {on && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Admin-only section */}
        {isAdmin && (
          <div className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1 text-[9px] font-bold text-gray-300 uppercase tracking-[0.18em] whitespace-nowrap">
                Admin
              </p>
            )}
            {collapsed && <div className="h-px bg-gray-100 mx-1 mb-2" />}
            <div className="space-y-0.5">
              {ADMIN_ITEMS.map(({ id, icon: Icon, label: name }) => {
                const on = active === id
                return (
                  <button
                    key={id}
                    onClick={() => onNav(id)}
                    title={collapsed ? name : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'
                    } ${
                      on
                        ? 'bg-brand-light text-brand-red'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={17} className={`flex-shrink-0 ${on ? 'text-brand-red' : 'text-gray-400'}`} />
                    {!collapsed && (
                      <>
                        <span className="truncate">{name}</span>
                        {on && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={`border-t border-gray-50 ${collapsed ? 'p-2 space-y-1' : 'px-4 py-3 space-y-2'}`}>
        {/* User info */}
        {!collapsed && displayName && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-brand-red uppercase">{displayName[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-700 truncate">{displayName}</p>
              {isAdmin && <p className="text-[9px] text-brand-red font-medium uppercase tracking-wide">Admin</p>}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className={`w-full flex items-center rounded-xl py-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition ${collapsed ? 'justify-center px-0' : 'px-2 gap-2'}`}
        >
          <LogOut size={14} />
          {!collapsed && <span className="text-xs font-medium">Cerrar sesión</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={`w-full flex items-center rounded-xl py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition ${collapsed ? 'justify-center px-0' : 'px-2 gap-2'}`}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={15} /><span className="text-xs font-medium">Ocultar menú</span></>
          }
        </button>
      </div>
    </aside>
  )
}
