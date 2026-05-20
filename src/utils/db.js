import { supabase } from '../lib/supabase'
import { createSiigoInvoice } from './siigo'

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id')
  if (error) throw error
  return data.map(p => ({ ...p, price: Number(p.price), stock: Number(p.stock) }))
}

export async function updateProduct(product) {
  const { error } = await supabase
    .from('products')
    .update({
      name:       product.name,
      barcode:    product.barcode,
      price:      product.price,
      stock:      product.stock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', product.id)
  if (error) throw error
}

// ── Sales ─────────────────────────────────────────────────────────────────────

function rowToSale(row) {
  return {
    id:                  row.id,
    date:                row.created_at,
    total:               Number(row.total),
    paymentMethod:       row.payment_method,
    discount:            Number(row.discount ?? 0),
    secondPaymentMethod: row.second_payment_method ?? null,
    secondPaymentAmount: Number(row.second_payment_amount ?? 0),
    userId:              row.user_id   ?? null,
    userName:            row.user_name ?? null,
    customer: {
      name:     row.customer_name     ?? '',
      phone:    row.customer_phone    ?? '',
      email:    row.customer_email    ?? '',
      document: row.customer_document ?? '',
    },
    items: (row.items ?? []).map(i => ({
      productId:   i.productId,
      productName: i.productName,
      price:       Number(i.price),
      quantity:    Number(i.quantity),
    })),
  }
}

export async function getSales() {
  const { data, error } = await supabase
    .from('sales_full')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(rowToSale)
}

export async function addSale(data) {
  const today = new Date().toISOString().split('T')[0]

  // Create electronic invoice in Siigo first — if this fails the sale is not saved
  const invoice = await createSiigoInvoice({
    customer:            data.customer,
    items:               data.items,
    paymentMethod:       data.paymentMethod,
    total:               data.total,
    discount:            data.discount            ?? 0,
    secondPaymentMethod: data.secondPaymentMethod ?? null,
    secondPaymentAmount: data.secondPaymentAmount ?? null,
    date:                today,
  })

  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const now = new Date().toISOString()

  const { error: saleErr } = await supabase
    .from('sales')
    .insert({
      id,
      total:                 data.total,
      payment_method:        data.paymentMethod,
      discount:              data.discount              ?? 0,
      second_payment_method: data.secondPaymentMethod   ?? null,
      second_payment_amount: data.secondPaymentAmount   ?? null,
      user_id:               data.userId                ?? null,
      user_name:             data.userName              ?? null,
      customer_name:         data.customer?.name        || null,
      customer_phone:        data.customer?.phone       || null,
      customer_email:        data.customer?.email       || null,
      customer_document:     data.customer?.document    || null,
      siigo_invoice_id:      invoice.id,
      siigo_invoice_prefix:  invoice.prefix,
      siigo_invoice_number:  invoice.number,
      siigo_invoice_name:    invoice.name,
      created_at:            now,
    })
  if (saleErr) throw saleErr

  if (data.items?.length) {
    const { error: itemsErr } = await supabase
      .from('sale_items')
      .insert(
        data.items.map(i => ({
          sale_id:      id,
          product_id:   i.productId,
          product_name: i.productName,
          price:        i.price,
          quantity:     i.quantity,
        }))
      )
    if (itemsErr) throw itemsErr
  }

  // Decrement stock for each product sold
  for (const item of data.items ?? []) {
    const { data: prod } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.productId)
      .single()
    if (prod != null) {
      await supabase
        .from('products')
        .update({ stock: Math.max(0, Number(prod.stock) - item.quantity), updated_at: now })
        .eq('id', item.productId)
    }
  }

  return { id, date: now, ...data, invoice }
}

// ── Cierres de caja ───────────────────────────────────────────────────────────

export async function getCierres() {
  const { data, error } = await supabase
    .from('cierres_caja')
    .select('*')
    .order('fecha', { ascending: false })
  if (error) throw error
  return data.map(c => ({
    id:         c.id,
    fecha:      c.fecha,
    totalDia:   Number(c.total_dia),
    ventas:     Number(c.ventas),
    efectivo:   Number(c.efectivo),
    transfer:   Number(c.transfer),
    tarjeta:    Number(c.tarjeta),
    contado:    Number(c.contado),
    diferencia: Number(c.diferencia),
    notas:      c.notas ?? '',
  }))
}

export async function addCierre(cierre) {
  const { error } = await supabase
    .from('cierres_caja')
    .insert({
      id:         cierre.id,
      fecha:      cierre.fecha,
      total_dia:  cierre.totalDia,
      ventas:     cierre.ventas,
      efectivo:   cierre.efectivo,
      transfer:   cierre.transfer,
      tarjeta:    cierre.tarjeta,
      contado:    cierre.contado,
      diferencia: cierre.diferencia,
      notas:      cierre.notas || null,
    })
  if (error) throw error
}
