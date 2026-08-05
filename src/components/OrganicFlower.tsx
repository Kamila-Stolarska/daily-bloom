// Organiczny, akwarelowy kwiatek.
// - gradient per płatek
// - lekki blur na krawędziach (BlurMask)
// - grain (Turbulence) tylko WEWNĄTRZ płatków, z blend multiply
// - asymetria kątów i szerokości
// - animacja rozkwitania (RAF → React state) z lekkim stagger między płatkami
//   (świadomie bez Reanimated → uniknięcie problemów z worklets/Skia transform na web)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Canvas,
  Group,
  Path,
  LinearGradient,
  Turbulence,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';

import { Dna } from '../lib/flower/dna';
import { PALETTES } from '../lib/flower/palettes';
import { organicPetalPath, petalJitter } from '../lib/flower/organic';
import { withSaturation } from '../lib/flower/color';
import { DayData, AXES, scaleFor } from '../lib/flower/types';

type Props = {
  dna: Dna;
  day: DayData;
  size: number;
  dnaSeed: number;
  grain?: boolean;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  /** Statyczna siatka skali 1–5 (zagnieżdżone kontury per oś) — tło-legenda za realnym kwiatkiem. */
  referenceGrid?: boolean;
  /** Wyłącz animację rozkwitania (np. w stats, kiedy zmieniamy dużo na raz). */
  animate?: boolean;
  /** Kąty płatków dokładnie i*60° (bez jitter) — do zgodności z etykietami FlowerChrome, które nie mają jittera. */
  symmetric?: boolean;
};

const scaleToUnit = (v: number) => (v - 1) / 4;
const BLOOM_DURATION_MS = 1400;
const PETAL_STAGGER = 0.09;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type PetalRender = {
  path: string;
  length: number;
  width: number;
  angleRad: number;
  tipHex: string;
  baseHex: string;
};

/** RAF-driven progress 0→1; re-startuje, gdy zmieni się którakolwiek wartość z `keys`. */
function useBloomProgress(animate: boolean, keys: ReadonlyArray<unknown>): number {
  const [progress, setProgress] = useState<number>(animate ? 0 : 1);
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setProgress(1);
      return;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    startedAtRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startedAtRef.current;
      const p = Math.min(1, elapsed / BLOOM_DURATION_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, ...keys]);

  return progress;
}

function petalTransform(petal: PetalRender, index: number, cx: number, cy: number, progress: number) {
  const delay = index * PETAL_STAGGER;
  const span = 1 - delay;
  const raw = (progress - delay) / span;
  const t = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  const eased = easeOutCubic(t);
  const rotateOffset = (1 - eased) * 0.35; // ~20° domknięcia na starcie
  return [
    { translateX: cx },
    { translateY: cy },
    { rotate: petal.angleRad - rotateOffset },
    { scale: Math.max(eased, 0.001) },
  ];
}

export const OrganicFlower = React.memo(function OrganicFlower({
  dna, day, size, dnaSeed, grain = false,
  outline = false, outlineColor = '#E1D8CE', outlineWidth = 1,
  referenceGrid = false,
  animate = true,
  symmetric = false,
}: Props) {
  const palette = PALETTES[dna.paletteIndex % PALETTES.length];
  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.42;

  // Promień legendy (zewnętrzny pierścień "5") — MUSI zgadzać się z FlowerChrome.
  // length(v) = legendR * v/5, więc wierzchołek płatka o odpowiedzi k leży dokładnie
  // na pierścieniu k. To wymóg data-viz: oś z formularza = pozycja na siatce.
  const legendR = size * 0.48;
  const lenFor = (v: number) => legendR * scaleFor(v);

  // 6 osi = 6 własnych płatków (kolejność z AXES: day, emotions, energy, body, delight, meaning).
  const lengths = [
    lenFor(day.day),
    lenFor(day.emotions),
    lenFor(day.energy),
    lenFor(day.body),
    lenFor(day.delight),
    lenFor(day.meaning),
  ];

  const satFactor = 0.55 + scaleToUnit(day.emotions) * 0.45;
  const petalBaseWidth = baseR * 0.26;
  // W trybie symmetric (home) płatki pełniejsze — szerokość liczona proporcjonalnie
  // do DŁUGOŚCI KAŻDEGO płatka (nie stały baseR), inaczej krótkie płatki (niskie wartości
  // osi) robią się szersze niż dłuższe i zapadają się w bezkształtną plamę.
  const SYMMETRIC_WIDTH_RATIO = 0.34;

  // Pre-compute wszystkich płatków raz — używane dwukrotnie (color + grain).
  const petals: PetalRender[] = useMemo(
    () => AXES.map((_axis, i) => {
      const jitter = petalJitter(dnaSeed, i);
      // UWAGA: nie używamy jitter.lengthScale — długość MUSI być dokładna (skala 1–5 → pierścień).
      const length = lengths[i];
      const width = symmetric
        ? length * SYMMETRIC_WIDTH_RATIO
        : petalBaseWidth * jitter.widthScale;
      const angleDeg = symmetric ? i * 60 : i * 60 + jitter.angleOffset;
      const angleRad = (angleDeg * Math.PI) / 180;
      const path = organicPetalPath(length, width, jitter.pathSeed);
      const tipHex = withSaturation(palette.petals[i], satFactor);
      const baseHex = withSaturation(palette.petals[(i + 3) % 6], satFactor * 0.85);
      return { path, length, width, angleRad, tipHex, baseHex };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dnaSeed, palette, satFactor, day.day, day.emotions, day.energy, day.body, day.delight, day.meaning, petalBaseWidth, symmetric],
  );

  const progress = useBloomProgress(animate, [
    dnaSeed, day.day, day.energy, day.body, day.delight, day.meaning, day.emotions,
    day.dateIso, outline,
  ]);

  // Siatka-legenda: dla każdej osi 5 zagnieżdżonych, samopodobnych konturów płatka
  // (wartości 1–5, ten sam kształt/seed przeskalowany) — odpowiednik pierścieni
  // FlowerChrome, ale w kształcie płatka danej osi. Wypełnienie + cienki kontur na
  // każdym pierścieniu, rysowane od największego do najmniejszego.
  if (referenceGrid) {
    return (
      <Canvas style={{ width: size, height: size }}>
        {AXES.map((_axis, i) => {
          const jitter = petalJitter(dnaSeed, i);
          // Ten sam kąt co realny płatek (ten sam dnaSeed/index) — siatka MUSI
          // pokrywać się z rzeczywistym płatkiem danej osi, inaczej wygląda krzywo.
          const angleDeg = symmetric ? i * 60 : i * 60 + jitter.angleOffset;
          const angleRad = (angleDeg * Math.PI) / 180;
          // Siatka zawsze rysuje ring 5 na pełnym legendR — szerokość liczona od tej samej
          // podstawy, żeby proporcje pokrywały się z realnym płatkiem (który skaluje width
          // od własnej długości).
          const width = symmetric ? legendR * SYMMETRIC_WIDTH_RATIO : petalBaseWidth * jitter.widthScale;
          return (
            <Group
              key={`grid-${i}`}
              transform={[{ translateX: cx }, { translateY: cy }, { rotate: angleRad }]}
            >
              {[5, 4, 3, 2, 1].map((v) => {
                const scale = scaleFor(v);
                const path = organicPetalPath(lenFor(v), width * scale, jitter.pathSeed);
                return (
                  <React.Fragment key={`ring-${i}-${v}`}>
                    <Path path={path} style="fill" color="#FFDFFF" />
                    <Path path={path} style="stroke" strokeWidth={0.6} color="#B4B4B4" />
                  </React.Fragment>
                );
              })}
              {/* Lekki noise na różowym tle skali — subtelny, żeby nie zdominować cienkich linii. */}
              <Group blendMode="multiply" opacity={0.12}>
                <Path path={organicPetalPath(lenFor(5), width, jitter.pathSeed)}>
                  <Turbulence
                    freqX={1.4}
                    freqY={1.4}
                    octaves={2}
                    seed={(dnaSeed ^ (i * 5237)) & 0xffff}
                  />
                </Path>
              </Group>
            </Group>
          );
        })}
      </Canvas>
    );
  }

  if (outline) {
    return (
      <Canvas style={{ width: size, height: size }}>
        {petals.map((p, i) => (
          <Group key={`outline-${i}`} transform={petalTransform(p, i, cx, cy, progress)}>
            <Path
              path={p.path}
              style="stroke"
              strokeWidth={outlineWidth}
              color={outlineColor}
            />
          </Group>
        ))}
      </Canvas>
    );
  }

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Warstwa kolorów — gradient + lekki blur dla "krwawiących" krawędzi. */}
      {petals.map((p, i) => (
        <Group key={`color-${i}`} transform={petalTransform(p, i, cx, cy, progress)}>
          <Path path={p.path} opacity={0.85}>
            {grain && <BlurMask blur={2.2} style="normal" />}
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -p.length)}
              colors={[p.baseHex, p.tipHex]}
            />
          </Path>
        </Group>
      ))}

      {/* Warstwa grain — Turbulence wewnątrz tych samych ścieżek, multiply blend. */}
      {grain && (
        <Group blendMode="multiply" opacity={0.32}>
          {petals.map((p, i) => (
            <Group key={`grain-${i}`} transform={petalTransform(p, i, cx, cy, progress)}>
              <Path path={p.path}>
                <Turbulence
                  freqX={1.8}
                  freqY={1.8}
                  octaves={3}
                  seed={(dnaSeed ^ (i * 9181)) & 0xffff}
                />
              </Path>
            </Group>
          ))}
        </Group>
      )}
    </Canvas>
  );
});
