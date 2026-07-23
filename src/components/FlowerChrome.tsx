// Etykiety osi pod kwiatkiem (legenda data-viz). Widmo skali 1–5 rysowane jest
// per-płatek w OrganicFlower (pod kolorem), więc tu zostają tylko etykiety.

import { useEffect, useRef, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { AXES, AXIS_LABELS_PL, type Axis } from '../lib/flower/types';

const LABELS = AXIS_LABELS_PL;

type Props = {
  size: number;
  rotationOffset?: number;
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
        // Rotacja etykiety — styczna do okręgu. Dla osi na 0°/180° (góra/dół)
        // rotacja jest zerowa (naturalnie pozioma); dla bocznych 60/120/240/300
        // etykieta odchyla się od poziomu tak, żeby "opadała" na linii promienia.
        // Formuła: rotacja etykiety = kąt osi (deg), ale znormalizowana do [-90,90]
        // żeby tekst nie stanął głową w dół.
        let labelRotDeg = deg % 360;
        if (labelRotDeg > 180) labelRotDeg -= 360;
        if (labelRotDeg > 90) labelRotDeg -= 180;
        if (labelRotDeg < -90) labelRotDeg += 180;
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
              transform: [{ rotate: `${labelRotDeg}deg` }],
            }}
          >
            <RNText
              style={{
                color: '#7A6F62',
                fontSize: 12,
                fontFamily: 'LibreBodoni_400Regular_Italic',
                letterSpacing: 0.8,
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
