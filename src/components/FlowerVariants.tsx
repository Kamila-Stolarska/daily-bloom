// Dwa warianty stylu kwiatka do porównania w /lab — v4, 1:1 z inspiracji.
// A: SoftBloom v4       — Vegetable Salad (białe pulchne płatki + kolorowa aureola przez Skia Shadow)
// B: WatercolorBleed v4 — Fragapane (papierowa tekstura tła + rozpoznawalne 6 płatków w chaosie)

import React, { useMemo } from 'react';
import {
  Canvas,
  Group,
  Path,
  Rect,
  Circle,
  LinearGradient,
  RadialGradient,
  Turbulence,
  FractalNoise,
  Shadow,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';

import { Dna } from '../lib/flower/dna';
import { petalJitter } from '../lib/flower/organic';
import { DayData, AXES } from '../lib/flower/types';

type Props = {
  dna: Dna;
  day: DayData;
  size: number;
  dnaSeed: number;
};

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

// ═══════════════════════════════════════════════════════════════════════════
// A. Soft Bloom v5 — 1:1 z SVG referencji (flower.svg)
// Płatki (białe + gradient lime→orange) zdefiniowane jako literalne krzywe
// Beziera z SVG. Renderowane w oryginalnym układzie 450×458, potem skalowane
// do zadanego size. Legenda stała — ani kształt, ani rozmiar nie zależy
// od odpowiedzi; zmieniać się będzie tylko kolor wypełnienia.
// ═══════════════════════════════════════════════════════════════════════════

// Oryginalny viewBox SVG referencji.
const SVG_SIZE = 450;
const SVG_CX = 229.151;
const SVG_CY = 232.5;

// Różowy pinkowy blur w środku.
const CENTER_COLOR = '#E276A3';
const CENTER_R = 27;
const CENTER_BLUR = 10.5;

// Gradient płatka — lime green → warm orange (ten sam na wszystkich 6, zmienia
// się tylko orientacja per płatek).
const GRADIENT_COLORS = ['#D3FD9D', '#FDA674'] as const;

// Białe kształty płatków — kolejność: day (top), emotions (upper-R), energy (lower-R),
// body (bottom), delight (lower-L), meaning (upper-L). AXES pasuje 1:1.
const WHITE_PETAL_PATHS: readonly string[] = [
  // Filter6 — top
  'M301.151 73.0459C301.151 122.237 257.012 206.648 224.151 206.648C191.29 206.648 146.151 128.676 146.151 79.4846C146.151 30.2935 191.29 21 224.151 21C257.012 21 301.151 23.8549 301.151 73.0459Z',
  // Filter1 — upper-right
  'M404.167 209.915C361.14 236.734 263.958 245.298 246.576 217.411C229.193 189.524 273.517 108.706 316.544 81.8865C359.57 55.067 391.577 88.3067 408.959 116.194C426.342 144.081 447.193 183.095 404.167 209.915Z',
  // Filter2 — lower-right
  'M325.854 378.035C283.253 353.44 232.221 273.008 248.651 244.55C265.082 216.092 355.177 215.986 397.778 240.582C440.379 265.177 425.858 308.916 409.427 337.374C392.997 365.833 368.455 402.631 325.854 378.035Z',
  // Filter3 — bottom
  'M141.51 387.166C143.172 338.003 190.138 255.131 222.98 256.241C255.823 257.352 298.301 336.805 296.639 385.968C294.977 435.131 249.55 442.894 216.708 441.784C183.865 440.673 139.848 436.329 141.51 387.166Z',
  // Filter4 — lower-left
  'M46.7277 228.792C90.8922 207.129 186.116 209.586 200.587 239.089C215.057 268.592 164.93 343.456 120.766 365.118C76.601 386.78 48.3793 350.346 33.9083 320.843C19.4374 291.34 2.56312 250.454 46.7277 228.792Z',
  // Filter5 — upper-left
  'M123.904 85.0262C168.473 105.844 226.272 181.559 212.365 211.333C198.458 241.106 108.709 249.004 64.1402 228.186C19.5716 207.368 30.2547 162.537 44.1617 132.764C58.0688 102.991 79.3355 64.2081 123.904 85.0262Z',
] as const;

// Gradientowe kształty — nieznacznie mniejsze/inne od białych (dają efekt
// białej krawędzi wokół koloru).
const GRADIENT_PETAL_PATHS: readonly string[] = [
  // paint0 — top
  'M273.151 110.566C273.151 146.072 245.529 207 224.964 207C204.4 207 176.151 150.72 176.151 115.214C176.151 79.708 204.4 73 224.964 73C245.529 73 273.151 75.0606 273.151 110.566Z',
  // paint1 — upper-right
  'M333.585 213.58C309.68 227.382 256.902 230.7 248.148 215.539C239.395 200.378 265.263 157.675 289.168 143.873C313.073 130.072 329.613 148.29 338.366 163.452C347.12 178.613 357.49 199.779 333.585 213.58Z',
  // paint2 — lower-right
  'M308.523 343.702C277.243 325.642 239.643 266.804 251.613 246.072C263.583 225.34 329.608 225.488 360.888 243.548C392.169 261.608 381.636 293.498 369.667 314.23C357.697 334.963 339.804 361.762 308.523 343.702Z',
  // paint3 — bottom
  'M150.111 387.416C150.111 338.662 189.978 255 219.659 255C249.34 255 290.111 332.28 290.111 381.035C290.111 429.789 249.34 439 219.659 439C189.978 439 150.111 436.17 150.111 387.416Z',
  // paint4 — lower-left
  'M74.5536 243.661C110.074 223.153 186.489 214.746 198.001 234.686C209.513 254.625 169.024 314.522 133.504 335.029C97.9841 355.537 75.4598 332.021 63.9476 312.081C52.4354 292.142 39.0336 264.168 74.5536 243.661Z',
  // paint5 — upper-left
  'M145.808 128.083C175.744 145.367 214.55 196.787 205.197 212.988C195.843 229.19 135.542 224.048 105.606 206.764C75.6697 189.48 82.8626 163.96 92.2164 147.759C101.57 131.558 115.872 110.8 145.808 128.083Z',
] as const;

// Wektory gradientów w oryginalnych koordynatach SVG — każdy skierowany
// od koniuszka (lime) do środka (orange).
const GRADIENT_VECS = [
  { x1: 224.651, y1: 73,      x2: 224.651, y2: 207     }, // top
  { x1: 338.233, y1: 163.221, x2: 248.015, y2: 215.308 }, // upper-right
  { x1: 369.849, y1: 313.915, x2: 251.795, y2: 245.757 }, // lower-right
  { x1: 220.111, y1: 439,     x2: 220.111, y2: 255     }, // bottom
  { x1: 64.1228, y1: 312.385, x2: 198.176, y2: 234.989 }, // lower-left
  { x1: 92.0741, y1: 148.006, x2: 205.054, y2: 213.235 }, // upper-left
] as const;

export const SoftBloomFlower = React.memo(function SoftBloomFlower({
  size,
}: Props) {
  // Skalujemy SVG viewBox (450) do naszego size i wyśrodkowujemy tak, żeby
  // (SVG_CX, SVG_CY) trafił w (size/2, size/2).
  // Skia RN Group transform: array [T1,T2,T3] → matryca T1*T2*T3, więc pierwszy
  // element jest aplikowany JAKO OSTATNI do punktu. Chcemy: najpierw scale
  // wokół origin (0,0), potem translate → translate stoi jako pierwsze.
  const scale = (size / SVG_SIZE) * 0.98;
  const tx = size / 2 - scale * SVG_CX;
  const ty = size / 2 - scale * SVG_CY;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: tx }, { translateY: ty }, { scale }]}>
        {/* WARSTWA 0 — różowe kółeczko z mocnym blurem (filter0). */}
        <Circle cx={SVG_CX} cy={SVG_CY} r={CENTER_R} color={CENTER_COLOR}>
          <BlurMask blur={CENTER_BLUR} style="normal" />
        </Circle>

        {/* WARSTWA 1 — białe płatki (filter1-6, delikatny blur stdDev=1). */}
        {WHITE_PETAL_PATHS.map((path, i) => (
          <Path key={`white-${i}`} path={path} color="#FFFFFF">
            <BlurMask blur={1} style="normal" />
          </Path>
        ))}

        {/* WARSTWA 2 — gradientowe kolory na płatkach (filter7-12, blur stdDev=2).
            Każdy płatek ma lime→orange, orientacja zgodna z paint0-paint5. */}
        {GRADIENT_PETAL_PATHS.map((path, i) => {
          const v = GRADIENT_VECS[i];
          return (
            <Path key={`grad-${i}`} path={path}>
              <LinearGradient
                start={vec(v.x1, v.y1)}
                end={vec(v.x2, v.y2)}
                colors={[GRADIENT_COLORS[0], GRADIENT_COLORS[1]]}
              />
              <BlurMask blur={2} style="normal" />
            </Path>
          );
        })}
      </Group>
    </Canvas>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// B. Watercolor Bleed v4 — 1:1 Fragapane + papierowa tekstura tła
// ═══════════════════════════════════════════════════════════════════════════

const BLEED_PALETTE_V4 = {
  paper: '#F6F6EA', // match page background exactly — canvas box edge invisible
  petals: [
    ['#F26B3D', '#F5B08A'], // day       — orange
    ['#D42418', '#F26B3D'], // emotions  — deep red → orange
    ['#C7346B', '#F09EA6'], // energy    — magenta → coral
    ['#F5B47A', '#EDCA8F'], // body      — amber
    ['#7EA598', '#B8CDBF'], // delight   — sage teal (chłodny)
    ['#A594B0', '#CBB8CB'], // meaning   — muted lila (drugi chłodny)
  ] as const,
  hotSpots: ['#F26B3D', '#D42418', '#C7346B', null, null, null] as const,
};

// 6 archetypów kształtu — owal, skrzydło-L, liść z wcięciem, ostrze, skrzydło-P, wiatrak.
function irregularPetalPath(length: number, width: number, seed: number, morph: number): string {
  const rng = mulberry32(seed);
  const r = (min: number, max: number) => min + rng() * (max - min);
  const L = length;
  const w = width;
  const arch = morph % 6;

  const wingBend = arch === 1 ? -w * 1.2 : arch === 4 ? w * 1.2 : 0;
  const tipX = wingBend + w * r(-0.15, 0.15);
  const tipY = -L * r(0.9, 1.05);

  const lMid = arch % 2 === 0 ? w * r(1.15, 1.4) : w * r(0.85, 1.05);
  const lMidY = -L * r(0.32, 0.5);
  const lUpper = arch < 3 ? w * r(0.5, 0.9) : w * r(0.9, 1.3);
  const lUpperY = -L * r(0.65, 0.85);

  const rMid = arch < 2 ? w * r(0.9, 1.1) : w * r(1.15, 1.45);
  const rMidY = -L * r(0.32, 0.5);
  const rUpper = arch === 1 || arch === 4 ? w * r(0.5, 0.85) : w * r(0.95, 1.35);
  const rUpperY = -L * r(0.6, 0.85);

  const notch = arch === 2 || arch === 5;
  const notchScale = notch ? r(0.5, 0.75) : 1;

  const bendCtrlL = arch === 1 ? -w * 0.6 : 0;
  const bendCtrlR = arch === 4 ? w * 0.6 : 0;

  return [
    `M 0 0`,
    `C ${-lMid * 1.05 + bendCtrlL} ${-L * 0.12}, ${-lMid + bendCtrlL} ${lMidY}, ${-lUpper + bendCtrlL * 0.5} ${lUpperY}`,
    `C ${-lUpper * notchScale + bendCtrlL * 0.3} ${lUpperY - L * 0.08}, ${tipX - w * 0.2} ${tipY + L * 0.02}, ${tipX} ${tipY}`,
    `C ${tipX + w * 0.2} ${tipY + L * 0.02}, ${rUpper * notchScale + bendCtrlR * 0.3} ${rUpperY - L * 0.08}, ${rUpper + bendCtrlR * 0.5} ${rUpperY}`,
    `C ${rMid + bendCtrlR} ${rMidY}, ${rMid * 1.05 + bendCtrlR} ${-L * 0.12}, 0 0`,
    `Z`,
  ].join(' ');
}

export const WatercolorBleedFlower = React.memo(function WatercolorBleedFlower({
  dna, day, size, dnaSeed,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const legendR = size * 0.48;
  const lenFor = (v: number) => legendR * (v / 5) * 1.15;
  const petalBaseWidth = size * 0.42 * 0.5;

  const lengths = [
    lenFor(day.day),
    lenFor(day.emotions),
    lenFor(day.energy),
    lenFor(day.body),
    lenFor(day.delight),
    lenFor(day.meaning),
  ];

  const petals = useMemo(
    () => AXES.map((_axis, i) => {
      const jitter = petalJitter(dnaSeed, i);
      const length = lengths[i];
      const width = petalBaseWidth * (0.7 + jitter.widthScale * 0.5);
      // Chaos ograniczony ±15° (zamiast wcześniejszych ±40°) — żeby 6 osi było czytelnych.
      const chaos = ((jitter.pathSeed % 100) / 100 - 0.5) * 30;
      const angleDeg = i * 60 + dna.rotationOffset + jitter.angleOffset * 1.2 + chaos;
      const angleRad = (angleDeg * Math.PI) / 180;
      const path = irregularPetalPath(length, width, jitter.pathSeed, i);
      // Umiarkowane krzyżowanie środka — 0.15 zamiast 0.22.
      const originShift = length * 0.15;
      const [baseHex, tipHex] = BLEED_PALETTE_V4.petals[i];
      const hotSpot = BLEED_PALETTE_V4.hotSpots[i];
      return { path, length, width, angleRad, originShift, tipHex, baseHex, hotSpot };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dnaSeed, day.day, day.emotions, day.energy, day.body, day.delight, day.meaning, dna.rotationOffset, petalBaseWidth],
  );

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* WARSTWA 0 — papierowa tekstura tła jako soft radial gradient + grain w okrągłym clip.
          Circle zamiast Rect — brak widocznej krawędzi kanwy. */}
      <Circle cx={cx} cy={cy} r={size * 0.5}>
        <RadialGradient
          c={vec(cx, cy)}
          r={size * 0.5}
          colors={[BLEED_PALETTE_V4.paper, BLEED_PALETTE_V4.paper, `${BLEED_PALETTE_V4.paper}00`]}
          positions={[0, 0.7, 1]}
        />
      </Circle>
      <Circle cx={cx} cy={cy} r={size * 0.5} opacity={0.05}>
        <FractalNoise freqX={0.8} freqY={0.8} octaves={4} seed={dnaSeed & 0xffff} />
        <BlurMask blur={size * 0.08} style="normal" />
      </Circle>

      {/* WARSTWA 1 — bazowy kolor płatka (multiply, opacity 0.65, żeby środek nie mętniał). */}
      <Group blendMode="multiply">
        {petals.map((p, i) => (
          <Group
            key={`bleed-${i}`}
            transform={[
              { translateX: cx },
              { translateY: cy },
              { rotate: p.angleRad },
              { translateY: p.originShift },
            ]}
          >
            <Path path={p.path} opacity={0.52}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, -p.length)}
                colors={[p.baseHex, p.tipHex]}
              />
              <BlurMask blur={1.5} style="normal" />
            </Path>
          </Group>
        ))}
      </Group>

      {/* WARSTWA 2 — hot spots: radialne rozbłyski w warm płatkach (day/emotions/energy). */}
      <Group blendMode="multiply">
        {petals.map((p, i) => {
          if (!p.hotSpot) return null;
          return (
            <Group
              key={`hot-${i}`}
              transform={[
                { translateX: cx },
                { translateY: cy },
                { rotate: p.angleRad },
                { translateY: p.originShift },
              ]}
            >
              <Path path={p.path} opacity={0.55}>
                <RadialGradient
                  c={vec(0, -p.length * 0.5)}
                  r={p.length * 0.4}
                  colors={[p.hotSpot, `${p.hotSpot}00`]}
                  positions={[0, 1]}
                />
                <BlurMask blur={4} style="normal" />
              </Path>
            </Group>
          );
        })}
      </Group>

      {/* WARSTWA 3 — drobny grain w płatkach. */}
      <Group blendMode="multiply" opacity={0.4}>
        {petals.map((p, i) => (
          <Group
            key={`grain-${i}`}
            transform={[
              { translateX: cx },
              { translateY: cy },
              { rotate: p.angleRad },
              { translateY: p.originShift },
            ]}
          >
            <Path path={p.path}>
              <Turbulence
                freqX={3.2}
                freqY={3.2}
                octaves={4}
                seed={(dnaSeed ^ (i * 9181)) & 0xffff}
              />
            </Path>
          </Group>
        ))}
      </Group>

      {/* WARSTWA 4 — grube plamy grain (efekt papieru akwarelowego). */}
      <Group blendMode="multiply" opacity={0.22}>
        {petals.map((p, i) => (
          <Group
            key={`grain2-${i}`}
            transform={[
              { translateX: cx },
              { translateY: cy },
              { rotate: p.angleRad },
              { translateY: p.originShift },
            ]}
          >
            <Path path={p.path}>
              <Turbulence
                freqX={0.9}
                freqY={0.9}
                octaves={2}
                seed={(dnaSeed ^ (i * 31337)) & 0xffff}
              />
            </Path>
          </Group>
        ))}
      </Group>
    </Canvas>
  );
});
