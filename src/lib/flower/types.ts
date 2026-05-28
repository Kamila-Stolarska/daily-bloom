// Daily Bloom — typy danych dnia (warstwa B).
// Mapowanie z FLOWER_DNA.md §3.

export type Scale = 1 | 2 | 3 | 4 | 5;

export type DayData = {
  day: Scale;
  emotions: Scale;
  energy: Scale;
  body: Scale;
  delight: Scale;
  meaning: Scale;
  somethingGood: boolean;
  somethingHard: boolean;
  noteLength?: number;    // długość notatki (znaki) — ornamenty
  dateIso?: string;       // YYYY-MM-DD — dla deterministycznego pęknięcia
};

// Kolejność osi dla 6 płatków (4+2). Indeksy zgodne z PALETTES[*].petals.
export const AXES = ['day', 'emotions', 'energy', 'body', 'delight', 'meaning'] as const;
export type Axis = (typeof AXES)[number];
