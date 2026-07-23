// Wrapper na SoftBloomFlower z lazy-load Skia na web.
// Skia.web.js przy imporcie robi JsiSkApi(global.CanvasKit). Jeśli CanvasKit jeszcze nie
// załadowany — Skia jest broken na stałe. Dlatego import DOPIERO po LoadSkiaWeb.
// Uwaga: FlowerLazy tunel do wszystkich ekranów renderujących kwiatek użytkownika
// (home/ogród/powitanie/wpis/chat). Podmiana tutaj = zmiana designu w całej appce.

import { lazy, Suspense, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Dna } from '../lib/flower/dna';
import { DayData } from '../lib/flower/types';
import { ensureSkiaWeb } from '../lib/loadSkiaWeb';

type Props = {
  dna: Dna;
  day: DayData;
  size: number;
  dnaSeed: number;
  grain?: boolean;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  animate?: boolean;
  bloomKey?: string | number;
};

export function FlowerLazy(props: Props) {
  const Flower = useMemo(
    () =>
      lazy(async () => {
        await ensureSkiaWeb();
        const mod = await import('./FlowerVariants');
        return { default: mod.SoftBloomFlower };
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
