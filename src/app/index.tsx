// Home — używa Button/Text z react-native-reusables-style ui/.

import { useEffect, useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { entryToDayData, notesLength, todayIso, useStore } from '../lib/store';
import { deriveDna } from '../lib/flower/dna';
import { currentWeekIso, WEEKDAYS_PL } from '../lib/week';
import { FlowerLazy } from '../components/FlowerLazy';
import { Text } from '../components/ui/text';

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 5) return `Cześć, ${name}`;
  if (h < 12) return `Dzień dobry, ${name}`;
  if (h < 18) return `Cześć, ${name}`;
  return `Dobry wieczór, ${name}`;
}

function subline(isToday: boolean, hasEntry: boolean, noteCount: number): string {
  const noun = noteCount === 1 ? '1 notatka' : `${noteCount} notatki`;
  const tail = isToday ? 'dziś' : 'tego dnia';
  if (hasEntry) {
    if (noteCount > 0) return `Dzień zapisany. ${noun} ${tail}.`;
    return isToday ? 'Dzień zapisany. Możesz coś dopisać.' : 'Dzień zapisany.';
  }
  if (noteCount > 0) return `${noun} ${tail}. Kwiatek czeka.`;
  return isToday ? 'Jak Ci dziś było?' : 'Brak wpisu tego dnia.';
}

const MONTHS_PL = [
  'Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca',
  'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia',
];
const WEEKDAY_FULL_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${WEEKDAY_FULL_PL[d.getDay()]}, ${d.getDate()} ${MONTHS_PL[d.getMonth()]}`;
}

export default function Home() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const name = useStore((s) => s.name);
  const userId = useStore((s) => s.userId);
  const entries = useStore((s) => s.entries);
  const notesByDate = useStore((s) => s.notesByDate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !name) router.replace('/onboarding');
  }, [hydrated, name]);

  const today = todayIso();
  const [selectedDate, setSelectedDate] = useState(today);

  const selectedEntry = entries[selectedDate];
  const selectedNotes = notesByDate[selectedDate] ?? [];
  const isToday = selectedDate === today;

  const dna = useMemo(() => deriveDna(userId || 'anon'), [userId]);
  const dnaSeed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
    return Math.abs(h) || 1234567;
  }, [userId]);

  const week = useMemo(() => currentWeekIso(), []);

  const { width: winW, height: winH } = useWindowDimensions();
  const [flowerBox, setFlowerBox] = useState({ w: 0, h: 0 });

  // Responsywne skale
  const tight = winH < 720;
  const roomy = winH > 880;
  const headlineSize = tight ? 34 : roomy ? 48 : 42;
  const headlineLh = Math.round(headlineSize * 1.04);
  const horizontalPad = winW < 380 ? 20 : winW > 480 ? 32 : 28;
  const topPad = tight ? 8 : roomy ? 24 : 16;
  const bottomPad = tight ? 8 : 16;
  const heroGap = tight ? 16 : roomy ? 32 : 24;

  // Kwiatek wypełnia ~98% dostępnego środka (cap większy żeby ładnie rósł na tablecie)
  const flowerSize = Math.min(
    Math.max(flowerBox.w * 0.98, 0),
    Math.max(flowerBox.h * 0.98, 0),
    640,
  );

  function openEntry(dateIso: string) {
    router.push({ pathname: '/entry', params: { date: dateIso } });
  }

  function openNote(dateIso: string) {
    router.push({ pathname: '/note', params: { date: dateIso } });
  }

  if (!hydrated || !name) {
    return <SafeAreaView className="flex-1 bg-paper" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View
        className="flex-1"
        style={{ paddingHorizontal: horizontalPad, paddingTop: topPad, paddingBottom: bottomPad }}
      >
        {/* Top label */}
        <View className="flex-row items-center justify-between">
          <Text variant="eyebrow">DAILY — BLOOM</Text>
          <View className="w-5 h-5 rounded-full bg-ink items-center justify-center">
            <View className="w-1.5 h-1.5 rounded-full bg-paper" />
          </View>
        </View>

        {/* Hero — responsywny headline */}
        <View style={{ marginTop: heroGap }}>
          <Text
            variant="display"
            style={{ fontSize: headlineSize, lineHeight: headlineLh, letterSpacing: -1.2 }}
          >
            {greeting(name)}
          </Text>
          <Text variant="body" tone="muted" style={{ marginTop: tight ? 8 : 12 }}>
            {subline(isToday, !!selectedEntry, selectedNotes.length)}
          </Text>
        </View>

        {/* Kwiatek (centrum, klikalny → edycja dnia) */}
        <View
          className="flex-1 items-center justify-center"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width !== flowerBox.w || height !== flowerBox.h) {
              setFlowerBox({ w: width, h: height });
            }
          }}
        >
          {flowerSize > 0 && (
            <Pressable
              onPress={() => openEntry(selectedDate)}
              accessibilityRole="button"
              accessibilityLabel={selectedEntry ? 'edytuj wpis dnia' : 'zapisz dzień'}
              style={{ width: flowerSize, height: flowerSize }}
              className="items-center justify-center"
            >
              {selectedEntry ? (
                <FlowerLazy
                  dna={dna}
                  day={entryToDayData(selectedEntry, notesLength(selectedNotes))}
                  size={flowerSize}
                  dnaSeed={dnaSeed}
                  grain={false}
                />
              ) : (
                <View
                  style={{ width: flowerSize * 0.32, height: flowerSize * 0.32 }}
                  className="rounded-full border border-ink-muted/25 items-center justify-center"
                >
                  <Text variant="caption" tone="muted" className="text-center">
                    {isToday ? 'jeszcze\nnie zakwitł' : 'brak wpisu\ndotknij, by dodać'}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        </View>

        {/* Czarny CTA "dodaj notatkę" — środek, lekko podniesiony */}
        <View className="items-center" style={{ marginBottom: tight ? 16 : 24 }}>
          <Pressable
            onPress={() => openNote(selectedDate)}
            accessibilityRole="button"
            className="bg-ink rounded-full flex-row items-center justify-center"
            style={{ paddingHorizontal: 28, paddingVertical: 16, minWidth: 220 }}
          >
            <Text variant="bodyMedium" tone="paper">
              dodaj notatkę
            </Text>
          </Pressable>
        </View>

        {/* Data wybranego dnia */}
        <Text variant="bodyMedium" tone="ink" style={{ marginBottom: tight ? 8 : 12 }}>
          {formatDayLabel(selectedDate)}
        </Text>

        {/* Tydzień — klikalne dni z numerami */}
        <View className="flex-row justify-between">
          {week.map((iso, i) => {
            const has = !!entries[iso];
            const hasNote = !!notesByDate[iso]?.length;
            const isSelected = iso === selectedDate;
            const isTodayCell = iso === today;
            const dayNum = new Date(iso + 'T00:00:00').getDate();
            return (
              <Pressable
                key={iso}
                onPress={() => setSelectedDate(iso)}
                className="items-center flex-1"
                style={{ paddingVertical: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`${WEEKDAY_FULL_PL[new Date(iso + 'T00:00:00').getDay()]} ${dayNum}`}
              >
                <Text
                  variant="mono"
                  tone={isSelected ? 'ink' : 'muted'}
                  className="mb-2"
                >
                  {WEEKDAYS_PL[i][0].toUpperCase() + WEEKDAYS_PL[i].slice(1)}
                </Text>
                <View
                  className={
                    'w-9 h-9 rounded-full items-center justify-center ' +
                    (isSelected ? 'bg-ink' : '')
                  }
                >
                  <Text
                    variant="bodyMedium"
                    tone={isSelected ? 'paper' : isTodayCell ? 'ink' : 'muted'}
                  >
                    {dayNum}
                  </Text>
                </View>
                {/* mały marker pod kółkiem: wpis / notatka */}
                <View style={{ height: 6, marginTop: 4 }}>
                  {has ? (
                    <View className="w-1.5 h-1.5 rounded-full bg-ink" />
                  ) : hasNote ? (
                    <View className="w-1.5 h-1.5 rounded-full bg-ink-muted/60" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
