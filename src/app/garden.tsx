// Ekran /garden — pakiet wizualizacji: Ogród (galeria), uśredniony kwiatek,
// trend liniowy 6 osi, kalendarz-heatmapa, podsumowanie tagów, chmura słów.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useStore, todayIso } from '../lib/store';
import { deriveDna } from '../lib/flower/dna';
import { AXES, type DayData } from '../lib/flower/types';
import {
  axisDistribution,
  averageDay,
  axisSeries,
  filterByWindow,
  filterPreviousWindow,
  streakDays,
  tagsSummary,
  compareWindows,
  momentGroups,
  buildInsights,
  coOccurrenceInsight,
  fewEntriesMessage,
  buildDailyInsightPoints,
  isoDate,
  MIN_ENTRIES_FOR_CONFIDENT_INSIGHTS,
} from '../lib/stats';
import { topWords } from '../lib/text/wordCloud';

import { Text } from '../components/ui/text';
import { FlowerLazy } from '../components/FlowerLazy';
import { FlowerChrome } from '../components/FlowerChrome';
import { AxisTrendCards } from '../components/AxisTrendCards';
import { AxisTrendChart } from '../components/AxisTrendChart';
import { AxisRibbon } from '../components/AxisRibbon';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { TagsSummary } from '../components/TagsSummary';
import { WordCloud } from '../components/WordCloud';
import { PeriodComparison } from '../components/PeriodComparison';
import { MomentGroups } from '../components/MomentGroups';
import { InsightCard } from '../components/InsightCard';
import { InsightsListView } from '../components/InsightsListView';

const WINDOWS = [
  { key: '7', label: '7 dni', days: 7 as const, genitive: 'z 7 dni' },
  { key: '30', label: '30 dni', days: 30 as const, genitive: 'z 30 dni' },
  { key: '90', label: '90 dni', days: 90 as const, genitive: 'z 90 dni' },
  { key: 'all', label: 'cały czas', days: 'all' as const, genitive: 'z całego okresu' },
] as const;

// Odtwarza krótki "rozkwit" (skala + fade-in) za każdym razem, gdy zmienia się
// changeKey — używane, żeby kwiatek okresu i wykresy wizualnie ożywały się przy
// przełączaniu 7/30/90/cały czas, zamiast podmieniać się w miejscu bez animacji.
function BloomOnChange({
  changeKey,
  children,
  style,
}: {
  changeKey: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(0.94);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = 0.94;
    opacity.value = 0;
    scale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.back(1.6)) });
    opacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeKey]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

const AXIS_LABELS: Record<(typeof AXES)[number], string> = {
  day: 'Dzień',
  emotions: 'Emocje',
  energy: 'Energia',
  body: 'Ciało',
  delight: 'Zachwyt',
  meaning: 'Sens',
};

export default function Garden() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const userId = useStore((s) => s.userId);
  const entries = useStore((s) => s.entries);
  const notesByDate = useStore((s) => s.notesByDate);
  const photosByNoteId = useStore((s) => s.photosByNoteId);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const { width: winW } = useWindowDimensions();
  const horizontalPad = winW < 380 ? 20 : winW > 480 ? 32 : 28;
  const contentW = winW - horizontalPad * 2;

  const dna = useMemo(() => deriveDna(userId || 'anon'), [userId]);
  const dnaSeed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
    return Math.abs(h) || 1234567;
  }, [userId]);

  const entriesList = useMemo(() => Object.values(entries), [entries]);
  const notesList = useMemo(() => Object.values(notesByDate).flat(), [notesByDate]);
  const today = useMemo(() => new Date(), []);

  const [windowKey, setWindowKey] = useState<(typeof WINDOWS)[number]['key']>('30');
  const currentWindow = WINDOWS.find((w) => w.key === windowKey)!;

  const windowed = useMemo(
    () => filterByWindow(entriesList, (e) => e.dateIso, currentWindow.days, today),
    [entriesList, currentWindow.days, today],
  );
  const previousWindowed = useMemo(
    () =>
      currentWindow.days === 'all'
        ? []
        : filterPreviousWindow(entriesList, (e) => e.dateIso, currentWindow.days, today),
    [entriesList, currentWindow.days, today],
  );

  const avg = useMemo(() => averageDay(windowed), [windowed]);
  const tags = useMemo(() => tagsSummary(entriesList), [entriesList]);
  const streak = useMemo(() => streakDays(entriesList, today), [entriesList, today]);
  const words = useMemo(() => topWords(notesList, 30), [notesList]);
  const sparklineCells = useMemo(
    () => AXES.map((a) => ({ label: AXIS_LABELS[a], axis: a, series: axisSeries(windowed, a) })),
    [windowed],
  );
  const comparisons = useMemo(
    () => (currentWindow.days === 'all' ? [] : compareWindows(windowed, previousWindowed)),
    [windowed, previousWindowed, currentWindow.days],
  );
  const previousAvg = useMemo(() => averageDay(previousWindowed), [previousWindowed]);
  const groups = useMemo(() => momentGroups(windowed), [windowed]);
  const insights = useMemo(
    () => buildInsights({ windowed, previousWindowed, comparison: comparisons, groups }),
    [windowed, previousWindowed, comparisons, groups],
  );
  const coOccurrence = useMemo(() => coOccurrenceInsight(groups), [groups]);
  const confidentInsights = windowed.length >= MIN_ENTRIES_FOR_CONFIDENT_INSIGHTS;
  const rangeStartIso = useMemo(() => {
    if (currentWindow.days === 'all') {
      const sorted = entriesList.map((e) => e.dateIso).sort();
      return sorted[0] ?? isoDate(today);
    }
    const d = new Date(today);
    d.setDate(d.getDate() - (currentWindow.days - 1));
    return isoDate(d);
  }, [currentWindow.days, entriesList, today]);
  const rangeEndIso = useMemo(() => isoDate(today), [today]);
  const dailyPoints = useMemo(
    () => buildDailyInsightPoints(entriesList, rangeStartIso, rangeEndIso, notesByDate, photosByNoteId),
    [entriesList, rangeStartIso, rangeEndIso, notesByDate, photosByNoteId],
  );
  const possibleDaysCount = dailyPoints.length;
  const [showListView, setShowListView] = useState(false);
  const ribbonRows = useMemo(
    () =>
      AXES.map((a) => {
        const d = axisDistribution(windowed, a);
        const mode = d.mode;
        // DayData dla kwiatka: ZAWSZE maksymalna wartość na wszystkich 6 osiach
        // (jak wpis 05.06.2026, gdzie wszystko było na 5) — kwiatek ma być stałym,
        // maksymalnie wypełnionym, symetrycznym znacznikiem, niezależnym od tego
        // jak niska jest sama moda. Inaczej płatki skalują się przez v/5 (patrz
        // OrganicFlower `lenFor`) i przy mode=1 kwiatek robi się mikroskopijny —
        // mniejszy niż kropka obok, co gubi hierarchię (kwiatek ma być zawsze
        // najbardziej wyróżniony). Pozycja na osi nadal pokazuje prawdziwą modę.
        const day: DayData = {
          day: 5,
          emotions: 5,
          energy: 5,
          body: 5,
          delight: 5,
          meaning: 5,
          somethingGood: avg.somethingGood,
          somethingHard: avg.somethingHard,
        };
        return { label: AXIS_LABELS[a], counts: d.counts, mode, day };
      }),
    [windowed, avg],
  );

  // Kalendarz-heatmapa: aktualnie oglądany miesiąc.
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const stepMonth = (delta: number) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const openEntry = (dateIso: string) => {
    router.push({ pathname: '/entry', params: { date: dateIso } });
  };

  if (!hydrated) {
    return <SafeAreaView className="flex-1 bg-paper" />;
  }

  const avgFlowerSize = Math.min(220, contentW * 0.7);
  const AVG_CHROME_PAD = 40;

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingTop: 12,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="wróć">
            <Text variant="body" style={{ fontSize: 18 }}>← wróć</Text>
          </Pressable>
          <Text variant="eyebrow">OGRÓD</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Header */}
        <Text variant="display" style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.2 }}>
          Twój ogród
        </Text>
        <Text variant="body" tone="muted" style={{ marginTop: 8 }}>
          {entriesList.length === 0
            ? 'Jeszcze pusto — zapisz pierwszy dzień.'
            : `${entriesList.length} ${entriesList.length === 1 ? 'wpis' : 'wpisów'} · streak ${streak} ${streak === 1 ? 'dzień' : 'dni'}`}
        </Text>

        {/* Sekcja 2 — Kalendarz-heatmapa */}
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <View style={{ alignSelf: 'stretch', marginBottom: 8 }}>
            <Text variant="h3">Kalendarz</Text>
          </View>
          <CalendarHeatmap
            entries={entries}
            notesByDate={notesByDate}
            month={month}
            dna={dna}
            dnaSeed={dnaSeed}
            width={contentW}
            onPrev={() => stepMonth(-1)}
            onNext={() => stepMonth(1)}
            onSelectDate={openEntry}
          />
        </View>

        {/* Sekcja 3 — Uśredniony kwiatek okresu */}
        <View style={{ marginTop: 40 }}>
          <Text variant="h3" style={{ marginBottom: 8 }}>
            Kwiatek okresu
          </Text>
          <Text variant="body" tone="muted" style={{ marginBottom: 16 }}>
            Obraz sześciu obszarów zbudowany z Twoich najczęstszych odpowiedzi w wybranym czasie.
          </Text>
          <WindowPicker current={windowKey} onSelect={setWindowKey} />
          {windowed.length < 3 ? (
            <Text variant="body" tone="muted" style={{ marginTop: 16 }}>
              {fewEntriesMessage(windowed.length, 'zobaczyć obraz tego okresu')}
            </Text>
          ) : (
            <BloomOnChange changeKey={windowKey} style={{ alignItems: 'center', marginTop: 16 + AVG_CHROME_PAD }}>
              <View style={{ width: avgFlowerSize, height: avgFlowerSize }} className="items-center justify-center">
                <FlowerLazy
                  dna={dna}
                  day={avg}
                  size={avgFlowerSize}
                  dnaSeed={dnaSeed}
                  grain={false}
                  bloomKey={windowKey}
                />
                <FlowerChrome
                  size={avgFlowerSize}
                  rotationOffset={dna.rotationOffset}
                  pad={AVG_CHROME_PAD}
                  revealKey={windowKey}
                />
              </View>
              <Text variant="caption" tone="muted" style={{ marginTop: 12 + AVG_CHROME_PAD }}>
                {`Na podstawie ${windowed.length} ${windowed.length === 1 ? 'wpisu' : 'wpisów'} z ostatnich ${possibleDaysCount} dni.`}
              </Text>
            </BloomOnChange>
          )}
        </View>

        {/* Sekcja 3b — Profil okresu (rozkład + wstęga) */}
        <View style={{ marginTop: 40 }}>
          <Text variant="h3" style={{ marginBottom: 8 }}>
            Profil okresu
          </Text>
          <Text variant="body" tone="muted" style={{ marginBottom: 16 }}>
            Zobacz, które odpowiedzi pojawiały się najczęściej w każdym z sześciu obszarów.
          </Text>
          <View style={{ marginBottom: 20, gap: 10 }}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <FlowerLazy
                  dna={dna}
                  day={{
                    day: 5, emotions: 5, energy: 5, body: 5, delight: 5, meaning: 5,
                    somethingGood: false, somethingHard: false,
                  }}
                  size={28}
                  dnaSeed={dnaSeed}
                  grain={false}
                />
              </View>
              <Text variant="caption" tone="muted">Najczęściej wybierana odpowiedź</Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#FBFAF2',
                    borderWidth: 1,
                    borderColor: '#E1D8CF',
                  }}
                />
              </View>
              <Text variant="caption" tone="muted">Wielkość symbolu pokazuje, jak często wybierano daną odpowiedź</Text>
            </View>
          </View>
          {windowed.length === 0 ? (
            <Text variant="caption" tone="muted">
              brak wpisów w tym okresie
            </Text>
          ) : (
            <BloomOnChange changeKey={windowKey}>
              <AxisRibbon
                rows={ribbonRows}
                width={contentW}
                rowHeight={76}
                dna={dna}
                dnaSeed={dnaSeed}
                bloomKey={windowKey}
              />
            </BloomOnChange>
          )}
        </View>

        {/* Sekcja 4 — Trend liniowy 6 osi */}
        <View style={{ marginTop: 40 }}>
          <Text variant="h3" style={{ marginBottom: 12 }}>
            Trend obszarów ({currentWindow.label})
          </Text>
          {windowed.length < 3 ? (
            <Text variant="body" tone="muted">
              {fewEntriesMessage(windowed.length, 'zobaczyć trend obszarów w czasie')}
            </Text>
          ) : (
            <>
              <BloomOnChange changeKey={windowKey}>
                <AxisTrendCards cells={sparklineCells} width={contentW} periodLabel={currentWindow.genitive} />
              </BloomOnChange>

              <View style={{ marginTop: 24 }}>
                {showListView ? (
                  <InsightsListView
                    points={dailyPoints}
                    onSelectDate={openEntry}
                    onShowChart={() => setShowListView(false)}
                  />
                ) : (
                  <AxisTrendChart
                    points={dailyPoints}
                    width={contentW}
                    onSelectDate={openEntry}
                    onShowList={() => setShowListView(true)}
                  />
                )}
              </View>
            </>
          )}
        </View>

        {/* Sekcja 5 — Porównanie z poprzednim okresem (ukryte tymczasowo, do dopracowania) */}
        {false && currentWindow.days !== 'all' && (
          <View style={{ marginTop: 40 }}>
            <Text variant="h3" style={{ marginBottom: 8 }}>
              Porównanie okresów
            </Text>
            <Text variant="body" tone="muted" style={{ marginBottom: 16 }}>
              Jak wypadają ostatnie {currentWindow.label} na tle poprzedniego takiego samego okresu.
            </Text>
            {windowed.length < 3 || previousWindowed.length < 3 ? (
              <Text variant="body" tone="muted">
                {fewEntriesMessage(
                  Math.min(windowed.length, previousWindowed.length),
                  'porównać ten okres z poprzednim',
                )}
              </Text>
            ) : (
              <PeriodComparison
                comparisons={comparisons}
                currentCount={windowed.length}
                previousCount={previousWindowed.length}
                currentDay={avg}
                previousDay={previousAvg}
                dna={dna}
                dnaSeed={dnaSeed}
                width={contentW}
              />
            )}
          </View>
        )}

        {/* Sekcja 6 — Tagi */}
        <View style={{ marginTop: 40 }}>
          <Text variant="h3" style={{ marginBottom: 12 }}>
            Co Cię spotykało
          </Text>
          <TagsSummary good={tags.good} hard={tags.hard} total={tags.total} />
        </View>

        {/* Sekcja 6b — Grupy dni wg tagów */}
        <View style={{ marginTop: 40 }}>
          <Text variant="h3" style={{ marginBottom: 8 }}>
            Dobre i trudne dni
          </Text>
          <Text variant="body" tone="muted" style={{ marginBottom: 16 }}>
            Jak wyglądały sześć obszarów w dniach z różnymi tagami — bez sugerowania, że jedno powoduje drugie.
          </Text>
          {windowed.length === 0 ? (
            <Text variant="body" tone="muted">
              {fewEntriesMessage(0, 'zobaczyć podział na dobre i trudne dni')}
            </Text>
          ) : (
            <MomentGroups groups={groups} coOccurrence={coOccurrence} />
          )}
        </View>

        {/* Sekcja 20 — Co zauważyliśmy */}
        <View style={{ marginTop: 40 }}>
          <Text variant="h3" style={{ marginBottom: 12 }}>
            Co zauważyliśmy
          </Text>
          <InsightCard insights={insights} entriesCount={windowed.length} confident={confidentInsights} />
        </View>

        {/* Sekcja 7 — Chmura słów */}
        <View style={{ marginTop: 40 }}>
          <Text variant="h3" style={{ marginBottom: 8 }}>
            Słowa z notatek
          </Text>
          <Text variant="body" tone="muted" style={{ marginBottom: 16 }}>
            Co najczęściej pojawia się w Twoich notatkach.
          </Text>
          <WordCloud words={words} />
        </View>

        {/* Data update timestamp / footer */}
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <Text variant="mono" tone="muted">
            {todayIso()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WindowPicker({
  current,
  onSelect,
}: {
  current: (typeof WINDOWS)[number]['key'];
  onSelect: (k: (typeof WINDOWS)[number]['key']) => void;
}) {
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {WINDOWS.map((w) => {
        const active = w.key === current;
        return (
          <Pressable
            key={w.key}
            onPress={() => onSelect(w.key)}
            accessibilityLabel={`okno ${w.label}`}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: active ? '#1A1614' : 'transparent',
              borderWidth: 1,
              borderColor: active ? '#1A1614' : '#E1D8CE',
            }}
          >
            <Text
              variant="caption"
              style={{ color: active ? '#F6F6EA' : '#1A1614', letterSpacing: 0.3 }}
            >
              {w.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
