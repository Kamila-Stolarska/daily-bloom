// Alternatywny widok danych w formie listy (sekcja 22/25 — dostępność).
// Ten sam zakres co wykres trendu, ale jako zwykła, przewijana lista tekstowa:
// data + sześć wartości + tagi. Tylko dni z wpisem (luki są oczywiste — brak wiersza).

import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from './ui/text';
import { AXES, AXIS_LABELS_PL } from '../lib/flower/types';
import type { DailyInsightPoint } from '../lib/insights/types';
import { formatShortDatePl } from '../lib/dateLabels';

type Props = {
  points: DailyInsightPoint[];
  onSelectDate: (dateIso: string) => void;
  onShowChart: () => void;
};

const CARD_BORDER = '#E1D8CE';
const INK = '#1A1614';

function ChartIcon({ color = INK }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15l3.5-5 3 3L19 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function InsightsListView({ points, onSelectDate, onShowChart }: Props) {
  const withEntry = points.filter((p) => p.day !== null);

  const header = (
    <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
      <Text variant="h3">Lista wpisów</Text>
      <Pressable
        onPress={onShowChart}
        accessibilityRole="button"
        accessibilityLabel="pokaż wykres"
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: CARD_BORDER,
        }}
      >
        <ChartIcon />
      </Pressable>
    </View>
  );

  if (withEntry.length === 0) {
    return (
      <View>
        {header}
        <Text variant="caption" tone="muted">
          Brak wpisów w tym okresie.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {header}
      <View style={{ gap: 8 }}>
      {withEntry
        .slice()
        .reverse()
        .map((p) => {
          const tags = [
            p.hasGoodMoment ? 'coś dobrego' : null,
            p.hasDifficultMoment ? 'coś trudnego' : null,
          ].filter(Boolean).join(' · ');
          const values = AXES.map((a) => `${AXIS_LABELS_PL[a]} ${p[a]}/5`).join('  ·  ');
          return (
            <Pressable
              key={p.date}
              onPress={() => onSelectDate(p.date)}
              accessibilityLabel={`otwórz wpis z dnia ${formatShortDatePl(p.date)}`}
              style={{
                minHeight: 44,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E1D8CE',
                backgroundColor: '#FBFAF1',
              }}
            >
              <Text variant="body">{formatShortDatePl(p.date)}</Text>
              <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                {values}
              </Text>
              {tags ? (
                <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                  {tags}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
