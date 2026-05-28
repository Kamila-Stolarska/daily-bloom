// Home — używa Button/Text z react-native-reusables-style ui/.

import { useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { entryToDayData, notesLength, todayIso, useStore } from '../lib/store';
import { deriveDna } from '../lib/flower/dna';
import { currentWeekIso, WEEKDAYS_PL } from '../lib/week';
import { FlowerLazy } from '../components/FlowerLazy';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 5) return `Cześć, ${name}`;
  if (h < 12) return `Dzień dobry, ${name}`;
  if (h < 18) return `Cześć, ${name}`;
  return `Dobry wieczór, ${name}`;
}

function subline(hasEntry: boolean, noteCount: number): string {
  if (hasEntry) {
    if (noteCount > 0) return `Dzień zapisany. ${noteCount === 1 ? '1 notatka' : `${noteCount} notatki`} dziś.`;
    return 'Dzień zapisany. Możesz coś dopisać.';
  }
  if (noteCount > 0) return `${noteCount === 1 ? '1 notatka' : `${noteCount} notatki`} dziś. Kwiatek czeka.`;
  return 'Jak Ci dziś było?';
}

function Wave({ width = 88, color = '#A89C8C' }: { width?: number; color?: string }) {
  return (
    <Svg width={width} height={14} viewBox="0 0 88 14">
      <Path
        d="M2 7 Q 12 1, 22 7 T 44 7 T 66 7 T 86 7"
        stroke={color}
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
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
  const todayEntry = entries[today];
  const todayNotes = notesByDate[today] ?? [];
  const dna = useMemo(() => deriveDna(userId || 'anon'), [userId]);
  const dnaSeed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
    return Math.abs(h) || 1234567;
  }, [userId]);

  const week = useMemo(() => currentWeekIso(), []);

  if (!hydrated || !name) {
    return <SafeAreaView className="flex-1 bg-paper" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-1 px-7 pt-4 pb-3">
        {/* Top label */}
        <View className="flex-row items-center justify-between">
          <Text variant="eyebrow">DAILY — BLOOM</Text>
          <View className="w-5 h-5 rounded-full bg-ink items-center justify-center">
            <View className="w-1.5 h-1.5 rounded-full bg-paper" />
          </View>
        </View>

        {/* Hero — mniejszy headline */}
        <View className="mt-6">
          <Text
            variant="display"
            style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.2 }}
          >
            {greeting(name)}
          </Text>
          <Text variant="body" tone="muted" className="mt-3">
            {subline(!!todayEntry, todayNotes.length)}
          </Text>
        </View>

        {/* Kwiatek (centrum, elastyczne) */}
        <View className="flex-1 items-center justify-center">
          {todayEntry ? (
            <FlowerLazy
              dna={dna}
              day={entryToDayData(todayEntry, notesLength(todayNotes))}
              size={240}
              dnaSeed={dnaSeed}
            />
          ) : (
            <View style={{ width: 240, height: 240 }} className="items-center justify-center">
              <View className="w-24 h-24 rounded-full border border-ink-muted/25 items-center justify-center">
                <Text variant="caption" tone="muted" className="text-center">
                  jeszcze{'\n'}nie zakwitł
                </Text>
              </View>
            </View>
          )}
          <View className="mt-1">
            <Wave />
          </View>
        </View>

        {/* Dwa CTA obok siebie */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              variant="pill"
              label={todayEntry ? 'edytuj dzień' : 'zapisz dzień'}
              onPress={() => router.push('/entry')}
            />
          </View>
          <Pressable
            onPress={() => router.push('/note')}
            className="w-14 h-14 rounded-full border border-ink items-center justify-center"
            accessibilityLabel="dopisz notatkę"
          >
            <Text variant="h3" tone="ink" style={{ fontSize: 24, lineHeight: 24 }}>
              +
            </Text>
          </Pressable>
        </View>

        {/* Tydzień — kompakt */}
        <View className="mt-5">
          <View className="flex-row justify-between">
            {week.map((iso, i) => {
              const has = !!entries[iso];
              const hasNote = !!notesByDate[iso]?.length;
              const isToday = iso === today;
              return (
                <View key={iso} className="items-center flex-1">
                  <Text
                    variant="mono"
                    tone={isToday ? 'ink' : 'muted'}
                    className="mb-1.5"
                  >
                    {WEEKDAYS_PL[i].toUpperCase()}
                  </Text>
                  <View
                    className={
                      'w-7 h-7 rounded-full items-center justify-center ' +
                      (isToday ? 'border border-ink' : '')
                    }
                  >
                    {has ? (
                      <View className="w-3.5 h-3.5 rounded-full bg-ink" />
                    ) : hasNote ? (
                      <View className="w-1.5 h-1.5 rounded-full bg-ink-muted/60" />
                    ) : (
                      <View className="w-1 h-1 rounded-full bg-ink-muted/40" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
