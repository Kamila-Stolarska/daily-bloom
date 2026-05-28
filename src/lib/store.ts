// Stan aplikacji: imię + wpisy dziennika. Persist do AsyncStorage (na web: localStorage).
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
  note?: string;
  createdAtIso: string;
};

type State = {
  hydrated: boolean;
  name: string | null;
  userId: string; // do DNA seed
  entries: Record<string, Entry>; // klucz = dateIso
  setName: (name: string) => Promise<void>;
  saveEntry: (entry: Entry) => Promise<void>;
  setNote: (dateIso: string, note: string) => Promise<void>;
  hydrate: () => Promise<void>;
};

const KEY = 'daily-bloom:v1';

type Persisted = {
  name: string | null;
  userId: string;
  entries: Record<string, Entry>;
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

async function savePersisted(p: Persisted) {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

function genUserId(): string {
  return `u_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export const useStore = create<State>((set, get) => ({
  hydrated: false,
  name: null,
  userId: '',
  entries: {},
  hydrate: async () => {
    const p = await loadPersisted();
    if (p) {
      set({ ...p, hydrated: true });
    } else {
      const userId = genUserId();
      set({ name: null, userId, entries: {}, hydrated: true });
      await savePersisted({ name: null, userId, entries: {} });
    }
  },
  setName: async (name) => {
    const { userId, entries } = get();
    set({ name });
    await savePersisted({ name, userId, entries });
  },
  saveEntry: async (entry) => {
    const { name, userId, entries } = get();
    const next = { ...entries, [entry.dateIso]: entry };
    set({ entries: next });
    await savePersisted({ name, userId, entries: next });
  },
  setNote: async (dateIso, note) => {
    const { name, userId, entries } = get();
    const existing = entries[dateIso];
    if (!existing) return;
    const updated = { ...existing, note };
    const next = { ...entries, [dateIso]: updated };
    set({ entries: next });
    await savePersisted({ name, userId, entries: next });
  },
}));

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function entryToDayData(e: Entry): DayData {
  return {
    day: e.day,
    emotions: e.emotions,
    energy: e.energy,
    body: e.body,
    delight: e.delight,
    meaning: e.meaning,
    somethingGood: e.somethingGood,
    somethingHard: e.somethingHard,
    noteLength: e.note?.length ?? 0,
    dateIso: e.dateIso,
  };
}
