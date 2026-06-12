// Przycisk "+" obok mikrofonu / w karcie notatki — otwiera wybór źródła zdjęcia
// (aparat lub galeria) i przypina je do konkretnej notatki (`noteId`). Jeśli notatka
// jeszcze nie istnieje (composer dla nowej notatki), woła `onBeforeUpload()` żeby tę
// notatkę utworzyć i dostać świeży `noteId`.

import { useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { useStore, type Photo } from '../../lib/store';

type Props = {
  noteId: string | null;
  /** Wywoływane przy pierwszym uploadzie gdy `noteId === null`. Zwraca świeży id. */
  onBeforeUpload?: () => Promise<string>;
  onAdded?: (photos: Photo[]) => void;
};

function PlusIcon({ color = '#1A1614' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

async function assetToUploadInput(
  asset: ImagePicker.ImagePickerAsset,
): Promise<{ data: ArrayBuffer; contentType: string; width?: number; height?: number }> {
  // ArrayBuffer zamiast Blob — Blob na React Native bywa pusty (0 bajtów) po fetch z file://.
  // ArrayBuffer działa spójnie na web i native.
  const res = await fetch(asset.uri);
  const buf = await res.arrayBuffer();
  const headerType = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
  const contentType = asset.mimeType || headerType || 'image/jpeg';
  return {
    data: buf,
    contentType,
    width: asset.width,
    height: asset.height,
  };
}

export function AttachPhotosButton({ noteId, onBeforeUpload, onAdded }: Props) {
  const addPhoto = useStore((s) => s.addPhoto);
  const [busy, setBusy] = useState(false);

  async function pickFromLibrary() {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Brak dostępu do zdjęć', 'Pozwól na dostęp do biblioteki zdjęć w ustawieniach.');
        return null;
      }
    }
    return ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.85,
      exif: false,
      base64: false,
    });
  }

  async function takePhoto() {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Brak dostępu do aparatu', 'Pozwól na dostęp do aparatu w ustawieniach.');
        return null;
      }
    }
    return ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      exif: false,
      base64: false,
    });
  }

  async function processResult(result: ImagePicker.ImagePickerResult | null) {
    if (!result || result.canceled || result.assets.length === 0) return;
    setBusy(true);
    const added: Photo[] = [];
    try {
      let effectiveNoteId = noteId;
      if (!effectiveNoteId) {
        if (!onBeforeUpload) {
          throw new Error('AttachPhotosButton: noteId null and no onBeforeUpload');
        }
        effectiveNoteId = await onBeforeUpload();
      }
      for (const asset of result.assets) {
        try {
          const input = await assetToUploadInput(asset);
          const photo = await addPhoto(effectiveNoteId, input);
          added.push(photo);
        } catch (e) {
          console.warn('photo upload failed:', e);
        }
      }
      if (added.length > 0) onAdded?.(added);
      if (added.length < result.assets.length) {
        Alert.alert('Niektóre zdjęcia się nie wgrały', 'Spróbuj ponownie za chwilę.');
      }
    } catch (e) {
      console.warn('AttachPhotosButton failed:', e);
      Alert.alert('Nie udało się dodać zdjęć', 'Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePress() {
    if (busy) return;

    // Web: od razu wołamy launchImageLibraryAsync. expo-image-picker tworzy
    // `<input type="file" accept="image/*">`, a iOS Safari sam pokazuje swój
    // natywny action sheet z opcjami "Biblioteka zdjęć / Zrób zdjęcie / Wybierz
    // pliki" — nie potrzebujemy własnego potwierdzenia.
    if (Platform.OS === 'web') {
      await processResult(await pickFromLibrary());
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Anuluj', 'Zrób zdjęcie', 'Wybierz z galerii'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) await processResult(await takePhoto());
          if (buttonIndex === 2) await processResult(await pickFromLibrary());
        },
      );
      return;
    }

    // Android — Alert z trzema opcjami (brak natywnego ActionSheet).
    Alert.alert('Dodaj zdjęcie', undefined, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Zrób zdjęcie', onPress: async () => processResult(await takePhoto()) },
      { text: 'Wybierz z galerii', onPress: async () => processResult(await pickFromLibrary()) },
    ]);
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="dodaj zdjęcie"
      style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        opacity: busy ? 0.5 : 1,
      }}
    >
      {busy ? <ActivityIndicator size="small" color="#1A1614" /> : <PlusIcon />}
    </Pressable>
  );
}
