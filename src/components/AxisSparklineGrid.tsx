// Lazy wrapper czekający na LoadSkiaWeb (wzorzec z FlowerLazy).
import { lazy, Suspense, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';
import { ensureSkiaWeb } from '../lib/loadSkiaWeb';

type Point = { date: string; value: number };
type Cell = { label: string; series: Point[] };

type Props = {
  cells: Cell[];
  width: number;
  cols?: number;
  cellHeight?: number;
};

export function AxisSparklineGrid(props: Props) {
  const Impl = useMemo(
    () =>
      lazy(async () => {
        await ensureSkiaWeb();
        const mod = await import('./AxisSparklineGridImpl');
        return { default: mod.AxisSparklineGridImpl };
      }),
    [],
  );
  const rows = Math.ceil(props.cells.length / (props.cols ?? 2));
  const fallbackH = rows * ((props.cellHeight ?? 60) + 16) + (rows - 1) * 12 + 16;
  return (
    <Suspense
      fallback={
        <View style={{ width: props.width, height: fallbackH, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="caption" tone="muted">wykresy się ładują…</Text>
        </View>
      }
    >
      <Impl {...props} />
    </Suspense>
  );
}
