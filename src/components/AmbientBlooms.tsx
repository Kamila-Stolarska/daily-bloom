// Miękkie, rozlane plamy koloru w tle — akwarelowy "atmosferyczny" akcent za
// treścią ekranu (np. logowanie). Zamiast twardych kółek: SVG RadialGradient
// gasnący do przezroczystości na brzegu, jak plama farby wsiąkająca w papier.
// Celowo NIE Skia — to statyczna dekoracja bez interakcji, react-native-svg
// (już w projekcie, patrz MiniFlower.tsx) wystarczy i nie wymaga lazy-load
// CanvasKit tylko po to, żeby pomalować tło ekranu logowania.

import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

export type Bloom = {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity?: number; // intensywność w centrum plamy, domyślnie 0.28
};

type Props = {
  width: number;
  height: number;
  blooms: Bloom[];
};

export function AmbientBlooms({ width, height, blooms }: Props) {
  if (width <= 0 || height <= 0) return null;
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
      pointerEvents="none"
    >
      <Defs>
        {blooms.map((b, i) => (
          <RadialGradient key={i} id={`bloom-${i}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={b.color} stopOpacity={b.opacity ?? 0.28} />
            <Stop offset="65%" stopColor={b.color} stopOpacity={(b.opacity ?? 0.28) * 0.4} />
            <Stop offset="100%" stopColor={b.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {blooms.map((b, i) => (
        <Circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={`url(#bloom-${i})`} />
      ))}
    </Svg>
  );
}
