// Miniaturowy, "poglądowy" kwiatek — do siatek z wieloma komórkami naraz
// (kalendarz-heatmapa). Celowo NIE używa Skia: kalendarz może mieć do 31
// komórek, a każdy Skia <Canvas> zajmuje osobny kontekst WebGL — przy takiej
// liczbie łatwo wyczerpać limit przeglądarki. Zamiast tego rysujemy ten sam
// kształt płatka co OrganicFlower (organicPetalPath — zwraca gotowy string
// ścieżki SVG, bez zależności od Skia) jako lekkie SVG — brak WebGL, brak
// limitu.
//
// To NIE jest dokładny portret dnia: wszystkie płatki są w pełnym rozkwicie
// (poziom 5), w kolorach palety DNA użytkowniczki — chodzi wyłącznie o
// czytelny znacznik "tu jest wpis", spójny wizualnie z prawdziwym
// (organicznym) kwiatkiem gdzie indziej w aplikacji.

import Svg, { Defs, LinearGradient, Stop, G, Path } from 'react-native-svg';
import type { Dna } from '../lib/flower/dna';
import { PALETTES } from '../lib/flower/palettes';
import { organicPetalPath, petalJitter } from '../lib/flower/organic';
import { withSaturation } from '../lib/flower/color';

type Props = {
  dna: Dna;
  dnaSeed: number;
  size: number;
};

const PETAL_COUNT = 6;

export function MiniFlower({ dna, dnaSeed, size }: Props) {
  const palette = PALETTES[dna.paletteIndex % PALETTES.length];
  const cx = size / 2;
  const cy = size / 2;
  const legendR = size * 0.48;
  const petalBaseWidth = size * 0.42 * 0.26;

  const petals = Array.from({ length: PETAL_COUNT }, (_, i) => {
    const jitter = petalJitter(dnaSeed, i);
    const width = petalBaseWidth * jitter.widthScale;
    const angleDeg = i * 60 + jitter.angleOffset;
    const path = organicPetalPath(legendR, width, jitter.pathSeed);
    const tipHex = withSaturation(palette.petals[i], 1);
    const baseHex = withSaturation(palette.petals[(i + 3) % 6], 0.85);
    return { id: `mg-${i}`, path, angleDeg, tipHex, baseHex };
  });

  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        {petals.map((p) => (
          <LinearGradient
            key={p.id}
            id={p.id}
            x1={0}
            y1={0}
            x2={0}
            y2={-legendR}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={p.baseHex} />
            <Stop offset="1" stopColor={p.tipHex} />
          </LinearGradient>
        ))}
      </Defs>
      {petals.map((p) => (
        <G key={p.id} transform={`translate(${cx}, ${cy}) rotate(${p.angleDeg})`}>
          <Path d={p.path} fill={`url(#${p.id})`} opacity={0.85} />
        </G>
      ))}
    </Svg>
  );
}
