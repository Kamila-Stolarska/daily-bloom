// Realny render sparkline'a. Wydzielony, żeby był lazy-loaded PO LoadSkiaWeb —
// import Skia na topie tego pliku triggeruje inicjalizację, która wymaga
// gotowego CanvasKit (patrz FlowerLazy dla tego samego wzorca).

import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Path, Skia, Circle } from '@shopify/react-native-skia';

type Point = { date: string; value: number };

type Props = {
  series: Point[];
  chartW: number;
  chartH: number;
};

const STROKE = '#3B342C';

export function AxisSparklineImpl({ series, chartW, chartH }: Props) {
  const { path, last } = useMemo(() => {
    if (series.length === 0) return { path: null as ReturnType<typeof Skia.Path.Make> | null, last: null };
    const n = series.length;
    const yFor = (v: number) => {
      const t = (Math.max(1, Math.min(5, v)) - 1) / 4;
      return chartH - t * chartH;
    };
    const xFor = (i: number) => (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
    const p = Skia.Path.Make();
    p.moveTo(xFor(0), yFor(series[0].value));
    for (let i = 1; i < n; i++) p.lineTo(xFor(i), yFor(series[i].value));
    return { path: p, last: { x: xFor(n - 1), y: yFor(series[n - 1].value) } };
  }, [series, chartW, chartH]);

  return (
    <View style={{ width: chartW, height: chartH }}>
      <Canvas style={{ width: chartW, height: chartH }}>
        {path && <Path path={path} style="stroke" strokeWidth={1.5} color={STROKE} />}
        {last && <Circle cx={last.x} cy={last.y} r={2.5} color={STROKE} />}
      </Canvas>
    </View>
  );
}

export default AxisSparklineImpl;
