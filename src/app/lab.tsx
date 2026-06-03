// Lab — siatka kwiatków do walidacji. Poza nawigacją (otwierane przez /lab).
// KRYTYCZNE: na web Skia.web.js przy imporcie robi `JsiSkApi(global.CanvasKit)`.
// Jeśli CanvasKit nie jest jeszcze załadowany, Skia staje się broken na stałe.
// Dlatego LabContent ładujemy DYNAMICZNIE — dopiero po LoadSkiaWeb.

import { lazy, Suspense, useMemo, useState } from 'react';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/text';
import { useStore } from '../lib/store';
import { seedTestWeek, clearTestWeek, clearChatHistory } from '../lib/dev/seed';

function DevTools() {
  const hydrate = useStore((s) => s.hydrate);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<string>) => {
    if (busy) return;
    setBusy(true);
    setStatus('…');
    try {
      const msg = await fn();
      setStatus(msg);
      await hydrate();
    } catch (e) {
      setStatus(`błąd: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const btn = {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1614',
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
      <Text variant="eyebrow" style={{ marginBottom: 10 }}>DEV — DANE TESTOWE</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pressable
          onPress={() =>
            run(async () => {
              const { entries, notes } = await seedTestWeek();
              return `wgrane: ${entries} wpisów + ${notes} notatek`;
            })
          }
          style={[btn, { backgroundColor: '#1A1614' }]}
        >
          <Text tone="paper" variant="bodyMedium" style={{ fontSize: 13 }}>
            wgraj 7 dni testowych
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            run(async () => {
              const { entries, notes } = await clearTestWeek();
              return `usunięte: ${entries} wpisów + ${notes} notatek`;
            })
          }
          style={[btn, { backgroundColor: 'transparent' }]}
        >
          <Text tone="ink" variant="bodyMedium" style={{ fontSize: 13 }}>
            wyczyść 7 dni
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            run(async () => {
              const n = await clearChatHistory();
              return `usunięte: ${n} wiadomości`;
            })
          }
          style={[btn, { backgroundColor: 'transparent' }]}
        >
          <Text tone="ink" variant="bodyMedium" style={{ fontSize: 13 }}>
            wyczyść czat
          </Text>
        </Pressable>
      </View>
      {!!status && (
        <Text variant="caption" tone="muted" style={{ marginTop: 10 }}>
          {status}
        </Text>
      )}
    </View>
  );
}

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
      <DevTools />
      <Suspense
        fallback={
          <View className="flex-1 items-center justify-center">
            <RNText className="font-serif-italic text-base text-ink-muted">
              ładuję kwiatki…
            </RNText>
          </View>
        }
      >
        <LabContent />
      </Suspense>
    </SafeAreaView>
  );
}
