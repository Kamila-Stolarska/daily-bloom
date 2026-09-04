// Ekran /notes — lista wszystkich notatek (test-wersja dolnej nawigacji).
// Grupuje notatki po dacie (dateIso -> Note[] w store), najnowsze na górze.

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { todayIso, useStore } from '../lib/store';
import { Text } from '../components/ui/text';
import { NoteCard } from '../components/NoteCard';
import { BottomNav, BOTTOM_NAV_CONTENT_HEIGHT } from '../components/nav/BottomNav';

const MONTHS_PL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

function formatDateLabel(dateIso: string): string {
  const d = new Date(dateIso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
}

function SearchIcon({ size = 20, color = '#1A1614' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.8} />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default function NotesScreen() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const notesByDate = useStore((s) => s.notesByDate);
  const insets = useSafeAreaInsets();
  const navBarHeight = BOTTOM_NAV_CONTENT_HEIGHT + Math.max(6, insets.bottom);
  const { width: winW, height: winH } = useWindowDimensions();
  const horizontalPad = winW < 380 ? 20 : winW > 480 ? 32 : 28;
  // Ta sama responsywna wartość co na Home — żeby "DAILY — BLOOM" nie skakało między ekranami.
  const topPad = winH < 720 ? 8 : winH > 880 ? 24 : 16;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const groups = useMemo(() => {
    return Object.entries(notesByDate)
      .filter(([, notes]) => notes.length > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateIso, notes]) => ({
        dateIso,
        notes: notes.slice().sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
      }));
  }, [notesByDate]);

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, notes: g.notes.filter((n) => n.text.toLowerCase().includes(q)) }))
      .filter((g) => g.notes.length > 0);
  }, [groups, query]);

  if (!hydrated) {
    return <SafeAreaView className="flex-1 bg-white" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingTop: topPad,
          paddingBottom: 32 + navBarHeight,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View className="flex-row items-start justify-between" style={{ marginBottom: 24 }}>
          <Text variant="eyebrow">DAILY — BLOOM</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => {
                setSearchOpen((v) => {
                  const next = !v;
                  if (!next) setQuery('');
                  return next;
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="szukaj w notatkach"
              hitSlop={10}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: searchOpen ? '#1A1614' : '#E1D8CE',
                backgroundColor: searchOpen ? '#1A1614' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon size={16} color={searchOpen ? '#FFFFF0' : '#1A1614'} />
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/note', params: { date: todayIso() } })}
              accessibilityRole="button"
              accessibilityLabel="dodaj notatkę"
              hitSlop={10}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#1A1614',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="body" tone="paper" style={{ fontSize: 18, lineHeight: 20 }}>
                +
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text variant="display" style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.2 }}>
            Notatki
          </Text>
        </View>

        {searchOpen && (
          <View style={{ marginBottom: 20 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Szukaj w notatkach…"
              placeholderTextColor="#7A6F62"
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: '#E1D8CE',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#1A1614',
                backgroundColor: '#FFFFFF',
              }}
            />
          </View>
        )}

        {groups.length === 0 && (
          <View style={{ marginTop: 24 }}>
            <Text variant="body" tone="muted">
              Nie masz jeszcze żadnych notatek. Dodaj pierwszą przy dzisiejszym wpisie.
            </Text>
          </View>
        )}

        {groups.length > 0 && visibleGroups.length === 0 && (
          <View style={{ marginTop: 24 }}>
            <Text variant="body" tone="muted">
              Brak notatek pasujących do „{query.trim()}”.
            </Text>
          </View>
        )}

        {visibleGroups.map(({ dateIso, notes }) => (
          <View key={dateIso} style={{ marginBottom: 24 }}>
            <View className="flex-row items-center" style={{ marginBottom: 16 }}>
              <Text variant="eyebrow" style={{ color: '#7A6F62', marginRight: 12 }}>
                {formatDateLabel(dateIso).toUpperCase()}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E1D8CE' }} />
            </View>
            {notes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onPress={() => router.push({ pathname: '/note', params: { date: dateIso, noteId: n.id } })}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}
