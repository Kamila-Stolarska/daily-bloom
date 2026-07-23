// Wrapper lazy-loadujący AxisSparklineImpl PO LoadSkiaWeb (wzorzec z FlowerLazy).
// Import Skia jest statyczny wewnątrz AxisSparklineImpl — musimy opóźnić import
// samego modułu, żeby CanvasKit był gotowy.

import { lazy, Suspense, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';
import { ensureSkiaWeb } from '../lib/loadSkiaWeb';

type Point = { date: string; value: number };

type Props = {
  series: Point[];
  width: number;
  height: number;
  label: string;
};

const AXIS = '#D9CFC1';

export function AxisSparkline({ series, width, height, label }: Props) {
  const chartH = Math.max(height - 24, 30);
  const chartW = Math.max(width - 8, 30);

  const Impl = useMemo(
    () =>
      lazy(async () => {
        await ensureSkiaWeb();
        const mod = await import('./AxisSparklineImpl');
        return { default: mod.AxisSparklineImpl };
      }),
    [],
  );

  return (
    <View style={{ width, height }}>
      <Text variant="mono" style={{ fontSize: 10, color: '#7A6F62', letterSpacing: 0.5, marginBottom: 4 }}>
        {label.toUpperCase()}
      </Text>
      <View style={{ width: chartW, height: chartH, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: chartH - 1, height: 1, backgroundColor: AXIS }} />
        {series.length === 0 ? (
          <Text variant="caption" tone="muted" style={{ marginTop: chartH / 2 - 8, textAlign: 'center' }}>
            brak danych
          </Text>
        ) : (
          <Suspense fallback={null}>
            <Impl series={series} chartW={chartW} chartH={chartH} />
          </Suspense>
        )}
      </View>
    </View>
  );
}
