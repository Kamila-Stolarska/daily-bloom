// Lab — siatka kwiatków do walidacji. Poza nawigacją (otwierane przez /lab).
// KRYTYCZNE: na web Skia.web.js przy imporcie robi `JsiSkApi(global.CanvasKit)`.
// Jeśli CanvasKit nie jest jeszcze załadowany, Skia staje się broken na stałe.
// Dlatego LabContent ładujemy DYNAMICZNIE — dopiero po LoadSkiaWeb.

import { lazy, Suspense, useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Lab() {
  const LabContent = useMemo(
    () =>
      lazy(async () => {
        if (Platform.OS === 'web') {
          const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
          await LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
        }
        return import('../components/LabContent');
      }),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <Suspense
        fallback={
          <View className="flex-1 items-center justify-center">
            <Text className="font-serif-italic text-base text-ink-muted">
              ładuję kwiatki…
            </Text>
          </View>
        }
      >
        <LabContent />
      </Suspense>
    </SafeAreaView>
  );
}
