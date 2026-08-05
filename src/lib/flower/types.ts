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

// Polskie etykiety osi — te same, co pod kwiatkiem (FlowerChrome).
export const AXIS_LABELS_PL: Record<Axis, string> = {
  day: 'DZIEŃ',
  emotions: 'EMOCJE',
  energy: 'ENERGIA',
  body: 'CIAŁO',
  delight: 'ZACHWYT',
  meaning: 'SENS',
};

// Minimalny udział promienia dla wartości 1 — przy czystym v/5 same jedynki dają płatek
// 20% długości, który ginie w tle i nie przypomina kwiatka. Mapowanie 1→MIN_SCALE, 5→1.0
// (liniowo pomiędzy) zachowuje monotoniczność i dokładne trafienie w pierścień k, ale
// podnosi podłogę na tyle, żeby kwiatek zawsze był rozpoznawalny.
export const MIN_SCALE_RATIO = 0.4;

/** Ułamek promienia legendy (0..1) dla wartości skali 1–5. MUSI być identyczny w OrganicFlower i FlowerChrome. */
export const scaleFor = (v: number): number =>
  MIN_SCALE_RATIO + ((v - 1) / 4) * (1 - MIN_SCALE_RATIO);
