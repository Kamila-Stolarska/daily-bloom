// Miniaturowy, "poglądowy" kwiatek — do siatek z wieloma komórkami naraz
// (kalendarz-heatmapa). Celowo NIE używa Skia: kalendarz może mieć do 31
// komórek, a każdy Skia <Canvas> zajmuje osobny kontekst WebGL — przy takiej
// liczbie łatwo wyczerpać limit przeglądarki. Zamiast tego rysujemy ten sam
// kanoniczny kształt płatka co SoftBloomFlower jako lekkie SVG — brak WebGL,
// brak limitu.
//
// KRYTYCZNE: importuj kształt/geometrię TYLKO z './flowerShape' (plik bez
// importu Skia), NIGDY z './FlowerVariants' — ten drugi statycznie importuje
// @shopify/react-native-skia, a CalendarHeatmap (i ten komponent) montują się
// eagerly na ekranie, zanim ensureSkiaWeb() zdąży załadować CanvasKit. Import
// Skia przed jego gotowością trwale psuje Skia na całej stronie.
//
// To NIE jest dokładny portret dnia: wszystkie płatki są w pełnym rozkwicie
// (poziom 5), tym samym stałym gradientem lime→orange co w SoftBloomFlower —
// chodzi wyłącznie o czytelny znacznik "tu jest wpis", spójny wizualnie
// z prawdziwym kwiatkiem gdzie indziej w aplikacji.

import Svg, { Defs, LinearGradient, Stop, G, Path } from 'react-native-svg';
import type { Dna } from '../lib/flower/dna';
import {
  SVG_SIZE,
  SVG_CX,
  SVG_CY,
  GRADIENT_COLORS,
  CANON_WHITE_PATH,
  CANON_COLOR_PATH,
  CANON_GRADIENT_VEC,
  PETAL_COUNT,
} from './flowerShape';

type Props = {
  dna: Dna;
  dnaSeed: number;
  size: number;
};

const FULL_BLOOM_DEG = Array.from({ length: PETAL_COUNT }, (_, i) => (i * 360) / PETAL_COUNT);

export function MiniFlower({ size }: Props) {
  const scale = (size / SVG_SIZE) * 0.98;
  const offset = size / 2 - scale * SVG_CX;

  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <LinearGradient
          id="miniFlowerGradient"
          x1={CANON_GRADIENT_VEC.x1}
          y1={CANON_GRADIENT_VEC.y1}
          x2={CANON_GRADIENT_VEC.x2}
          y2={CANON_GRADIENT_VEC.y2}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={GRADIENT_COLORS[0]} />
          <Stop offset="1" stopColor={GRADIENT_COLORS[1]} />
        </LinearGradient>
      </Defs>
      <G transform={`translate(${offset}, ${offset}) scale(${scale})`}>
        {FULL_BLOOM_DEG.map((deg, i) => (
          <G key={`white-${i}`} transform={`rotate(${deg}, ${SVG_CX}, ${SVG_CY})`}>
            <Path d={CANON_WHITE_PATH} fill="#FFFFFF" />
          </G>
        ))}
        {FULL_BLOOM_DEG.map((deg, i) => (
          <G key={`fill-${i}`} transform={`rotate(${deg}, ${SVG_CX}, ${SVG_CY})`}>
            <Path d={CANON_COLOR_PATH} fill="url(#miniFlowerGradient)" />
          </G>
        ))}
      </G>
    </Svg>
  );
}
