// Przycisk mikrofonu w toolbarze notatki.
// Stany pokazane wizualnie: idle (mic), recording (stop + pulsująca kropka + timer),
// transcribing (spinner + napis), error (inline tekst 3s).
//
// Klik toggle: idle → recording → stop → transcribing → idle.

import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MotiView } from 'moti';
import { Text } from '../ui/text';
import { useDictation } from '../../lib/dictation/useDictation';

type Props = {
  onTranscribed: (text: string) => void;
  /** Wyświetl etykietę obok ikony (idle: "dyktuj"). Domyślnie false (tylko ikona). */
  showLabel?: boolean;
};

function MicIcon({ size = 18, color = '#1A1614' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 11a7 7 0 1 1-14 0M12 18v3"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StopIcon({ size = 14, color = '#F6F6EA' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={5} width={14} height={14} rx={2} fill={color} />
    </Svg>
  );
}

function Spinner({ size = 16, color = '#1A1614' }: { size?: number; color?: string }) {
  return (
    <MotiView
      from={{ rotate: '0deg' }}
      animate={{ rotate: '360deg' }}
      transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: false }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeOpacity={0.18} strokeWidth={2} fill="none" />
        <Path
          d="M21 12a9 9 0 0 0-9-9"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </MotiView>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function DictateButton({ onTranscribed, showLabel = false }: Props) {
  const { state, error, durationSec, start, stop } = useDictation({ onTranscribed });

  const onPress = () => {
    if (state === 'idle') void start();
    else if (state === 'recording') void stop();
  };

  const disabled = state === 'transcribing' || state === 'requesting-permission';

  // Recording — czerwony pill z stop+timer
  if (state === 'recording') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="zatrzymaj nagrywanie"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#C0392B',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <StopIcon size={12} color="#F6F6EA" />
        <MotiView
          from={{ opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 700, loop: true, repeatReverse: true }}
          style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: '#F6F6EA' }}
        />
        <Text variant="caption" style={{ color: '#F6F6EA', fontVariant: ['tabular-nums'] }}>
          {formatDuration(durationSec)}
        </Text>
      </Pressable>
    );
  }

  // Transcribing — spinner + napis
  if (state === 'transcribing') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Spinner size={14} />
        <Text variant="caption" tone="muted">transkrybuję…</Text>
      </View>
    );
  }

  // Requesting permission
  if (state === 'requesting-permission') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Spinner size={14} />
        <Text variant="caption" tone="muted">pozwolenie…</Text>
      </View>
    );
  }

  // Error
  if (state === 'error') {
    return (
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text variant="caption" style={{ color: '#C0392B' }} numberOfLines={1}>
          {error ?? 'błąd'}
        </Text>
      </View>
    );
  }

  // Idle
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="dyktuj notatkę"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
      }}
    >
      <MicIcon size={18} />
      {showLabel && (
        <Text variant="caption" tone="muted">dyktuj</Text>
      )}
    </Pressable>
  );
}
