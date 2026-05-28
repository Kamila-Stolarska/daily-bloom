// Daily Bloom — DNA użytkownika (warstwa A z FLOWER_DNA.md).
// Deterministyczne z userId, stałe na zawsze.

import { PALETTES } from './palettes';

export type Dna = {
  paletteIndex: number;
  archetypeIndex: number;   // 0 = kropla, 1 = owal, 2 = łopatka
  curvature: number;        // 0.2 – 1.0
  asymmetry: number;        // 0 – 0.3
  textureIndex: number;     // 0 – 3
  rotationOffset: number;   // -30 – +30 stopni
  pestilIndex: number;      // 0 – 5
};

// cyrb53 — szybki, deterministyczny string→32bit (nie kryptograficzny — wystarczy do seeda PRNG).
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0);
}

// mulberry32 — deterministyczny PRNG.
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

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function range(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function deriveDna(userId: string): Dna {
  const seed = cyrb53(userId);
  const rng = mulberry32(seed);

  return {
    // MVP: zawsze paleta "Akwarela" (index 0) — jedyna iterowana wg referencji.
    // Pozostałe palety wracają do losowania DNA po redesignie do poziomu Akwareli.
    paletteIndex: 0,
    archetypeIndex: Math.floor(rng() * 3),
    curvature: range(rng, 0.3, 0.95),
    asymmetry: range(rng, 0, 0.25),
    textureIndex: Math.floor(rng() * 4),
    rotationOffset: range(rng, -25, 25),
    pestilIndex: Math.floor(rng() * 6),
  };
}

// Deterministyczny indeks płatka dla pęknięcia "coś trudnego" — z daty (YYYY-MM-DD).
export function hardPetalIndex(dateIso: string, petalCount: number): number {
  return cyrb53(dateIso) % petalCount;
}
