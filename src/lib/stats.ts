// Czyste agregacje na wpisach. Bez zależności od UI/backendu.
// Używane głównie przez ekran /garden.

import type { Entry } from './store';
import type { Axis, DayData, Scale } from './flower/types';
import { AXES } from './flower/types';

function clampScale(n: number): Scale {
  const r = Math.round(n);
  if (r <= 1) return 1;
  if (r >= 5) return 5;
  return r as Scale;
}

// Średnia 6 osi zaokrąglona do skali 1–5.
// Tagi: dominująca wartość (true jeśli w większości wpisów było true).
export function averageDay(entries: Entry[]): DayData {
  if (entries.length === 0) {
    return {
      day: 3, emotions: 3, energy: 3, body: 3, delight: 3, meaning: 3,
      somethingGood: false, somethingHard: false,
    };
  }
  const sum: Record<Axis, number> = {
    day: 0, emotions: 0, energy: 0, body: 0, delight: 0, meaning: 0,
  };
  let good = 0;
  let hard = 0;
  for (const e of entries) {
    for (const a of AXES) sum[a] += e[a];
    if (e.somethingGood) good++;
    if (e.somethingHard) hard++;
  }
  const n = entries.length;
  return {
    day: clampScale(sum.day / n),
    emotions: clampScale(sum.emotions / n),
    energy: clampScale(sum.energy / n),
    body: clampScale(sum.body / n),
    delight: clampScale(sum.delight / n),
    meaning: clampScale(sum.meaning / n),
    somethingGood: good * 2 >= n,
    somethingHard: hard * 2 >= n,
  };
}

// Jak averageDay, ale każda oś = moda (najczęściej wybierana wartość), nie średnia.
// Spójne z axisDistribution/"Profil okresu" — bez tego kwiatek (średnia) i wstęga
// (moda) potrafiły pokazywać co innego dla tego samego okresu przy rozkładach
// dwumodalnych (np. remis 3 i 5 rozjeżdżał się ze średnią 3.3→3).
export function modeDay(entries: Entry[]): DayData {
  if (entries.length === 0) {
    return {
      day: 3, emotions: 3, energy: 3, body: 3, delight: 3, meaning: 3,
      somethingGood: false, somethingHard: false,
    };
  }
  let good = 0;
  let hard = 0;
  for (const e of entries) {
    if (e.somethingGood) good++;
    if (e.somethingHard) hard++;
  }
  const n = entries.length;
  const out = { somethingGood: good * 2 >= n, somethingHard: hard * 2 >= n } as DayData;
  for (const a of AXES) out[a] = axisDistribution(entries, a).mode;
  return out;
}

// Grupowanie po miesiącu (YYYY-MM). Kolejność miesięcy: malejąco (od najnowszego).
export function groupByMonth(entries: Entry[]): Array<{ month: string; entries: Entry[] }> {
  const buckets = new Map<string, Entry[]>();
  for (const e of entries) {
    const month = e.dateIso.slice(0, 7);
    const list = buckets.get(month);
    if (list) list.push(e);
    else buckets.set(month, [e]);
  }
  const out: Array<{ month: string; entries: Entry[] }> = [];
  for (const [month, list] of buckets) {
    list.sort((a, b) => b.dateIso.localeCompare(a.dateIso));
    out.push({ month, entries: list });
  }
  out.sort((a, b) => b.month.localeCompare(a.month));
  return out;
}

// Streak dni pod rząd wstecz od today. Liczy się, jeśli dziś MA lub NIE ma wpisu;
// gdy dziś nie ma, sprawdzamy wczoraj — to nadal streak, bo dzień się nie skończył.
export function streakDays(entries: Entry[], today: Date): number {
  const set = new Set(entries.map((e) => e.dateIso));
  let count = 0;
  const cursor = new Date(today);
  // Jeśli dziś nie ma wpisu — zacznij liczenie od wczoraj (żeby dzień "w toku" nie zerował streaka).
  const todayIsoStr = isoDate(cursor);
  if (!set.has(todayIsoStr)) cursor.setDate(cursor.getDate() - 1);
  while (set.has(isoDate(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

// Filtrowanie po oknie N dni wstecz od dziś (włącznie z dziś).
export function filterByWindow<T>(
  items: T[],
  getDate: (t: T) => string,
  days: number | 'all',
  today: Date,
): T[] {
  if (days === 'all') return items.slice();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffIso = isoDate(cutoff);
  return items.filter((t) => getDate(t) >= cutoffIso);
}

// Chronologiczna seria wartości jednej osi (rosnąco po dacie).
export function axisSeries(
  entries: Entry[],
  axis: Axis,
): Array<{ date: string; value: number }> {
  return entries
    .slice()
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso))
    .map((e) => ({ date: e.dateIso, value: e[axis] as number }));
}

// Rozkład wartości 1..5 dla każdej osi + modalna (najczęstsza) wartość.
// Używane przez sekcję "wstążki" w /garden: rozmiar kropki ∝ liczbie dni w tej wartości,
// mode → tam rysujemy kwiatek zamiast kropki. Przy remisie: wyższa wartość wygrywa
// (bardziej wspierający ton).
export function axisDistribution(
  entries: Entry[],
  axis: Axis,
): { counts: [number, number, number, number, number]; mode: Scale; max: number; total: number } {
  const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const e of entries) {
    const v = e[axis] as number;
    if (v >= 1 && v <= 5) counts[v - 1]++;
  }
  let mode: Scale = 3;
  let max = 0;
  // Iteruj od 5 do 1 → przy remisie wygrywa wyższa wartość.
  for (let v = 5; v >= 1; v--) {
    if (counts[v - 1] > max) {
      max = counts[v - 1];
      mode = v as Scale;
    }
  }
  return { counts, mode, max, total: entries.length };
}

// Podsumowanie 2 tagów. `both` = oba, `neither` = żaden.
export function tagsSummary(entries: Entry[]): {
  good: number;
  hard: number;
  both: number;
  neither: number;
  total: number;
} {
  let good = 0;
  let hard = 0;
  let both = 0;
  let neither = 0;
  for (const e of entries) {
    if (e.somethingGood) good++;
    if (e.somethingHard) hard++;
    if (e.somethingGood && e.somethingHard) both++;
    if (!e.somethingGood && !e.somethingHard) neither++;
  }
  return { good, hard, both, neither, total: entries.length };
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
