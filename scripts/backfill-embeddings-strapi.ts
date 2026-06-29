/* eslint-disable no-console */
// Backfill embeddingów dla wpisów już istniejących w Strapi.
// Czyta wpisy ze Strapi → buduje embedding_source (ten sam format co api/_lib/embedding.ts)
// → embed przez OpenAI text-embedding-3-small → upsert do public.entry_embeddings w Supabase.
//
// Idempotentny: pomija (user_id, date), które już mają embedding.
//
// Wymaga w .env.local:
//   EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   STRAPI_URL
//   STRAPI_TOKEN
//   OPENAI_API_KEY
//
// Uruchomienie:
//   PATH=/Users/kamilastolarska/.nvm/versions/node/v20.20.2/bin:$PATH \
//     npx tsx --env-file=.env.local scripts/backfill-embeddings-strapi.ts

import { createClient } from '@supabase/supabase-js';
// @ts-expect-error — ws bez typów.
import WS from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).WebSocket ??= WS as unknown as typeof WebSocket;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) { console.error(`Brakuje env: ${name}`); process.exit(1); }
  return v;
}

const SUPA_URL = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const STRAPI_URL = requireEnv('STRAPI_URL').replace(/\/$/, '');
const STRAPI_TOKEN = requireEnv('STRAPI_TOKEN');
const OPENAI_KEY = requireEnv('OPENAI_API_KEY');

type StrapiEntry = {
  documentId: string;
  userId: string;
  date: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  somethingGood: boolean;
  somethingHard: boolean;
};

function label(v: number): string {
  return v <= 1 ? 'bardzo mało' : v === 2 ? 'mało' : v === 3 ? 'średnio' : v === 4 ? 'sporo' : 'dużo';
}

function buildEmbeddingSource(e: StrapiEntry, noteText?: string): string {
  const tags: string[] = [];
  if (e.somethingGood) tags.push('coś dobrego');
  if (e.somethingHard) tags.push('coś trudnego');
  const tagStr = tags.length ? `Tagi: ${tags.join(', ')}.` : '';
  const noteStr = noteText && noteText.trim() ? `Notatka: ${noteText.trim()}` : '';
  return [
    `Data: ${e.date}.`,
    `Dzień ogólnie: ${label(e.day)} (${e.day}/5).`,
    `Emocje: ${label(e.emotions)} (${e.emotions}/5).`,
    `Energia: ${label(e.energy)} (${e.energy}/5).`,
    `Ciało: ${label(e.body)} (${e.body}/5).`,
    `Zachwyt: ${label(e.delight)} (${e.delight}/5).`,
    `Sens: ${label(e.meaning)} (${e.meaning}/5).`,
    tagStr,
    noteStr,
  ].filter(Boolean).join(' ');
}

async function embedText(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

async function fetchAllStrapi(): Promise<StrapiEntry[]> {
  const out: StrapiEntry[] = [];
  const pageSize = 100;
  let page = 1;
  while (true) {
    const url = new URL(`${STRAPI_URL}/api/entries`);
    url.searchParams.set('pagination[pageSize]', String(pageSize));
    url.searchParams.set('pagination[page]', String(page));
    url.searchParams.set('sort', 'date:asc');
    const res = await fetch(url.toString(), {
      headers: { accept: 'application/json', authorization: `Bearer ${STRAPI_TOKEN}` },
    });
    if (!res.ok) throw new Error(`strapi ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { data: StrapiEntry[]; meta: { pagination: { pageCount: number } } };
    out.push(...(json.data ?? []));
    if (page >= (json.meta?.pagination?.pageCount ?? page)) break;
    page++;
  }
  return out;
}

async function main(): Promise<void> {
  console.log(`Strapi: ${STRAPI_URL}`);
  const supabase = createClient(SUPA_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const entries = await fetchAllStrapi();
  console.log(`Strapi zwrócił ${entries.length} wpisów.`);

  const { data: existing } = await supabase
    .from('entry_embeddings')
    .select('user_id, date')
    .not('embedding', 'is', null);
  const have = new Set<string>((existing ?? []).map((r) => `${r.user_id}__${r.date}`));
  console.log(`Już z embeddingiem: ${have.size}`);

  // Notatki do złączenia (per user, date — tekst pierwszej notatki tego dnia).
  const { data: notes } = await supabase
    .from('notes')
    .select('user_id, date, text');
  const noteMap = new Map<string, string>();
  for (const n of notes ?? []) {
    const k = `${n.user_id}__${n.date}`;
    if (!noteMap.has(k)) noteMap.set(k, (n as { text: string }).text);
  }

  let created = 0, skipped = 0, failed = 0;
  for (const e of entries) {
    const k = `${e.userId}__${e.date}`;
    if (have.has(k)) { skipped++; continue; }
    try {
      const source = buildEmbeddingSource(e, noteMap.get(k));
      const vec = await embedText(source);
      const { error } = await supabase
        .from('entry_embeddings')
        .upsert({
          user_id: e.userId,
          date: e.date,
          strapi_document_id: e.documentId,
          embedding_source: source,
          embedding: `[${vec.join(',')}]`,
        }, { onConflict: 'user_id,date' });
      if (error) throw new Error(error.message);
      created++;
      if (created % 25 === 0) console.log(`  + ${created} (${e.userId.slice(0,8)} ${e.date})`);
    } catch (err) {
      failed++;
      console.error(`  ! ${e.userId.slice(0,8)} ${e.date}: ${(err as Error).message}`);
    }
  }
  console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed}`);
}

void main();
