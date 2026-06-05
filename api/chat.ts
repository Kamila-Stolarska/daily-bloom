// Vercel Edge function — czat z xAI Grok.
// Klient wysyła Authorization: Bearer <supabase_access_token> + body { message }.
// My:
//  1) walidujemy sesję Supabase (auth.uid())
//  2) sprawdzamy kredyt (profiles.credit_cents > 0)
//  3) ładujemy kontekst z 14 dni (entries + notes) + ostatnie 20 chat_messages
//  4) zapisujemy user message
//  5) strumieniujemy odpowiedź xAI (OpenAI-compatible) jako SSE do klienta
//  6) po skończeniu zapisujemy assistant message + dekrementujemy credit_cents
//
// Klucz XAI_API_KEY nie może wyciec do bundla — wszystko po stronie serwera.

import { createClient } from '@supabase/supabase-js';
import {
  XAI_URL,
  MODEL,
  PRICE_IN_PER_TOKEN_USD,
  PRICE_OUT_PER_TOKEN_USD,
  CORS_HEADERS,
  buildSystemPrompt,
  estimateTokens,
  type Role,
  type ChatMsg,
  type EntryRow,
  type NoteRow,
} from './_lib/chat-shared';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405);
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'missing-api-key', hint: 'Ustaw XAI_API_KEY w env.' }, 500);
  }
  const supaUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supaAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaAnon) {
    return json({ error: 'missing-supabase-env' }, 500);
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'missing-auth' }, 401);
  }

  let body: { message?: string };
  try {
    body = (await req.json()) as { message?: string };
  } catch {
    return json({ error: 'invalid-json' }, 400);
  }
  const message = body.message?.trim();
  if (!message) {
    return json({ error: 'empty-message' }, 400);
  }

  // Klient Supabase z forwardowanym JWT — RLS naturalne na wszystkich zapytaniach.
  const supabase = createClient(supaUrl, supaAnon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: 'invalid-session' }, 401);
  }
  const userId = userData.user.id;

  // Kredyt.
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('credit_cents, tokens_used, name')
    .eq('user_id', userId)
    .single();
  if (profErr || !profile) {
    return json({ error: 'profile-not-found' }, 404);
  }
  if ((profile.credit_cents ?? 0) <= 0) {
    return json({ error: 'out-of-credits' }, 402);
  }

  // Kontekst — ostatnie 14 dni.
  const since = new Date();
  since.setDate(since.getDate() - 14);
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
  const history = ((historyRes.data ?? []) as Array<{ role: Role; content: string }>)
    .reverse(); // chronologicznie

  const systemPrompt = buildSystemPrompt(profile.name, entries, notes);
  const messages: ChatMsg[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  // Zapisz user message zanim ruszy stream — żeby się nie zgubiło jak coś przerwie.
  await supabase.from('chat_messages').insert({
    user_id: userId,
    role: 'user',
    content: message,
  });

  // Stream do xAI.
  const xaiRes = await fetch(XAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages,
      temperature: 0.8,
      max_tokens: 700,
    }),
  });

  if (!xaiRes.ok || !xaiRes.body) {
    const errBody = await safeText(xaiRes);
    return json({ error: 'upstream-error', status: xaiRes.status, body: errBody }, 502);
  }

  // Parsujemy SSE z xAI, ekstrahujemy delta.content, forwardujemy do klienta jako prosty stream tekstu.
  // Po zakończeniu zapisujemy assistant message + dekrementujemy kredyt.
  const stream = new ReadableStream({
    async start(controller) {
      const reader = xaiRes.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';
      let fullText = '';
      let usageIn = 0;
      let usageOut = 0;

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const raw of lines) {
            const line = raw.trim();
            if (!line || !line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
                usage?: { prompt_tokens?: number; completion_tokens?: number };
              };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                controller.enqueue(encoder.encode(delta));
              }
              if (parsed.usage) {
                usageIn = parsed.usage.prompt_tokens ?? usageIn;
                usageOut = parsed.usage.completion_tokens ?? usageOut;
              }
            } catch {
              // Ignoruj nieparsowalne chunki.
            }
          }
        }

        // Fallback estymaty tokenów jeśli xAI nie zwróciło usage.
        if (usageIn === 0) usageIn = estimateTokens(systemPrompt + message + history.map((h) => h.content).join(''));
        if (usageOut === 0) usageOut = estimateTokens(fullText);

        const costUsd = usageIn * PRICE_IN_PER_TOKEN_USD + usageOut * PRICE_OUT_PER_TOKEN_USD;
        const deltaCents = Math.max(1, Math.ceil(costUsd * 100));

        await supabase.from('chat_messages').insert({
          user_id: userId,
          role: 'assistant',
          content: fullText,
          tokens_in: usageIn,
          tokens_out: usageOut,
        });
        await supabase
          .from('profiles')
          .update({
            credit_cents: Math.max(0, (profile.credit_cents ?? 0) - deltaCents),
            tokens_used: (profile.tokens_used ?? 0) + usageIn + usageOut,
          })
          .eq('user_id', userId);
      } catch (e) {
        controller.enqueue(encoder.encode(`\n[error: ${String(e)}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  });
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return '';
  }
}
