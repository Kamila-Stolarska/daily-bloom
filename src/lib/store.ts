// Stan aplikacji: imię + wpisy + notatki. Źródło prawdy = Supabase.
// Lokalny AsyncStorage trzyma snapshot do offline read (szybki paint).
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayData, Scale } from './flower/types';
import { supabase } from './supabase';
import { listEntries, upsertEntry } from './db/entries';
import {
  listNotesByDate,
  addNote as dbAddNote,
  updateNote as dbUpdateNote,
  deleteNote as dbDeleteNote,
} from './db/notes';
import { getOrCreateProfile, setProfileName } from './db/profile';

export type Entry = {
  dateIso: string;
  day: Scale;
  emotions: Scale;
  energy: Scale;
  body: Scale;
  delight: Scale;
  meaning: Scale;
  somethingGood: boolean;
  somethingHard: boolean;
  createdAtIso: string;
};

export type Note = {
  id: string;
  text: string;
  createdAtIso: string;
};

type State = {
  hydrated: boolean;
  authed: boolean;
  name: string | null;
  userId: string;
  entries: Record<string, Entry>;
  notesByDate: Record<string, Note[]>;
  setName: (name: string) => Promise<void>;
  saveEntry: (entry: Entry) => Promise<void>;
  addNote: (dateIso: string, text: string) => Promise<Note>;
  updateNote: (dateIso: string, id: string, text: string) => Promise<void>;
  deleteNote: (dateIso: string, id: string) => Promise<void>;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};

const CACHE_KEY_PREFIX = 'daily-bloom:cache:';
const LEGACY_KEY = 'daily-bloom:v1';
const MIGRATED_FLAG_PREFIX = 'daily-bloom:migrated:';

type CacheBlob = {
  name: string | null;
  userId: string;
  entries: Record<string, Entry>;
  notesByDate: Record<string, Note[]>;
};

type LegacyEntry = Entry & { note?: string };
type LegacyBlob = {
  name: string | null;
  userId: string;
  entries: Record<string, LegacyEntry>;
  notesByDate?: Record<string, Note[]>;
};

async function loadCache(userId: string): Promise<CacheBlob | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + userId);
    return raw ? (JSON.parse(raw) as CacheBlob) : null;
  } catch {
    return null;
  }
}

async function saveCache(c: CacheBlob): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY_PREFIX + c.userId, JSON.stringify(c));
}

async function loadLegacy(): Promise<LegacyBlob | null> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as LegacyBlob) : null;
  } catch {
    return null;
  }
}

function genNoteId(): string {
  return `n_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// Jednorazowy upload lokalnych danych z `daily-bloom:v1` do Supabase.
// Uruchamiany przy pierwszym zalogowaniu — jeżeli zdalne tabele dla tego usera są puste.
async function migrateLegacyIfNeeded(userId: string): Promise<void> {
  const flagKey = MIGRATED_FLAG_PREFIX + userId;
  const done = await AsyncStorage.getItem(flagKey);
  if (done) return;
  const legacy = await loadLegacy();
  if (!legacy) {
    await AsyncStorage.setItem(flagKey, '1');
    return;
  }
  // Czy w Supabase jest już cokolwiek?
  const [{ count: entryCount }, { count: noteCount }] = await Promise.all([
    supabase.from('entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  if ((entryCount ?? 0) > 0 || (noteCount ?? 0) > 0) {
    await AsyncStorage.setItem(flagKey, '1');
    return;
  }
  // Upload wpisów (strip legacy `note` field jeśli istnieje).
  const entries = Object.values(legacy.entries ?? {});
  for (const e of entries) {
    const { note, ...rest } = e as LegacyEntry;
    await upsertEntry(userId, rest);
    if (note && note.trim()) {
      await dbAddNote(userId, rest.dateIso, note);
    }
  }
  // Upload notatek.
  const notes = Object.entries(legacy.notesByDate ?? {});
  for (const [dateIso, list] of notes) {
    for (const n of list) await dbAddNote(userId, dateIso, n.text);
  }
  await AsyncStorage.setItem(flagKey, '1');
}

export const useStore = create<State>((set, get) => ({
  hydrated: false,
  authed: false,
  name: null,
  userId: '',
  entries: {},
  notesByDate: {},

  hydrate: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      set({ hydrated: true, authed: false, name: null, userId: '', entries: {}, notesByDate: {} });
      return;
    }
    const authUserId = session.user.id;

    // 1) Szybki paint z cache.
    const cached = await loadCache(authUserId);
    if (cached) {
      set({
        hydrated: true,
        authed: true,
        name: cached.name,
        userId: cached.userId,
        entries: cached.entries,
        notesByDate: cached.notesByDate,
      });
    }

    // 2) Profile + ew. migracja legacy.
    const legacy = await loadLegacy();
    const profile = await getOrCreateProfile(authUserId, legacy?.userId);
    await migrateLegacyIfNeeded(authUserId);

    // 3) Świeży fetch z Supabase.
    const [entries, notesByDate] = await Promise.all([
      listEntries(authUserId),
      listNotesByDate(authUserId),
    ]);
    set({
      hydrated: true,
      authed: true,
      name: profile.name,
      userId: profile.flowerSeed,
      entries,
      notesByDate,
    });
    await saveCache({
      name: profile.name,
      userId: profile.flowerSeed,
      entries,
      notesByDate,
    });
  },

  setName: async (name) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error('not authed');
    const trimmed = name.trim();
    const normalized = trimmed
      ? trimmed.charAt(0).toLocaleUpperCase('pl-PL') + trimmed.slice(1)
      : trimmed;
    await setProfileName(session.user.id, normalized);
    set({ name: normalized });
    const { userId, entries, notesByDate } = get();
    await saveCache({ name: normalized, userId, entries, notesByDate });
  },

  saveEntry: async (entry) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error('not authed');
    await upsertEntry(session.user.id, entry);
    const { entries, notesByDate, name, userId } = get();
    const next = { ...entries, [entry.dateIso]: entry };
    set({ entries: next });
    await saveCache({ name, userId, entries: next, notesByDate });
  },

  addNote: async (dateIso, text) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error('not authed');
    const trimmed = text.trim();
    if (!trimmed) throw new Error('empty note');
    let note: Note;
    try {
      note = await dbAddNote(session.user.id, dateIso, trimmed);
    } catch (e) {
      // Optymistycznie — jakby sieci brak, zapisujemy lokalnie z tymczasowym id.
      note = { id: genNoteId(), text: trimmed, createdAtIso: new Date().toISOString() };
      throw e;
    } finally {
      const { notesByDate, entries, name, userId } = get();
      const list = notesByDate[dateIso] ?? [];
      const nextNotes = { ...notesByDate, [dateIso]: [...list, note!] };
      set({ notesByDate: nextNotes });
      await saveCache({ name, userId, entries, notesByDate: nextNotes });
    }
    return note;
  },

  updateNote: async (dateIso, id, text) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error('not authed');
    const trimmed = text.trim();
    if (!trimmed) throw new Error('empty note');
    await dbUpdateNote(session.user.id, id, trimmed);
    const { notesByDate, entries, name, userId } = get();
    const list = notesByDate[dateIso] ?? [];
    const next = list.map((n) => (n.id === id ? { ...n, text: trimmed } : n));
    const nextNotes = { ...notesByDate, [dateIso]: next };
    set({ notesByDate: nextNotes });
    await saveCache({ name, userId, entries, notesByDate: nextNotes });
  },

  deleteNote: async (dateIso, id) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error('not authed');
    await dbDeleteNote(session.user.id, id);
    const { notesByDate, entries, name, userId } = get();
    const list = (notesByDate[dateIso] ?? []).filter((n) => n.id !== id);
    const nextNotes = { ...notesByDate };
    if (list.length) nextNotes[dateIso] = list;
    else delete nextNotes[dateIso];
    set({ notesByDate: nextNotes });
    await saveCache({ name, userId, entries, notesByDate: nextNotes });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ authed: false, name: null, userId: '', entries: {}, notesByDate: {} });
  },
}));

// Reaguj na zmiany sesji (login z drugiej karty, sign-out itp.).
supabase.auth.onAuthStateChange((_event, _session) => {
  void useStore.getState().hydrate();
});

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function notesLength(notes: Note[] | undefined): number {
  if (!notes) return 0;
  return notes.reduce((sum, n) => sum + n.text.length, 0);
}

export function entryToDayData(e: Entry, noteLen = 0): DayData {
  return {
    day: e.day,
    emotions: e.emotions,
    energy: e.energy,
    body: e.body,
    delight: e.delight,
    meaning: e.meaning,
    somethingGood: e.somethingGood,
    somethingHard: e.somethingHard,
    noteLength: noteLen,
    dateIso: e.dateIso,
  };
}
