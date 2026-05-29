// Notatki dnia — niezależne od kwestionariusza. Wiele notatek na dzień.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { Note, todayIso, useStore } from '../lib/store';
import { Text } from '../components/ui/text';

const LINE_HEIGHT = 32;

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

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: () => void;
}) {
  return (
    <View
      style={{
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#EDE5D5',
      }}
    >
      <View className="flex-row items-center justify-between" style={{ marginBottom: 6 }}>
        <Text variant="mono" style={{ color: '#7A6F62' }}>{formatTime(note.createdAtIso)}</Text>
        <Pressable onPress={onDelete} hitSlop={10}>
          <Text variant="caption" style={{ color: '#7A6F62' }}>
            usuń
          </Text>
        </Pressable>
      </View>
      <Text variant="body" style={{ color: '#1A1614', lineHeight: 22 }}>
        {note.text}
      </Text>
    </View>
  );
}

export default function NoteScreen() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const addNote = useStore((s) => s.addNote);
  const deleteNote = useStore((s) => s.deleteNote);
  const notesByDate = useStore((s) => s.notesByDate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const params = useLocalSearchParams<{ date?: string }>();
  const today = (typeof params.date === 'string' && params.date) || todayIso();
  const notes = useMemo(() => notesByDate[today] ?? [], [notesByDate, today]);

  const [text, setText] = useState('');
  const [composerHeight, setComposerHeight] = useState(LINE_HEIGHT * 6);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  async function save() {
    const trimmed = text.trim();
    if (!trimmed || !hydrated) return;
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
        <Pressable onPress={save} disabled={!text.trim()} hitSlop={10}>
          <Text variant="bodyMedium" tone={text.trim() ? 'ink' : 'muted'}>
            zapisz
          </Text>
        </Pressable>
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

        {notes.length > 0 && (
          <Text variant="eyebrow" style={{ color: '#7A6F62', marginBottom: 8 }}>
            {notes.length === 1 ? 'NOTATKA' : 'NOTATKI'}
          </Text>
        )}

        {notes
          .slice()
          .reverse()
          .map((n) => (
            <NoteCard key={n.id} note={n} onDelete={() => deleteNote(today, n.id)} />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
