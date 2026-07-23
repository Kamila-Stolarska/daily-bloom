// Wersja OrganicFlower BEZ własnego Canvas — do renderowania wielu kwiatków
// w jednym Canvas (Ogród), żeby oszczędzić WebGL contexts. Bez animacji.

import React, { useMemo } from 'react';
import { Group, Path, LinearGradient, vec } from '@shopify/react-native-skia';

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
  ox?: number;
  oy?: number;
};

const scaleToUnit = (v: number) => (v - 1) / 4;

export const OrganicFlowerContent = React.memo(function OrganicFlowerContent({
  dna, day, size, dnaSeed, ox = 0, oy = 0,
}: Props) {
  const palette = PALETTES[dna.paletteIndex % PALETTES.length];
  const cx = size / 2;
  const cy = size / 2;
  const legendR = size * 0.48;
  const petalBaseWidth = size * 0.42 * 0.26;
  const satFactor = 0.55 + scaleToUnit(day.emotions) * 0.45;

  const petals = useMemo(() => {
    const lens = [day.day, day.emotions, day.energy, day.body, day.delight, day.meaning].map(
      (v) => legendR * (v / 5),
    );
    return AXES.map((_axis, i) => {
      const jitter = petalJitter(dnaSeed, i);
      const length = lens[i];
      const width = petalBaseWidth * jitter.widthScale;
      const angleDeg = i * 60 + dna.rotationOffset + jitter.angleOffset;
      const angleRad = (angleDeg * Math.PI) / 180;
      const path = organicPetalPath(length, width, jitter.pathSeed);
      const tipHex = withSaturation(palette.petals[i], satFactor);
      const baseHex = withSaturation(palette.petals[(i + 3) % 6], satFactor * 0.85);
      return { path, length, angleRad, tipHex, baseHex };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dnaSeed, palette, satFactor, legendR, petalBaseWidth, dna.rotationOffset,
      day.day, day.emotions, day.energy, day.body, day.delight, day.meaning]);

  return (
    <Group transform={[{ translateX: ox }, { translateY: oy }]}>
      {petals.map((p, i) => (
        <Group
          key={i}
          transform={[{ translateX: cx }, { translateY: cy }, { rotate: p.angleRad }]}
        >
          <Path path={p.path} opacity={0.85}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -p.length)}
              colors={[p.baseHex, p.tipHex]}
            />
          </Path>
        </Group>
      ))}
    </Group>
  );
});
