// POST /api/shopify/webhook — odbiera webhooki Shopify.
// Topiki:
//   - orders/paid       → upsert do user_therapists (po emailu lub note_attributes.user_id)
//   - products/update   → re-sync rekordu w therapists (metafields persona_*, cena, handle)
//
// HMAC verify używa SHOPIFY_WEBHOOK_SECRET. Pisanie do bazy przez service role
// (SUPABASE_SERVICE_ROLE_KEY), bo RLS na user_therapists/therapists nie ma policy
// dla anonimowych klientów.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { verifyShopifyHmac, fetchProductMetafields } from '../_lib/shopify';

export const config = { runtime: 'edge' };

type OrderPaid = {
  id: number;
  email: string | null;
  line_items: Array<{ product_id: number; title: string }>;
  note_attributes?: Array<{ name: string; value: string }>;
};

type ProductUpdate = {
  id: number;
  title: string;
  handle: string;
  variants: Array<{ price: string }>;
  image?: { src?: string } | null;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('method-not-allowed', { status: 405 });

  const rawBody = await req.text();
  const hmac = req.headers.get('x-shopify-hmac-sha256');
  const topic = req.headers.get('x-shopify-topic') ?? '';

  if (!(await verifyShopifyHmac(rawBody, hmac))) {
    return new Response('unauthorized', { status: 401 });
  }

  const supaUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !serviceKey) return new Response('missing-supabase-env', { status: 500 });
  const supabase = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });

  try {
    if (topic === 'orders/paid') {
      const order = JSON.parse(rawBody) as OrderPaid;
      await handleOrderPaid(supabase, order);
      return new Response('ok', { status: 200 });
    }
    if (topic === 'products/update' || topic === 'products/create') {
      const product = JSON.parse(rawBody) as ProductUpdate;
      await handleProductUpdate(supabase, product);
      return new Response('ok', { status: 200 });
    }
    return new Response(`unhandled-topic:${topic}`, { status: 200 });
  } catch (e) {
    console.error('webhook error', e);
    return new Response('internal-error', { status: 500 });
  }
}

async function handleOrderPaid(supabase: SupabaseClient, order: OrderPaid): Promise<void> {
  // Znajdź user_id: priorytet cart attribute, fallback po emailu.
  const userIdAttr = order.note_attributes?.find((a) => a.name === 'user_id')?.value;
  let userId: string | null = userIdAttr ?? null;
  if (!userId && order.email) {
    userId = await findUserIdByEmail(supabase, order.email);
  }
  if (!userId) {
    console.warn('orders/paid: no user matched', { orderId: order.id, email: order.email });
    return;
  }

  // Każdy line_item.product_id zmapuj do therapists.shopify_product_id.
  const productIds = order.line_items.map((li) => String(li.product_id));
  if (productIds.length === 0) return;

  const { data: therapists } = await supabase
    .from('therapists')
    .select('id, shopify_product_id')
    .in('shopify_product_id', productIds);

  for (const t of (therapists ?? []) as Array<{ id: string; shopify_product_id: string }>) {
    await supabase.from('user_therapists').upsert(
      {
        user_id: userId,
        therapist_id: t.id,
        shopify_order_id: String(order.id),
      },
      { onConflict: 'user_id,therapist_id' },
    );
  }
}

async function handleProductUpdate(supabase: SupabaseClient, product: ProductUpdate): Promise<void> {
  // Metafields persona_name / system_prompt / short_bio / sort_order / persona_handle.
  const meta = await fetchProductMetafields(product.id);
  const handle = meta.persona_handle?.trim() || product.handle;
  const name = meta.persona_name?.trim() || product.title;
  const systemPrompt = meta.system_prompt?.trim();
  if (!systemPrompt) {
    console.warn('products/update: missing system_prompt metafield', { productId: product.id, handle });
    return;
  }
  const shortBio = meta.short_bio?.trim() || null;
  const sortOrder = meta.sort_order ? Number(meta.sort_order) : 1;
  const priceCents = Math.round(Number(product.variants[0]?.price ?? '0') * 100);
  const avatarUrl = product.image?.src ?? null;

  await supabase.from('therapists').upsert(
    {
      shopify_product_id: String(product.id),
      handle,
      name,
      system_prompt: systemPrompt,
      short_bio: shortBio,
      avatar_url: avatarUrl,
      price_cents: priceCents,
      sort_order: sortOrder,
      is_default: false,
      is_active: true,
      synced_at: new Date().toISOString(),
    },
    { onConflict: 'handle' },
  );
}

async function findUserIdByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  // Service role pozwala czytać auth.users. Listujemy po emailu (Supabase nie ma RPC).
  // Używamy admin.listUsers — ale w edge runtime to OK przez service key.
  const norm = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.warn('listUsers error', error.message);
    return null;
  }
  const u = data.users.find((x) => x.email?.toLowerCase() === norm);
  return u?.id ?? null;
}

// Eksport tylko dla testów (nieużywane przez routing).
export { handleOrderPaid, handleProductUpdate };
