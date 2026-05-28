// Daily Bloom — komponent renderujący kwiatek (Skia).
// Faza 1: prototyp. Pipeline z FLOWER_DNA.md §5.

import React, { useMemo } from 'react';
import {
  Canvas,
  Group,
  Path,
  Circle,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';

import { Dna, hardPetalIndex } from '../lib/flower/dna';
import { PALETTES } from '../lib/flower/palettes';
import { petalPath, Archetype } from '../lib/flower/petals';
import { withSaturation } from '../lib/flower/color';
import { DayData, AXES } from '../lib/flower/types';

type Props = {
  dna: Dna;
  day: DayData;
  size: number;            // szerokość/wysokość canvasa w px
  showBg?: boolean;        // czy rysować tło palety (true) — w lab często wyłączone
};

// Mapowanie skali 1..5 → 0..1 (liniowo).
const scaleToUnit = (v: number) => (v - 1) / 4;

export const Flower = React.memo(function Flower({ dna, day, size, showBg = false }: Props) {
  const palette = PALETTES[dna.paletteIndex % PALETTES.length];
  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.4;

  // 1. Globalny rozmiar (Dzień) — 0.55..1.0
  const globalSize = 0.55 + scaleToUnit(day.day) * 0.45;

  // 2. Długości 4 indywidualnych płatków (energy, body, delight, meaning)
  const lenE = (0.32 + scaleToUnit(day.energy) * 0.68) * globalSize * baseR;
  const lenB = (0.32 + scaleToUnit(day.body) * 0.68) * globalSize * baseR;
  const lenD = (0.32 + scaleToUnit(day.delight) * 0.68) * globalSize * baseR;
  const lenM = (0.32 + scaleToUnit(day.meaning) * 0.68) * globalSize * baseR;

  // 3. Dzień i Emocje: długość = średnia z pozostałych 4
  const lenAvg = (lenE + lenB + lenD + lenM) / 4;

  // Kolejność wg AXES: [day, emotions, energy, body, delight, meaning]
  const lengths = [lenAvg, lenAvg, lenE, lenB, lenD, lenM];

  // 4. Saturacja od Emocji — 0.35..1.0
  const satFactor = 0.35 + scaleToUnit(day.emotions) * 0.65;

  // Pre-compute kolorów płatków z saturacją.
  const colors = useMemo(
    () => palette.petals.map((c) => withSaturation(c, satFactor)),
    [palette, satFactor],
  );

  // 5. Szerokość płatków — proporcjonalna do globalSize, lekko od krzywizny.
  const petalWidth = baseR * 0.22 * globalSize;

  // 6. Pęknięcie "coś trudnego" — deterministyczny indeks płatka z daty (lub środkowy).
  const hardIdx = day.somethingHard
    ? hardPetalIndex(day.dateIso ?? 'fallback', 6)
    : -1;

  // 7. Aura "coś dobrego" — soft glow.
  const auraR = baseR * globalSize * 1.35;

  return (
    <Canvas style={{ width: size, height: size }}>
      {showBg && <Circle cx={cx} cy={cy} r={size / 2} color={palette.bg} />}

      {/* Aura: coś dobrego */}
      {day.somethingGood && (
        <Circle cx={cx} cy={cy} r={auraR} opacity={0.55}>
          <RadialGradient
            c={vec(cx, cy)}
            r={auraR}
            colors={[palette.aura, `${palette.aura}00`]}
          />
        </Circle>
      )}

      {/* Płatki */}
      {AXES.map((axis, i) => {
        const angleDeg = i * 60 + dna.rotationOffset;
        const rad = (angleDeg * Math.PI) / 180;
        const path = petalPath(
          dna.archetypeIndex as Archetype,
          lengths[i],
          petalWidth,
          dna.curvature,
          dna.asymmetry,
        );
        return (
          <Group
            key={axis}
            transform={[
              { translateX: cx },
              { translateY: cy },
              { rotate: rad },
            ]}
          >
            <Path path={path} color={colors[i]} opacity={0.92} />
            {/* obrys subtelny — czytelność na kremowym tle */}
            <Path
              path={path}
              color={palette.shadow}
              style="stroke"
              strokeWidth={0.6}
              opacity={0.18}
            />
            {/* ślad "coś trudnego" na wybranym płatku */}
            {hardIdx === i && (
              <Path
                path={`M 0 ${-lengths[i] * 0.15} L 0 ${-lengths[i] * 0.85}`}
                color={palette.shadow}
                style="stroke"
                strokeWidth={1.4}
                opacity={0.55}
              />
            )}
          </Group>
        );
      })}

      {/* Środek (pestil) — 6 form */}
      <Pestil cx={cx} cy={cy} r={baseR * 0.13 * globalSize} form={dna.pestilIndex} color={palette.pestil} accent={palette.aura} />
    </Canvas>
  );
});

function Pestil({
  cx, cy, r, form, color, accent,
}: { cx: number; cy: number; r: number; form: number; color: string; accent: string }) {
  switch (form % 6) {
    case 0: // kropka
      return <Circle cx={cx} cy={cy} r={r} color={color} />;
    case 1: // koło z otoczką
      return (
        <Group>
          <Circle cx={cx} cy={cy} r={r * 1.5} color={color} opacity={0.18} />
          <Circle cx={cx} cy={cy} r={r} color={color} />
        </Group>
      );
    case 2: // mandala — koncentryczne okręgi
      return (
        <Group>
          <Circle cx={cx} cy={cy} r={r * 1.6} color={color} style="stroke" strokeWidth={0.8} opacity={0.4} />
          <Circle cx={cx} cy={cy} r={r * 1.1} color={color} style="stroke" strokeWidth={0.8} opacity={0.55} />
          <Circle cx={cx} cy={cy} r={r * 0.6} color={color} />
        </Group>
      );
    case 3: // punkt z aurą złotą
      return (
        <Group>
          <Circle cx={cx} cy={cy} r={r * 1.8} color={accent} opacity={0.25} />
          <Circle cx={cx} cy={cy} r={r * 0.8} color={color} />
        </Group>
      );
    case 4: // mały pierścień
      return <Circle cx={cx} cy={cy} r={r} color={color} style="stroke" strokeWidth={Math.max(1, r * 0.3)} />;
    case 5: // gwiazda (uproszczona — koło + 4 drobne kropki)
    default:
      return (
        <Group>
          <Circle cx={cx} cy={cy} r={r * 0.7} color={color} />
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const px = cx + Math.cos(rad) * r * 1.4;
            const py = cy + Math.sin(rad) * r * 1.4;
            return <Circle key={deg} cx={px} cy={py} r={r * 0.25} color={color} opacity={0.7} />;
          })}
        </Group>
      );
  }
}
