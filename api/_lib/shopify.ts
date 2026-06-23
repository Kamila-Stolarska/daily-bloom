// Helpery do Shopify: HMAC weryfikacja webhooków + minimalny klient Admin API.
// Env wymagane: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN, SHOPIFY_WEBHOOK_SECRET.

const ADMIN_API_VERSION = '2025-01';

export async function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): Promise<boolean> {
  if (!hmacHeader) return false;
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('SHOPIFY_WEBHOOK_SECRET not set — rejecting webhook');
    return false;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  // Stałoczasowe porównanie.
  if (computed.length !== hmacHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hmacHeader.charCodeAt(i);
  }
  return diff === 0;
}

type AdminFetchOpts = { method?: 'GET' | 'POST'; body?: unknown };

export async function adminFetch<T>(path: string, opts: AdminFetchOpts = {}): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!domain || !token) throw new Error('shopify-env-missing');
  const url = `https://${domain}/admin/api/${ADMIN_API_VERSION}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      'X-Shopify-Access-Token': token,
      'content-type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`shopify-${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// Czyta metafields produktu z namespace `dailybloom`. Zwraca mapę key→value.
export async function fetchProductMetafields(productId: number | string): Promise<Record<string, string>> {
  type Meta = { metafields: Array<{ namespace: string; key: string; value: string }> };
  const data = await adminFetch<Meta>(
    `/products/${productId}/metafields.json?namespace=dailybloom`,
  );
  const out: Record<string, string> = {};
  for (const m of data.metafields ?? []) {
    out[m.key] = m.value;
  }
  return out;
}

// Czyta pojedynczy produkt (cena z pierwszego variantu).
export async function fetchProduct(productId: number | string): Promise<{
  id: number;
  title: string;
  handle: string;
  variants: Array<{ id: number; price: string }>;
  image: { src?: string } | null;
}> {
  type R = { product: { id: number; title: string; handle: string; variants: Array<{ id: number; price: string }>; image: { src?: string } | null } };
  const r = await adminFetch<R>(`/products/${productId}.json`);
  return r.product;
}

// Listuje zamówienia (paid, any time) klienta po emailu.
export async function fetchOrdersByEmail(email: string): Promise<Array<{
  id: number;
  email: string | null;
  financial_status: string | null;
  line_items: Array<{ product_id: number; title: string }>;
  note_attributes: Array<{ name: string; value: string }>;
}>> {
  type R = { orders: Array<{ id: number; email: string | null; financial_status: string | null; line_items: Array<{ product_id: number; title: string }>; note_attributes: Array<{ name: string; value: string }> }> };
  const data = await adminFetch<R>(
    `/orders.json?status=any&financial_status=paid&email=${encodeURIComponent(email)}`,
  );
  return data.orders ?? [];
}
