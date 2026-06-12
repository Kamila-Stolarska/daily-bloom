// Pasek miniatur zdjęć dla danej notatki. Tap → preview (modal), long-press → menu usuwania.
// Sygnowane URLs są generowane przez `db/photos.ts` przy hydratacji (TTL 1h).

import { useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore, type Photo } from '../../lib/store';

const THUMB_SIZE = 72;
const EMPTY_PHOTOS: Photo[] = [];

type Props = {
  noteId: string;
};

function CloseIcon({ color = '#FBFAF1' }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon({ color = '#FBFAF1' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EntryPhotosStrip({ noteId }: Props) {
  const photos = useStore((s) => s.photosByNoteId[noteId] ?? EMPTY_PHOTOS);
  const removePhoto = useStore((s) => s.removePhoto);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) return null;

  function confirmRemove(photo: Photo) {
    const doRemove = async () => {
      try {
        await removePhoto(noteId, photo);
      } catch (e) {
        console.warn('removePhoto failed:', e);
        Alert.alert('Nie udało się usunąć', 'Spróbuj ponownie.');
      }
    };
    if (Platform.OS === 'web') {
      // Web Alert.alert nie blokuje — używamy confirm.
      if (typeof window !== 'undefined' && window.confirm('Usunąć to zdjęcie?')) {
        void doRemove();
      }
      return;
    }
    Alert.alert('Usunąć zdjęcie?', 'Tego nie da się cofnąć.', [
      { text: 'anuluj', style: 'cancel' },
      { text: 'usuń', style: 'destructive', onPress: () => void doRemove() },
    ]);
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4, gap: 8 }}
        style={{ marginBottom: 12 }}
      >
        {photos.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setPreviewPhoto(p)}
            onLongPress={() => confirmRemove(p)}
            delayLongPress={350}
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: 'rgba(26,22,20,0.08)',
            }}
          >
            {p.signedUrl ? (
              <Image source={{ uri: p.signedUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={previewPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <Pressable
          onPress={() => setPreviewPhoto(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          {previewPhoto?.signedUrl ? (
            <Image
              source={{ uri: previewPhoto.signedUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          ) : null}
          {/* Close (X) — top-right */}
          <Pressable
            onPress={() => setPreviewPhoto(null)}
            hitSlop={10}
            accessibilityLabel="zamknij podgląd"
            style={{
              position: 'absolute',
              top: 48,
              right: 24,
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon color="#FBFAF1" />
          </Pressable>
          {/* Delete — top-left, osobno od close, żeby tap-out nie kasował */}
          <Pressable
            onPress={() => {
              if (!previewPhoto) return;
              const p = previewPhoto;
              setPreviewPhoto(null);
              confirmRemove(p);
            }}
            hitSlop={10}
            accessibilityLabel="usuń zdjęcie"
            style={{
              position: 'absolute',
              top: 48,
              left: 24,
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrashIcon color="#FBFAF1" />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
