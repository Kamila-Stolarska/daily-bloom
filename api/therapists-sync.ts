// POST /api/therapists-sync — "Odzyskaj zakup".
// Czyta ordery klienta Shopify po emailu zalogowanego usera, mapuje paid line items
// na therapists.shopify_product_id i upsertuje user_therapists. Fallback gdy webhook
// orders/paid się zgubi.
//
// Pisze service-rolem (klient nie ma policy INSERT na user_therapists).

import { createClient } from '@supabase/supabase-js';
import { jsonResponse, CORS_HEADERS } from './_lib/chat-shared';
import { requireUser } from './_lib/auth';
import { fetchOrdersByEmail } from './_lib/shopify';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'method-not-allowed' }, 405);

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { userId, supabase: userClient } = auth;

  const { data: userRes } = await userClient.auth.getUser();
  const email = userRes.user?.email?.trim().toLowerCase();
  if (!email) return jsonResponse({ error: 'missing-email' }, 400);

  let orders;
  try {
    orders = await fetchOrdersByEmail(email);
  } catch (e) {
    return jsonResponse({ error: 'shopify-error', detail: String(e) }, 502);
  }

  if (orders.length === 0) return jsonResponse({ unlocked: [] }, 200);

  const supaUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !serviceKey) return jsonResponse({ error: 'missing-service-key' }, 500);
  const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });

  const productIds = [...new Set(orders.flatMap((o) => o.line_items.map((li) => String(li.product_id))))];
  const { data: therapists } = await admin
    .from('therapists')
    .select('id, shopify_product_id')
    .in('shopify_product_id', productIds);

  const productToTherapist = new Map<string, string>();
  for (const t of (therapists ?? []) as Array<{ id: string; shopify_product_id: string }>) {
    productToTherapist.set(t.shopify_product_id, t.id);
  }

  const unlockedIds: string[] = [];
  for (const order of orders) {
    for (const li of order.line_items) {
      const therapistId = productToTherapist.get(String(li.product_id));
      if (!therapistId) continue;
      await admin
        .from('user_therapists')
        .upsert(
          { user_id: userId, therapist_id: therapistId, shopify_order_id: String(order.id) },
          { onConflict: 'user_id,therapist_id' },
        );
      unlockedIds.push(therapistId);
    }
  }

  return jsonResponse({ unlocked: [...new Set(unlockedIds)] }, 200);
}
