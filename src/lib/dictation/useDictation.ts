// Hook nagrywania głosu — platforma-agnostyczny interface, dwa silniki:
// - web: MediaRecorder + getUserMedia
// - native: expo-audio (AudioRecorder + RecordingPresets)
//
// Stany: idle | requesting-permission | recording | transcribing | error
// Po stop() automatycznie POST do /api/transcribe i wywołanie onTranscribed.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { transcribeAudio, TranscribeInput } from './transcribe';

export type DictationState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'transcribing'
  | 'error';

export type UseDictationOptions = {
  onTranscribed: (text: string) => void;
  /** Maksymalny czas nagrania w sekundach. Po przekroczeniu auto-stop. */
  maxDurationSec?: number;
};

export type UseDictationReturn = {
  state: DictationState;
  error: string | null;
  durationSec: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
};

const DEFAULT_MAX = 300; // 5 min — zabezpieczenie przed user'em który zostawia włączone.

export function useDictation({ onTranscribed, maxDurationSec = DEFAULT_MAX }: UseDictationOptions): UseDictationReturn {
  const [state, setState] = useState<DictationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  // Web refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Native refs — lazy-loaded żeby nie crashować na webie
  const nativeRecorderRef = useRef<any>(null);

  // Wspólne
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearTimers();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    nativeRecorderRef.current = null;
  }, [clearTimers]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setError(null);
    setDurationSec(0);
  }, [cleanup]);

  const beginTimers = useCallback(() => {
    startedAtRef.current = Date.now();
    setDurationSec(0);
    tickRef.current = setInterval(() => {
      setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    autoStopRef.current = setTimeout(() => {
      // Wywołanie z poziomu timera — useRef do funkcji stop nie potrzebny, bo
      // stop jest stabilny przez useCallback, ale wywołujemy globalnie zdefiniowany.
      void stopRef.current?.();
    }, maxDurationSec * 1000);
  }, [maxDurationSec]);

  // Trick: stop trzyma referencje do refs, definiujemy ją bezpośrednio, ale
  // autoStop powyżej musi widzieć aktualną wersję — używamy ref-to-fn.
  const stopRef = useRef<(() => Promise<void>) | null>(null);

  const start = useCallback(async () => {
    if (state === 'recording' || state === 'transcribing' || state === 'requesting-permission') return;
    setError(null);
    setState('requesting-permission');

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Twoja przeglądarka nie wspiera nagrywania audio.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Wybór mime — webm/opus najlepiej wspierany. Safari preferuje audio/mp4.
        // UWAGA: nie ufamy `isTypeSupported` — Safari potrafi powiedzieć "tak",
        // po czym konstruktor rzuca SyntaxError ("did not match the expected pattern").
        // Próbujemy więc faktycznie konstruować i lecimy po kolei.
        const recorder = createMediaRecorderSafely(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } else {
        // Native: dynamic import, żeby web bundle nie pociągnął expo-audio.
        const ExpoAudio = await import('expo-audio');
        const { AudioModule, RecordingPresets, AudioRecorder } = ExpoAudio as any;

        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) {
          throw new Error('Brak zgody na mikrofon. Zmień to w ustawieniach systemowych.');
        }

        const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
        await recorder.prepareToRecordAsync();
        recorder.record();
        nativeRecorderRef.current = recorder;
      }

      beginTimers();
      setState('recording');
    } catch (e: any) {
      cleanup();
      setError(humanizeMediaError(e));
      setState('error');
      // Auto-reset po 3s
      setTimeout(() => {
        setState((s) => (s === 'error' ? 'idle' : s));
        setError(null);
      }, 3500);
    }
  }, [state, beginTimers, cleanup]);

  const stop = useCallback(async () => {
    if (state !== 'recording') return;
    clearTimers();

    try {
      let payload: TranscribeInput;

      if (Platform.OS === 'web') {
        const recorder = mediaRecorderRef.current;
        if (!recorder) throw new Error('Brak aktywnego nagrania.');

        const stopped = new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
        });
        recorder.stop();
        await stopped;

        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];

        // Wyczyść stream żeby zgasł czerwony wskaźnik mikrofonu w przeglądarce.
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
        payload = { kind: 'blob', blob, filename: `audio.${ext}` };
      } else {
        const recorder = nativeRecorderRef.current;
        if (!recorder) throw new Error('Brak aktywnego nagrania.');
        await recorder.stop();
        const uri: string | null = recorder.uri;
        if (!uri) throw new Error('Brak pliku nagrania.');
        // expo-audio HIGH_QUALITY domyślnie m4a (AAC) — kompatybilne z Whisperem.
        payload = { kind: 'uri', uri, filename: 'audio.m4a', mimeType: 'audio/m4a' };
      }

      setState('transcribing');
      const text = await transcribeAudio(payload);
      if (text) {
        // Dodajemy trailing space, żeby user mógł od razu pisać dalej.
        onTranscribed(text.endsWith(' ') ? text : text + ' ');
      }
      cleanup();
      setState('idle');
      setDurationSec(0);
    } catch (e: any) {
      cleanup();
      setError(humanizeMediaError(e));
      setState('error');
      setTimeout(() => {
        setState((s) => (s === 'error' ? 'idle' : s));
        setError(null);
      }, 3500);
    }
  }, [state, clearTimers, cleanup, onTranscribed]);

  // Trzymamy świeży stop dla auto-stop timera.
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  return { state, error, durationSec, start, stop, reset };
}

/** Próbuje skonstruować MediaRecorder z kolejnymi mime, padając wstecz na "bez mime".
 *  isTypeSupported() kłamie w Safari, dlatego konstruujemy realnie i łapiemy SyntaxError. */
function createMediaRecorderSafely(stream: MediaStream): MediaRecorder {
  const candidates: (string | undefined)[] = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4', // Safari — bez sufiksu codec, bo z nim rzuca "did not match the expected pattern"
    'audio/ogg;codecs=opus',
    undefined, // fallback: niech przeglądarka wybierze sama
  ];
  // 32 kbps Opus = wystarczająco dla mowy (Whisper i tak resampluje do 16kHz mono).
  // Default ~128 kbps to ~4× więcej do uploadu bez zysku jakości transkrypcji.
  const LOW_BITRATE = 32000;
  const attempted: Array<{ mime: string | undefined; err?: string }> = [];
  for (const mime of candidates) {
    try {
      return new MediaRecorder(
        stream,
        mime ? { mimeType: mime, audioBitsPerSecond: LOW_BITRATE } : { audioBitsPerSecond: LOW_BITRATE },
      );
    } catch (e: any) {
      attempted.push({ mime, err: `${e?.name ?? 'Error'}: ${e?.message ?? ''}` });
      continue;
    }
  }
  // Awaryjnie — bez żadnych argumentów (niektóre buildy Chromium tego wymagają).
  try {
    return new MediaRecorder(stream);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[dictation] MediaRecorder construction failed in all variants:', attempted, 'last:', e);
    const finalErr = new Error(
      `MediaRecorder nie chce ruszyć. Sprawdź konsolę. (${e?.name ?? 'Error'}: ${e?.message ?? ''})`,
    );
    (finalErr as any).name = e?.name ?? 'Error';
    throw finalErr;
  }
}

/** Mapuje DOMException na zrozumiały komunikat PL. Loguje pełny błąd do konsoli. */
function humanizeMediaError(e: any): string {
  // eslint-disable-next-line no-console
  console.error('[dictation] error:', e?.name, e?.message, e);
  const name: string = e?.name ?? '';
  const msg: string = e?.message ?? '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Mikrofon zablokowany. Kliknij kłódkę przy adresie → Mikrofon → Zezwól, potem odśwież.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Nie znaleziono mikrofonu w systemie.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Mikrofon zajęty przez inną aplikację. Zamknij ją i spróbuj ponownie.';
  }
  if (name === 'SecurityError') {
    return 'Mikrofon działa tylko na https lub localhost.';
  }
  // Generyczny fallback — pokazujemy realny komunikat, żeby user mógł podać go nam.
  return `${name ? name + ': ' : ''}${msg || 'nieznany błąd nagrywania'}`;
}
