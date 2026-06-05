// Wspólny helper auth dla publicznych endpointów API.
// Waliduje Bearer JWT przez Supabase i zwraca klient z forwardowanym tokenem (RLS naturalne).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { jsonResponse } from './chat-shared';

export type AuthOk = { ok: true; userId: string; supabase: SupabaseClient };
export type AuthErr = { ok: false; response: Response };

export async function requireUser(req: Request): Promise<AuthOk | AuthErr> {
  const supaUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supaAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaAnon) {
    return { ok: false, response: jsonResponse({ error: 'missing-supabase-env' }, 500) };
  }
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { ok: false, response: jsonResponse({ error: 'missing-auth' }, 401) };
  }
  const supabase = createClient(supaUrl, supaAnon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: jsonResponse({ error: 'invalid-session' }, 401) };
  }
  return { ok: true, userId: data.user.id, supabase };
}
