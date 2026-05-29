// Stan aplikacji: imię + wpisy dziennika + notatki. Persist do AsyncStorage (na web: localStorage).
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayData, Scale } from './flower/types';

export type Entry = {
  dateIso: string; // YYYY-MM-DD
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
  name: string | null;
  userId: string; // do DNA seed
  entries: Record<string, Entry>; // klucz = dateIso
  notesByDate: Record<string, Note[]>;
  setName: (name: string) => Promise<void>;
  saveEntry: (entry: Entry) => Promise<void>;
  addNote: (dateIso: string, text: string) => Promise<Note>;
  updateNote: (dateIso: string, id: string, text: string) => Promise<void>;
  deleteNote: (dateIso: string, id: string) => Promise<void>;
  hydrate: () => Promise<void>;
};

const KEY = 'daily-bloom:v1';

type LegacyEntry = Entry & { note?: string };

type Persisted = {
  name: string | null;
  userId: string;
  entries: Record<string, LegacyEntry>;
  notesByDate?: Record<string, Note[]>;
};

async function loadPersisted(): Promise<Persisted | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

async function savePersisted(p: {
  name: string | null;
  userId: string;
  entries: Record<string, Entry>;
  notesByDate: Record<string, Note[]>;
}) {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

function genUserId(): string {
  return `u_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function genNoteId(): string {
  return `n_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function migrate(p: Persisted): {
  entries: Record<string, Entry>;
  notesByDate: Record<string, Note[]>;
} {
  const notesByDate: Record<string, Note[]> = { ...(p.notesByDate ?? {}) };
  const entries: Record<string, Entry> = {};
  for (const [dateIso, legacy] of Object.entries(p.entries ?? {})) {
    const { note, ...rest } = legacy;
    entries[dateIso] = rest;
    if (note && note.trim() && !notesByDate[dateIso]?.length) {
      notesByDate[dateIso] = [
        { id: genNoteId(), text: note, createdAtIso: legacy.createdAtIso },
      ];
    }
  }
  return { entries, notesByDate };
}

export const useStore = create<State>((set, get) => ({
  hydrated: false,
  name: null,
  userId: '',
  entries: {},
  notesByDate: {},
  hydrate: async () => {
    const p = await loadPersisted();
    if (p) {
      const { entries, notesByDate } = migrate(p);
      set({ name: p.name, userId: p.userId, entries, notesByDate, hydrated: true });
      await savePersisted({ name: p.name, userId: p.userId, entries, notesByDate });
    } else {
      const userId = genUserId();
      set({ name: null, userId, entries: {}, notesByDate: {}, hydrated: true });
      await savePersisted({ name: null, userId, entries: {}, notesByDate: {} });
    }
  },
  setName: async (name) => {
    const { userId, entries, notesByDate } = get();
    set({ name });
    await savePersisted({ name, userId, entries, notesByDate });
  },
  saveEntry: async (entry) => {
    const { name, userId, entries, notesByDate } = get();
    const next = { ...entries, [entry.dateIso]: entry };
    set({ entries: next });
    await savePersisted({ name, userId, entries: next, notesByDate });
  },
  addNote: async (dateIso, text) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('empty note');
    const { name, userId, entries, notesByDate } = get();
    const note: Note = { id: genNoteId(), text: trimmed, createdAtIso: new Date().toISOString() };
    const list = notesByDate[dateIso] ?? [];
    const nextNotes = { ...notesByDate, [dateIso]: [...list, note] };
    set({ notesByDate: nextNotes });
    await savePersisted({ name, userId, entries, notesByDate: nextNotes });
    return note;
  },
  updateNote: async (dateIso, id, text) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('empty note');
    const { name, userId, entries, notesByDate } = get();
    const list = notesByDate[dateIso] ?? [];
    const next = list.map((n) => (n.id === id ? { ...n, text: trimmed } : n));
    const nextNotes = { ...notesByDate, [dateIso]: next };
    set({ notesByDate: nextNotes });
    await savePersisted({ name, userId, entries, notesByDate: nextNotes });
  },
  deleteNote: async (dateIso, id) => {
    const { name, userId, entries, notesByDate } = get();
    const list = (notesByDate[dateIso] ?? []).filter((n) => n.id !== id);
    const nextNotes = { ...notesByDate };
    if (list.length) nextNotes[dateIso] = list;
    else delete nextNotes[dateIso];
    set({ notesByDate: nextNotes });
    await savePersisted({ name, userId, entries, notesByDate: nextNotes });
  },
}));

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
