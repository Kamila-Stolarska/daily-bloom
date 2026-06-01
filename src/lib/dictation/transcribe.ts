// Klient transkrypcji — wysyła plik audio do /api/transcribe (proxy do Groq Whisper).
//
// Routing URL:
// - Jeśli EXPO_PUBLIC_API_BASE jest ustawione → użyj go (działa wszędzie: web, iOS, prod).
//   Sensowne wartości:
//     - dev z Metro (8081) + Vercel dev (3000) → "http://localhost:3000"
//     - iOS symulator/urządzenie → URL preview Vercela ("https://...vercel.app")
// - Inaczej na webie → relative "/api/transcribe" (działa pod `vercel dev` i produkcji).

import { Platform } from 'react-native';

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

function endpoint(): string {
  if (API_BASE) return `${API_BASE}/api/transcribe`;
  if (Platform.OS === 'web') return '/api/transcribe';
  throw new Error(
    'EXPO_PUBLIC_API_BASE nie jest ustawione. Dodaj w .env.local URL backendu (np. https://daily-bloom.vercel.app albo http://localhost:3000 dla dev).',
  );
}

export type TranscribeInput =
  | { kind: 'blob'; blob: Blob; filename?: string }
  | { kind: 'uri'; uri: string; filename: string; mimeType: string };

export async function transcribeAudio(input: TranscribeInput, language = 'pl'): Promise<string> {
  const fd = new FormData();

  if (input.kind === 'blob') {
    fd.append('file', input.blob, input.filename ?? 'audio.webm');
  } else {
    // React Native FormData — przyjmuje { uri, name, type } jako "polyfill" pliku.
    // To nieudokumentowane w typach FormData (DOM), ale to natywny sposób w RN.
    fd.append('file', {
      uri: input.uri,
      name: input.filename,
      type: input.mimeType,
    } as any);
  }

  fd.append('language', language);

  const url = endpoint();
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: fd });
  } catch (e: any) {
    // Najczęściej: CORS, brak serwera (np. localhost:3000 niewstarte), zerwane połączenie.
    throw new Error(`Nie udało się połączyć z ${url}. Czy backend (vercel dev) działa? (${e?.message ?? e})`);
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`Transcription failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  // Defensywnie — jeśli serwer (np. Metro przy fetch do nieistniejącej ścieżki)
  // zwrócił HTML zamiast JSON, dajemy konkretny komunikat, a nie surowy SyntaxError.
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { text?: string };
    return (data.text ?? '').trim();
  } catch {
    throw new Error(
      `Serwer odpowiedział nie-JSON-em (prawdopodobnie wołasz Metro zamiast Vercel dev). Pierwsze 80 znaków: ${text.slice(0, 80)}`,
    );
  }
}
