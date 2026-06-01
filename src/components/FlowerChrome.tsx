// Subtelna siatka + etykiety osi pod kwiatkiem (legenda data-viz).
// Renderowane jako SVG overlay — niezależne od Skia.

import { useEffect, useRef, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { AXES, type Axis } from '../lib/flower/types';

const LABELS: Record<(typeof AXES)[number], string> = {
  day: 'DZIEŃ',
  emotions: 'EMOCJE',
  energy: 'ENERGIA',
  body: 'CIAŁO',
  delight: 'ZACHWYT',
  meaning: 'SENS',
};

type Props = {
  size: number;
  rotationOffset?: number;
  showGrid?: boolean;
  /** Margines wokół kwiatka na etykiety. Domyślnie 56px. */
  pad?: number;
  /** Klucz triggerujący ponowne wyłonienie się legendy (np. dateIso). */
  revealKey?: string;
  /** Opóźnienie startu fade-in po mount/zmianie revealKey. Domyślnie 1500ms (zakwitnięcie). */
  revealDelayMs?: number;
  /** Czas fade-in legendy. Domyślnie 900ms. */
  revealDurationMs?: number;
  /** Gdy podane, etykiety osi są klikalne (edycja pojedynczej osi). */
  onAxisPress?: (axis: Axis) => void;
};

function useFadeIn(delayMs: number, durationMs: number, key: string | undefined): number {
  const [opacity, setOpacity] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setOpacity(0);
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      startRef.current = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - startRef.current) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setOpacity(eased);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else rafRef.current = null;
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [delayMs, durationMs, key]);

  return opacity;
}

export function FlowerChrome({
  size,
  rotationOffset = 0,
  showGrid = true,
  pad = 56,
  revealKey,
  revealDelayMs = 1500,
  revealDurationMs = 900,
  onAxisPress,
}: Props) {
  const reveal = useFadeIn(revealDelayMs, revealDurationMs, revealKey);
  const outer = size + pad * 2;
  const cx = outer / 2;
  const cy = outer / 2;
  // Maks. zasięg płatka: baseR (0.42) × lengthScale (≤1.1) × tip (≤1.04) ≈ 0.48 * size.
  const baseR = size * 0.48;
  const rings = 5;

  return (
    <View
      style={{
        position: 'absolute',
        top: -pad,
        left: -pad,
        width: outer,
        height: outer,
        opacity: reveal,
        // box-none — kontener nie łapie eventów, ale etykiety (Pressable) tak.
        pointerEvents: onAxisPress ? 'box-none' : 'none',
      }}
    >
      <Svg width={outer} height={outer} pointerEvents="none">
        {showGrid && (
          <G opacity={0.18}>
            {/* Pierścienie skali 1–5 */}
            {Array.from({ length: rings }).map((_, i) => {
              const r = baseR * ((i + 1) / rings);
              return (
                <Circle
                  key={`ring-${i}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke="#7A6F62"
                  strokeWidth={0.5}
                  fill="none"
                />
              );
            })}
            {/* Promienie 6 osi */}
            {AXES.map((_a, i) => {
              const deg = i * 60 + rotationOffset;
              const rad = (deg * Math.PI) / 180;
              const x2 = cx + baseR * Math.sin(rad);
              const y2 = cy - baseR * Math.cos(rad);
              return (
                <Line
                  key={`spoke-${i}`}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="#7A6F62"
                  strokeWidth={0.5}
                />
              );
            })}
          </G>
        )}
      </Svg>

      {/* Etykiety jako natywne Pressable — żeby klik per oś działał na web i iOS.
          Pozycja liczona z kąta osi, identycznie jak wcześniej w SvgText. */}
      {AXES.map((axis, i) => {
        const deg = i * 60 + rotationOffset;
        const rad = (deg * Math.PI) / 180;
        const labelR = baseR + 18;
        const x = cx + labelR * Math.sin(rad);
        const y = cy - labelR * Math.cos(rad);
        const labelW = 90;
        const labelH = 28;
        const handlePress = onAxisPress ? () => onAxisPress(axis) : undefined;
        return (
          <Pressable
            key={`label-${i}`}
            onPress={handlePress}
            disabled={!handlePress}
            accessibilityRole={handlePress ? 'button' : undefined}
            accessibilityLabel={handlePress ? `edytuj ${LABELS[axis]}` : undefined}
            style={{
              position: 'absolute',
              left: x - labelW / 2,
              top: y - labelH / 2,
              width: labelW,
              height: labelH,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText
              style={{
                color: '#7A6F62',
                fontSize: 10,
                fontFamily: 'Inter_500Medium',
                letterSpacing: 1.6,
                textAlign: 'center',
              }}
            >
              {LABELS[axis]}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}
