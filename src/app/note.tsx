// Notatki dnia — niezależne od kwestionariusza. Wiele notatek na dzień.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Line, Path } from 'react-native-svg';
import { todayIso, useStore } from '../lib/store';
import { NoteCard } from '../components/NoteCard';
import { Text } from '../components/ui/text';

const LINE_HEIGHT = 32;

function TrashIcon({ size = 20, color = '#1A1614' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PaperLines({ height }: { height: number }) {
  const lines = Math.max(1, Math.floor(height / LINE_HEIGHT));
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height, pointerEvents: 'none' }}>
      <Svg width="100%" height={height}>
        {Array.from({ length: lines }).map((_, i) => {
          const y = (i + 1) * LINE_HEIGHT;
          return (
            <Line
              key={i}
              x1={0}
              x2="100%"
              y1={y}
              y2={y}
              stroke="#A89C8C"
              strokeOpacity={0.18}
              strokeWidth={0.5}
            />
          );
        })}
      </Svg>
    </View>
  );
}

export default function NoteScreen() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);
  const notesByDate = useStore((s) => s.notesByDate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const params = useLocalSearchParams<{ date?: string; noteId?: string }>();
  const today = (typeof params.date === 'string' && params.date) || todayIso();
  const editingId = typeof params.noteId === 'string' ? params.noteId : null;
  const notes = useMemo(() => notesByDate[today] ?? [], [notesByDate, today]);
  const editingNote = useMemo(
    () => (editingId ? notes.find((n) => n.id === editingId) ?? null : null),
    [editingId, notes],
  );

  const [text, setText] = useState(editingNote?.text ?? '');
  const [composerHeight, setComposerHeight] = useState(LINE_HEIGHT * 6);
  const inputRef = useRef<TextInput>(null);
  const prefilledRef = useRef(false);

  useEffect(() => {
    // Po hydration uzupełnij pole edytowanej notatki (jeśli nie zostało już ustawione).
    if (editingNote && !prefilledRef.current) {
      setText(editingNote.text);
      prefilledRef.current = true;
    }
  }, [editingNote]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  async function save() {
    const trimmed = text.trim();
    if (!trimmed || !hydrated) return;
    if (editingId) {
      await updateNote(today, editingId, trimmed);
      if (router.canGoBack()) router.back();
      else router.replace('/');
      return;
    }
    await addNote(today, trimmed);
    setText('');
    inputRef.current?.focus();
  }

  if (!hydrated) {
    return <SafeAreaView className="flex-1 bg-paper" />;
  }

  const linesInComposer = Math.max(6, Math.floor(composerHeight / LINE_HEIGHT));
  const composerPaperHeight = linesInComposer * LINE_HEIGHT + 24;

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="px-7 pt-6 flex-row items-center justify-between">
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text variant="bodyMedium">←</Text>
        </Pressable>
        <Text variant="eyebrow">NOTATKI</Text>
        {editingId ? (
          <Pressable
            onPress={async () => {
              await deleteNote(today, editingId);
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="usuń notatkę"
          >
            <TrashIcon />
          </Pressable>
        ) : (
          <View style={{ width: 20, height: 20 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Composer */}
        <View
          style={{
            minHeight: composerPaperHeight,
            backgroundColor: '#FBFAF1',
            borderRadius: 16,
            paddingHorizontal: 18,
            paddingTop: 12,
            paddingBottom: 12,
            overflow: 'hidden',
            marginBottom: 28,
          }}
        >
          <PaperLines height={composerPaperHeight} />
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onContentSizeChange={(e) => setComposerHeight(e.nativeEvent.contentSize.height)}
            placeholder="zapisz, co Ci dziś chodzi po głowie…"
            placeholderTextColor="#7A6F6260"
            multiline
            textAlignVertical="top"
            className="font-serif text-ink"
            style={{ fontSize: 17, lineHeight: LINE_HEIGHT, padding: 0, margin: 0, outlineStyle: 'none' } as any}
          />
        </View>

        {/* Główne CTA — czarny przycisk "zapisz" */}
        <View className="items-center" style={{ marginTop: 4, marginBottom: 28 }}>
          <Pressable
            onPress={save}
            disabled={!text.trim()}
            accessibilityRole="button"
            accessibilityLabel="zapisz notatkę"
            className="bg-ink rounded-full items-center justify-center"
            style={{
              paddingHorizontal: 36,
              paddingVertical: 16,
              minWidth: 200,
              opacity: text.trim() ? 1 : 0.35,
            }}
          >
            <Text variant="bodyMedium" tone="paper">
              zapisz
            </Text>
          </Pressable>
        </View>

        {(() => {
          const visible = editingId ? notes.filter((n) => n.id !== editingId) : notes;
          if (!visible.length) return null;
          return (
            <>
              <Text variant="eyebrow" style={{ color: '#7A6F62', marginBottom: 8 }}>
                {visible.length === 1 ? 'NOTATKA' : 'NOTATKI'}
              </Text>
              {visible
                .slice()
                .reverse()
                .map((n) => (
                  <NoteCard key={n.id} note={n} onDelete={() => deleteNote(today, n.id)} />
                ))}
            </>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}
