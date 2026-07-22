// Lazy wrapper czekający na LoadSkiaWeb — jeden Canvas per miesiąc (patrz Impl).

import { lazy, Suspense, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Text } from './ui/text';
import type { Entry, Note } from '../lib/store';
import type { Dna } from '../lib/flower/dna';

type Props = {
  entries: Entry[];
  notesByDate: Record<string, Note[]>;
  dna: Dna;
  dnaSeed: number;
  onSelectDate: (dateIso: string) => void;
  width: number;
};

export function FlowerGarden(props: Props) {
  const Impl = useMemo(
    () =>
      lazy(async () => {
        if (Platform.OS === 'web') {
          const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
          await LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
        }
        const mod = await import('./FlowerGardenImpl');
        return { default: mod.FlowerGardenImpl };
      }),
    [],
  );
  return (
    <Suspense
      fallback={
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <Text variant="caption" tone="muted">ogród rozkwita…</Text>
        </View>
      }
    >
      <Impl {...props} />
    </Suspense>
  );
}
