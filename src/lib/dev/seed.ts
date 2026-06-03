// Seed danych testowych — 6 dni wstecz + dziś z arc-em tygodnia.
// Środek tygodnia spada (energia, ciało), weekend rośnie. Realistyczne PL notatki.
// Używane w /lab do testowania agenta na "ludzkich" danych.

import { supabase } from '../supabase';
import { upsertEntry } from '../db/entries';
import { addNote as dbAddNote } from '../db/notes';
import type { Entry } from '../store';
import type { Scale } from '../flower/types';

type SeedDay = {
  offset: number; // dni od dziś (0 = dziś)
  entry: Omit<Entry, 'dateIso' | 'createdAtIso'>;
  notes: string[];
};

const SEED: SeedDay[] = [
  {
    offset: -6,
    entry: {
      day: 4 as Scale, emotions: 4 as Scale, energy: 4 as Scale, body: 3 as Scale,
      delight: 3 as Scale, meaning: 4 as Scale, somethingGood: false, somethingHard: false,
    },
    notes: ['Spokojny początek tygodnia. Zaplanowałam dzień rano i to mi pomogło — czułam, że ogarniam.'],
  },
  {
    offset: -5,
    entry: {
      day: 4 as Scale, emotions: 3 as Scale, energy: 3 as Scale, body: 3 as Scale,
      delight: 2 as Scale, meaning: 3 as Scale, somethingGood: false, somethingHard: false,
    },
    notes: ['Dużo zoomów dziś, ale wieczorem skończyłam ten dokument. Jest.'],
  },
  {
    offset: -4,
    entry: {
      day: 2 as Scale, emotions: 2 as Scale, energy: 1 as Scale, body: 2 as Scale,
      delight: 1 as Scale, meaning: 2 as Scale, somethingGood: false, somethingHard: true,
    },
    notes: [
      'Padłam. Od rana coś było nie tak, kiepsko spałam.',
      'Wieczorem ledwo żyłam. Nie chciało mi się gotować, zamówiłam pizzę i poszłam spać o 21.',
    ],
  },
  {
    offset: -3,
    entry: {
      day: 3 as Scale, emotions: 3 as Scale, energy: 2 as Scale, body: 2 as Scale,
      delight: 3 as Scale, meaning: 3 as Scale, somethingGood: false, somethingHard: false,
    },
    notes: ['Wyszłam na długi spacer w południe, słońce ładnie wpadało między drzewa. Trochę lepiej niż wczoraj.'],
  },
  {
    offset: -2,
    entry: {
      day: 4 as Scale, emotions: 4 as Scale, energy: 3 as Scale, body: 4 as Scale,
      delight: 4 as Scale, meaning: 4 as Scale, somethingGood: true, somethingHard: false,
    },
    notes: ['Piątek. Wino z dziewczynami w tej knajpie na Mokotowie. Śmiałyśmy się tak, że bolał mnie brzuch.'],
  },
  {
    offset: -1,
    entry: {
      day: 5 as Scale, emotions: 5 as Scale, energy: 4 as Scale, body: 4 as Scale,
      delight: 5 as Scale, meaning: 4 as Scale, somethingGood: true, somethingHard: false,
    },
    notes: [
      'Cały dzień na działce u rodziców. Słońce, kawa, książka pod jabłonią. Cudo.',
      'Wieczorem ognisko. Tata grał na gitarze. Te momenty są tym, dla czego warto.',
    ],
  },
];

function isoForOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function seedTestWeek(): Promise<{ entries: number; notes: number }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Nie jesteś zalogowana.');
  const userId = session.user.id;

  let entriesCount = 0;
  let notesCount = 0;
  for (const day of SEED) {
    const dateIso = isoForOffset(day.offset);
    const entry: Entry = {
      ...day.entry,
      dateIso,
      createdAtIso: new Date().toISOString(),
    };
    await upsertEntry(userId, entry);
    entriesCount += 1;
    for (const text of day.notes) {
      try {
        await dbAddNote(userId, dateIso, text);
        notesCount += 1;
      } catch {
        // Pomijaj duplikaty / błędy pojedynczych notatek.
      }
    }
  }
  return { entries: entriesCount, notes: notesCount };
}

export async function clearTestWeek(): Promise<{ entries: number; notes: number }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Nie jesteś zalogowana.');
  const userId = session.user.id;

  const fromIso = isoForOffset(-6);
  const toIso = isoForOffset(0);

  // Najpierw notatki (no FK constraint, ale dla porządku).
  const { data: deletedNotes } = await supabase
    .from('notes')
    .delete()
    .eq('user_id', userId)
    .gte('date', fromIso)
    .lte('date', toIso)
    .select('id');

  const { data: deletedEntries } = await supabase
    .from('entries')
    .delete()
    .eq('user_id', userId)
    .gte('date', fromIso)
    .lte('date', toIso)
    .select('id');

  return {
    entries: deletedEntries?.length ?? 0,
    notes: deletedNotes?.length ?? 0,
  };
}

export async function clearChatHistory(): Promise<number> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Nie jesteś zalogowana.');
  const userId = session.user.id;
  const { data } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId)
    .select('id');
  return data?.length ?? 0;
}
