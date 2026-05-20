import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export async function createSiigoInvoice(saleData) {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-siigo-invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(saleData),
  })

  let result
  try {
    result = await res.json()
  } catch {
    throw new Error(`Error de conexión con el servidor de facturación (HTTP ${res.status})`)
  }

  if (!res.ok) {
    throw new Error(result.error || `Error Siigo (${res.status})`)
  }

  return result
}
