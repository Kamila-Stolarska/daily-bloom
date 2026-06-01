// Web-only edytor notatki oparty o Tiptap (ProseMirror).
// Ten plik wybierany jest automatycznie przez Metro dla platformy web
// (`.web.tsx` ma priorytet). Na iOS/Android ładowany jest `NoteEditor.tsx`.
//
// Imperatywne API zgodne z natywnym wariantem — rodzic woła np. insertAtCursor()
// i nie wie/nie obchodzi go, czy pod spodem jest TextInput czy ProseMirror.

import * as React from 'react';
import { View } from 'react-native';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export type NoteEditorHandle = {
  insertAtCursor: (text: string) => void;
  focus: () => void;
  getValue: () => string;
  /** Web-only: zwraca instancję edytora do toolbara (bold/italic/list). */
  getEditor: () => Editor | null;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  onContentSizeChange?: (height: number) => void;
  /** Wysokość liniowania — musi się zgadzać z PaperLines w rodzicu. */
  lineHeight?: number;
  autoFocus?: boolean;
};

export const NoteEditor = React.forwardRef<NoteEditorHandle, Props>(function NoteEditor(
  { value, onChange, placeholder, onContentSizeChange, lineHeight = 32, autoFocus = true },
  ref,
) {
  const containerRef = React.useRef<View | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Dropujemy rzeczy, których nie chcemy w notatce dzienniczkowej.
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
    ],
    content: valueToHtml(value),
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        // Te klasy + inline style spinają typografię z resztą aplikacji.
        class: 'note-tiptap font-serif',
        style: `font-size:17px;line-height:${lineHeight}px;outline:none;color:#1A1614;min-height:${lineHeight * 8}px;`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  // Trzymamy edytor i ostatnio wysłany text w sync z value z parenta —
  // tylko jeśli value zmienione z ZEWNĄTRZ (nie własny onUpdate, żeby nie deptać kursora).
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getText();
    if (current !== value) {
      editor.commands.setContent(valueToHtml(value), { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  // ResizeObserver → onContentSizeChange — żeby PaperLines rósł z treścią.
  React.useEffect(() => {
    if (!onContentSizeChange) return;
    const dom = editor?.view?.dom;
    if (!dom || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const h = e.contentRect.height;
        onContentSizeChange(h);
      }
    });
    ro.observe(dom);
    return () => ro.disconnect();
  }, [editor, onContentSizeChange]);

  React.useImperativeHandle(
    ref,
    () => ({
      getValue: () => editor?.getText() ?? '',
      focus: () => editor?.commands.focus(),
      getEditor: () => editor ?? null,
      insertAtCursor: (text: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(text).run();
      },
    }),
    [editor],
  );

  return (
    <View ref={containerRef} style={{ position: 'relative' }}>
      <EditorContent editor={editor} />
    </View>
  );
});

/** Plain text → minimalny HTML (paragrafy z podziału linii). */
function valueToHtml(v: string): string {
  if (!v) return '';
  // Tiptap StarterKit oczekuje <p> — splitujemy na linie i robimy paragrafy.
  return v
    .split(/\n\n+/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
