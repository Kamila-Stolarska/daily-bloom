// Rzeczywisty render "portretu okresu".
// - Skia Canvas rysuje: 6 poziomych osi, kropki 1..5 (rozmiar ∝ liczba wyborów),
//   ORAZ kwiatki (OrganicFlowerContent) — wszystko w JEDNYM współdzielonym
//   Canvas. Wcześniej kwiatki były osobnymi
//   `FlowerLazy` (każdy = własny Canvas/WebGL context) — przy 6 osiach naraz to
//   6 dodatkowych kontekstów WebGL obok innych kwiatków na ekranie /garden,
//   co potrafiło wyczerpać limit przeglądarki i zostawić ten wiersz bez kwiatków.
//
// Etykiety osi po lewej wyrównane do środka (RN <Text>).
// Prawa krawędź osi zostawia miejsce na kwiatek (żeby nie ucinał się przy value=5).

import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Path, Skia, Circle } from '@shopify/react-native-skia';
import { Text } from './ui/text';
import { OrganicFlowerContent } from './OrganicFlowerContent';
import type { RibbonRow } from './AxisRibbon';
import type { Dna } from '../lib/flower/dna';

type Props = {
  rows: RibbonRow[];
  width: number;
  rowHeight?: number;
  dna: Dna;
  dnaSeed: number;
  bloomKey?: string | number;
};

const COLOR_AXIS = '#D9CFC1';
const LABEL_W = 76;                    // pas na etykietę po lewej
const AXIS_PAD = 8;                    // odstęp między etykietą a osią
const AXIS_OVERHANG = 10;              // o ile linia wystaje poza skrajne kropki (jak w inspiracji)

// Rozmiar kropki 1..5 → promień. Celowo mniejsza górna granica niż kwiatek —
// kwiatek (nasze DNA) ma być zawsze najbardziej wyróżnionym elementem wiersza.
// 0 wyborów (niewybrane) = mikroślad 1.2 + 3px, żeby był czytelniejszy.
function dotRadius(count: number, maxCount: number): number {
  if (count === 0) return 4.2;
  if (maxCount === 0) return 4.2;
  const t = count / maxCount;
  return 2.5 + Math.sqrt(t) * 5; // 2.5..7.5
}

export function AxisRibbonImpl({ rows, width, rowHeight = 76, dna, dnaSeed }: Props) {
  const height = rows.length * rowHeight;
  // Kwiatek wyraźnie większy niż największa możliwa kropka (promień ≤ 7.5,
  // czyli średnica ≤ 15) — flowerSize ma średnicę ~60-70px, więc dominuje wiersz.
  const flowerSize = Math.min(rowHeight * 0.92, 68);
  const rightPad = flowerSize / 2 + 4;
  const axisX0 = LABEL_W + AXIS_PAD + flowerSize / 2; // symetrycznie po lewej dla value=1
  const axisX1 = width - rightPad;
  const axisSpan = Math.max(40, axisX1 - axisX0);
  const stepX = axisSpan / 4;

  const rowYs = useMemo(
    () => rows.map((_, i) => i * rowHeight + rowHeight / 2),
    [rows, rowHeight],
  );

  return (
    <View style={{ width, height }}>
      {/* Etykiety osi jako RN Text — wyrównane do środka pasa etykiet */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: LABEL_W, height }}>
        {rows.map((r, i) => (
          <View
            key={r.label + i}
            style={{
              position: 'absolute',
              top: rowYs[i] - 8,
              left: 0,
              width: LABEL_W,
              alignItems: 'center', // ← wypośrodkowanie
            }}
          >
            <Text variant="mono" style={{ fontSize: 11, color: '#3B342C', letterSpacing: 0.8 }}>
              {r.label.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      {/* Canvas: osie + kropki (pod kwiatkami) */}
      <Canvas style={{ width, height, position: 'absolute', left: 0, top: 0 }}>
        {/* Linie osi — celowo dłuższe niż rozstaw kropek 1..5 (jak w inspiracji:
            linia wystaje kawałek poza skrajne kropki po obu stronach). Same
            kropki/kwiatki zostają na swoich pozycjach — przesuwamy tylko końce linii. */}
        {rows.map((_r, i) => {
          const y = rowYs[i];
          const line = Skia.Path.Make();
          line.moveTo(axisX0 - AXIS_OVERHANG, y);
          line.lineTo(axisX1 + AXIS_OVERHANG, y);
          return <Path key={`axis-${i}`} path={line} style="stroke" strokeWidth={1} color={COLOR_AXIS} />;
        })}

        {/* Kropki 1..5 na każdej osi (bez pozycji modalnej — tam kwiatek nad Canvas) */}
        {rows.map((r, i) => {
          const y = rowYs[i];
          const rowMax = Math.max(...r.counts);
          return (
            <Group key={`dots-${i}`}>
              {[1, 2, 3, 4, 5].map((v) => {
                if (v === r.mode) return null;
                const cx = axisX0 + (v - 1) * stepX;
                const rad = dotRadius(r.counts[v - 1], rowMax);
                return (
                  <Group key={v}>
                    <Circle cx={cx} cy={y} r={rad} color="#FBFAF2" />
                    {/* obrys 1px, przesunięty do środka o połowę grubości,
                        żeby cały stroke mieścił się w obrębie promienia kropki. */}
                    <Circle
                      cx={cx}
                      cy={y}
                      r={Math.max(0.5, rad - 0.5)}
                      style="stroke"
                      strokeWidth={1}
                      color="#E1D8CF"
                    />
                  </Group>
                );
              })}
            </Group>
          );
        })}

        {/* Kwiatki — w tym samym Canvas co osie/kropki (patrz komentarz u góry pliku). */}
        {rows.map((r, i) => {
          const cx = axisX0 + (r.mode - 1) * stepX;
          const cy = rowYs[i];
          return (
            <OrganicFlowerContent
              key={`flower-${i}`}
              dna={dna}
              dnaSeed={dnaSeed}
              day={r.day}
              size={flowerSize}
              ox={cx - flowerSize / 2}
              oy={cy - flowerSize / 2}
            />
          );
        })}
      </Canvas>
    </View>
  );
}

export default AxisRibbonImpl;
