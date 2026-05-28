// Kwestionariusz dnia — używa Button/Text z ui/.

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
      <Text variant="h3" tone={selected ? 'paper' : 'ink'}>
        {label}
      </Text>
      <Text variant="mono" tone={selected ? 'paper-muted' : 'muted'}>
        {String(index).padStart(2, '0')}
      </Text>
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

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState<Step>({ kind: 'axis', index: 0 });
  const [savedEntry, setSavedEntry] = useState<Entry | null>(null);
  const [noteText, setNoteText] = useState('');

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
    else if (step.kind === 'axis' && step.index === 0) router.back();
  }

  async function finalizeEntry(d: Draft) {
    const dateIso = todayIso();
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
    return (
      <SafeAreaView className="flex-1 bg-paper">
        <TopBar
          left={
            <Pressable onPress={() => setStep({ kind: 'bloom' })}>
              <Text variant="bodyMedium">←</Text>
            </Pressable>
          }
          right={
            <Pressable onPress={finishNote}>
              <Text variant="caption" tone="muted">
                pomiń
              </Text>
            </Pressable>
          }
        />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-start gap-4 mb-10">
            <View style={{ width: 64, height: 64 }}>
              <FlowerLazy dna={dna} day={entryToDayData(savedEntry, noteText.length)} size={64} dnaSeed={dnaSeed} />
            </View>
            <View className="flex-1">
              <Text variant="eyebrow">DZIENNIK</Text>
              <Text variant="h2" className="mt-2">
                {notePrompt}
              </Text>
            </View>
          </View>

          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="pisz…"
            placeholderTextColor="#7A6F6260"
            multiline
            textAlignVertical="top"
            className="font-serif text-ink"
            style={{ minHeight: 280, fontSize: 18, lineHeight: 28 }}
          />
        </ScrollView>

        <View className="px-6 pb-8">
          <Button variant="pill" label="zapisz dzień" onPress={finishNote} />
        </View>
      </SafeAreaView>
    );
  }

  return <SafeAreaView className="flex-1 bg-paper" />;
}
