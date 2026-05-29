// Kwestionariusz dnia — używa Button/Text z ui/.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AXIS_QUESTIONS, NOTE_PROMPTS } from '../lib/questions';
import { Scale } from '../lib/flower/types';
import { Entry, entryToDayData, todayIso, useStore } from '../lib/store';
import { deriveDna } from '../lib/flower/dna';
import { FlowerLazy } from '../components/FlowerLazy';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';

type Draft = Partial<Record<(typeof AXIS_QUESTIONS)[number]['axis'], Scale>> & {
  somethingGood?: boolean;
  somethingHard?: boolean;
};

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

type Step =
  | { kind: 'axis'; index: number }
  | { kind: 'bloom' }
  | { kind: 'note' };

function TopBar({ left, center, right }: { left?: React.ReactNode; center?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View className="px-7 pt-6 flex-row items-center justify-between">
      <View style={{ minWidth: 60 }}>{left}</View>
      <View>{center}</View>
      <View style={{ minWidth: 60, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

function IntensityDots({ value, selected }: { value: number; selected: boolean }) {
  const dotSize = 6;
  const gap = 6;
  const total = 5;
  const width = total * dotSize + (total - 1) * gap;
  const filled = selected ? '#F6F6EA' : '#1A1614';
  const muted = selected ? 'rgba(246,246,234,0.3)' : 'rgba(122,111,98,0.35)';
  return (
    <Svg width={width} height={dotSize}>
      {Array.from({ length: total }).map((_, i) => {
        const cx = i * (dotSize + gap) + dotSize / 2;
        const on = i < value;
        return (
          <Circle
            key={i}
            cx={cx}
            cy={dotSize / 2}
            r={dotSize / 2}
            fill={on ? filled : 'transparent'}
            stroke={on ? filled : muted}
            strokeWidth={1}
          />
        );
      })}
    </Svg>
  );
}

function OptionRow({
  label,
  index,
  selected,
  onPress,
}: {
  label: string;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        'py-4 px-5 rounded-2xl border flex-row items-center justify-between ' +
        (selected ? 'bg-ink border-ink' : 'bg-paper border-ink-muted/25')
      }
    >
      <Text
        variant="bodyMedium"
        tone={selected ? 'paper' : 'ink'}
        style={{ fontSize: 17, letterSpacing: -0.1 }}
      >
        {label}
      </Text>
      <IntensityDots value={index} selected={selected} />
    </Pressable>
  );
}

export default function EntryScreen() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const saveEntry = useStore((s) => s.saveEntry);
  const addNote = useStore((s) => s.addNote);
  const userId = useStore((s) => s.userId);
  const name = useStore((s) => s.name);
  const entries = useStore((s) => s.entries);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const params = useLocalSearchParams<{ date?: string }>();
  const targetDate = (typeof params.date === 'string' && params.date) || todayIso();

  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState<Step>({ kind: 'axis', index: 0 });
  const [savedEntry, setSavedEntry] = useState<Entry | null>(null);
  const [noteText, setNoteText] = useState('');
  const [composerHeight, setComposerHeight] = useState(LINE_HEIGHT * 6);
  const noteInputRef = useRef<TextInput>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);

  // Hydratuj draft z istniejącego wpisu (edycja) tylko raz po hydratacji store
  useEffect(() => {
    if (!hydrated || draftHydrated) return;
    const existing = entries[targetDate];
    if (existing) {
      setDraft({
        day: existing.day,
        emotions: existing.emotions,
        energy: existing.energy,
        body: existing.body,
        delight: existing.delight,
        meaning: existing.meaning,
      });
    }
    setDraftHydrated(true);
  }, [hydrated, draftHydrated, entries, targetDate]);

  const dna = useMemo(() => deriveDna(userId || 'anon'), [userId]);
  const dnaSeed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
    return Math.abs(h) || 1234567;
  }, [userId]);

  const notePrompt = useMemo(
    () => NOTE_PROMPTS[Math.floor(Math.random() * NOTE_PROMPTS.length)],
    [],
  );

  function selectAxis(axis: (typeof AXIS_QUESTIONS)[number]['axis'], v: Scale) {
    const newDraft = { ...draft, [axis]: v };
    setDraft(newDraft);
    if (step.kind !== 'axis') return;
    if (step.index < AXIS_QUESTIONS.length - 1) {
      setStep({ kind: 'axis', index: step.index + 1 });
    } else {
      finalizeEntry(newDraft);
    }
  }

  function back() {
    if (step.kind === 'axis' && step.index > 0) setStep({ kind: 'axis', index: step.index - 1 });
    else if (step.kind === 'axis' && step.index === 0) {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  }

  async function finalizeEntry(d: Draft) {
    const dateIso = targetDate;
    const entry: Entry = {
      dateIso,
      day: (d.day ?? 3) as Scale,
      emotions: (d.emotions ?? 3) as Scale,
      energy: (d.energy ?? 3) as Scale,
      body: (d.body ?? 3) as Scale,
      delight: (d.delight ?? 3) as Scale,
      meaning: (d.meaning ?? 3) as Scale,
      somethingGood: false,
      somethingHard: false,
      createdAtIso: new Date().toISOString(),
    };
    await saveEntry(entry);
    setSavedEntry(entry);
    setStep({ kind: 'bloom' });
  }

  async function finishNote() {
    if (savedEntry && noteText.trim()) {
      await addNote(savedEntry.dateIso, noteText.trim());
    }
    router.replace('/');
  }

  const total = AXIS_QUESTIONS.length;
  const stepNumber = step.kind === 'axis' ? step.index + 1 : total;

  if (!hydrated) {
    return <SafeAreaView className="flex-1 bg-paper" />;
  }

  // ---- AXIS ----
  if (step.kind === 'axis') {
    const q = AXIS_QUESTIONS[step.index];
    const value = draft[q.axis];
    return (
      <SafeAreaView className="flex-1 bg-paper">
        <TopBar
          left={
            <Pressable onPress={back}>
              <Text variant="bodyMedium">←</Text>
            </Pressable>
          }
          center={
            <Text variant="mono">
              {String(stepNumber).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </Text>
          }
        />

        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 40, paddingBottom: 32 }}>
          <Text variant="eyebrow">{q.axis.toUpperCase()}</Text>
          <Text variant="h1" className="mt-4">
            {q.prompt}
          </Text>
          {q.micro ? (
            <Text variant="caption" tone="muted" className="mt-4">
              {q.micro}
            </Text>
          ) : null}

          <View className="mt-10 gap-2.5">
            {q.labels.map((label, i) => {
              const v = (i + 1) as Scale;
              return (
                <OptionRow
                  key={label}
                  label={label}
                  index={v}
                  selected={value === v}
                  onPress={() => selectAxis(q.axis, v)}
                />
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- BLOOM ----
  if (step.kind === 'bloom' && savedEntry) {
    return (
      <SafeAreaView className="flex-1 bg-paper">
        <TopBar left={<Text variant="eyebrow">ZAKWITŁO</Text>} />
        <View className="flex-1 items-center justify-center px-6">
          <FlowerLazy dna={dna} day={entryToDayData(savedEntry, noteText.length)} size={340} dnaSeed={dnaSeed} />
          <Text
            variant="h2"
            className="text-center mt-10"
            style={{ fontSize: 36, lineHeight: 40, letterSpacing: -1 }}
          >
            {name ? `${name}, oto Twój dzień.` : 'Oto Twój dzień.'}
          </Text>
        </View>
        <View className="px-6 pb-10">
          <Button variant="pill" label="dopisz coś od siebie" onPress={() => setStep({ kind: 'note' })} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- NOTE ----
  if (step.kind === 'note' && savedEntry) {
    const linesInComposer = Math.max(8, Math.floor(composerHeight / LINE_HEIGHT));
    const composerPaperHeight = linesInComposer * LINE_HEIGHT + 24;
    const hasText = !!noteText.trim();
    return (
      <SafeAreaView className="flex-1 bg-paper">
        <View className="px-7 pt-6 flex-row items-center justify-between">
          <Pressable onPress={() => setStep({ kind: 'bloom' })}>
            <Text variant="bodyMedium">←</Text>
          </Pressable>
          <Text variant="eyebrow">NOTATKI</Text>
          <View style={{ width: 20, height: 20 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
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
              ref={noteInputRef}
              value={noteText}
              onChangeText={setNoteText}
              onContentSizeChange={(e) => setComposerHeight(e.nativeEvent.contentSize.height)}
              placeholder={notePrompt}
              placeholderTextColor="#7A6F6260"
              multiline
              textAlignVertical="top"
              autoFocus
              className="font-serif text-ink"
              style={{ fontSize: 17, lineHeight: LINE_HEIGHT, padding: 0, margin: 0, outlineStyle: 'none' } as any}
            />
          </View>

          <View className="items-center" style={{ marginTop: 4, marginBottom: 28 }}>
            <Pressable
              onPress={finishNote}
              accessibilityRole="button"
              accessibilityLabel={hasText ? 'zapisz notatkę' : 'pomiń notatkę'}
              className="bg-ink rounded-full items-center justify-center"
              style={{
                paddingHorizontal: 36,
                paddingVertical: 16,
                minWidth: 200,
                opacity: hasText ? 1 : 0.35,
              }}
            >
              <Text variant="bodyMedium" tone="paper">
                {hasText ? 'zapisz' : 'pomiń'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView className="flex-1 bg-paper" />;
}
