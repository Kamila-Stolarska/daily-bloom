// Home — używa Button/Text z react-native-reusables-style ui/.

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { entryToDayData, notesLength, todayIso, useStore } from '../lib/store';
import type { Axis, DayData, Scale } from '../lib/flower/types';
import { AxisEditSheet } from '../components/AxisEditSheet';

// Outline-placeholder: maksymalne wartości żeby kwiatek wypełnił pełną przestrzeń.
const NEUTRAL_DAY: DayData = {
  day: 5, emotions: 5, energy: 5, body: 5, delight: 5, meaning: 5,
  somethingGood: false, somethingHard: false,
};
import { deriveDna } from '../lib/flower/dna';
import { currentWeekIso, WEEKDAYS_PL } from '../lib/week';
import { FlowerLazy } from '../components/FlowerLazy';
import { FlowerChrome } from '../components/FlowerChrome';
import { NoteCard } from '../components/NoteCard';
import { Text } from '../components/ui/text';
import { ChatBar } from '../components/chat/ChatBar';

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

  const saveEntry = useStore((s) => s.saveEntry);

  const today = todayIso();
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingAxis, setEditingAxis] = useState<Axis | null>(null);

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
  // Dodatkowy zapas pod pływający ChatBar (≈68px wysokości baru + safe area).
  const bottomPad = (tight ? 8 : 16) + 84;
  const heroGap = tight ? 16 : roomy ? 32 : 24;

  // Kwiatek + miejsce na etykiety legendy (~40px po każdej stronie).
  const CHROME_PAD = 40;
  const flowerSize = Math.min(
    Math.max(flowerBox.w - CHROME_PAD * 2, 0),
    Math.max(flowerBox.h - CHROME_PAD * 2, 0),
    560,
  );

  function openEntry(dateIso: string) {
    router.push({ pathname: '/entry', params: { date: dateIso } });
  }

  function openNote(dateIso: string, noteId?: string) {
    router.push({
      pathname: '/note',
      params: noteId ? { date: dateIso, noteId } : { date: dateIso },
    });
  }

  if (!hydrated || !name) {
    return <SafeAreaView className="flex-1 bg-paper" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: horizontalPad,
          paddingTop: topPad,
          paddingBottom: bottomPad,
        }}
        showsVerticalScrollIndicator={false}
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

        {/* Kwiatek (centrum, klikalny → edycja dnia).
            Stała wysokość — by przycisk i kalendarz były zawsze w tym samym miejscu,
            niezależnie od tego, czy są notatki. Notatki scrollują się pod spodem. */}
        <View
          className="items-center justify-center"
          style={{ height: Math.min(winH * 0.46, 460) }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width !== flowerBox.w || height !== flowerBox.h) {
              setFlowerBox({ w: width, h: height });
            }
          }}
        >
          {flowerSize > 0 && (
            selectedEntry ? (
              // Z wpisem: kontener NIE jest klikalny (żeby nie zagnieżdżać przycisków).
              // Etykiety osi (FlowerChrome) → edycja jednej osi.
              // Środek "dotknij, by edytować" → pełna edycja.
              <View
                style={{ width: flowerSize, height: flowerSize }}
                className="items-center justify-center"
              >
                <FlowerLazy
                  dna={dna}
                  day={entryToDayData(selectedEntry, notesLength(selectedNotes))}
                  size={flowerSize}
                  dnaSeed={dnaSeed}
                  grain={false}
                />
                <FlowerChrome
                  size={flowerSize}
                  rotationOffset={dna.rotationOffset}
                  showGrid
                  pad={CHROME_PAD}
                  revealKey={selectedDate}
                  onAxisPress={(axis) => setEditingAxis(axis)}
                />
                <Pressable
                  onPress={() => openEntry(selectedDate)}
                  accessibilityRole="button"
                  accessibilityLabel="edytuj wpis dnia"
                  style={{
                    position: 'absolute',
                    width: flowerSize * 0.34,
                    height: flowerSize * 0.34,
                    borderRadius: flowerSize * 0.17,
                  }}
                  className="items-center justify-center"
                >
                  <Text variant="caption" className="text-center" style={{ color: '#161311' }}>
                    {'dotknij,\nby edytować'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              // Pusty dzień: cały kwiatek klikalny → otwiera pełen flow.
              <Pressable
                onPress={() => openEntry(selectedDate)}
                accessibilityRole="button"
                accessibilityLabel="zapisz dzień"
                style={{ width: flowerSize, height: flowerSize }}
                className="items-center justify-center"
              >
                <FlowerLazy
                  dna={dna}
                  day={{ ...NEUTRAL_DAY, dateIso: selectedDate }}
                  size={flowerSize}
                  dnaSeed={dnaSeed}
                  outline
                />
                <View
                  style={{
                    position: 'absolute',
                    width: flowerSize * 0.34,
                    height: flowerSize * 0.34,
                  }}
                  className="rounded-full items-center justify-center"
                >
                  <Text variant="caption" tone="muted" className="text-center">
                    {isToday ? 'jeszcze\nnie zakwitł' : 'brak wpisu\ndotknij, by dodać'}
                  </Text>
                </View>
              </Pressable>
            )
          )}
        </View>

        {/* CTA — okrągły przycisk z plusem (dodaj notatkę) */}
        <View className="items-center" style={{ marginBottom: tight ? 16 : 24 }}>
          <Pressable
            onPress={() => openNote(selectedDate)}
            accessibilityRole="button"
            accessibilityLabel="dodaj notatkę"
            className="bg-ink rounded-full items-center justify-center"
            style={{ width: 56, height: 56 }}
          >
            <Text tone="paper" style={{ fontSize: 28, lineHeight: 28, marginTop: -2 }}>
              +
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
            // Inline color zamiast `tone` — NativeWind/RNW nie deduplikuje klas
            // text-* przy dynamicznej zmianie propa, więc po przeklikiwaniu dni
            // stary `text-paper` zostawał w className i numery stawały się
            // kremowe na kremowym tle (niewidoczne).
            const numColor = isSelected ? '#F6F6EA' : isTodayCell ? '#1A1614' : '#7A6F62';
            const labelColor = isSelected ? '#1A1614' : '#7A6F62';
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
                  className="mb-2"
                  style={{ color: labelColor }}
                >
                  {WEEKDAYS_PL[i][0].toUpperCase() + WEEKDAYS_PL[i].slice(1)}
                </Text>
                <View
                  className={
                    'w-9 h-9 rounded-full items-center justify-center ' +
                    (isSelected ? 'bg-ink' : '')
                  }
                >
                  <Text variant="bodyMedium" style={{ color: numColor }}>
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

        {/* Notatki wybranego dnia — pojawiają się gdy są jakieś. */}
        {selectedNotes.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View
              className="flex-row items-center"
              style={{ marginBottom: 16 }}
            >
              <Text variant="eyebrow" style={{ color: '#7A6F62', marginRight: 12 }}>
                {isToday ? 'DZIŚ' : 'TEGO DNIA'} — {selectedNotes.length}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E1D8CE' }} />
            </View>
            {selectedNotes
              .slice()
              .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
              .map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onPress={() => openNote(selectedDate, n.id)}
                />
              ))}
          </View>
        )}
      </ScrollView>

      <AxisEditSheet
        axis={editingAxis}
        currentValue={editingAxis && selectedEntry ? (selectedEntry[editingAxis] as Scale) : undefined}
        onSelect={async (axis, value) => {
          if (!selectedEntry) return;
          await saveEntry({ ...selectedEntry, [axis]: value });
          setEditingAxis(null);
        }}
        onClose={() => setEditingAxis(null)}
      />

      <ChatBar />
    </SafeAreaView>
  );
}
