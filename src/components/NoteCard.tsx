// Karta pojedynczej notatki — używana na home (read-only) i w note.tsx (z usuń + dodaj zdjęcia).
// Pod tekstem pasek miniatur zdjęć przypiętych do tej notatki; tap → fullscreen preview,
// long-press → usuń.

import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Note } from '../lib/store';
import { Text } from './ui/text';
import { EntryPhotosStrip } from './note/EntryPhotosStrip';
import { AttachPhotosButton } from './note/AttachPhotosButton';

function TrashIcon({ size = 18, color = '#7A6F62' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
  /** Czy renderować plusik do dorzucania kolejnych zdjęć (true w edytorze, false na home). */
  allowAttach?: boolean;
};

export function NoteCard({ note, onPress, onDelete, allowAttach }: Props) {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {allowAttach && <AttachPhotosButton noteId={note.id} />}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="usuń notatkę"
            >
              <TrashIcon />
            </Pressable>
          )}
        </View>
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
        {note.text.trim().length > 0 && (
          <Text variant="body" style={{ color: '#1A1614', lineHeight: 24 }}>
            {note.text}
          </Text>
        )}
        <EntryPhotosStrip noteId={note.id} />
      </Wrapper>
    </View>
  );
}
