// POST /api/v1/entries — dodaj/zaktualizuj wpis (upsert po user_id + date).
// Auth: Authorization: Bearer <supabase_access_token>.
// Body: { date?, day, emotions, energy, body, delight, meaning, somethingGood, somethingHard, note? }
// date domyślnie = dziś (UTC). note opcjonalna — jeśli podana, dodaje wiersz do notes.

import { CORS_HEADERS, jsonResponse, todayIsoUtc, isValidDateIso } from '../_lib/chat-shared';
import { requireUser } from '../_lib/auth';

export const config = { runtime: 'edge' };

type Body = {
  date?: string;
  day?: number;
  emotions?: number;
  energy?: number;
  body?: number;
  delight?: number;
  meaning?: number;
  somethingGood?: boolean;
  somethingHard?: boolean;
  note?: string;
};

const AXES = ['day', 'emotions', 'energy', 'body', 'delight', 'meaning'] as const;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'method-not-allowed' }, 405);

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: 'invalid-json' }, 400);
  }

  const date = body.date ?? todayIsoUtc();
  if (!isValidDateIso(date)) {
    return jsonResponse({ error: 'invalid-date', hint: 'Użyj formatu YYYY-MM-DD.' }, 400);
  }

  for (const k of AXES) {
    const v = body[k];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) {
      return jsonResponse({ error: 'invalid-axis', field: k, hint: 'Wartość musi być liczbą całkowitą 1–5.' }, 400);
    }
  }
  if (typeof body.somethingGood !== 'boolean' || typeof body.somethingHard !== 'boolean') {
    return jsonResponse({ error: 'invalid-tags', hint: 'somethingGood i somethingHard muszą być boolean.' }, 400);
  }
  if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 4000)) {
    return jsonResponse({ error: 'invalid-note', hint: 'note musi być stringiem ≤ 4000 znaków.' }, 400);
  }

  const nowIso = new Date().toISOString();
  const { supabase, userId } = auth;

  const { data: entryRow, error: entryErr } = await supabase
    .from('entries')
    .upsert(
      {
        user_id: userId,
        date,
        day: body.day,
        emotions: body.emotions,
        energy: body.energy,
        body: body.body,
        delight: body.delight,
        meaning: body.meaning,
        something_good: body.somethingGood,
        something_hard: body.somethingHard,
        created_at: nowIso,
      },
      { onConflict: 'user_id,date' },
    )
    .select('*')
    .single();
  if (entryErr || !entryRow) {
    return jsonResponse({ error: 'upsert-failed', detail: entryErr?.message }, 500);
  }

  let noteOut: { id: string; date: string; text: string; createdAtIso: string } | undefined;
  if (typeof body.note === 'string' && body.note.trim().length > 0) {
    const { data: noteRow, error: noteErr } = await supabase
      .from('notes')
      .insert({ user_id: userId, date, text: body.note.trim() })
      .select('*')
      .single();
    if (noteErr || !noteRow) {
      return jsonResponse({ error: 'note-insert-failed', detail: noteErr?.message }, 500);
    }
    noteOut = {
      id: noteRow.id as string,
      date: noteRow.date as string,
      text: noteRow.text as string,
      createdAtIso: noteRow.created_at as string,
    };
  }

  return jsonResponse(
    {
      entry: {
        dateIso: entryRow.date,
        day: entryRow.day,
        emotions: entryRow.emotions,
        energy: entryRow.energy,
        body: entryRow.body,
        delight: entryRow.delight,
        meaning: entryRow.meaning,
        somethingGood: entryRow.something_good,
        somethingHard: entryRow.something_hard,
        createdAtIso: entryRow.created_at,
      },
      note: noteOut,
    },
    200,
  );
}
