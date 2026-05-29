// Karta pojedynczej notatki — używana na home (read-only) i w note.tsx (z usuń).

import { Pressable, View } from 'react-native';
import type { Note } from '../lib/store';
import { Text } from './ui/text';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

type Props = {
  note: Note;
  onPress?: () => void;
  onDelete?: () => void;
};

export function NoteCard({ note, onPress, onDelete }: Props) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <View style={{ marginBottom: 12 }}>
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: 8, paddingHorizontal: 4 }}
      >
        <Text variant="mono" style={{ color: '#7A6F62' }}>
          {formatTime(note.createdAtIso)}
        </Text>
        {onDelete && (
          <Pressable onPress={onDelete} hitSlop={10}>
            <Text variant="caption" style={{ color: '#7A6F62' }}>
              usuń
            </Text>
          </Pressable>
        )}
      </View>
      <Wrapper
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        style={{
          backgroundColor: '#FBFAF1',
          borderRadius: 16,
          paddingHorizontal: 18,
          paddingVertical: 16,
        }}
      >
        <Text variant="body" style={{ color: '#1A1614', lineHeight: 24 }}>
          {note.text}
        </Text>
      </Wrapper>
    </View>
  );
}
