// /api/v1/entries
//   POST — dodaj/zaktualizuj wpis dnia (upsert po userId + date) w Strapi.
//   GET  — lista wpisów zalogowanego użytkownika (ze Strapi).
// Auth: Authorization: Bearer <supabase_access_token>.
// Architektura: Strapi = źródło prawdy dla wpisów; Supabase trzyma embedding + link do Strapi
// (tabela `entry_embeddings`). Stara tabela `entries` w Supabase zostaje jako backup.
// Notatki dalej w Supabase (poza zakresem migracji).

import { CORS_HEADERS, jsonResponse, todayIsoUtc, isValidDateIso } from '../_lib/chat-shared';
import { requireUser } from '../_lib/auth';
import { embedText, buildEmbeddingSource } from '../_lib/embedding';
import { listEntriesByUser, upsertEntry as upsertStrapiEntry, type StrapiEntry } from '../_lib/strapi';

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

function strapiToWire(e: StrapiEntry) {
  return {
    dateIso: e.date,
    day: e.day,
    emotions: e.emotions,
    energy: e.energy,
    body: e.body,
    delight: e.delight,
    meaning: e.meaning,
    somethingGood: e.somethingGood,
    somethingHard: e.somethingHard,
    createdAtIso: e.createdAt,
    strapiDocumentId: e.documentId,
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  if (req.method === 'GET') {
    try {
      const list = await listEntriesByUser(userId);
      return jsonResponse({ entries: list.map(strapiToWire) }, 200);
    } catch (e) {
      return jsonResponse({ error: 'strapi-list-failed', detail: (e as Error).message }, 502);
    }
  }

  if (req.method !== 'POST') return jsonResponse({ error: 'method-not-allowed' }, 405);

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

  let strapiEntry: StrapiEntry;
  try {
    strapiEntry = await upsertStrapiEntry({
      userId,
      date,
      day: body.day!,
      emotions: body.emotions!,
      energy: body.energy!,
      body: body.body!,
      delight: body.delight!,
      meaning: body.meaning!,
      somethingGood: body.somethingGood,
      somethingHard: body.somethingHard,
    });
  } catch (e) {
    return jsonResponse({ error: 'strapi-upsert-failed', detail: (e as Error).message }, 502);
  }

  // Notatka — pozostaje w Supabase.
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

  // Embedding — best-effort. Zapisujemy do tabeli `entry_embeddings` w Supabase z linkiem do Strapi.
  try {
    const noteText = noteOut?.text ?? (typeof body.note === 'string' ? body.note.trim() : '');
    const embeddingSource = buildEmbeddingSource({
      date: strapiEntry.date,
      day: strapiEntry.day,
      emotions: strapiEntry.emotions,
      energy: strapiEntry.energy,
      body: strapiEntry.body,
      delight: strapiEntry.delight,
      meaning: strapiEntry.meaning,
      somethingGood: strapiEntry.somethingGood,
      somethingHard: strapiEntry.somethingHard,
      noteText,
    });
    const vec = await embedText(embeddingSource);
    await supabase
      .from('entry_embeddings')
      .upsert(
        {
          user_id: userId,
          date: strapiEntry.date,
          strapi_document_id: strapiEntry.documentId,
          embedding_source: embeddingSource,
          embedding: `[${vec.join(',')}]`,
        },
        { onConflict: 'user_id,date' },
      );
  } catch (e) {
    console.warn('embedding update failed:', (e as Error).message);
  }

  return jsonResponse(
    {
      entry: strapiToWire(strapiEntry),
      note: noteOut,
    },
    200,
  );
}
