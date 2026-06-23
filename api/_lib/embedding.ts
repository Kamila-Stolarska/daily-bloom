// OpenAI text-embedding-3-small (1536D) — wrapper dla Edge runtime.
// Używamy do (a) embedding zapytań w czacie i (b) embedding wpisów przy upsercie.

const OPENAI_URL = 'https://api.openai.com/v1/embeddings';
const MODEL = 'text-embedding-3-small';

// Minimalny LRU cache w pamięci procesu — chat user często powtarza podobne pytania w sesji.
const CACHE_MAX = 100;
const cache = new Map<string, number[]>();

function cacheGet(key: string): number[] | undefined {
  const v = cache.get(key);
  if (!v) return undefined;
  cache.delete(key);
  cache.set(key, v);
  return v;
}

function cacheSet(key: string, vec: number[]): void {
  cache.set(key, vec);
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export async function embedText(text: string): Promise<number[]> {
  const key = text.trim().toLowerCase();
  const hit = cacheGet(key);
  if (hit) return hit;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('missing-openai-key');

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`openai-embed ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  const vec = data.data?.[0]?.embedding;
  if (!vec) throw new Error('openai-embed-empty');
  cacheSet(key, vec);
  return vec;
}

// Tekstowa reprezentacja wpisu z której liczymy wektor. MUSI być spójna z `scripts/seed-history.ts`,
// żeby seedowane wpisy i nowe wpisy żyły w tej samej przestrzeni embeddingów.
export function buildEmbeddingSource(args: {
  date: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  somethingGood: boolean;
  somethingHard: boolean;
  noteText?: string;
}): string {
  const label = (v: number): string =>
    v <= 1 ? 'bardzo mało' : v === 2 ? 'mało' : v === 3 ? 'średnio' : v === 4 ? 'sporo' : 'dużo';
  const tags: string[] = [];
  if (args.somethingGood) tags.push('coś dobrego');
  if (args.somethingHard) tags.push('coś trudnego');
  const tagStr = tags.length ? `Tagi: ${tags.join(', ')}.` : '';
  const noteStr = args.noteText && args.noteText.trim() ? `Notatka: ${args.noteText.trim()}` : '';
  return [
    `Data: ${args.date}.`,
    `Dzień ogólnie: ${label(args.day)} (${args.day}/5).`,
    `Emocje: ${label(args.emotions)} (${args.emotions}/5).`,
    `Energia: ${label(args.energy)} (${args.energy}/5).`,
    `Ciało: ${label(args.body)} (${args.body}/5).`,
    `Zachwyt: ${label(args.delight)} (${args.delight}/5).`,
    `Sens: ${label(args.meaning)} (${args.meaning}/5).`,
    tagStr,
    noteStr,
  ].filter(Boolean).join(' ');
}
