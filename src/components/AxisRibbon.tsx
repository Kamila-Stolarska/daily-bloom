// Lazy wrapper czekający na LoadSkiaWeb (wzorzec z FlowerLazy).
// Renderuje "portret okresu": 6 osi × 5 pozycji, kropki proporcjonalne do
// częstotliwości wyboru, kwiatek DNA użytkowniczki na wartości modalnej,
// falowa wstęga łącząca mode'y osi. Canvas na osie/kropki/wstęgę, kwiatki
// jako nakładka FlowerLazy (żeby użyć naszego renderu DNA).

import { lazy, Suspense, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Text } from './ui/text';
import type { Scale, DayData } from '../lib/flower/types';
import type { Dna } from '../lib/flower/dna';

export type RibbonRow = {
  label: string;
  counts: [number, number, number, number, number]; // count dla wartości 1..5
  mode: Scale;                                      // 1..5, gdzie rysujemy kwiatek
  day: DayData;                                     // DayData użyta do wyrenderowania kwiatka
};

type Props = {
  rows: RibbonRow[]; // dokładnie 6 (kolejność AXES)
  width: number;
  rowHeight?: number; // domyślnie 64
  dna: Dna;
  dnaSeed: number;
  /** Klucz wymuszający ponowne rozkwitnięcie kwiatków (np. wybrane okno czasowe). */
  bloomKey?: string | number;
};

export function AxisRibbon(props: Props) {
  const Impl = useMemo(
    () =>
      lazy(async () => {
        if (Platform.OS === 'web') {
          const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
          await LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
        }
        const mod = await import('./AxisRibbonImpl');
        return { default: mod.AxisRibbonImpl };
      }),
    [],
  );
  const rowH = props.rowHeight ?? 76;
  const fallbackH = props.rows.length * rowH;
  return (
    <Suspense
      fallback={
        <View style={{ width: props.width, height: fallbackH, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="caption" tone="muted">wstążka się rysuje…</Text>
        </View>
      }
    >
      <Impl {...props} />
    </Suspense>
  );
}
