// Lazy wrapper czekający na LoadSkiaWeb (wzorzec z FlowerLazy/AxisSparklineGrid).
// Karty trendu per oś — pełna szerokość, jedna pod drugą (nie grid).

import { lazy, Suspense, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';
import { ensureSkiaWeb } from '../lib/loadSkiaWeb';
import type { Axis } from '../lib/flower/types';

type Point = { date: string; value: number };
type Cell = { label: string; axis: Axis; series: Point[] };

type Props = {
  cells: Cell[]; // dokładnie 6, w kolejności AXES
  width: number;
  periodLabel: string; // np. "30 dni" — pokazywane w rogu każdej karty
};

export function AxisTrendCards(props: Props) {
  const Impl = useMemo(
    () =>
      lazy(async () => {
        await ensureSkiaWeb();
        const mod = await import('./AxisTrendCardsImpl');
        return { default: mod.AxisTrendCardsImpl };
      }),
    [],
  );
  const fallbackH = props.cells.length * 240 + (props.cells.length - 1) * 14;
  return (
    <Suspense
      fallback={
        <View style={{ width: props.width, height: fallbackH, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="caption" tone="muted">karty się ładują…</Text>
        </View>
      }
    >
      <Impl {...props} />
    </Suspense>
  );
}
