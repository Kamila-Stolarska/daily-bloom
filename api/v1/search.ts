// /api/v1/search — semantyczna wyszukiwarka wpisów dziennika.
// Faza 5 kursu: embed zapytania (OpenAI 1536D) + hybrid search (vector + BM25, RRF)
// na tabeli `entry_embeddings` w Supabase. Wpisy żyją w Strapi, ale do wyszukiwarki
// wystarczy `embedding_source` (czytelna polska reprezentacja wpisu).
//
// POST { query: string, k?: number } → { results: [{ date, strapiDocumentId, embeddingSource, score }] }
// Auth: Authorization: Bearer <supabase_access_token>.

import { CORS_HEADERS, jsonResponse } from '../_lib/chat-shared';
import { requireUser } from '../_lib/auth';
import { embedText } from '../_lib/embedding';

export const config = { runtime: 'edge' };

type Body = { query?: string; k?: number };

type RpcRow = {
  date: string;
  strapi_document_id: string;
  embedding_source: string | null;
  score: number;
  vec_rank: number | null;
  bm_rank: number | null;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'method-not-allowed' }, 405);

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: 'invalid-json' }, 400);
  }

  const query = (body.query ?? '').trim();
  if (query.length < 2) {
    return jsonResponse({ error: 'invalid-query', hint: 'Podaj co najmniej 2 znaki.' }, 400);
  }
  const k = typeof body.k === 'number' && body.k > 0 && body.k <= 50 ? Math.floor(body.k) : 10;

  let vec: number[];
  try {
    vec = await embedText(query);
  } catch (e) {
    return jsonResponse({ error: 'embed-failed', detail: (e as Error).message }, 502);
  }

  const { data, error } = await supabase.rpc('hybrid_search_entry_embeddings', {
    p_user_id: userId,
    p_query: query,
    p_query_embedding: `[${vec.join(',')}]`,
    p_k: k,
  });

  if (error) {
    return jsonResponse({ error: 'rpc-failed', detail: error.message }, 500);
  }

  const results = ((data ?? []) as RpcRow[]).map((r) => ({
    date: r.date,
    strapiDocumentId: r.strapi_document_id,
    embeddingSource: r.embedding_source ?? '',
    score: r.score,
    vecRank: r.vec_rank,
    bmRank: r.bm_rank,
  }));

  return jsonResponse({ results }, 200);
}
