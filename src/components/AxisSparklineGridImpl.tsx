// Wszystkie 6 sparklinów w JEDNYM Canvas z transformami — oszczędza WebGL contexts.
// Lazy-loaded po LoadSkiaWeb (patrz AxisSparklineGrid.tsx).

import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Path, Skia, Circle, Line, vec } from '@shopify/react-native-skia';
import { Text } from './ui/text';

type Point = { date: string; value: number };
type Cell = { label: string; series: Point[] };

type Props = {
  cells: Cell[];             // dokładnie 6 komórek w kolejności AXES
  width: number;             // szerokość całego canvasa
  cols?: number;             // domyślnie 2 (grid 2×3)
  cellHeight?: number;       // wysokość jednej komórki (bez etykiety)
};

const STROKE = '#3B342C';
const AXIS = '#D9CFC1';
const GAP = 12;
const LABEL_H = 16;

export function AxisSparklineGridImpl({ cells, width, cols = 2, cellHeight = 60 }: Props) {
  const rows = Math.ceil(cells.length / cols);
  const cellW = (width - GAP * (cols - 1)) / cols;
  const chartH = cellHeight;
  const totalH = rows * (chartH + LABEL_H) + (rows - 1) * GAP;

  const paths = useMemo(() => {
    return cells.map((c) => {
      if (c.series.length === 0) return { path: null as ReturnType<typeof Skia.Path.Make> | null, last: null };
      const n = c.series.length;
      const yFor = (v: number) => {
        const t = (Math.max(1, Math.min(5, v)) - 1) / 4;
        return chartH - t * chartH;
      };
      const xFor = (i: number) => (n === 1 ? cellW / 2 : (i / (n - 1)) * cellW);
      const p = Skia.Path.Make();
      p.moveTo(xFor(0), yFor(c.series[0].value));
      for (let i = 1; i < n; i++) p.lineTo(xFor(i), yFor(c.series[i].value));
      return { path: p, last: { x: xFor(n - 1), y: yFor(c.series[n - 1].value) } };
    });
  }, [cells, cellW, chartH]);

  return (
    <View style={{ width, height: totalH + LABEL_H }}>
      {/* Etykiety w tle jako zwykłe RN Textów, ułożone gridem — canvas rysuje tylko linie */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP }}>
        {cells.map((c, i) => (
          <View key={c.label + i} style={{ width: cellW, height: chartH + LABEL_H }}>
            <Text variant="mono" style={{ fontSize: 10, color: '#7A6F62', letterSpacing: 0.5, marginBottom: 4 }}>
              {c.label.toUpperCase()}
            </Text>
            <View style={{ width: cellW, height: chartH, position: 'relative' }}>
              <View
                style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  top: chartH - 1,
                  height: 1,
                  backgroundColor: AXIS,
                }}
              />
            </View>
          </View>
        ))}
      </View>
      {/* Jeden Canvas overlay z 6 grupami */}
      <View style={{ position: 'absolute', left: 0, top: 0, width, height: totalH + LABEL_H, pointerEvents: 'none' }}>
        <Canvas style={{ width, height: totalH + LABEL_H }}>
          {cells.map((_c, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const tx = col * (cellW + GAP);
            const ty = row * (chartH + LABEL_H + GAP) + LABEL_H;
            const p = paths[i];
            return (
              <Group key={i} transform={[{ translateX: tx }, { translateY: ty }]}>
                {p.path && <Path path={p.path} style="stroke" strokeWidth={1.5} color={STROKE} />}
                {p.last && <Circle cx={p.last.x} cy={p.last.y} r={2.5} color={STROKE} />}
              </Group>
            );
          })}
        </Canvas>
      </View>
    </View>
  );
}

export default AxisSparklineGridImpl;
