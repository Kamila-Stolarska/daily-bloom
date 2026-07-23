// SoftBloom — renderer kwiatka wg flower.svg + system osi jako ghost-konturów.
//
// Legenda skali 1-5 jest wpisana W KAŻDY PŁATEK: pod kolorowym wypełnieniem
// lezą 5 delikatnych ghost-konturów (skale 0.2/0.4/0.6/0.8/1.0 wokół centrum),
// każdy w tym samym gradient lime→orange co wypełnienie, ale jako cienki stroke
// z niską opacity. Kolorowy fill jest skalowany do value/5 osi — value=5 pokrywa
// wszystko, niższe wartości zostawiają zewnętrzne ghost-y widoczne.
// Kształty płatków są literalnymi krzywymi Beziera z inspirującego SVG (viewBox 450).

import React from 'react';
import {
  Canvas,
  Group,
  Path,
  Circle,
  LinearGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';

import { Dna } from '../lib/flower/dna';
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

export {
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
};

type Props = {
  dna: Dna;
  day: DayData;
  size: number;
  dnaSeed: number;
  // Kompatybilność z FlowerLazy — na razie ignorowane w SoftBloom.
  grain?: boolean;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  animate?: boolean;
  bloomKey?: string | number;
};

export const SoftBloomFlower = React.memo(function SoftBloomFlower({
  size,
  day,
}: Props) {
  const scale = (size / SVG_SIZE) * 0.98;
  const tx = size / 2 - scale * SVG_CX;
  const ty = size / 2 - scale * SVG_CY;

  // Wartości osi 1..5 w kolejności AXES (day, emotions, energy, body, delight, meaning).
  const values: readonly number[] = [
    day.day,
    day.emotions,
    day.energy,
    day.body,
    day.delight,
    day.meaning,
  ];

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ translateX: tx }, { translateY: ty }, { scale }]}>
        {/* WARSTWA 0 — różowe kółeczko z blurem (filter0 w SVG). */}
        <Circle cx={SVG_CX} cy={SVG_CY} r={CENTER_R} color={CENTER_COLOR}>
          <BlurMask blur={CENTER_BLUR} style="normal" />
        </Circle>

        {/* WARSTWA 1 — białe podłoże kwiatka, ten sam kanoniczny kształt obrócony
            o i*60°. Stały rozmiar (max), niezależny od odpowiedzi — to szkielet
            wizualny kwiatka. Ghost linie i kolorowe wypełnienie leżą na wierzchu. */}
        {Array.from({ length: PETAL_COUNT }, (_, i) => (
          <Group key={`white-${i}`} transform={petalTransform(petalAngleRad(i), 1, SVG_CX, SVG_CY)}>
            <Path path={CANON_WHITE_PATH} color="#FFFFFF">
              <BlurMask blur={1} style="normal" />
            </Path>
          </Group>
        ))}

        {/* WARSTWA 2 — ghost stroke dla każdego płatka × 5 poziomów.
            Jednolity kolor GHOST_LINE_COLOR, opacity ~0.32.
            Kolorowy fill (WARSTWA 2) przykryje wewnętrzne poziomy do value. */}
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

        {/* WARSTWA 3 — kolorowe wypełnienie skalowane do value/5.
            Value=5 → 100% (przykrywa wszystkie ghost 1-5).
            Value=3 → 60% (ghost 4,5 zostają widoczne jako duchy). */}
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
    </Canvas>
  );
});
