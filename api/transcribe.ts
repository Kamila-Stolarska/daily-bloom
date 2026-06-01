// Vercel serverless function — proxy do Groq Whisper.
// Klient wysyła multipart/form-data z polem `file` (audio).
// My forwardujemy do api.groq.com z kluczem z env i zwracamy { text }.
//
// Dlaczego Groq, nie OpenAI: ten sam Whisper-large-v3, ~10× taniej, kompatybilne API.
// Dlaczego proxy: klucz GROQ_API_KEY NIE MOŻE wyciec do bundla klienta.
//
// TODO (jeśli wjedzie publicznie): rate-limit per IP (np. @vercel/kv) — bez tego
// ktoś może wypompować nasz darmowy tier.

export const config = {
  // Edge runtime — natywnie wspiera Web FormData/Request/Response oraz fetch z FormData body.
  // Node runtime lokalnie (`vercel dev`) wiesza się na `req.formData()` przy multipart.
  // Limit body na Edge: ~4.5MB — dla mowy przy 32 kbps Opus to >18 min audio, wystarczy.
  runtime: 'edge',
};

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3-turbo';

// Permisywny CORS — w dev Metro (8081) woła Vercel dev (3000) cross-origin.
// W produkcji frontend i API są pod tą samą domeną, więc CORS jest no-op.
const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: 'missing-api-key', hint: 'Ustaw GROQ_API_KEY w env.' }, 500);
  }

  let incoming: any;
  try {
    incoming = await req.formData();
  } catch {
    return json({ error: 'invalid-multipart' }, 400);
  }

  const file = incoming.get('file');
  if (!(file instanceof Blob)) {
    return json({ error: 'missing-file' }, 400);
  }

  // Limit defensywny (Groq sam zwróci 413 przy >25MB, ale lepiej obciąć wcześniej).
  if (file.size > 25 * 1024 * 1024) {
    return json({ error: 'file-too-large', maxBytes: 25 * 1024 * 1024 }, 413);
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
    return json({ error: 'upstream-fetch-failed', detail: String(e) }, 502);
  }
  const groqMs = Date.now() - t0;

  if (!groqRes.ok) {
    const body = await safeText(groqRes);
    return json({ error: 'upstream-error', status: groqRes.status, body }, 502);
  }

  const data = (await groqRes.json()) as { text?: string };
  // eslint-disable-next-line no-console
  console.log(`[transcribe] file=${(file.size / 1024).toFixed(1)}KB groq=${groqMs}ms chars=${data.text?.length ?? 0}`);
  return json({ text: data.text ?? '' }, 200);
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
