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

// --- Długa historia (do testowania filtrów 90 dni / cały czas) ---------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clampScale = (v: number): Scale => Math.max(1, Math.min(5, Math.round(v))) as Scale;

const LONG_HISTORY_FROM = -119; // sięga za granicę "90 dni", żeby "cały czas" różnił się od "90 dni"
const LONG_HISTORY_TO = -7; // seedTestWeek() pokrywa już -6..0

const LONG_NOTES = [
  'Rano padało, ale zdążyłam na czas mimo korków.',
  'Spotkanie zespołu przeciągnęło się o godzinę — zmęczona, ale załatwione.',
  'Ugotowałam coś nowego, wyszło lepiej niż się spodziewałam.',
  'Trening po pracy — mało energii, ale dałam radę do końca.',
  'Długa rozmowa z mamą przez telefon, dobrze mi zrobiła.',
  'Cały dzień nad prezentacją, głowa pęka wieczorem.',
  'Spacer nad rzeką, w końcu trochę słońca.',
  'Nic szczególnego, spokojny, zwyczajny dzień.',
  'Kolacja z przyjaciółmi, dużo śmiechu.',
  'Zarwana noc, dzień ciężko mi się dłużył.',
  'Zrobiłam porządki w mieszkaniu, ulżyło mi.',
  'Deadline w pracy, stres od rana do wieczora.',
  'Film wieczorem z kocem i herbatą — dokładnie tego potrzebowałam.',
  'Bolała mnie głowa, wcześnie poszłam spać.',
  'Dobra wiadomość z pracy, cały dzień w lepszym nastroju.',
  'Zapomniałam parasola i zmokłam do suchej nitki.',
  'Joga rano nastroiła mnie na spokojnie na cały dzień.',
  'Kłótnia z kimś bliskim, ciężko mi to zostawić za sobą.',
  'Piekłam ciasto na urodziny — pachniało cudownie.',
  'Zwykły dzień w biurze, nic wyjątkowego.',
];

function longHistoryDay(offset: number): { entry: Omit<Entry, 'dateIso' | 'createdAtIso'>; notes: string[] } {
  const rng = mulberry32(offset + 10_000);
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dow = d.getDay(); // 0 = niedziela .. 6 = sobota
  const isWeekend = dow === 0 || dow === 6;

  // Powolny, wielotygodniowy "arc" nastroju + krótszy tygodniowy cykl (dołek w środku tygodnia).
  const monthlyWave = Math.sin((offset / 27) * Math.PI * 2) * 0.6;
  const weeklyBoost = isWeekend ? 0.7 : dow === 3 || dow === 4 ? -0.5 : 0;
  const noise = (rng() - 0.5) * 1.6;
  const base = 3.1 + monthlyWave + weeklyBoost + noise;

  const jitter = () => (rng() - 0.5) * 0.9;
  const entry: Omit<Entry, 'dateIso' | 'createdAtIso'> = {
    day: clampScale(base + jitter()),
    emotions: clampScale(base + jitter()),
    energy: clampScale(base - (isWeekend ? 0 : 0.2) + jitter()),
    body: clampScale(base + jitter()),
    delight: clampScale(base + (isWeekend ? 0.4 : 0) + jitter()),
    meaning: clampScale(base + jitter()),
    somethingGood: rng() < (isWeekend ? 0.45 : 0.25),
    somethingHard: rng() < (base < 2.6 ? 0.4 : 0.12),
  };

  const notes: string[] = [];
  if (rng() < 0.35) {
    const idx = Math.floor(rng() * LONG_NOTES.length);
    notes.push(LONG_NOTES[idx]);
  }

  return { entry, notes };
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

export async function seedLongHistory(): Promise<{ entries: number; notes: number }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Nie jesteś zalogowana.');
  const userId = session.user.id;

  let entriesCount = 0;
  let notesCount = 0;
  for (let offset = LONG_HISTORY_FROM; offset <= LONG_HISTORY_TO; offset++) {
    const { entry: dayEntry, notes } = longHistoryDay(offset);
    const dateIso = isoForOffset(offset);
    const entry: Entry = {
      ...dayEntry,
      dateIso,
      createdAtIso: new Date().toISOString(),
    };
    await upsertEntry(userId, entry);
    entriesCount += 1;
    for (const text of notes) {
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

export async function clearLongHistory(): Promise<{ entries: number; notes: number }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Nie jesteś zalogowana.');
  const userId = session.user.id;

  const fromIso = isoForOffset(LONG_HISTORY_FROM);
  const toIso = isoForOffset(LONG_HISTORY_TO);

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
