// GET /api/v1/entries/:date — pobierz wpis i notatki dla daty.
// Auth: Authorization: Bearer <supabase_access_token>.
// Brak wpisu = entry: null (nie 404), żeby agent miał jeden kształt do parsowania.

import { CORS_HEADERS, jsonResponse, isValidDateIso } from '../../_lib/chat-shared';
import { requireUser } from '../../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'GET') return jsonResponse({ error: 'method-not-allowed' }, 405);

  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const date = segments[segments.length - 1];
  if (!date || !isValidDateIso(date)) {
    return jsonResponse({ error: 'invalid-date', hint: 'Użyj formatu YYYY-MM-DD.' }, 400);
  }

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  const [entryRes, notesRes] = await Promise.all([
    supabase
      .from('entries')
      .select('date,day,emotions,energy,body,delight,meaning,something_good,something_hard,created_at')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle(),
    supabase
      .from('notes')
      .select('id,date,text,created_at')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true }),
  ]);

  if (entryRes.error) {
    return jsonResponse({ error: 'entry-fetch-failed', detail: entryRes.error.message }, 500);
  }
  if (notesRes.error) {
    return jsonResponse({ error: 'notes-fetch-failed', detail: notesRes.error.message }, 500);
  }

  const entry = entryRes.data
    ? {
        dateIso: entryRes.data.date,
        day: entryRes.data.day,
        emotions: entryRes.data.emotions,
        energy: entryRes.data.energy,
        body: entryRes.data.body,
        delight: entryRes.data.delight,
        meaning: entryRes.data.meaning,
        somethingGood: entryRes.data.something_good,
        somethingHard: entryRes.data.something_hard,
        createdAtIso: entryRes.data.created_at,
      }
    : null;

  const notes = (notesRes.data ?? []).map((n) => ({
    id: n.id,
    date: n.date,
    text: n.text,
    createdAtIso: n.created_at,
  }));

  return jsonResponse({ entry, notes }, 200);
}
