import { createContext, useContext, useState, useEffect } from 'react'
import { getProducts, saveProducts, getSales, saveSales } from '../utils/storage'
import { INITIAL_PRODUCTS } from '../data/products'

const Ctx = createContext()

export function AppProvider({ children }) {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])

  useEffect(() => {
    const saved = getProducts()
    setProducts(saved?.length ? saved : INITIAL_PRODUCTS.map(p => ({ ...p })))
    setSales(getSales())
  }, [])

  const updateProduct = (updated) => {
    const next = products.map(p => p.id === updated.id ? updated : p)
    setProducts(next)
    saveProducts(next)
  }

  const addSale = (data) => {
    const sale = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, date: new Date().toISOString(), ...data }
    const nextP = products.map(p => {
      const item = data.items.find(i => i.productId === p.id)
      return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p
    })
    setProducts(nextP)
    saveProducts(nextP)
    const nextS = [...sales, sale]
    setSales(nextS)
    saveSales(nextS)
    return sale
  }

  return <Ctx.Provider value={{ products, sales, updateProduct, addSale }}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)
