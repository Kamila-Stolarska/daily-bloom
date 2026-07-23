// Lazy wrapper czekający na LoadSkiaWeb — jeden Canvas per miesiąc (patrz Impl).

import { lazy, Suspense, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';
import { ensureSkiaWeb } from '../lib/loadSkiaWeb';
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
        await ensureSkiaWeb();
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
