import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Sidebar    from './components/Sidebar'
import Analytics  from './components/Analytics'
import Products   from './components/Products'
import Sales      from './components/Sales'
import Orders     from './components/Orders'
import Export     from './components/Export'
import CierreCaja from './components/CierreCaja'
import Login      from './components/Login'

function AppContent() {
  const [active, setActive] = useState('analytics')
  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden">
      <Sidebar active={active} onNav={setActive} />
      <main className="flex-1 overflow-y-auto">
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
