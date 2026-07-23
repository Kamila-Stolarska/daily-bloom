// Wersja SoftBloomFlower BEZ własnego Canvas — do renderowania wielu kwiatków
// w jednym współdzielonym Canvas (Ogród, Profil okresu), żeby oszczędzić
// WebGL contexts. Ten sam kanoniczny kształt płatka + ghost-linie skali co
// SoftBloomFlower (src/components/FlowerVariants.tsx) — patrz tam po komentarz
// wyjaśniający logikę LEVELS/petalTransform. Bez animacji rozkwitania.

import React from 'react';
import { Group, Path, Circle, LinearGradient, BlurMask, vec } from '@shopify/react-native-skia';

import { DayData } from '../lib/flower/types';
import {
  SVG_SIZE,
  SVG_CX,
  SVG_CY,
  CENTER_COLOR,
  CENTER_R,
  CENTER_BLUR,
  GRADIENT_COLORS,
  CANON_WHITE_PATH,
  CANON_COLOR_PATH,
  CANON_GRADIENT_VEC,
  PETAL_COUNT,
  petalAngleRad,
  LEVELS,
  fillScaleForValue,
  GHOST_STROKE_W,
  GHOST_OPACITY,
  GHOST_LINE_COLOR,
  petalTransform,
} from './flowerShape';

type Props = {
  day: DayData;
  size: number;
  ox?: number;
  oy?: number;
};

export const SoftBloomFlowerContent = React.memo(function SoftBloomFlowerContent({
  day,
  size,
  ox = 0,
  oy = 0,
}: Props) {
  const scale = (size / SVG_SIZE) * 0.98;
  const tx = ox + size / 2 - scale * SVG_CX;
  const ty = oy + size / 2 - scale * SVG_CY;

  const values: readonly number[] = [
    day.day,
    day.emotions,
    day.energy,
    day.body,
    day.delight,
    day.meaning,
  ];

  return (
    <Group transform={[{ translateX: tx }, { translateY: ty }, { scale }]}>
      <Circle cx={SVG_CX} cy={SVG_CY} r={CENTER_R} color={CENTER_COLOR}>
        <BlurMask blur={CENTER_BLUR} style="normal" />
      </Circle>

      {Array.from({ length: PETAL_COUNT }, (_, i) => (
        <Group key={`white-${i}`} transform={petalTransform(petalAngleRad(i), 1, SVG_CX, SVG_CY)}>
          <Path path={CANON_WHITE_PATH} color="#FFFFFF">
            <BlurMask blur={1} style="normal" />
          </Path>
        </Group>
      ))}

      {Array.from({ length: PETAL_COUNT }, (_, i) =>
        LEVELS.map((k, level) => (
          <Group key={`ghost-${i}-${level}`} transform={petalTransform(petalAngleRad(i), k, SVG_CX, SVG_CY)}>
            <Path
              path={CANON_COLOR_PATH}
              style="stroke"
              strokeWidth={GHOST_STROKE_W}
              opacity={GHOST_OPACITY}
              color={GHOST_LINE_COLOR}
            />
          </Group>
        )),
      )}

      {Array.from({ length: PETAL_COUNT }, (_, i) => {
        const k = fillScaleForValue(values[i]);
        return (
          <Group key={`fill-${i}`} transform={petalTransform(petalAngleRad(i), k, SVG_CX, SVG_CY)}>
            <Path path={CANON_COLOR_PATH}>
              <LinearGradient
                start={vec(CANON_GRADIENT_VEC.x1, CANON_GRADIENT_VEC.y1)}
                end={vec(CANON_GRADIENT_VEC.x2, CANON_GRADIENT_VEC.y2)}
                colors={[GRADIENT_COLORS[0], GRADIENT_COLORS[1]]}
              />
              <BlurMask blur={2} style="normal" />
            </Path>
          </Group>
        );
      })}
    </Group>
  );
});
