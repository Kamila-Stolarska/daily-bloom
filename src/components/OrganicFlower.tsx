// Organiczny, akwarelowy kwiatek.
// - gradient per płatek
// - lekki blur na krawędziach (BlurMask)
// - grain (Turbulence) tylko WEWNĄTRZ płatków, z blend multiply
// - asymetria kątów i szerokości

import React, { useMemo } from 'react';
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
import { DayData, AXES } from '../lib/flower/types';

type Props = {
  dna: Dna;
  day: DayData;
  size: number;
  dnaSeed: number;
};

const scaleToUnit = (v: number) => (v - 1) / 4;

type PetalRender = {
  path: string;
  length: number;
  width: number;
  angleRad: number;
  tipHex: string;
  baseHex: string;
};

export const OrganicFlower = React.memo(function OrganicFlower({
  dna, day, size, dnaSeed,
}: Props) {
  const palette = PALETTES[dna.paletteIndex % PALETTES.length];
  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.42;

  const globalSize = 0.55 + scaleToUnit(day.day) * 0.45;

  const lenE = (0.4 + scaleToUnit(day.energy) * 0.6) * globalSize * baseR;
  const lenB = (0.4 + scaleToUnit(day.body) * 0.6) * globalSize * baseR;
  const lenD = (0.4 + scaleToUnit(day.delight) * 0.6) * globalSize * baseR;
  const lenM = (0.4 + scaleToUnit(day.meaning) * 0.6) * globalSize * baseR;
  const lenAvg = (lenE + lenB + lenD + lenM) / 4;
  const lengths = [lenAvg, lenAvg, lenE, lenB, lenD, lenM];

  const satFactor = 0.55 + scaleToUnit(day.emotions) * 0.45;
  const petalBaseWidth = baseR * 0.28 * globalSize;

  // Pre-compute wszystkich płatków raz — używane dwukrotnie (color + grain).
  const petals: PetalRender[] = useMemo(
    () => AXES.map((_axis, i) => {
      const jitter = petalJitter(dnaSeed, i);
      const length = lengths[i] * jitter.lengthScale;
      const width = petalBaseWidth * jitter.widthScale;
      const angleDeg = i * 60 + dna.rotationOffset + jitter.angleOffset;
      const angleRad = (angleDeg * Math.PI) / 180;
      const path = organicPetalPath(length, width, jitter.pathSeed);
      const tipHex = withSaturation(palette.petals[i], satFactor);
      const baseHex = withSaturation(palette.petals[(i + 3) % 6], satFactor * 0.85);
      return { path, length, width, angleRad, tipHex, baseHex };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dnaSeed, palette, satFactor, globalSize, day.energy, day.body, day.delight, day.meaning, dna.rotationOffset, petalBaseWidth],
  );

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Warstwa kolorów — gradient + lekki blur dla "krwawiących" krawędzi. */}
      {petals.map((p, i) => (
        <Group
          key={`color-${i}`}
          transform={[
            { translateX: cx },
            { translateY: cy },
            { rotate: p.angleRad },
          ]}
        >
          <Path path={p.path} opacity={0.78}>
            <BlurMask blur={2.2} style="normal" />
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -p.length)}
              colors={[p.baseHex, p.tipHex]}
            />
          </Path>
        </Group>
      ))}

      {/* Warstwa grain — Turbulence wewnątrz tych samych ścieżek, multiply blend.
          Grain widoczny tylko na obszarze kwiatka, nie w tle. */}
      <Group blendMode="multiply" opacity={0.32}>
        {petals.map((p, i) => (
          <Group
            key={`grain-${i}`}
            transform={[
              { translateX: cx },
              { translateY: cy },
              { rotate: p.angleRad },
            ]}
          >
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
    </Canvas>
  );
});
