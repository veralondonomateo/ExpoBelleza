import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getProducts, updateProduct as dbUpdateProduct, getSales, addSale as dbAddSale } from '../utils/db'
import { INITIAL_PRODUCTS } from '../data/products'

const Ctx = createContext()

export function AppProvider({ user, children }) {
  const [profile,  setProfile]  = useState(null)
  const [products, setProducts] = useState([])
  const [sales,    setSales]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [dbError,  setDbError]  = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const [{ data: prof }, prods, sls] = await Promise.all([
          supabase.from('profiles').select('role, full_name').eq('id', user.id).single(),
          getProducts(),
          getSales(),
        ])
        setProfile(prof)
        setProducts(prods.length ? prods : INITIAL_PRODUCTS.map(p => ({ ...p })))
        setSales(sls)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setDbError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user.id])

  const logout = useCallback(() => supabase.auth.signOut(), [])

  const updateProduct = useCallback(async (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
    try {
      await dbUpdateProduct(updated)
    } catch (err) {
      console.error('Error actualizando producto:', err)
    }
  }, [])

  const addSale = useCallback(async (data) => {
    try {
      const sale = await dbAddSale({
        ...data,
        userId:   user.id,
        userName: profile?.full_name || user.email?.split('@')[0] || null,
      })
      setProducts(prev =>
        prev.map(p => {
          const item = data.items.find(i => i.productId === p.id)
          return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p
        })
      )
      setSales(prev => [sale, ...prev])
      return sale
    } catch (err) {
      console.error('Error registrando venta:', err)
      throw err
    }
  }, [user, profile])

  const userRole = profile?.role ?? 'vendedora'

  return (
    <Ctx.Provider value={{ user, profile, userRole, products, sales, loading, dbError, updateProduct, addSale, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)
