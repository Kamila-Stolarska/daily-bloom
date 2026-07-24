// "Co zauważyliśmy" — krótkie obserwacje tekstowe (reguły, bez LLM w MVP).
// Zawsze jasno oznaczone jako obserwacja z podstawą liczbową, nie diagnoza.

import { View } from 'react-native';
import { Text } from './ui/text';

type Props = {
  insights: string[];
  entriesCount: number;
  confident: boolean;
};

export function InsightCard({ insights, entriesCount, confident }: Props) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E1D8CE',
        backgroundColor: '#FBFAF1',
        padding: 18,
      }}
    >
      <Text variant="mono" style={{ fontSize: 10, color: '#7A6F62', letterSpacing: 0.5, marginBottom: 10 }}>
        CO ZAUWAŻYLIŚMY
      </Text>
      {insights.length === 0 ? (
        <Text variant="body" tone="muted">
          Zbieramy jeszcze dane, aby móc pokazać Ci bardziej wiarygodne wzorce.
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          {insights.map((line, i) => (
            <Text key={i} variant="body">
              {line}
            </Text>
          ))}
        </View>
      )}
      {insights.length > 0 && (
        <Text variant="caption" tone="muted" style={{ marginTop: 10 }}>
          Na podstawie {entriesCount} {entriesCount === 1 ? 'wpisu' : 'wpisów'}.
          {!confident ? ' Obraz może się jeszcze zmieniać wraz z kolejnymi wpisami.' : ''}
        </Text>
      )}
    </View>
  );
}
