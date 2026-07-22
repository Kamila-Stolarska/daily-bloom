// Rzeczywisty render "portretu okresu".
// - Skia Canvas rysuje: 6 poziomych osi, kropki 1..5 (rozmiar ∝ liczba wyborów),
//   koralowa wstęga (Bézier + blur) łącząca mode'y.
// - Kwiatki (nasz OrganicFlower/DNA) rysowane jako nakładka absolutna nad Canvas —
//   po jednym `FlowerLazy` na oś, umieszczony na wartości modalnej.
//
// Etykiety osi po lewej wyrównane do środka (RN <Text>).
// Prawa krawędź osi zostawia miejsce na kwiatek (żeby nie ucinał się przy value=5).

import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Path, Skia, Circle, BlurMask } from '@shopify/react-native-skia';
import { Text } from './ui/text';
import { FlowerLazy } from './FlowerLazy';
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
const COLOR_CORAL = '#DD6181';         // akcent wstęgi
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

export function AxisRibbonImpl({ rows, width, rowHeight = 76, dna, dnaSeed, bloomKey }: Props) {
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

  // Ścieżka wstęgi: Bézier przez środki modalnych pozycji.
  const ribbonPath = useMemo(() => {
    if (rows.length < 2) return null;
    const points = rows.map((r, i) => ({
      x: axisX0 + (r.mode - 1) * stepX,
      y: rowYs[i],
    }));
    const p = Skia.Path.Make();
    p.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const midY = (prev.y + cur.y) / 2;
      p.cubicTo(prev.x, midY, cur.x, midY, cur.x, cur.y);
    }
    return p;
  }, [rows, rowYs, axisX0, stepX]);

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

      {/* Canvas: osie + kropki + wstęga (pod kwiatkami) */}
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

        {/* Wstęga — miękka, rozlana poświata (jak w referencji: bez twardej
            krawędzi, szeroka, gasnąca gradientowo). Trzy rozmyte warstwy
            zamiast jednej ostrej "rdzeniowej" linii. */}
        {ribbonPath && (
          <Group>
            <Path
              path={ribbonPath}
              style="stroke"
              strokeWidth={46}
              color={COLOR_CORAL}
              opacity={0.14}
              strokeCap="round"
              strokeJoin="round"
            >
              <BlurMask blur={26} style="normal" />
            </Path>
            <Path
              path={ribbonPath}
              style="stroke"
              strokeWidth={30}
              color={COLOR_CORAL}
              opacity={0.2}
              strokeCap="round"
              strokeJoin="round"
            >
              <BlurMask blur={16} style="normal" />
            </Path>
            <Path
              path={ribbonPath}
              style="stroke"
              strokeWidth={16}
              color={COLOR_CORAL}
              opacity={0.26}
              strokeCap="round"
              strokeJoin="round"
            >
              <BlurMask blur={9} style="normal" />
            </Path>
          </Group>
        )}
      </Canvas>

      {/* Kwiatki (nasze DNA) — nakładka nad Canvas, po jednym na oś */}
      {rows.map((r, i) => {
        const cx = axisX0 + (r.mode - 1) * stepX;
        const cy = rowYs[i];
        return (
          <View
            key={`flower-${i}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: cx - flowerSize / 2,
              top: cy - flowerSize / 2,
              width: flowerSize,
              height: flowerSize,
            }}
          >
            <FlowerLazy
              dna={dna}
              day={r.day}
              size={flowerSize}
              dnaSeed={dnaSeed}
              grain={false}
              bloomKey={bloomKey}
            />
          </View>
        );
      })}
    </View>
  );
}

export default AxisRibbonImpl;
