// GET  /api/therapists        — katalog z entitlementami (jakie odblokowane, jakie do kupienia)
// POST /api/therapists        — { therapist_id } ustawia profiles.active_therapist_id
//
// Auth: Authorization: Bearer <supabase_access_token>.

import type { SupabaseClient } from '@supabase/supabase-js';
import { CORS_HEADERS, jsonResponse } from './_lib/chat-shared';
import { requireUser } from './_lib/auth';

export const config = { runtime: 'edge' };

type TherapistRow = {
  id: string;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  handle: string;
  name: string;
  short_bio: string | null;
  avatar_url: string | null;
  price_cents: number;
  sort_order: number;
  is_default: boolean;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  if (req.method === 'GET') return getCatalog(supabase, userId);
  if (req.method === 'POST') return setActive(supabase, userId, req);
  return jsonResponse({ error: 'method-not-allowed' }, 405);
}

async function getCatalog(supabase: SupabaseClient, userId: string): Promise<Response> {
  const [catalogRes, entitlementsRes, profileRes] = await Promise.all([
    supabase
      .from('therapists')
      .select('id, shopify_product_id, shopify_variant_id, handle, name, short_bio, avatar_url, price_cents, sort_order, is_default')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('user_therapists').select('therapist_id').eq('user_id', userId),
    supabase.from('profiles').select('active_therapist_id').eq('user_id', userId).maybeSingle<{ active_therapist_id: string | null }>(),
  ]);

  if (catalogRes.error) return jsonResponse({ error: 'db-error', detail: catalogRes.error.message }, 500);

  const catalog = (catalogRes.data ?? []) as TherapistRow[];
  const unlockedIds = new Set((entitlementsRes.data ?? []).map((r) => (r as { therapist_id: string }).therapist_id));
  const items = catalog.map((t) => {
    const isUnlocked = t.is_default || unlockedIds.has(t.id);
    return {
      id: t.id,
      handle: t.handle,
      name: t.name,
      short_bio: t.short_bio,
      avatar_url: t.avatar_url,
      price_cents: t.price_cents,
      is_unlocked: isUnlocked,
      is_default: t.is_default,
      checkout_url: isUnlocked ? null : buildCheckoutUrl(t.shopify_variant_id, userId),
    };
  });

  // Domyślny aktywny: profile.active_therapist_id jeśli odblokowany, inaczej is_default.
  const activeFromProfile = profileRes.data?.active_therapist_id ?? null;
  const activeIsValid =
    activeFromProfile && items.some((i) => i.id === activeFromProfile && i.is_unlocked);
  const fallback = items.find((i) => i.is_default)?.id ?? items[0]?.id ?? null;
  const active_therapist_id = activeIsValid ? activeFromProfile : fallback;

  return jsonResponse({ active_therapist_id, catalog: items }, 200);
}

async function setActive(supabase: SupabaseClient, userId: string, req: Request): Promise<Response> {
  let body: { therapist_id?: string };
  try {
    body = (await req.json()) as { therapist_id?: string };
  } catch {
    return jsonResponse({ error: 'invalid-json' }, 400);
  }
  const therapistId = body.therapist_id?.trim();
  if (!therapistId) return jsonResponse({ error: 'missing-therapist-id' }, 400);

  // Walidacja entitlementu — read przez RLS klienta usera.
  const { data: t } = await supabase
    .from('therapists')
    .select('id, is_default')
    .eq('id', therapistId)
    .eq('is_active', true)
    .maybeSingle<{ id: string; is_default: boolean }>();
  if (!t) return jsonResponse({ error: 'therapist-not-found' }, 404);

  if (!t.is_default) {
    const { data: ent } = await supabase
      .from('user_therapists')
      .select('therapist_id')
      .eq('user_id', userId)
      .eq('therapist_id', therapistId)
      .maybeSingle();
    if (!ent) return jsonResponse({ error: 'therapist-not-unlocked' }, 403);
  }

  const { error } = await supabase
    .from('profiles')
    .update({ active_therapist_id: therapistId })
    .eq('user_id', userId);
  if (error) return jsonResponse({ error: 'db-error', detail: error.message }, 500);

  return jsonResponse({ ok: true, active_therapist_id: therapistId }, 200);
}

// Buduje URL bezpośredni do koszyka z variantem + cart attribute user_id.
// Format /cart/<variant>:1?attributes[user_id]=... przenosi atrybut przez cały checkout,
// więc webhook orders/paid zawsze trafia we właściwego usera, niezależnie od emaila.
function buildCheckoutUrl(variantId: string | null, userId: string): string | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain || !variantId) return null;
  const params = new URLSearchParams({
    [`attributes[user_id]`]: userId,
  });
  return `https://${domain}/cart/${encodeURIComponent(variantId)}:1?${params.toString()}`;
}
