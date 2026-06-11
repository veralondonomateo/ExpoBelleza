// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SIIGO_BASE_URL = Deno.env.get("SIIGO_BASE_URL") || "https://api.siigo.com";
const SIIGO_USERNAME = Deno.env.get("SIIGO_USERNAME") || "";
const SIIGO_ACCESS_KEY = Deno.env.get("SIIGO_ACCESS_KEY") || "";
const SIIGO_PARTNER_ID = Deno.env.get("SIIGO_PARTNER_ID") || "";

const PRODUCT_CODES: Record<string, string> = {
  "fem-probiotico": "01",
  "jabon-intimo": "07",
  "gomas-pms": "03",
  "fem-mom": "18",
  "soda-prebiotica": "25",
};

// IVA rate (%) per product — prices in the app are tax-inclusive
const TAX_RATES: Record<string, number> = {
  "fem-probiotico": 5,
  "jabon-intimo": 19,
  "gomas-pms": 5,
  "fem-mom": 5,
  "soda-prebiotica": 19,
};

// Module-level cache (persists within Deno isolate across warm requests)
let cachedToken: string | null = null;
let cachedTokenExpiry: Date | null = null;
let cachedSellerId: number | null = null;
let cachedDocumentTypeId: number | null = null;
let cachedIdTypeCC: string | null = null;
const paymentTypeCache: Record<string, number> = {};
const taxIdCache: Record<number, number> = {}; // percentage → Siigo tax type ID
const knownCustomers = new Set<string>();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function getToken(): Promise<string> {
  if (cachedToken && cachedTokenExpiry && new Date() < cachedTokenExpiry) return cachedToken;
  const res = await fetch(`${SIIGO_BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Partner-Id": SIIGO_PARTNER_ID },
    body: JSON.stringify({ username: SIIGO_USERNAME, access_key: SIIGO_ACCESS_KEY }),
  });
  if (!res.ok) throw new Error(`Autenticación Siigo falló: ${await res.text()}`);
  const d = await res.json();
  cachedToken = d.access_token;
  cachedTokenExpiry = new Date(Date.now() + (d.expires_in - 60) * 1000);
  return cachedToken!;
}

async function siigoRequest(method: string, path: string, body?: unknown, qs?: Record<string, string>): Promise<any> {
  const token = await getToken();
  let url = `${SIIGO_BASE_URL}${path}`;
  if (qs) url += "?" + new URLSearchParams(qs).toString();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Partner-Id": SIIGO_PARTNER_ID,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.Errors?.[0] ||
      data?.errors?.[0]?.Message ||
      data?.errors?.[0] ||
      data?.Message ||
      data?.message ||
      JSON.stringify(data).slice(0, 300);
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

async function getSellerId(): Promise<number> {
  if (cachedSellerId) return cachedSellerId;
  const d = await siigoRequest("GET", "/v1/users");
  const first = d.results?.[0];
  if (!first) throw new Error("No se encontró ningún vendedor en Siigo");
  cachedSellerId = first.id;
  return cachedSellerId!;
}

async function getDocumentTypeId(): Promise<number> {
  if (cachedDocumentTypeId) return cachedDocumentTypeId;

  function toArray(d: any): any[] {
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    return [];
  }

  let results = toArray(await siigoRequest("GET", "/v1/document-types", undefined, { type: "FV" }));
  if (results.length === 0) {
    const all = toArray(await siigoRequest("GET", "/v1/document-types"));
    results = all.filter((r: any) =>
      r.keyword === "FV" || r.type === "FV" || r.code === "FV" ||
      (r.name || "").toLowerCase().includes("factura de venta") ||
      (r.name || "").toLowerCase().includes("factura venta")
    );
    if (results.length === 0) results = all;
  }

  const fvTypes = results.filter((r: any) => r.keyword === "FV" || r.type === "FV" || r.code === "FV");
  const pool = fvTypes.length > 0 ? fvTypes : results;
  const fv = pool.reduce((best: any, r: any) =>
    (r.consecutive ?? 0) > (best?.consecutive ?? 0) ? r : best
  , pool[0]);

  if (!fv) throw new Error("No se encontró tipo de documento FV en Siigo.");
  cachedDocumentTypeId = fv.id;
  return cachedDocumentTypeId!;
}

async function getPaymentTypeId(method: string): Promise<number> {
  if (paymentTypeCache[method] !== undefined) return paymentTypeCache[method];
  let results: any[] = [];
  try {
    const d = await siigoRequest("GET", "/v1/payment-types", undefined, { document_type: "FV" });
    results = d.results ?? (Array.isArray(d) ? d : []);
  } catch { /* ignore */ }
  if (results.length === 0) {
    const d = await siigoRequest("GET", "/v1/payment-types");
    results = d.results ?? (Array.isArray(d) ? d : []);
  }
  console.log("Siigo payment types:", JSON.stringify(results.map((p: any) => ({ id: p.id, name: p.name }))));
  for (const pt of results) {
    const name = (pt.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (/efectivo|contado|caja/.test(name))                      paymentTypeCache["efectivo"]      = pt.id;
    if (/transfer|consign|bancolombia|nequi|davip/.test(name))   paymentTypeCache["transferencia"] = pt.id;
    if (/tarjeta|credit|debit|debito|credito/.test(name))        paymentTypeCache["tarjeta"]       = pt.id;
  }
  if (results.length > 0) {
    const fb = results[0].id;
    if (!paymentTypeCache["efectivo"])      paymentTypeCache["efectivo"]      = fb;
    if (!paymentTypeCache["transferencia"]) paymentTypeCache["transferencia"] = fb;
    if (!paymentTypeCache["tarjeta"])       paymentTypeCache["tarjeta"]       = fb;
  }
  if (paymentTypeCache[method] === undefined)
    throw new Error(`Método de pago "${method}" no encontrado.`);
  return paymentTypeCache[method];
}

async function getTaxId(percentage: number): Promise<number> {
  if (taxIdCache[percentage] !== undefined) return taxIdCache[percentage];
  const d = await siigoRequest("GET", "/v1/taxes");
  const taxes: any[] = d.results ?? (Array.isArray(d) ? d : []);
  console.log("Siigo taxes:", JSON.stringify(taxes.map((t: any) => ({ id: t.id, name: t.name, percentage: t.percentage }))));
  for (const tax of taxes) {
    const pct = Number(tax.percentage ?? tax.rate ?? 0);
    if (pct === 19) taxIdCache[19] = tax.id;
    if (pct === 5)  taxIdCache[5]  = tax.id;
    if (pct === 0)  taxIdCache[0]  = tax.id;
  }
  if (taxIdCache[percentage] === undefined)
    throw new Error(`No se encontró IVA ${percentage}% en Siigo. Verifica los impuestos de tu cuenta.`);
  return taxIdCache[percentage];
}

async function getIdTypeCC(): Promise<string> {
  if (cachedIdTypeCC) return cachedIdTypeCC;
  try {
    const d = await siigoRequest("GET", "/v1/id-types");
    const types: any[] = d.results ?? (Array.isArray(d) ? d : []);
    const cc = types.find((t: any) => {
      const name = (t.name || t.description || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      return name.includes("ciudadan") || name.includes("cedula") || t.code === "CC" || t.id === 13;
    }) ?? types[0];
    if (cc) { cachedIdTypeCC = String(cc.id); return cachedIdTypeCC!; }
  } catch { /* use default */ }
  cachedIdTypeCC = "13";
  return cachedIdTypeCC;
}

async function ensureCustomer(customer: { name: string; document: string; phone?: string; email?: string }): Promise<void> {
  if (knownCustomers.has(customer.document)) return;
  const parts = customer.name.trim().split(/\s+/);
  const firstName = parts[0] || "Cliente";
  const lastName = parts.slice(1).join(" ") || "Final";
  const docClean = customer.document.replace(/\s+/g, "").trim();
  const idTypeCC = await getIdTypeCC();
  try {
    await siigoRequest("POST", "/v1/customers", {
      type: "Customer", person_type: "Person", id_type: idTypeCC,
      identification: docClean, name: [firstName, lastName],
      commercial_name: customer.name.trim(), active: true, vat_responsible: false,
      fiscal_responsibilities: [{ code: "R-99-PN" }],
      address: { address: "Sin dirección", city: { country_code: "Co", state_code: "11", city_code: "11001" } },
      phones: [],
      contacts: customer.email ? [{ first_name: firstName, last_name: lastName, email: customer.email }] : [],
    });
  } catch (err: any) {
    const msg = (err.message || "").toLowerCase();
    const isDuplicate =
      msg.includes("ya exist") || msg.includes("duplicad") || msg.includes("identificación") ||
      msg.includes("identificacion") || msg.includes("already exist") || msg.includes("conflict") ||
      msg.includes("409") || msg.includes("customers_service");
    if (!isDuplicate) throw new Error(`Error al crear cliente en Siigo: ${err.message}`);
  }
  knownCustomers.add(customer.document);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const sale = await req.json();
    if (!sale.customer?.document?.trim()) {
      return new Response(
        JSON.stringify({ error: "La cédula/NIT del cliente es obligatoria para la factura electrónica" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const [sellerIdVal, docTypeIdVal] = await Promise.all([getSellerId(), getDocumentTypeId()]);
    await ensureCustomer(sale.customer);

    const subtotal: number = sale.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const discountFactor = subtotal > 0 && sale.discount > 0 ? (subtotal - sale.discount) / subtotal : 1;

    // Prices are IVA-inclusive. Back-calculate the base price so Siigo shows the
    // tax breakdown correctly without changing the total the customer pays.
    const items = await Promise.all(sale.items.map(async (item: any) => {
      const code = PRODUCT_CODES[item.productId];
      if (!code) throw new Error(`Producto "${item.productName}" no tiene código Siigo configurado`);
      const taxRate = TAX_RATES[item.productId] ?? 19;
      const taxId = await getTaxId(taxRate);
      const taxInclusivePrice = item.price * discountFactor;
      // Divide by (1 + rate) to get base; keep 2 decimals to avoid rounding drift
      const basePrice = Math.round(taxInclusivePrice / (1 + taxRate / 100) * 100) / 100;
      return {
        code,
        description: item.productName,
        quantity: item.quantity,
        price: basePrice,
        taxes: [{ id: taxId, percentage: taxRate }],
      };
    }));

    const payments: Array<{ id: number; value: number; due_date: string }> = [];
    if (sale.secondPaymentMethod && sale.secondPaymentAmount > 0) {
      const [id1, id2] = await Promise.all([getPaymentTypeId(sale.paymentMethod), getPaymentTypeId(sale.secondPaymentMethod)]);
      payments.push({ id: id1, value: sale.total - sale.secondPaymentAmount, due_date: sale.date });
      payments.push({ id: id2, value: sale.secondPaymentAmount, due_date: sale.date });
    } else {
      const id = await getPaymentTypeId(sale.paymentMethod);
      payments.push({ id, value: sale.total, due_date: sale.date });
    }

    let invoice: any;
    try {
      invoice = await siigoRequest("POST", "/v1/invoices", {
        document: { id: docTypeIdVal },
        date: sale.date,
        customer: { identification: sale.customer.document.replace(/\s+/g, "").trim(), branch_office: 0 },
        seller: sellerIdVal, items, payments,
      });
    } catch (err: any) {
      const isDuplicate = (err.message || "").toLowerCase().includes("duplicated_document") ||
        (err.message || "").toLowerCase().includes("document already exists");
      if (!isDuplicate) throw err;
      const existing = await siigoRequest("GET", "/v1/invoices", undefined, {
        created_start: sale.date, created_end: sale.date, page: "1", page_size: "1",
      });
      const recovered = existing.results?.[0];
      if (!recovered) throw new Error("Factura duplicada en Siigo y no se pudo recuperar.");
      invoice = recovered;
    }

    const invoiceName = `${invoice.prefix || "FV"}-${invoice.number}`;
    let pdfBase64: string | null = null;
    try {
      const pdf = await siigoRequest("GET", `/v1/invoices/${invoice.id}/pdf`);
      pdfBase64 = pdf.base64 ?? null;
    } catch { /* PDF not yet available */ }

    return new Response(
      JSON.stringify({ id: invoice.id, prefix: invoice.prefix, number: invoice.number, name: invoiceName, pdfBase64 }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Error creando factura Siigo:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error al crear la factura en Siigo" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
