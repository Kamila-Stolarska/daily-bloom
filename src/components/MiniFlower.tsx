// Miniaturowy, "poglądowy" kwiatek — do siatek z wieloma komórkami naraz
// (kalendarz-heatmapa). Celowo NIE używa Skia: kalendarz może mieć do 31
// komórek, a każdy Skia <Canvas> zajmuje osobny kontekst WebGL — przy takiej
// liczbie łatwo wyczerpać limit przeglądarki (patrz historia CalendarHeatmap.tsx).
// Zamiast tego rysujemy te same organiczne płatki (organicPetalPath, jak w
// OrganicFlower) jako lekkie SVG — brak WebGL, brak limitu.
//
// To NIE jest dokładny portret dnia: wszystkie płatki mają pełną długość
// (kwiatek zawsze "w pełni rozkwitnięty"), a kolory to paleta DNA użytkowniczki.
// Chodzi wyłącznie o czytelny znacznik "tu jest wpis", spójny wizualnie
// z prawdziwym kwiatkiem gdzie indziej w aplikacji.

import Svg, { G, Path } from 'react-native-svg';
import type { Dna } from '../lib/flower/dna';
import { PALETTES } from '../lib/flower/palettes';
import { organicPetalPath, petalJitter } from '../lib/flower/organic';
import { AXES } from '../lib/flower/types';

type Props = {
  dna: Dna;
  dnaSeed: number;
  size: number;
};

export function MiniFlower({ dna, dnaSeed, size }: Props) {
  const palette = PALETTES[dna.paletteIndex % PALETTES.length];
  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.42;
  const legendR = size * 0.48; // pełny rozkwit — jak lenFor(5) w OrganicFlower
  const petalBaseWidth = baseR * 0.28;

  return (
    <Svg width={size} height={size} pointerEvents="none">
      <G>
        {AXES.map((_axis, i) => {
          const jitter = petalJitter(dnaSeed, i);
          const width = petalBaseWidth * jitter.widthScale;
          const angleDeg = i * 60 + dna.rotationOffset + jitter.angleOffset;
          const path = organicPetalPath(legendR, width, jitter.pathSeed);
          return (
            <G key={i} transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}>
              <Path d={path} fill={palette.petals[i]} />
            </G>
          );
        })}
      </G>
    </Svg>
  );
}
