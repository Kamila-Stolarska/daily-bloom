// Dwie karty: "Coś dobrego" i "Coś trudnego" — liczba dni + procent.
// Ton wspierający, zgodnie z CLAUDE.md (bez negatywnych skojarzeń).

import { View } from 'react-native';
import { Text } from './ui/text';

type Props = {
  good: number;
  hard: number;
  total: number;
};

function pct(part: number, whole: number): string {
  if (whole === 0) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FBFAF1',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1D8CE',
        paddingVertical: 16,
        paddingHorizontal: 16,
      }}
    >
      <Text variant="mono" style={{ fontSize: 10, color: '#7A6F62', letterSpacing: 0.5, marginBottom: 8 }}>
        {label.toUpperCase()}
      </Text>
      <Text variant="display" style={{ fontSize: 28, lineHeight: 32 }}>
        {value}
      </Text>
      <Text variant="caption" tone="muted" style={{ marginTop: 6 }}>
        {sub}
      </Text>
    </View>
  );
}

export function TagsSummary({ good, hard, total }: Props) {
  return (
    <View className="flex-row" style={{ gap: 12 }}>
      <Card
        label="Coś dobrego"
        value={`${good}`}
        sub={total > 0 ? `${pct(good, total)} dni` : 'jeszcze bez wpisów'}
      />
      <Card
        label="Coś trudnego"
        value={`${hard}`}
        sub={total > 0 ? `${pct(hard, total)} dni` : 'jeszcze bez wpisów'}
      />
    </View>
  );
}
