// Home — używa Button/Text z react-native-reusables-style ui/.

import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { entryToDayData, todayIso, useStore } from '../lib/store';
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

function subline(hasEntry: boolean): string {
  if (hasEntry) return 'Dzień zapisany. Możesz wrócić, jeśli chcesz coś dopisać.';
  return 'Jak Ci dziś było? Zapisz dzień, żeby zakwitł kwiatek.';
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

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !name) router.replace('/onboarding');
  }, [hydrated, name]);

  const today = todayIso();
  const todayEntry = entries[today];
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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top label */}
        <View className="px-7 pt-6 flex-row items-center justify-between">
          <Text variant="eyebrow">DAILY — BLOOM</Text>
          <View className="w-5 h-5 rounded-full bg-ink items-center justify-center">
            <View className="w-1.5 h-1.5 rounded-full bg-paper" />
          </View>
        </View>

        {/* Hero */}
        <View className="px-7 mt-16">
          <Text variant="display">{greeting(name)}</Text>
          <Text variant="body" tone="muted" className="mt-5">
            {subline(!!todayEntry)}
          </Text>
        </View>

        {/* Separator */}
        <View className="px-7 mt-10">
          <View className="h-px bg-ink-muted/25" />
        </View>

        {/* Kwiatek */}
        <View className="items-center mt-10">
          {todayEntry ? (
            <FlowerLazy
              dna={dna}
              day={entryToDayData(todayEntry)}
              size={300}
              dnaSeed={dnaSeed}
            />
          ) : (
            <View style={{ width: 300, height: 300 }} className="items-center justify-center">
              <View className="w-28 h-28 rounded-full border border-ink-muted/25 items-center justify-center">
                <Text variant="caption" tone="muted" className="text-center">
                  jeszcze{'\n'}nie zakwitł
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Falka */}
        <View className="items-center mt-2">
          <Wave />
        </View>

        {/* CTA */}
        <View className="px-7 mt-8">
          <Button
            variant="pill"
            label={todayEntry ? 'edytuj dzień' : 'zapisz dzisiejszy dzień'}
            onPress={() => router.push('/entry')}
          />
        </View>

        {/* Tydzień */}
        <View className="px-7 mt-14">
          <View className="flex-row items-center justify-between mb-4">
            <Text variant="eyebrow">TEN TYDZIEŃ</Text>
            <View className="flex-1 h-px bg-ink-muted/20 ml-4" />
          </View>
          <View className="flex-row justify-between">
            {week.map((iso, i) => {
              const has = !!entries[iso];
              const isToday = iso === today;
              return (
                <View key={iso} className="items-center flex-1">
                  <Text
                    variant="mono"
                    tone={isToday ? 'ink' : 'muted'}
                    className="mb-2"
                  >
                    {WEEKDAYS_PL[i].toUpperCase()}
                  </Text>
                  <View
                    className={
                      'w-9 h-9 rounded-full items-center justify-center ' +
                      (isToday ? 'border border-ink' : '')
                    }
                  >
                    {has ? (
                      <View className="w-5 h-5 rounded-full bg-ink" />
                    ) : (
                      <View className="w-1 h-1 rounded-full bg-ink-muted/40" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
