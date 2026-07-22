// MVP chmury słów: flex-wrap <Text> z fontSize proporcjonalnym do częstotliwości.

import { View } from 'react-native';
import { Text } from './ui/text';

type Props = {
  words: Array<{ word: string; count: number }>;
};

const MIN_FS = 12;
const MAX_FS = 32;

export function WordCloud({ words }: Props) {
  if (words.length === 0) {
    return (
      <Text variant="body" tone="muted">
        Jeszcze nic tu nie ma — dopisz kilka notatek, żeby zobaczyć wzorce.
      </Text>
    );
  }
  const maxCount = words[0].count;
  const minCount = words[words.length - 1].count;
  const range = Math.max(maxCount - minCount, 1);
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: 10,
      }}
    >
      {words.map(({ word, count }) => {
        const t = (count - minCount) / range;
        const fs = Math.round(MIN_FS + t * (MAX_FS - MIN_FS));
        const opacity = 0.5 + t * 0.5;
        return (
          <Text
            key={word}
            variant="body"
            style={{
              fontSize: fs,
              lineHeight: fs + 4,
              color: '#3B342C',
              opacity,
            }}
          >
            {word}
          </Text>
        );
      })}
    </View>
  );
}
