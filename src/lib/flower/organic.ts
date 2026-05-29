// Akwarelowy płatek — kropelkowaty teardrop, jeden łuk na stronę.
// Lekka asymetria L/P + niezależny jitter szerokości i wierzchołka.
// Bez ostrych guzów — krawędzie miękkie, ksztalt rozpoznawalnie "płatkowy".

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

/**
 * Teardrop o lekko asymetrycznych bokach.
 * Baza w (0,0), wierzchołek w okolicach (0, -L). Szerokość ~ w w okolicach 45% długości.
 */
export function organicPetalPath(length: number, width: number, seed: number): string {
  const rng = mulberry32(seed);
  const r = (min: number, max: number) => min + rng() * (max - min);
  const L = length;
  const w = width;

  // Niezależne parametry lewej i prawej strony — subtelna asymetria.
  const lWidth = w * r(0.95, 1.1);
  const rWidth = w * r(0.95, 1.1);
  const lBulgeY = -L * r(0.42, 0.55); // gdzie najszerszy punkt po lewej
  const rBulgeY = -L * r(0.42, 0.55);

  // Wierzchołek DOKŁADNIE na osi w punkcie -L — wymóg data-viz:
  // pozycja tipa odpowiada wartości skali (1–5 → pierścień 1–5 w FlowerChrome).
  const tipX = 0;
  const tipY = -L;

  // Lewy brzeg: od (0,0) krzywą do wierzchołka, "wypchnięty" na lewo w lBulgeY.
  // C cp1 (przy bazie) cp2 (przy wierzchołku) (tipX,tipY)
  const lcp1x = -lWidth * r(0.85, 1.0);
  const lcp1y = -L * r(0.12, 0.22);
  const lcp2x = -lWidth * r(0.55, 0.8);
  const lcp2y = lBulgeY - L * r(0.15, 0.28); // ciągnie ku wierzchołkowi
  const lMidx = -lWidth; // punkt referencyjny dla bulge — nieuzywany w path

  // Prawy brzeg: od wierzchołka z powrotem do (0,0).
  const rcp1x = rWidth * r(0.55, 0.8);
  const rcp1y = tipY + (rBulgeY - tipY) * r(0.55, 0.75);
  const rcp2x = rWidth * r(0.85, 1.0);
  const rcp2y = -L * r(0.12, 0.22);

  // unused var guard
  void lMidx;

  return [
    `M 0 0`,
    `C ${lcp1x} ${lcp1y}, ${lcp2x} ${lcp2y}, ${tipX} ${tipY}`,
    `C ${rcp1x} ${rcp1y}, ${rcp2x} ${rcp2y}, 0 0`,
    `Z`,
  ].join(' ');
}

export type PetalJitter = {
  angleOffset: number;
  widthScale: number;
  lengthScale: number;
  pathSeed: number;
};

export function petalJitter(dnaSeed: number, index: number): PetalJitter {
  const rng = mulberry32(dnaSeed ^ ((index + 1) * 2654435761));
  return {
    // mniejsza rotacja per płatek — żeby kwiatek był spójny
    angleOffset: (rng() - 0.5) * 14,
    // węższy zakres — płatki podobnej szerokości
    widthScale: 0.9 + rng() * 0.35,
    // węższy zakres — płatki podobnej długości
    lengthScale: 0.9 + rng() * 0.2,
    pathSeed: Math.floor(rng() * 1e9),
  };
}
