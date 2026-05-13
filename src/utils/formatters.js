export const fmt$ = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const fmtShort = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit' })

export const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()
