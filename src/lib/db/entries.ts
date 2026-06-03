import { supabase } from '../supabase';
import type { Entry } from '../store';
import type { Scale } from '../flower/types';

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
  created_at: string;
  updated_at: string;
};

function rowToEntry(r: Row): Entry {
  return {
    dateIso: r.date,
    day: r.day as Scale,
    emotions: r.emotions as Scale,
    energy: r.energy as Scale,
    body: r.body as Scale,
    delight: r.delight as Scale,
    meaning: r.meaning as Scale,
    somethingGood: r.something_good,
    somethingHard: r.something_hard,
    createdAtIso: r.created_at,
  };
}

export async function listEntries(userId: string): Promise<Record<string, Entry>> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  const out: Record<string, Entry> = {};
  for (const r of (data ?? []) as Row[]) out[r.date] = rowToEntry(r);
  return out;
}

export async function upsertEntry(userId: string, entry: Entry): Promise<void> {
  const { error } = await supabase.from('entries').upsert(
    {
      user_id: userId,
      date: entry.dateIso,
      day: entry.day,
      emotions: entry.emotions,
      energy: entry.energy,
      body: entry.body,
      delight: entry.delight,
      meaning: entry.meaning,
      something_good: entry.somethingGood,
      something_hard: entry.somethingHard,
      created_at: entry.createdAtIso,
    },
    { onConflict: 'user_id,date' },
  );
  if (error) throw error;
}
