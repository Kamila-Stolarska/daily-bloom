// Czysta geometria/dane kanonicznego kwiatka SoftBloom — BEZ importu Skia.
// KRYTYCZNE: ten plik nie może importować @shopify/react-native-skia (ani
// niczego co go importuje). Jest importowany też przez MiniFlower.tsx (czysty
// SVG, montowany eagerly w kalendarzu, zanim CanvasKit zdąży się załadować).
// Skia.web.js przy imporcie wywołuje JsiSkApi(global.CanvasKit) — jeśli
// CanvasKit nie jest jeszcze gotowy, Skia zostaje trwale zepsute na całej
// stronie. Wszystko co faktycznie potrzebuje Skia (Canvas/Path/Group...) żyje
// w FlowerVariants.tsx / SoftBloomFlowerContent.tsx, lazy-loaded po
// ensureSkiaWeb().

// Oryginalny viewBox SVG referencji.
export const SVG_SIZE = 450;
export const SVG_CX = 229.151;
export const SVG_CY = 232.5;

// Różowy pinkowy blur w środku.
export const CENTER_COLOR = '#E276A3';
export const CENTER_R = 27;
export const CENTER_BLUR = 10.5;

// Gradient płatka — lime green → warm orange (ten sam na wszystkich 6, zmienia
// się tylko orientacja per płatek).
export const GRADIENT_COLORS: readonly [string, string] = ['#D3FD9D', '#FDA674'];

// Kanoniczny kształt płatka — wzięty z "DZIEŃ" (top, paint0/Filter6), bo w nim
// linie skali wypadały poprawnie. WSZYSTKIE 6 płatków to ten sam kształt,
// tylko obrócony o i*60° wokół centrum — gwarantuje identyczny układ ghost-linii
// w każdym płatku (oryginalny SVG miał 6 niezależnie rysowanych, asymetrycznych
// krzywych, przez co linie wypadały różnie płatek od płatka).
export const CANON_WHITE_PATH =
  'M301.151 73.0459C301.151 122.237 257.012 206.648 224.151 206.648C191.29 206.648 146.151 128.676 146.151 79.4846C146.151 30.2935 191.29 21 224.151 21C257.012 21 301.151 23.8549 301.151 73.0459Z';
export const CANON_COLOR_PATH =
  'M273.151 110.566C273.151 146.072 245.529 207 224.964 207C204.4 207 176.151 150.72 176.151 115.214C176.151 79.708 204.4 73 224.964 73C245.529 73 273.151 75.0606 273.151 110.566Z';
// Wektor gradientu kanonicznego płatka (koniuszek → środek) — obraca się razem
// z płatkiem, bo żyje w tym samym obróconym Group.
export const CANON_GRADIENT_VEC = { x1: 224.651, y1: 73, x2: 224.651, y2: 207 };

// 6 osi w kolejności zgodnej z AXES: day, emotions, energy, body, delight, meaning.
// Kąty zgodne z układem zegara (0°=góra, 60°=góra-prawo, ...), tak jak w FlowerChrome.
export const PETAL_COUNT = 6;
export const petalAngleRad = (i: number) => (i * Math.PI) / 3;

// Próbkowanie ścieżki "M x y C.. C.. C.. Z" żeby policzyć realny zasięg płatka
// od centrum — CANON_COLOR_PATH i CANON_WHITE_PATH to NIEZALEŻNE krzywe (nie
// skalowane kopie tego samego kształtu), więc ich stosunek trzeba zmierzyć.
const BEZIER_SAMPLES = 24;
function maxReachFromCenter(d: string, cx: number, cy: number): number {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  let curX = nums[0];
  let curY = nums[1];
  let max = Math.hypot(curX - cx, curY - cy);
  for (let i = 2; i + 5 < nums.length; i += 6) {
    const [c1x, c1y, c2x, c2y, ex, ey] = nums.slice(i, i + 6);
    for (let s = 1; s <= BEZIER_SAMPLES; s++) {
      const t = s / BEZIER_SAMPLES;
      const mt = 1 - t;
      const x = mt * mt * mt * curX + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex;
      const y = mt * mt * mt * curY + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > max) max = dist;
    }
    curX = ex;
    curY = ey;
  }
  return max;
}

// Zasięg (promień od centrum) kanonicznego płatka koloru i białego podłoża —
// ten sam dla wszystkich 6 płatków, bo to ten sam kanoniczny kształt.
const CANON_COLOR_REACH = maxReachFromCenter(CANON_COLOR_PATH, SVG_CX, SVG_CY);
const CANON_WHITE_REACH = maxReachFromCenter(CANON_WHITE_PATH, SVG_CX, SVG_CY);

// Bazowy (równy) podział zasięgu na 5 poziomów 1..5 — poziom 5 = CANON_WHITE_REACH
// (dotyka białej krawędzi płatka, nie ruszamy go).
const baseLevelReach = (j: number) => (CANON_WHITE_REACH * j) / 5;

// Płaskie przesunięcie (w jednostkach viewBox=450, ~1:1 z px przy renderze ~500px)
// poziomów 1-4 O TĘ SAMĄ wartość bliżej piątego — nie kumulacyjnie (10,20,30,40),
// tylko każdy z osobna +10 względem swojej pierwotnej (równej) pozycji. Dzięki temu
// wzajemne odstępy 1↔2↔3↔4 zostają jak w zatwierdzonym wzorcu, tylko cała grupa
// podjeżdża trochę bliżej krawędzi — a najmniejszy płatek (wartość 1) robi się większy.
const GHOST_LEVEL_SHIFT = 10;

// 5 poziomów ghost, przeliczone na skalę względem CANON_COLOR_REACH.
export const LEVELS: readonly number[] = [1, 2, 3, 4, 5].map(
  (j) => (j === 5 ? baseLevelReach(j) : baseLevelReach(j) + GHOST_LEVEL_SHIFT) / CANON_COLOR_REACH,
);

// Skala wypełnienia kolorowego dla wartości osi 1..5 — mapuje wprost na LEVELS.
export function fillScaleForValue(v: number): number {
  const idx = Math.max(1, Math.min(5, Math.round(v))) - 1;
  return LEVELS[idx];
}

// Cienka, subtelna linia — "na pół milimetra". W jednostkach viewBox=450
// (renderowanego docelowo na ~500px) 1 unit ≈ 0.22mm — więc 2 = ~0.45mm.
export const GHOST_STROKE_W = 2;
export const GHOST_OPACITY = 0.32;
export const GHOST_LINE_COLOR = '#E4E4DC';

// Skia Group transform: array czytane jako T1*T2*T3*...*P. Do point P aplikowane
// w kolejności: pierwszy element array = ostatni krok obliczeń. Więc żeby
// "obrócić i/lub przeskalować wokół (cx,cy)": array = [T_back, T_scale, T_rotate, T_to_origin].
// (Zwykłe obiekty transformu — nie zależą od Skia, ale ich kształt pasuje do
// Skia <Group transform={...}>, którego używa SoftBloomFlowerContent.)
export function petalTransform(angleRad: number, k: number, cx: number, cy: number) {
  return [
    { translateX: cx },
    { translateY: cy },
    { scale: k },
    { rotate: angleRad },
    { translateX: -cx },
    { translateY: -cy },
  ];
}
