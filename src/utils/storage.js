const K = { PRODUCTS: 'eb_products', SALES: 'eb_sales' }

export const getProducts = () => {
  try { const d = localStorage.getItem(K.PRODUCTS); return d ? JSON.parse(d) : null } catch { return null }
}
export const saveProducts = (p) => localStorage.setItem(K.PRODUCTS, JSON.stringify(p))

export const getSales = () => {
  try { const d = localStorage.getItem(K.SALES); return d ? JSON.parse(d) : [] } catch { return [] }
}
export const saveSales = (s) => localStorage.setItem(K.SALES, JSON.stringify(s))
