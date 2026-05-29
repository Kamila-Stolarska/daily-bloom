// Wrapper na OrganicFlower z lazy-load Skia na web.
// Skia.web.js przy imporcie robi JsiSkApi(global.CanvasKit). Jeśli CanvasKit jeszcze nie
// załadowany — Skia jest broken na stałe. Dlatego import OrganicFlower DOPIERO po LoadSkiaWeb.

import { lazy, Suspense, useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import { Dna } from '../lib/flower/dna';
import { DayData } from '../lib/flower/types';

type Props = {
  dna: Dna;
  day: DayData;
  size: number;
  dnaSeed: number;
  grain?: boolean;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
};

export function FlowerLazy(props: Props) {
  const Flower = useMemo(
    () =>
      lazy(async () => {
        if (Platform.OS === 'web') {
          const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
          await LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
        }
        const mod = await import('./OrganicFlower');
        return { default: mod.OrganicFlower };
      }),
    [],
  );

  return (
    <Suspense
      fallback={
        <View style={{ width: props.size, height: props.size }} className="items-center justify-center">
          <Text className="font-serif-italic text-base text-ink-muted">kwitnie…</Text>
        </View>
      }
    >
      <Flower {...props} />
    </Suspense>
  );
}
