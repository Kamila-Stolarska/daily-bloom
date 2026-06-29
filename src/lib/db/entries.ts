// Klient API wpisów dziennika. Wszystkie operacje idą przez Vercel proxy (/api/v1/entries),
// który pod spodem czyta/pisze w Strapi (źródło prawdy).
// Stara, bezpośrednia ścieżka przez Supabase jest porzucona — tabela `entries` w Supabase
// zostaje jako backup (zgodnie z kursem, Faza 3).

import { supabase } from '../supabase';
import type { Entry } from '../store';
import type { Scale } from '../flower/types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';
const URL_ENTRIES = `${API_BASE}/api/v1/entries`;

type WireEntry = {
  dateIso: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  somethingGood: boolean;
  somethingHard: boolean;
  createdAtIso: string;
  strapiDocumentId?: string;
};

function wireToEntry(w: WireEntry): Entry {
  return {
    dateIso: w.dateIso,
    day: w.day as Scale,
    emotions: w.emotions as Scale,
    energy: w.energy as Scale,
    body: w.body as Scale,
    delight: w.delight as Scale,
    meaning: w.meaning as Scale,
    somethingGood: w.somethingGood,
    somethingHard: w.somethingHard,
    createdAtIso: w.createdAtIso,
  };
}

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('not-authenticated');
  return `Bearer ${token}`;
}

export async function listEntries(_userId: string): Promise<Record<string, Entry>> {
  const res = await fetch(URL_ENTRIES, { headers: { authorization: await authHeader() } });
  if (!res.ok) throw new Error(`list-entries-failed: ${res.status}`);
  const json = (await res.json()) as { entries: WireEntry[] };
  const out: Record<string, Entry> = {};
  for (const w of json.entries ?? []) out[w.dateIso] = wireToEntry(w);
  return out;
}

export async function upsertEntry(_userId: string, entry: Entry): Promise<void> {
  const res = await fetch(URL_ENTRIES, {
    method: 'POST',
    headers: {
      authorization: await authHeader(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      date: entry.dateIso,
      day: entry.day,
      emotions: entry.emotions,
      energy: entry.energy,
      body: entry.body,
      delight: entry.delight,
      meaning: entry.meaning,
      somethingGood: entry.somethingGood,
      somethingHard: entry.somethingHard,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`upsert-entry-failed: ${res.status} ${text}`);
  }
}
