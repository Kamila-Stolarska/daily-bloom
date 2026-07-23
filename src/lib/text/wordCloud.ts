// Top-N słów z notatek do wizualizacji "chmury słów".
// Prosta tokenizacja, polskie stopwords, min długość, min częstotliwość.

import type { Note } from '../store';

// Krótka lista polskich stopwords + kilka najczęstszych "wypełniaczy".
// Nie chcemy tu pełnego korpusu — celowo krótka, żeby pokazać charakter notatek.
const STOPWORDS = new Set<string>([
  'i', 'oraz', 'ale', 'lub', 'albo', 'czy', 'że', 'żeby', 'aby', 'bo', 'więc',
  'a', 'o', 'u', 'w', 'we', 'z', 'ze', 'do', 'na', 'po', 'za', 'od', 'dla', 'przez', 'przy',
  'to', 'ta', 'ten', 'tego', 'tej', 'tym', 'tam', 'tu', 'tutaj',
  'jest', 'są', 'być', 'był', 'była', 'było', 'byli', 'będzie', 'będę', 'będziesz',
  'mam', 'masz', 'miał', 'miała', 'miałam', 'miałem',
  'się', 'sie', 'nie', 'tak', 'już', 'jeszcze', 'tylko', 'też', 'także', 'wciąż',
  'ja', 'ty', 'on', 'ona', 'ono', 'my', 'wy', 'oni', 'one',
  'mnie', 'mi', 'mną', 'ciebie', 'cię', 'tobą', 'mu', 'jej', 'ich', 'im',
  'mój', 'moja', 'moje', 'twój', 'twoja', 'twoje', 'jego', 'nasz', 'wasz',
  'jak', 'gdy', 'kiedy', 'gdzie', 'skąd', 'dokąd',
  'bardzo', 'trochę', 'chyba', 'może', 'znów', 'znowu',
  'co', 'kto', 'czym', 'czego',
  'the', 'and', 'or', 'of', 'to', 'in', 'a', 'is', 'it',
]);

const MIN_LEN = 3;
const MIN_COUNT = 2;

export function topWords(
  notes: Note[],
  limit = 30,
): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();
  for (const n of notes) {
    if (!n.text) continue;
    const tokens = n.text
      .toLocaleLowerCase('pl-PL')
      // rozdziel po wszystkim co nie jest literą polską/łacińską
      .split(/[^\p{L}]+/u)
      .filter((t) => t.length >= MIN_LEN && !STOPWORDS.has(t));
    for (const t of tokens) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const arr: Array<{ word: string; count: number }> = [];
  for (const [word, count] of counts) {
    if (count >= MIN_COUNT) arr.push({ word, count });
  }
  arr.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  return arr.slice(0, limit);
}
