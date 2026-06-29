/* eslint-disable no-console */
// Backfill: kopiuje wpisy z Supabase (tabela `entries`) do Strapi (collection `entries`).
// Stara tabela w Supabase ZOSTAJE — to jest backup zgodnie z Fazą 3 kursu.
// Idempotentny: jeśli (userId, date) już istnieje w Strapi → aktualizuje, nie duplikuje.
//
// Wymaga w .env.local:
//   EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    (sekret — tylko lokalnie!)
//   STRAPI_URL                   (np. http://localhost:1337)
//   STRAPI_TOKEN                 (Full access)
//
// Uruchomienie:
//   PATH=/Users/kamilastolarska/.nvm/versions/node/v20.20.2/bin:$PATH \
//     npx tsx --env-file=.env.local scripts/backfill-entries-to-strapi.ts

import { createClient } from '@supabase/supabase-js';
// Node 20 nie ma natywnego WebSocket — polyfill przed utworzeniem klienta Supabase.
// @ts-expect-error — ws bez typów, używamy tylko konstruktora.
import WS from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).WebSocket ??= WS as unknown as typeof WebSocket;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Brakuje zmiennej env: ${name}`);
    process.exit(1);
  }
  return v;
}

const SUPA_URL = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const STRAPI_URL = requireEnv('STRAPI_URL').replace(/\/$/, '');
const STRAPI_TOKEN = requireEnv('STRAPI_TOKEN');

type Row = {
  id: string;
  user_id: string;
  date: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  something_good: boolean;
  something_hard: boolean;
};

type StrapiEntry = { id: number; documentId: string; userDate: string };

function userDateKey(userId: string, date: string): string {
  return `${userId}__${date}`;
}

function strapiHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    accept: 'application/json',
    authorization: `Bearer ${STRAPI_TOKEN}`,
    ...(extra ?? {}),
  };
}

async function findExisting(userId: string, date: string): Promise<StrapiEntry | null> {
  const url = new URL(`${STRAPI_URL}/api/entries`);
  url.searchParams.set('filters[userDate][$eq]', userDateKey(userId, date));
  url.searchParams.set('pagination[pageSize]', '1');
  const res = await fetch(url.toString(), { headers: strapiHeaders() });
  if (!res.ok) throw new Error(`find ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data: StrapiEntry[] };
  return json.data?.[0] ?? null;
}

async function upsert(row: Row): Promise<{ action: 'created' | 'updated'; documentId: string }> {
  const data = {
    userId: row.user_id,
    date: row.date,
    userDate: userDateKey(row.user_id, row.date),
    day: row.day,
    emotions: row.emotions,
    energy: row.energy,
    body: row.body,
    delight: row.delight,
    meaning: row.meaning,
    somethingGood: row.something_good,
    somethingHard: row.something_hard,
  };
  const existing = await findExisting(row.user_id, row.date);
  if (existing) {
    const res = await fetch(`${STRAPI_URL}/api/entries/${existing.documentId}`, {
      method: 'PUT',
      headers: strapiHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error(`update ${res.status}: ${await res.text()}`);
    return { action: 'updated', documentId: existing.documentId };
  }
  const res = await fetch(`${STRAPI_URL}/api/entries`, {
    method: 'POST',
    headers: strapiHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`create ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data: StrapiEntry };
  return { action: 'created', documentId: json.data.documentId };
}

async function main(): Promise<void> {
  console.log(`Backfill: Supabase → ${STRAPI_URL}`);
  const supabase = createClient(SUPA_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const PAGE = 500;
  let offset = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  while (true) {
    const { data, error } = await supabase
      .from('entries')
      .select('id, user_id, date, day, emotions, energy, body, delight, meaning, something_good, something_hard')
      .order('date', { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error('Supabase select failed:', error.message);
      process.exit(1);
    }
    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;

    console.log(`\nBatch offset=${offset} size=${rows.length}`);
    for (const r of rows) {
      try {
        const { action, documentId } = await upsert(r);
        if (action === 'created') totalCreated++;
        else totalUpdated++;
        const prefix = action === 'created' ? '+' : '~';
        console.log(`  ${prefix} ${r.user_id.slice(0, 8)} ${r.date} → ${documentId}`);
      } catch (e) {
        totalFailed++;
        console.error(`  ! ${r.user_id.slice(0, 8)} ${r.date}: ${(e as Error).message}`);
      }
    }

    if (rows.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`\nDone. created=${totalCreated} updated=${totalUpdated} failed=${totalFailed}`);
}

void main();
