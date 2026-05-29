// Subtelna siatka + etykiety osi pod kwiatkiem (legenda data-viz).
// Renderowane jako SVG overlay — niezależne od Skia.

import { View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { AXES } from '../lib/flower/types';

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
};

export function FlowerChrome({ size, rotationOffset = 0, showGrid = true, pad = 56 }: Props) {
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
        pointerEvents: 'none',
      }}
    >
      <Svg width={outer} height={outer}>
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

        {/* Etykiety osi tuż za końcem promienia */}
        {AXES.map((axis, i) => {
          const deg = i * 60 + rotationOffset;
          const rad = (deg * Math.PI) / 180;
          const labelR = baseR + 18;
          const x = cx + labelR * Math.sin(rad);
          const y = cy - labelR * Math.cos(rad);
          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={y + 4}
              fill="#7A6F62"
              fontSize={10}
              fontFamily="Inter_500Medium"
              textAnchor="middle"
              letterSpacing={1.6}
            >
              {LABELS[axis]}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
