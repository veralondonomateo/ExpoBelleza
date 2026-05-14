import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getProducts, updateProduct as dbUpdateProduct, getSales, addSale as dbAddSale } from '../utils/db'
import { INITIAL_PRODUCTS } from '../data/products'

const Ctx = createContext()

export function AppProvider({ children }) {
  const [products, setProducts] = useState([])
  const [sales,    setSales]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [dbError,  setDbError]  = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [prods, sls] = await Promise.all([getProducts(), getSales()])
        // If DB returned products use them, otherwise keep initial seeds (DB already has them)
        setProducts(prods.length ? prods : INITIAL_PRODUCTS.map(p => ({ ...p })))
        setSales(sls)
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err)
        setDbError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateProduct = useCallback(async (updated) => {
    // Optimistic UI
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
    try {
      await dbUpdateProduct(updated)
    } catch (err) {
      console.error('Error actualizando producto:', err)
      // Revert on error
      setProducts(prev => prev.map(p => p.id === updated.id ? prev.find(x => x.id === updated.id) : p))
    }
  }, [])

  const addSale = useCallback(async (data) => {
    try {
      const sale = await dbAddSale(data)
      // Update local products stock to match what DB did
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
  }, [])

  return (
    <Ctx.Provider value={{ products, sales, loading, dbError, updateProduct, addSale }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)
