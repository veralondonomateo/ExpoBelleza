import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar    from './components/Sidebar'
import Analytics  from './components/Analytics'
import Products   from './components/Products'
import Sales      from './components/Sales'
import Orders     from './components/Orders'
import Export     from './components/Export'
import CierreCaja from './components/CierreCaja'
import Login      from './components/Login'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F8F9FB]">
      <div className="text-center">
        <img src="/logo2.jpg" alt="ExpoBelleza" className="h-16 w-auto object-contain mx-auto mb-5 opacity-80" />
        <div className="w-6 h-6 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-3">Cargando datos...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F8F9FB] p-8">
      <div className="bg-white rounded-2xl shadow-card p-8 max-w-md text-center">
        <p className="text-sm font-semibold text-red-500 mb-2">Error de conexión</p>
        <p className="text-xs text-gray-400">{message}</p>
        <button onClick={() => window.location.reload()}
          className="mt-5 px-5 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-brand-red/90 transition">
          Reintentar
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  const { loading, dbError } = useApp()
  const [active, setActive]       = useState('analytics')
  // Persist sidebar state: default collapsed on small screens
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('eb_sidebar')
    if (saved !== null) return saved === '1'
    return window.innerWidth < 1024
  })

  const handleToggle = () => {
    setCollapsed(v => {
      localStorage.setItem('eb_sidebar', !v ? '1' : '0')
      return !v
    })
  }

  if (loading)  return <LoadingScreen />
  if (dbError)  return <ErrorScreen message={dbError} />

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden">
      <Sidebar
        active={active}
        onNav={setActive}
        collapsed={collapsed}
        onToggle={handleToggle}
      />
      <main className="flex-1 overflow-y-auto min-w-0">
        {active === 'analytics' && <Analytics />}
        {active === 'products'  && <Products />}
        {active === 'sales'     && <Sales onNav={setActive} />}
        {active === 'orders'    && <Orders />}
        {active === 'export'    && <Export />}
        {active === 'caja'      && <CierreCaja />}
      </main>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('eb_auth') === '1')
  if (!auth) return <Login onAuth={() => setAuth(true)} />
  return <AppProvider><AppContent /></AppProvider>
}
