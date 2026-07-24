// Czyste agregacje na wpisach. Bez zależności od UI/backendu.
// Używane głównie przez ekran /garden.

import type { Entry, Note, Photo } from './store';
import type { Axis, DayData, Scale } from './flower/types';
import { AXES } from './flower/types';
import type { DailyInsightPoint, MetricComparison, MomentGroup, MomentGroupKey } from './insights/types';

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

// Poprzedni okres tej samej długości, bezpośrednio poprzedzający bieżące okno
// (do porównania "30 dni vs poprzednie 30 dni", sekcja 9). Bez sensu dla 'all'.
export function filterPreviousWindow<T>(
  items: T[],
  getDate: (t: T) => string,
  days: number,
  today: Date,
): T[] {
  const end = new Date(today);
  end.setDate(end.getDate() - days);
  const start = new Date(today);
  start.setDate(start.getDate() - (days * 2 - 1));
  const startIso = isoDate(start);
  const endIso = isoDate(end);
  return items.filter((t) => {
    const d = getDate(t);
    return d >= startIso && d <= endIso;
  });
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

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function dailyBalanceOf(e: Entry): number {
  return (e.day + e.emotions + e.energy + e.body + e.delight + e.meaning) / 6;
}

// Precyzyjne średnie okresu (bez clampowania do skali 1–5), zaokrąglone do 1
// miejsca po przecinku — do wyświetlenia liczb pod kwiatem okresu. `averageDay`
// zostaje osobno, bo napędza kształt płatków i musi zwracać Scale (integer).
export function precisePeriodAverages(entries: Entry[]): {
  day: number | null;
  emotions: number | null;
  energy: number | null;
  body: number | null;
  delight: number | null;
  meaning: number | null;
  dailyBalance: number | null;
} {
  if (entries.length === 0) {
    return { day: null, emotions: null, energy: null, body: null, delight: null, meaning: null, dailyBalance: null };
  }
  const sum: Record<Axis, number> = { day: 0, emotions: 0, energy: 0, body: 0, delight: 0, meaning: 0 };
  let balanceSum = 0;
  for (const e of entries) {
    for (const a of AXES) sum[a] += e[a];
    balanceSum += dailyBalanceOf(e);
  }
  const n = entries.length;
  return {
    day: round1(sum.day / n),
    emotions: round1(sum.emotions / n),
    energy: round1(sum.energy / n),
    body: round1(sum.body / n),
    delight: round1(sum.delight / n),
    meaning: round1(sum.meaning / n),
    dailyBalance: round1(balanceSum / n),
  };
}

// Progi kierunku zmiany między dwoma okresami (sekcja 9 specyfikacji).
// <0.15 podobnie, 0.15–0.49 nieco wyżej/niżej, ≥0.5 wyraźnie wyżej/niżej.
const MIN_ENTRIES_FOR_COMPARISON = 3;

export function compareWindows(current: Entry[], previous: Entry[]): MetricComparison[] {
  const insufficient = current.length < MIN_ENTRIES_FOR_COMPARISON || previous.length < MIN_ENTRIES_FOR_COMPARISON;
  const curAvg = precisePeriodAverages(current);
  const prevAvg = precisePeriodAverages(previous);
  return AXES.map((metric) => {
    const currentAverage = curAvg[metric];
    const previousAverage = prevAvg[metric];
    if (insufficient || currentAverage === null || previousAverage === null) {
      return { metric, currentAverage, previousAverage, difference: null, direction: 'insufficient_data' as const };
    }
    const difference = round1(currentAverage - previousAverage);
    const abs = Math.abs(difference);
    const direction: MetricComparison['direction'] = abs < 0.15 ? 'similar' : difference > 0 ? 'higher' : 'lower';
    return { metric, currentAverage, previousAverage, difference, direction };
  });
}

// Cztery grupy dni wg tagów: tylko dobre / tylko trudne / oba / żaden (sekcja 11).
export function momentGroups(entries: Entry[]): Record<MomentGroupKey, MomentGroup> {
  const buckets: Record<MomentGroupKey, Entry[]> = { onlyGood: [], onlyHard: [], both: [], neither: [] };
  for (const e of entries) {
    const key: MomentGroupKey = e.somethingGood && e.somethingHard
      ? 'both'
      : e.somethingGood
        ? 'onlyGood'
        : e.somethingHard
          ? 'onlyHard'
          : 'neither';
    buckets[key].push(e);
  }
  const toGroup = (key: MomentGroupKey): MomentGroup => {
    const list = buckets[key];
    const avg = precisePeriodAverages(list);
    return {
      key,
      count: list.length,
      averages: {
        day: avg.day, emotions: avg.emotions, energy: avg.energy,
        body: avg.body, delight: avg.delight, meaning: avg.meaning,
      },
      dailyBalance: avg.dailyBalance,
    };
  };
  return {
    onlyGood: toGroup('onlyGood'),
    onlyHard: toGroup('onlyHard'),
    both: toGroup('both'),
    neither: toGroup('neither'),
  };
}

// Buduje pełen zakres dziennych punktów (z lukami = null dla dni bez wpisu) do
// wykresu trendu. `startIso`/`endIso` włącznie, iterowane dzień po dniu.
export function buildDailyInsightPoints(
  entries: Entry[],
  startIso: string,
  endIso: string,
  notesByDate: Record<string, Note[]>,
  photosByNoteId: Record<string, Photo[]>,
): DailyInsightPoint[] {
  const byDate = new Map(entries.map((e) => [e.dateIso, e] as const));
  const out: DailyInsightPoint[] = [];
  const cursor = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  while (cursor <= end) {
    const dateIso = isoDate(cursor);
    const e = byDate.get(dateIso);
    const notes = notesByDate[dateIso] ?? [];
    const hasNote = notes.some((n) => n.text.trim().length > 0);
    const hasPhotos = notes.some((n) => (photosByNoteId[n.id]?.length ?? 0) > 0);
    out.push({
      date: dateIso,
      day: e ? e.day : null,
      emotions: e ? e.emotions : null,
      energy: e ? e.energy : null,
      body: e ? e.body : null,
      delight: e ? e.delight : null,
      meaning: e ? e.meaning : null,
      dailyBalance: e ? round1(dailyBalanceOf(e)) : null,
      hasGoodMoment: e ? e.somethingGood : false,
      hasDifficultMoment: e ? e.somethingHard : false,
      hasNote,
      hasPhotos,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// Obserwacje tekstowe (reguły, bez LLM) — sekcja 2/20 specyfikacji: opisują
// współwystępowanie, nie przyczynę; wymagają minimalnej liczby wpisów.
const MIN_ENTRIES_FOR_INSIGHTS = 7;
// Poniżej tej liczby wpisów insighty się pokazują, ale z zastrzeżeniem o małej
// próbie (sekcja 21) — obraz może się jeszcze wyraźnie zmienić.
export const MIN_ENTRIES_FOR_CONFIDENT_INSIGHTS = 20;

export function buildInsights(params: {
  windowed: Entry[];
  previousWindowed: Entry[];
  comparison: MetricComparison[];
  groups: Record<MomentGroupKey, MomentGroup>;
}): string[] {
  const { windowed, comparison } = params;
  if (windowed.length < MIN_ENTRIES_FOR_INSIGHTS) return [];
  const out: string[] = [];

  // Najniższa i najwyższa oś okresu.
  const avg = precisePeriodAverages(windowed);
  const withValues = AXES.map((a) => ({ axis: a, value: avg[a] })).filter(
    (x): x is { axis: Axis; value: number } => x.value !== null,
  );
  if (withValues.length === AXES.length) {
    const lowest = withValues.reduce((a, b) => (b.value < a.value ? b : a));
    const highest = withValues.reduce((a, b) => (b.value > a.value ? b : a));
    if (highest.value - lowest.value >= 0.5) {
      const g = AXIS_GRAMMAR[lowest.axis];
      out.push(`${g.label} ${g.was} w tym okresie ${g.lower} niż pozostałe obszary.`);
    }
  }

  // Kierunek zmian względem poprzedniego okresu — max 2 najmocniejsze.
  const notableComparisons = comparison
    .filter((c) => c.direction === 'higher' || c.direction === 'lower')
    .sort((a, b) => Math.abs(b.difference ?? 0) - Math.abs(a.difference ?? 0))
    .slice(0, 2);
  for (const c of notableComparisons) {
    const word = c.direction === 'higher' ? 'wyżej' : 'niżej';
    const g = AXIS_GRAMMAR[c.metric];
    out.push(`${g.label} ${g.was} ostatnio nieco ${word} niż we wcześniejszym okresie.`);
  }

  return out;
}

// Zdanie o współwystępowaniu tagów (sekcja 11) — osobno od buildInsights,
// bo wyświetlane bezpośrednio przy MomentGroups, nie w karcie "Co zauważyliśmy".
const MIN_HARD_DAYS_FOR_COOCCURRENCE = 3;

export function coOccurrenceInsight(groups: Record<MomentGroupKey, MomentGroup>): string | null {
  const hardTotal = groups.onlyHard.count + groups.both.count;
  if (hardTotal < MIN_HARD_DAYS_FOR_COOCCURRENCE) return null;
  return `W ${groups.both.count} z ${hardTotal} trudnych dni zauważyłaś również coś dobrego.`;
}

// Komunikaty dla 0 i 1–2 wpisów (sekcja 21) — cieplejsze niż standardowe
// "za mało danych", bo to pierwsze dni w aplikacji, nie brak wzorca.
export function fewEntriesMessage(count: number, subject: string): string {
  if (count === 0) return `Jeszcze pusto — zapisz pierwszy dzień, aby ${subject}.`;
  return `Dodaj jeszcze kilka wpisów, aby ${subject}.`;
}

// Forma gramatyczna etykiety każdej osi (rodzaj/liczba), żeby zdania insightów
// zgadzały się gramatycznie ("Emocje były", "Ciało było", "Zachwyt był").
const AXIS_GRAMMAR: Record<Axis, { label: string; was: string; lower: string }> = {
  day: { label: 'Ocena dnia', was: 'była', lower: 'niższa' },
  emotions: { label: 'Emocje', was: 'były', lower: 'niższe' },
  energy: { label: 'Energia', was: 'była', lower: 'niższa' },
  body: { label: 'Ciało', was: 'było', lower: 'niższe' },
  delight: { label: 'Zachwyt', was: 'był', lower: 'niższy' },
  meaning: { label: 'Poczucie sensu', was: 'było', lower: 'niższe' },
};
