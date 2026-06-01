// Pasek nad polem notatki: mikrofon (zawsze) + formatowanie (tylko na webie,
// kiedy edytor Tiptap jest dostępny).
//
// Przyciski formatowania działają na żywej instancji edytora (jeśli istnieje).
// Aktualnie aktywne formatowanie podświetlamy delikatnym tłem.

import { Platform, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Editor } from '@tiptap/react';
import { Text } from '../ui/text';
import { DictateButton } from './DictateButton';

type Props = {
  onTranscribed: (text: string) => void;
  /** Web-only. Na natywne null. */
  editor: Editor | null;
};

function ToolbarBtn({
  onPress,
  active,
  label,
  children,
}: {
  onPress: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        backgroundColor: active ? 'rgba(26,22,20,0.08)' : 'transparent',
      }}
    >
      {children}
    </Pressable>
  );
}

function BoldIcon({ color = '#1A1614' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4h6a4 4 0 0 1 0 8H7V4Zm0 8h7a4 4 0 0 1 0 8H7v-8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ItalicIcon({ color = '#1A1614' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M10 4h8M6 20h8M14 4l-4 16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ListIcon({ color = '#1A1614' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function NoteEditorToolbar({ onTranscribed, editor }: Props) {
  const isWeb = Platform.OS === 'web';
  const canFormat = isWeb && !!editor;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingVertical: 4,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {canFormat && editor ? (
          <>
            <ToolbarBtn
              onPress={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              label="pogrubienie"
            >
              <BoldIcon />
            </ToolbarBtn>
            <ToolbarBtn
              onPress={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              label="kursywa"
            >
              <ItalicIcon />
            </ToolbarBtn>
            <ToolbarBtn
              onPress={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              label="lista"
            >
              <ListIcon />
            </ToolbarBtn>
          </>
        ) : (
          // Placeholder po lewej, żeby DictateButton wylądował po prawej.
          <Text variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
            notatka
          </Text>
        )}
      </View>

      <DictateButton onTranscribed={onTranscribed} />
    </View>
  );
}
