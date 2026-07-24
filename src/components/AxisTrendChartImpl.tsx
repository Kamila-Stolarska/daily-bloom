// Realny render wykresu trendu. Wydzielony, żeby był lazy-loaded PO LoadSkiaWeb
// (patrz FlowerLazy/AxisSparklineImpl dla tego samego wzorca).
// Paleta i gradient pod linią jak w AxisTrendCardsImpl (spójność kart trendu).

import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Path, Skia, Circle, LinearGradient, vec } from '@shopify/react-native-skia';

type ChartPoint = { x: number; y: number };
type MarkerPoint = ChartPoint & { good: boolean; hard: boolean };

type Props = {
  chartW: number;
  chartH: number;
  segments: ChartPoint[][];
  averagePath: ChartPoint[] | null;
  markers: MarkerPoint[];
};

const CORAL = '#FDA674'; // ten sam kolor co w AxisTrendCardsImpl
const AVERAGE_STROKE = '#B7AD9E';
const GOOD_COLOR = '#9461FC'; // "coś dobrego" (patrz legenda w AxisTrendChart)
const HARD_COLOR = '#ED7BA1'; // "coś trudnego" (patrz legenda w AxisTrendChart)

function pathFrom(points: ChartPoint[]): ReturnType<typeof Skia.Path.Make> | null {
  if (points.length < 2) return null;
  const p = Skia.Path.Make();
  p.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) p.lineTo(points[i].x, points[i].y);
  return p;
}

function areaFrom(points: ChartPoint[], chartH: number): ReturnType<typeof Skia.Path.Make> | null {
  if (points.length < 2) return null;
  const p = Skia.Path.Make();
  p.moveTo(points[0].x, chartH);
  p.lineTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) p.lineTo(points[i].x, points[i].y);
  p.lineTo(points[points.length - 1].x, chartH);
  p.close();
  return p;
}

export function AxisTrendChartImpl({ chartW, chartH, segments, averagePath, markers }: Props) {
  const segmentPaths = useMemo(() => segments.map((s) => pathFrom(s)).filter(Boolean), [segments]);
  const areaPaths = useMemo(() => segments.map((s) => areaFrom(s, chartH)).filter(Boolean), [segments, chartH]);
  const avgPath = useMemo(() => (averagePath ? pathFrom(averagePath) : null), [averagePath]);

  return (
    <View style={{ width: chartW, height: chartH }}>
      <Canvas style={{ width: chartW, height: chartH }}>
        {areaPaths.map((path, i) => (
          <Path key={`area-${i}`} path={path!} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, chartH)}
              colors={['rgba(253,166,116,0.32)', 'rgba(253,166,116,0)']}
            />
          </Path>
        ))}
        {avgPath && <Path path={avgPath} style="stroke" strokeWidth={2} color={AVERAGE_STROKE} />}
        {segmentPaths.map((path, i) => (
          <Path
            key={i}
            path={path!}
            style="stroke"
            strokeWidth={1.75}
            color={CORAL}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}
        {markers.map((m, i) => (
          <Circle
            key={i}
            cx={m.x}
            cy={m.y}
            r={m.good || m.hard ? 3.5 : 2.5}
            color={m.hard ? HARD_COLOR : m.good ? GOOD_COLOR : CORAL}
          />
        ))}
      </Canvas>
    </View>
  );
}

export default AxisTrendChartImpl;
