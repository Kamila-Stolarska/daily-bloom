// Native (iOS/Android) i fallback edytor notatki — surowy TextInput z trackingiem
// pozycji kursora, żeby DictateButton mógł wstawiać tekst w bieżącej selekcji.
//
// Tryb sterowany: rodzic trzyma `value` i dostaje update przez `onChange`.
// Imperatywne API przez ref:
//   - insertAtCursor(text): wstawia tekst w obecnej selekcji, zachowuje kursor po nim
//   - focus(): focus na input
//
// Web ma swój odpowiednik w NoteEditor.web.tsx (Tiptap) — ten plik tam nie wjeżdża
// dzięki rozdzieleniu Metro per platforma.

import * as React from 'react';
import { TextInput, TextInputSelectionChangeEventData, View, type NativeSyntheticEvent } from 'react-native';

export type NoteEditorHandle = {
  insertAtCursor: (text: string) => void;
  focus: () => void;
  getValue: () => string;
  /** Tylko na webie — zwraca instancję Tiptap. Na natywne zawsze null. */
  getEditor: () => null;
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
  const inputRef = React.useRef<TextInput | null>(null);
  // Trzymamy ostatnią znaną selekcję — TextInput nie udostępnia jej imperatywnie,
  // więc nasłuchujemy onSelectionChange i zapisujemy do refa.
  const selectionRef = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  // Kontrolowana selekcja — używamy tylko po wstawieniu tekstu, żeby przesunąć kursor.
  // Po jednym renderze ustawiamy z powrotem na undefined, żeby user mógł znowu klikać swobodnie.
  const [pendingSelection, setPendingSelection] = React.useState<{ start: number; end: number } | undefined>(undefined);

  // Trzymamy świeży value w refie, żeby insertAtCursor (stable forwardRef API)
  // operował na aktualnej wartości, bez re-binding po każdej zmianie.
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  React.useImperativeHandle(
    ref,
    () => ({
      getValue: () => valueRef.current,
      focus: () => inputRef.current?.focus(),
      getEditor: () => null,
      insertAtCursor: (text: string) => {
        const v = valueRef.current;
        const sel = selectionRef.current;
        const start = Math.max(0, Math.min(sel.start, v.length));
        const end = Math.max(start, Math.min(sel.end, v.length));
        const insert = text;
        const next = v.slice(0, start) + insert + v.slice(end);
        const caret = start + insert.length;
        onChange(next);
        // Po renderze ustawiamy kursor — pendingSelection wymusza jednorazowy override.
        setPendingSelection({ start: caret, end: caret });
        // I czyścimy go w next tick, żeby nie blokować dalszej edycji.
        requestAnimationFrame(() => setPendingSelection(undefined));
        inputRef.current?.focus();
      },
    }),
    [onChange],
  );

  const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    selectionRef.current = e.nativeEvent.selection;
  };

  return (
    <View style={{ position: 'relative' }}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onSelectionChange={handleSelectionChange}
        selection={pendingSelection}
        onContentSizeChange={(e) => onContentSizeChange?.(e.nativeEvent.contentSize.height)}
        placeholder={placeholder}
        placeholderTextColor="#7A6F6260"
        multiline
        textAlignVertical="top"
        autoFocus={autoFocus}
        className="font-serif text-ink"
        style={{ fontSize: 17, lineHeight, padding: 0, margin: 0, outlineStyle: 'none' } as any}
      />
    </View>
  );
});
