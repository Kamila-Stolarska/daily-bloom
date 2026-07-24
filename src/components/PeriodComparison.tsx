// Porównanie bieżącego okresu z poprzednim (sekcja 9 specyfikacji Insights).
// Dwa małe kwiaty obok siebie + wykres typu "dumbbell": dla każdego obszaru
// punkt "wcześniej" i "teraz" na wspólnej skali 1–5, połączone paskiem —
// zielonym gdy lepiej niż poprzednio, czerwonym gdy gorzej, szarym gdy podobnie.
// Bez procentów — skala 1–5 nie jest naturalnie procentowa.

import { View } from 'react-native';
import { Text } from './ui/text';
import { FlowerLazy } from './FlowerLazy';
import type { Dna } from '../lib/flower/dna';
import { AXIS_LABELS_PL, type DayData } from '../lib/flower/types';
import type { MetricComparison } from '../lib/insights/types';

type Props = {
  comparisons: MetricComparison[];
  currentCount: number;
  previousCount: number;
  currentDay: DayData;
  previousDay: DayData;
  dna: Dna;
  dnaSeed: number;
  width: number;
};

const CARD_BG = '#FBFAF1';
const CARD_BORDER = '#E1D8CE';
const IMPROVE_COLOR = '#5E7635'; // jak "coś dobrego" na wykresie trendu
const DECLINE_COLOR = '#A8433A'; // jak "coś trudnego" na wykresie trendu
const NEUTRAL_COLOR = '#B7AD9E';
const CARD_PAD = 18;
const EDGE_PAD = 26;
const ROW_H = 92;

function directionLabel(c: MetricComparison): string {
  if (c.direction === 'insufficient_data') return 'za mało danych';
  if (c.direction === 'similar') return 'podobnie';
  const abs = Math.abs(c.difference ?? 0);
  const strength = abs >= 0.5 ? 'wyraźnie' : 'nieco';
  const word = c.direction === 'higher' ? 'wyżej' : 'niżej';
  return `${strength} ${word}`;
}

function directionColor(c: MetricComparison): string {
  if (c.direction === 'higher') return IMPROVE_COLOR;
  if (c.direction === 'lower') return DECLINE_COLOR;
  return NEUTRAL_COLOR;
}

function formatValue(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(1).replace('.', ',');
}

function ComparisonRow({ c, trackW }: { c: MetricComparison; trackW: number }) {
  const color = directionColor(c);
  const usableW = Math.max(trackW - EDGE_PAD * 2, 20);
  const xFor = (v: number) => EDGE_PAD + ((v - 1) / 4) * usableW;

  if (c.previousAverage === null || c.currentAverage === null) {
    return (
      <View style={{ height: ROW_H, justifyContent: 'center' }}>
        <Text variant="body" style={{ fontWeight: '700', textAlign: 'center' }}>
          {AXIS_LABELS_PL[c.metric]}
        </Text>
        <Text variant="caption" tone="muted" style={{ textAlign: 'center', marginTop: 4 }}>
          za mało danych
        </Text>
      </View>
    );
  }

  const leftX = xFor(c.previousAverage);
  const rightX = xFor(c.currentAverage);
  const segLeft = Math.min(leftX, rightX);
  const segW = Math.max(Math.abs(rightX - leftX), 4);

  return (
    <View style={{ height: ROW_H }}>
      <Text variant="caption" style={{ textAlign: 'center', fontWeight: '700', letterSpacing: 0.3 }}>
        {AXIS_LABELS_PL[c.metric]}
      </Text>

      <View style={{ position: 'relative', height: 16, marginTop: 10 }}>
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: segLeft,
            width: segW,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: leftX - 8,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: CARD_BG,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: rightX - 8,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: CARD_BG,
          }}
        />
      </View>

      <View style={{ position: 'relative', height: 18, marginTop: 6 }}>
        <Text
          variant="caption"
          tone="muted"
          style={{ position: 'absolute', top: 0, left: leftX - 16, width: 32, textAlign: 'center' }}
        >
          {formatValue(c.previousAverage)}
        </Text>
        <Text
          variant="caption"
          tone="muted"
          style={{ position: 'absolute', top: 0, left: rightX - 16, width: 32, textAlign: 'center' }}
        >
          {formatValue(c.currentAverage)}
        </Text>
      </View>

      <Text variant="caption" style={{ textAlign: 'center', marginTop: 2, color }}>
        {directionLabel(c)}
      </Text>
    </View>
  );
}

export function PeriodComparison({
  comparisons,
  currentCount,
  previousCount,
  currentDay,
  previousDay,
  dna,
  dnaSeed,
  width,
}: Props) {
  const flowerSize = 84;
  const trackW = Math.max(width - CARD_PAD * 2, 40);

  return (
    <View>
      <View className="flex-row items-center justify-center" style={{ gap: 24, marginBottom: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <FlowerLazy dna={dna} day={previousDay} size={flowerSize} dnaSeed={dnaSeed} grain={false} />
          <Text variant="caption" tone="muted" style={{ marginTop: 8 }}>
            wcześniej · {previousCount} {previousCount === 1 ? 'wpis' : 'wpisów'}
          </Text>
        </View>
        <Text variant="body" tone="muted">→</Text>
        <View style={{ alignItems: 'center' }}>
          <FlowerLazy dna={dna} day={currentDay} size={flowerSize} dnaSeed={dnaSeed} grain={false} />
          <Text variant="caption" tone="muted" style={{ marginTop: 8 }}>
            teraz · {currentCount} {currentCount === 1 ? 'wpis' : 'wpisów'}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: CARD_BG,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: CARD_BORDER,
          padding: CARD_PAD,
        }}
      >
        {comparisons.map((c, i) => (
          <View
            key={c.metric}
            style={
              i > 0 ? { marginTop: 6, borderTopWidth: 1, borderTopColor: CARD_BORDER, paddingTop: 6 } : undefined
            }
          >
            <ComparisonRow c={c} trackW={trackW} />
          </View>
        ))}
      </View>
    </View>
  );
}
