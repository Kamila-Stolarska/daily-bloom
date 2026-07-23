// Singleton CanvasKit loader dla web. LoadSkiaWeb() nie jest bezpieczne wołane
// współbieżnie — kilka niezależnych lazy-wrapperów (FlowerLazy, AxisRibbon,
// AxisTrendCards, AxisSparkline...) montujących się na tym samym ekranie
// naraz i każdy wołający LoadSkiaWeb() na własną rękę potrafiło rozjechać
// inicjalizację CanvasKit — objawiało się losowymi błędami w runtime
// ("Cannot read properties of undefined (reading 'PathBuilder'/'PictureRecorder')"),
// przez co część kwiatków/wykresów Skia po prostu nie renderowała się na
// ekranie /garden. Każdy lazy-wrapper powinien czekać na TĘ SAMĄ obietnicę
// zamiast importować i wołać LoadSkiaWeb() niezależnie.

import { Platform } from 'react-native';

let skiaWebPromise: Promise<void> | null = null;

export function ensureSkiaWeb(): Promise<void> {
  if (Platform.OS !== 'web') return Promise.resolve();
  if (!skiaWebPromise) {
    skiaWebPromise = (async () => {
      const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
      await LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
    })();
  }
  return skiaWebPromise;
}
