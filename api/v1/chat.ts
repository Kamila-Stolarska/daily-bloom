// POST /api/v1/chat — JSON wariant czatu (dla agentów/skryptów).
// Zwraca pełną odpowiedź modelu po jej wygenerowaniu (bez streamingu).
// Auth: Authorization: Bearer <supabase_access_token>.
// Body: { message: string, date?: "YYYY-MM-DD" } — date oznacza dzień rozmowy w kontekście.

import {
  CORS_HEADERS,
  XAI_URL,
  MODEL,
  PRICE_IN_PER_TOKEN_USD,
  PRICE_OUT_PER_TOKEN_USD,
  buildSystemPrompt,
  estimateTokens,
  jsonResponse,
  todayIsoUtc,
  isValidDateIso,
  type ChatMsg,
  type Role,
  type EntryRow,
  type NoteRow,
} from '../_lib/chat-shared';
import { requireUser } from '../_lib/auth';

export const config = { runtime: 'edge' };

type Body = { message?: string; date?: string };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'method-not-allowed' }, 405);

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return jsonResponse({ error: 'missing-api-key' }, 500);

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: 'invalid-json' }, 400);
  }
  const message = body.message?.trim();
  if (!message) return jsonResponse({ error: 'empty-message' }, 400);

  const dateContext = body.date ?? todayIsoUtc();
  if (!isValidDateIso(dateContext)) {
    return jsonResponse({ error: 'invalid-date', hint: 'Użyj formatu YYYY-MM-DD.' }, 400);
  }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('credit_cents, tokens_used, name')
    .eq('user_id', userId)
    .single();
  if (profErr || !profile) return jsonResponse({ error: 'profile-not-found' }, 404);
  if ((profile.credit_cents ?? 0) <= 0) return jsonResponse({ error: 'out-of-credits' }, 402);

  // Kontekst — ostatnie 14 dni licząc od dateContext.
  const since = new Date(dateContext + 'T00:00:00Z');
  since.setUTCDate(since.getUTCDate() - 14);
  const sinceIso = since.toISOString().slice(0, 10);

  const [entriesRes, notesRes, historyRes] = await Promise.all([
    supabase
      .from('entries')
      .select('date,day,emotions,energy,body,delight,meaning,something_good,something_hard')
      .eq('user_id', userId)
      .gte('date', sinceIso)
      .order('date', { ascending: true }),
    supabase
      .from('notes')
      .select('date,text,created_at')
      .eq('user_id', userId)
      .gte('date', sinceIso)
      .order('created_at', { ascending: true }),
    supabase
      .from('chat_messages')
      .select('role,content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const entries = (entriesRes.data ?? []) as EntryRow[];
  const notes = (notesRes.data ?? []) as NoteRow[];
  const history = ((historyRes.data ?? []) as Array<{ role: Role; content: string }>).reverse();

  const systemPrompt = buildSystemPrompt(profile.name, entries, notes);
  const messages: ChatMsg[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  await supabase.from('chat_messages').insert({ user_id: userId, role: 'user', content: message });

  const xaiRes = await fetch(XAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages,
      temperature: 0.8,
      max_tokens: 700,
    }),
  });

  if (!xaiRes.ok) {
    const errBody = await xaiRes.text().catch(() => '');
    return jsonResponse({ error: 'upstream-error', status: xaiRes.status, body: errBody }, 502);
  }

  const data = (await xaiRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const reply = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!reply) return jsonResponse({ error: 'empty-reply' }, 502);

  const usageIn = data.usage?.prompt_tokens ?? estimateTokens(systemPrompt + message);
  const usageOut = data.usage?.completion_tokens ?? estimateTokens(reply);
  const costUsd = usageIn * PRICE_IN_PER_TOKEN_USD + usageOut * PRICE_OUT_PER_TOKEN_USD;
  const deltaCents = Math.max(1, Math.ceil(costUsd * 100));
  const creditCentsRemaining = Math.max(0, (profile.credit_cents ?? 0) - deltaCents);

  await supabase.from('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content: reply,
    tokens_in: usageIn,
    tokens_out: usageOut,
  });
  await supabase
    .from('profiles')
    .update({
      credit_cents: creditCentsRemaining,
      tokens_used: (profile.tokens_used ?? 0) + usageIn + usageOut,
    })
    .eq('user_id', userId);

  return jsonResponse(
    {
      reply,
      date: dateContext,
      tokensIn: usageIn,
      tokensOut: usageOut,
      creditCentsRemaining,
    },
    200,
  );
}
