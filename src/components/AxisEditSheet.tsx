// Bottom sheet do edycji jednej osi — uruchamiany klikiem etykiety w FlowerChrome.
// Klik odpowiedzi = auto-zapis i zamknięcie; bez next/prev, bez przycisku zapisz.

import { Modal, Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AXIS_QUESTIONS } from '../lib/questions';
import { Axis, Scale } from '../lib/flower/types';
import { Text } from './ui/text';

type Props = {
  axis: Axis | null;
  currentValue: Scale | undefined;
  onSelect: (axis: Axis, value: Scale) => void;
  onClose: () => void;
};

function IntensityDots({ value, selected }: { value: number; selected: boolean }) {
  const dotSize = 6;
  const gap = 6;
  const total = 5;
  const width = total * dotSize + (total - 1) * gap;
  const filled = selected ? '#F6F6EA' : '#1A1614';
  const muted = selected ? 'rgba(246,246,234,0.3)' : 'rgba(122,111,98,0.35)';
  return (
    <Svg width={width} height={dotSize}>
      {Array.from({ length: total }).map((_, i) => {
        const cx = i * (dotSize + gap) + dotSize / 2;
        const on = i < value;
        return (
          <Circle
            key={i}
            cx={cx}
            cy={dotSize / 2}
            r={dotSize / 2}
            fill={on ? filled : 'transparent'}
            stroke={on ? filled : muted}
            strokeWidth={1}
          />
        );
      })}
    </Svg>
  );
}

export function AxisEditSheet({ axis, currentValue, onSelect, onClose }: Props) {
  const open = axis !== null;
  const q = axis ? AXIS_QUESTIONS.find((qq) => qq.axis === axis) : null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop + sheet jako rodzeństwo, nie jako zagnieżdżenie — żeby uniknąć
          niewalidnego HTML (button w button). */}
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={onClose}
          accessibilityLabel="zamknij"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(20, 17, 15, 0.35)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#F6F6EA',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 36,
          }}
        >
          {/* Uchwyt */}
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E1D8CE',
              marginBottom: 20,
            }}
          />

          {q && (
            <>
              <Text variant="eyebrow">{q.axis.toUpperCase()}</Text>
              <Text variant="h2" className="mt-3" style={{ fontSize: 28, lineHeight: 32, letterSpacing: -0.5 }}>
                {q.prompt}
              </Text>
              {q.micro ? (
                <Text variant="caption" tone="muted" className="mt-3">
                  {q.micro}
                </Text>
              ) : null}

              <View className="mt-6 gap-2.5">
                {q.labels.map((label, i) => {
                  const v = (i + 1) as Scale;
                  const selected = currentValue === v;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => onSelect(q.axis, v)}
                      className={
                        'py-4 px-5 rounded-2xl border flex-row items-center justify-between ' +
                        (selected ? 'bg-ink border-ink' : 'bg-paper border-ink-muted/25')
                      }
                    >
                      <Text
                        variant="bodyMedium"
                        tone={selected ? 'paper' : 'ink'}
                        style={{ fontSize: 17, letterSpacing: -0.1 }}
                      >
                        {label}
                      </Text>
                      <IntensityDots value={v} selected={selected} />
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
