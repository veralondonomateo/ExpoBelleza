// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SIIGO_BASE_URL = Deno.env.get("SIIGO_BASE_URL") || "https://api.siigo.com";
const SIIGO_USERNAME = Deno.env.get("SIIGO_USERNAME") || "";
const SIIGO_ACCESS_KEY = Deno.env.get("SIIGO_ACCESS_KEY") || "";
const SIIGO_PARTNER_ID = Deno.env.get("SIIGO_PARTNER_ID") || "";

// Mapping from app product IDs to Siigo product codes
const PRODUCT_CODES: Record<string, string> = {
  "fem-probiotico": "1",
  "jabon-intimo": "7",
  "gomas-pms": "3",
  "fem-mom": "18",
  "soda-prebiotica": "25",
};

// Module-level cache (persists within Deno isolate across warm requests)
let cachedToken: string | null = null;
let cachedTokenExpiry: Date | null = null;
let cachedSellerId: number | null = null;
let cachedDocumentTypeId: number | null = null;
const paymentTypeCache: Record<string, number> = {};
const productTaxCache: Record<string, number[]> = {};
const knownCustomers = new Set<string>();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Siigo HTTP helpers ────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  if (cachedToken && cachedTokenExpiry && new Date() < cachedTokenExpiry) {
    return cachedToken;
  }
  const res = await fetch(`${SIIGO_BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Partner-Id": SIIGO_PARTNER_ID },
    body: JSON.stringify({ username: SIIGO_USERNAME, access_key: SIIGO_ACCESS_KEY }),
  });
  if (!res.ok) throw new Error(`Autenticación Siigo falló: ${await res.text()}`);
  const d = await res.json();
  cachedToken = d.access_token;
  // Expire 60s early to avoid using a token right as it expires
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
    // Siigo uses both camelCase and PascalCase depending on the endpoint
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

// ── Catalog helpers ───────────────────────────────────────────────────────────

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

  // Siigo can return either an array or { results: [...] }
  function toArray(d: any): any[] {
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    return [];
  }

  // Try with FV filter first
  let results = toArray(await siigoRequest("GET", "/v1/document-types", undefined, { type: "FV" }));

  // If empty, fetch all types and filter manually
  if (results.length === 0) {
    const all = toArray(await siigoRequest("GET", "/v1/document-types"));
    results = all.filter((r: any) =>
      r.keyword === "FV" || r.type === "FV" || r.code === "FV" ||
      (r.name || "").toLowerCase().includes("factura de venta") ||
      (r.name || "").toLowerCase().includes("factura venta")
    );
    if (results.length === 0) results = all; // last resort: use any
  }

  // Pick exact FV match or first available
  const fv = results.find((r: any) =>
    r.keyword === "FV" || r.type === "FV" || r.code === "FV"
  ) ?? results[0];

  if (!fv) throw new Error("No se encontró tipo de documento FV en Siigo. Verifica que tu cuenta tenga Facturas de Venta configuradas.");
  cachedDocumentTypeId = fv.id;
  return cachedDocumentTypeId!;
}

async function getPaymentTypeId(method: string): Promise<number> {
  if (paymentTypeCache[method] !== undefined) return paymentTypeCache[method];

  // Try with FV filter first, then without filter as fallback
  let results: any[] = [];
  try {
    const d = await siigoRequest("GET", "/v1/payment-types", undefined, { document_type: "FV" });
    results = d.results ?? (Array.isArray(d) ? d : []);
  } catch { /* ignore, try without filter */ }

  if (results.length === 0) {
    const d = await siigoRequest("GET", "/v1/payment-types");
    results = d.results ?? (Array.isArray(d) ? d : []);
  }

  console.log("Siigo payment types available:", JSON.stringify(results.map((p: any) => ({ id: p.id, name: p.name }))));

  for (const pt of results) {
    const name = (pt.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (/efectivo|contado|caja/.test(name))           paymentTypeCache["efectivo"]      = pt.id;
    if (/transfer|consign|bancolombia|nequi|davip/.test(name)) paymentTypeCache["transferencia"] = pt.id;
    if (/tarjeta|credit|debit|debito|credito/.test(name))      paymentTypeCache["tarjeta"]       = pt.id;
  }

  // If still unmatched, use the first available for everything
  if (results.length > 0) {
    const fallbackId = results[0].id;
    if (!paymentTypeCache["efectivo"])      paymentTypeCache["efectivo"]      = fallbackId;
    if (!paymentTypeCache["transferencia"]) paymentTypeCache["transferencia"] = fallbackId;
    if (!paymentTypeCache["tarjeta"])       paymentTypeCache["tarjeta"]       = fallbackId;
  }

  if (paymentTypeCache[method] === undefined) {
    throw new Error(`Método de pago "${method}" no encontrado. Tipos disponibles: ${results.map((p: any) => p.name).join(", ")}`);
  }
  return paymentTypeCache[method];
}

async function getProductTaxes(siigoCode: string): Promise<number[]> {
  if (productTaxCache[siigoCode] !== undefined) return productTaxCache[siigoCode];
  try {
    const d = await siigoRequest("GET", "/v1/products", undefined, {
      code: siigoCode,
      page: "1",
      page_size: "100",
    });
    const prod = d.results?.find((p: any) => p.code === siigoCode) ?? d.results?.[0];
    const taxes = (prod?.taxes ?? []).map((t: any) => t.id);
    productTaxCache[siigoCode] = taxes;
    return taxes;
  } catch {
    productTaxCache[siigoCode] = [];
    return [];
  }
}

// ── Customer handling ─────────────────────────────────────────────────────────

async function ensureCustomer(customer: {
  name: string;
  document: string;
  phone?: string;
  email?: string;
}): Promise<void> {
  if (knownCustomers.has(customer.document)) return;

  const parts = customer.name.trim().split(/\s+/);
  const firstName = parts[0] || "Cliente";
  const lastName = parts.slice(1).join(" ") || "Final";
  const phone = customer.phone?.replace(/\D/g, "");
  const docClean = customer.document.replace(/\s+/g, "").trim();

  try {
    await siigoRequest("POST", "/v1/customers", {
      type: "Customer",
      person_type: "Person",
      id_type: { id: 13 },
      identification: docClean,
      name: [firstName, lastName],
      commercial_name: customer.name.trim(),
      active: true,
      vat_responsible: false,
      fiscal_responsibilities: [{ code: "R-99-PN" }],
      address: {
        address: "Sin dirección",
        city: { country_code: "Co", state_code: "11", city_code: "11001" },
      },
      phones: phone ? [{ indicative: "57", number: phone }] : [],
      contacts: customer.email
        ? [{ first_name: firstName, last_name: lastName, email: customer.email }]
        : [],
    });
  } catch (err: any) {
    const msg = (err.message || "").toLowerCase();
    const isDuplicate =
      msg.includes("ya exist") ||
      msg.includes("duplicad") ||
      msg.includes("identificación") ||
      msg.includes("identificacion") ||
      msg.includes("already exist") ||
      msg.includes("conflict") ||
      msg.includes("invalid_reference") ||
      msg.includes("409");
    if (!isDuplicate) {
      throw new Error(`Error al crear cliente en Siigo: ${err.message}`);
    }
  }
  knownCustomers.add(customer.document);
}

// ── Main handler ──────────────────────────────────────────────────────────────

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

    // Fetch seller and document type in parallel
    const [sellerIdVal, docTypeIdVal] = await Promise.all([getSellerId(), getDocumentTypeId()]);

    // Ensure customer exists in Siigo
    await ensureCustomer(sale.customer);

    // Distribute discount proportionally across item prices
    const subtotal: number = sale.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const discountFactor = subtotal > 0 && sale.discount > 0 ? (subtotal - sale.discount) / subtotal : 1;

    // Build invoice items with taxes fetched from Siigo product catalog
    const items = await Promise.all(
      sale.items.map(async (item: any) => {
        const code = PRODUCT_CODES[item.productId];
        if (!code) throw new Error(`Producto "${item.productName}" no tiene código Siigo configurado`);
        const taxes = await getProductTaxes(code);
        const unitPrice = Math.round(item.price * discountFactor);
        return {
          code,
          description: item.productName,
          quantity: item.quantity,
          price: unitPrice,
          taxes: taxes.map((id: number) => ({ id })),
        };
      }),
    );

    // Build payments
    const payments: Array<{ id: number; value: number }> = [];
    if (sale.secondPaymentMethod && sale.secondPaymentAmount > 0) {
      const [id1, id2] = await Promise.all([
        getPaymentTypeId(sale.paymentMethod),
        getPaymentTypeId(sale.secondPaymentMethod),
      ]);
      payments.push({ id: id1, value: sale.total - sale.secondPaymentAmount });
      payments.push({ id: id2, value: sale.secondPaymentAmount });
    } else {
      const id = await getPaymentTypeId(sale.paymentMethod);
      payments.push({ id, value: sale.total });
    }

    const invoice = await siigoRequest("POST", "/v1/invoices", {
      document: { id: docTypeIdVal },
      date: sale.date,
      customer: { identification: sale.customer.document.replace(/\s+/g, "").trim(), branch_office: 0 },
      seller: sellerIdVal,
      items,
      payments,
      stamp: { send: true },
    });

    const invoiceName = `${invoice.prefix || "FV"}-${invoice.number}`;

    // Fetch PDF base64 — best-effort, don't fail the invoice if this errors
    let pdfBase64: string | null = null;
    try {
      const pdf = await siigoRequest("GET", `/v1/invoices/${invoice.id}/pdf`);
      pdfBase64 = pdf.base64 ?? null;
    } catch {
      // PDF not yet available (e.g. stamp pending) — client can retry later
    }

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
