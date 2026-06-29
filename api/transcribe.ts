// Vercel serverless function — proxy do Groq Whisper.
// Klient wysyła multipart/form-data z polem `file` (audio).
// My forwardujemy do api.groq.com z kluczem z env i zwracamy { text }.
//
// Dlaczego Groq, nie OpenAI: ten sam Whisper-large-v3, ~10× taniej, kompatybilne API.
// Dlaczego proxy: klucz GROQ_API_KEY NIE MOŻE wyciec do bundla klienta.
//
// Auth: Bearer JWT (Supabase) — endpoint kosztuje pieniądze przy każdym użyciu,
// więc tylko zalogowani użytkownicy. CORS allowlist (nie `*`), żeby obca strona
// nie odpaliła tego z przeglądarki na nasz rachunek.

import { requireUser } from './_lib/auth';

export const config = {
  // Edge runtime — natywnie wspiera Web FormData/Request/Response oraz fetch z FormData body.
  // Node runtime lokalnie (`vercel dev`) wiesza się na `req.formData()` przy multipart.
  // Limit body na Edge: ~4.5MB — dla mowy przy 32 kbps Opus to >18 min audio, wystarczy.
  runtime: 'edge',
};

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3-turbo';

// Allowlist originów. Produkcja: `ALLOWED_ORIGINS` (przecinkami) lub auto z `VERCEL_URL`.
// Dev: localhost/127.0.0.1 na dowolnym porcie (Metro web 8081, vercel dev 3000).
// Native (iOS/Android) nie wysyła nagłówka Origin — przepuszczamy bez sprawdzenia.
const STATIC_ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const VERCEL_ORIGIN = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

function isAllowedOrigin(origin: string): boolean {
  if (STATIC_ALLOWED.includes(origin)) return true;
  if (VERCEL_ORIGIN && origin === VERCEL_ORIGIN) return true;
  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  } catch {
    /* malformed origin */
  }
  return false;
}

function corsHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
  const origin = req.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    headers['access-control-allow-origin'] = origin;
  }
  return headers;
}

export default async function handler(req: Request): Promise<Response> {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405, cors);
  }

  const auth = await requireUser(req);
  if (!auth.ok) {
    // requireUser zwraca własny Response — przepisz z naszymi CORS-ami.
    const body = await auth.response.text();
    return new Response(body, {
      status: auth.response.status,
      headers: { 'content-type': 'application/json', ...cors },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: 'missing-api-key', hint: 'Ustaw GROQ_API_KEY w env.' }, 500, cors);
  }

  let incoming: any;
  try {
    incoming = await req.formData();
  } catch {
    return json({ error: 'invalid-multipart' }, 400, cors);
  }

  const file = incoming.get('file');
  if (!(file instanceof Blob)) {
    return json({ error: 'missing-file' }, 400, cors);
  }

  // Limit defensywny (Groq sam zwróci 413 przy >25MB, ale lepiej obciąć wcześniej).
  if (file.size > 25 * 1024 * 1024) {
    return json({ error: 'file-too-large', maxBytes: 25 * 1024 * 1024 }, 413, cors);
  }

  // Język domyślnie polski (lepsza interpunkcja niż auto-detect).
  const language = (incoming.get('language') as string) || 'pl';

  const upstream = new FormData() as any;
  // Whisper preferuje nazwę pliku z rozszerzeniem — `.webm` dla web MediaRecorder,
  // `.m4a` dla iOS expo-audio. Nazwa pliku z FormData (jeśli przyszła) ma priorytet.
  const filename = (file as File).name || 'audio.webm';
  upstream.append('file', file, filename);
  upstream.append('model', MODEL);
  upstream.append('language', language);
  upstream.append('response_format', 'json');
  // Temperature 0 = bardziej deterministyczne, mniej halucynacji.
  upstream.append('temperature', '0');

  // Diagnostyka: pokaż w terminalu vercel dev rozmiar pliku i czas Groqa.
  // To zwykle wąskie gardło: upload klient→funkcja albo Groq inference.
  const t0 = Date.now();
  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream as any,
    });
  } catch (e) {
    return json({ error: 'upstream-fetch-failed', detail: String(e) }, 502, cors);
  }
  const groqMs = Date.now() - t0;

  if (!groqRes.ok) {
    const body = await safeText(groqRes);
    return json({ error: 'upstream-error', status: groqRes.status, body }, 502, cors);
  }

  const data = (await groqRes.json()) as { text?: string };
  // eslint-disable-next-line no-console
  console.log(`[transcribe] file=${(file.size / 1024).toFixed(1)}KB groq=${groqMs}ms chars=${data.text?.length ?? 0}`);
  return json({ text: data.text ?? '' }, 200, cors);
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return '';
  }
}
