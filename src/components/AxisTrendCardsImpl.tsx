// Karty trendu per oś, jedna pod drugą — odwzorowanie inspiracji (duża liczba +
// wykres z gradientową powierzchnią pod linią, etykiety dat). Duża liczba to
// ŚREDNIA z całego okresu, w prawym rogu razem z podpisem "średnia z okresu"
// (feedback: bez podpisu było niejasne, potem podpis sam trafił w róg, ale
// liczba miała zostać po lewej — teraz obie razem, jak "delta" w inspiracji).
// Kolory tylko z naszej palety: krem/ink + akcent na wykresie/wstędze.
//
// Dotknięcie/przeciągnięcie po wykresie pokazuje wartość w tym miejscu —
// dymek nad kropką (jak w inspiracji z hover-tooltipem). Obsługa przez RN
// Responder System (onStartShouldSetResponder / onResponderMove) na zwykłym
// View pod Canvasem — działa tak samo na web (mysz) i na urządzeniu (dotyk).
//
// Jeden wspólny Canvas dla wszystkich 6 wykresów (Group + transform per karta),
// żeby nie mnożyć kontekstów WebGL — karty jako zwykłe RN View w tle, Canvas
// tylko rysuje linie/gradienty/kropki na wierzchu (wzorzec z AxisSparklineGridImpl).

import { useEffect, useMemo, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import { Canvas, Group, Path, Skia, Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import { Text } from './ui/text';
import { AXIS_QUESTIONS } from '../lib/questions';
import type { Axis } from '../lib/flower/types';

type Point = { date: string; value: number };
type Cell = { label: string; axis: Axis; series: Point[] };

function labelForValue(axis: Axis, value: number): string | null {
  const q = AXIS_QUESTIONS.find((q) => q.axis === axis);
  const idx = Math.round(value) - 1;
  return q?.labels[idx] ?? null;
}

type Props = {
  cells: Cell[];
  width: number;
  periodLabel: string;
};

const CORAL = '#DD6181';
const INK = '#1A1614';
const MUTED = '#7A6F62';
const CARD_BG = '#FBFAF1';
const CARD_BORDER = '#E1D8CE';
const AXIS_LINE = '#E7DFD2';

const CARD_PAD = 18;
const HEADER_H = 50;
const GAP1 = 12;
const CHART_H = 72;
const XLABELS_H = 16;
const CARD_GAP = 14;
const BUBBLE_W = 58;
const BUBBLE_H = 24;

function fmtShortDate(iso: string): string {
  const parts = iso.split('-');
  return `${parts[2]}.${parts[1]}`;
}

type Stats = { avg: number };

function computeStats(series: Point[]): Stats | null {
  if (series.length === 0) return null;
  const sum = series.reduce((a, p) => a + p.value, 0);
  return { avg: sum / series.length };
}

type Selected = { card: number; idx: number };

export function AxisTrendCardsImpl({ cells, width, periodLabel: _periodLabel }: Props) {
  const chartW = width - CARD_PAD * 2;
  const cardInnerH = HEADER_H + GAP1 + CHART_H + XLABELS_H;
  const cardH = cardInnerH + CARD_PAD * 2;
  const totalH = cells.length * cardH + (cells.length - 1) * CARD_GAP;

  const [selected, setSelected] = useState<Selected | null>(null);
  // Zmiana okresu (7d/30d/…) podmienia cells — stary index mógłby wskazywać
  // poza nową serię, więc czyścimy zaznaczenie.
  useEffect(() => setSelected(null), [cells]);

  const charts = useMemo(() => {
    return cells.map((c) => {
      const n = c.series.length;
      if (n === 0) return null;
      const yFor = (v: number) => {
        const t = (Math.max(1, Math.min(5, v)) - 1) / 4;
        return CHART_H - t * CHART_H;
      };
      const xFor = (i: number) => (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);

      const line = Skia.Path.Make();
      line.moveTo(xFor(0), yFor(c.series[0].value));
      for (let i = 1; i < n; i++) line.lineTo(xFor(i), yFor(c.series[i].value));

      const area = Skia.Path.Make();
      area.moveTo(xFor(0), CHART_H);
      area.lineTo(xFor(0), yFor(c.series[0].value));
      for (let i = 1; i < n; i++) area.lineTo(xFor(i), yFor(c.series[i].value));
      area.lineTo(xFor(n - 1), CHART_H);
      area.close();

      const points = c.series.map((p, i) => ({ x: xFor(i), y: yFor(p.value), date: p.date, value: p.value }));
      const last = points[n - 1];
      return { line, area, last, points };
    });
  }, [cells, chartW]);

  const selectPoint = (cardIndex: number, locationX: number) => {
    const n = cells[cardIndex]?.series.length ?? 0;
    if (n === 0) return;
    const t = Math.max(0, Math.min(1, locationX / chartW));
    const idx = n === 1 ? 0 : Math.round(t * (n - 1));
    setSelected({ card: cardIndex, idx });
  };

  return (
    <View style={{ width, height: totalH }}>
      {/* Karty — tło, obramowanie, tekst (RN, nie Skia) */}
      {cells.map((c, i) => {
        const stats = computeStats(c.series);
        const top = i * (cardH + CARD_GAP);
        return (
          <View
            key={c.label + i}
            style={{
              position: 'absolute',
              top,
              left: 0,
              width,
              height: cardH,
              backgroundColor: CARD_BG,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: CARD_PAD,
            }}
          >
            {/* Header: etykieta (lewo), duża liczba + podpis "średnia z okresu" w prawym rogu */}
            <View className="flex-row items-start justify-between" style={{ height: HEADER_H }}>
              <Text variant="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.8, marginTop: 3 }}>
                {c.label.toUpperCase()}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <View className="flex-row items-baseline">
                  <Text variant="display" style={{ fontSize: 26, lineHeight: 28 }}>
                    {stats ? stats.avg.toFixed(1) : '—'}
                  </Text>
                  <Text variant="caption" tone="muted" style={{ marginLeft: 4 }}>
                    / 5
                  </Text>
                </View>
                <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                  {stats ? 'średnia z okresu' : 'brak wpisów'}
                </Text>
              </View>
            </View>

            {/* Obszar wykresu — linię/gradient rysuje wspólny Canvas nad kartami; ten View
                łapie dotyk/klik i przelicza go na najbliższy punkt serii. */}
            <View
              style={{ marginTop: GAP1, height: CHART_H }}
              onStartShouldSetResponder={() => !!stats}
              onMoveShouldSetResponder={() => !!stats}
              onResponderGrant={(e: GestureResponderEvent) => selectPoint(i, e.nativeEvent.locationX)}
              onResponderMove={(e: GestureResponderEvent) => selectPoint(i, e.nativeEvent.locationX)}
            >
              {!stats && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="caption" tone="muted">brak danych w tym okresie</Text>
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 1,
                  backgroundColor: AXIS_LINE,
                }}
              />
            </View>

            {/* Etykiety dat pod wykresem */}
            <View style={{ height: XLABELS_H, marginTop: 2 }} className="flex-row justify-between">
              {c.series.length > 0 && (
                <>
                  <Text variant="mono" style={{ fontSize: 9, color: MUTED }}>
                    {fmtShortDate(c.series[0].date)}
                  </Text>
                  <Text variant="mono" style={{ fontSize: 9, color: MUTED }}>
                    {fmtShortDate(c.series[c.series.length - 1].date)}
                  </Text>
                </>
              )}
            </View>
          </View>
        );
      })}

      {/* Jeden Canvas overlay — wykresy wszystkich kart (gradient + linia + kropka + zaznaczenie) */}
      <View style={{ position: 'absolute', left: 0, top: 0, width, height: totalH, pointerEvents: 'none' }}>
        <Canvas style={{ width, height: totalH }}>
          {cells.map((_c, i) => {
            const chart = charts[i];
            if (!chart) return null;
            const top = i * (cardH + CARD_GAP);
            const tx = CARD_PAD;
            const ty = top + CARD_PAD + HEADER_H + GAP1;
            const sel = selected && selected.card === i ? chart.points[selected.idx] : null;
            const guide = sel ? Skia.Path.Make() : null;
            if (guide && sel) {
              guide.moveTo(sel.x, 0);
              guide.lineTo(sel.x, CHART_H);
            }
            return (
              <Group key={i} transform={[{ translateX: tx }, { translateY: ty }]}>
                <Path path={chart.area} style="fill">
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, CHART_H)}
                    colors={['rgba(221,97,129,0.32)', 'rgba(221,97,129,0)']}
                  />
                </Path>
                <Path
                  path={chart.line}
                  style="stroke"
                  strokeWidth={1.75}
                  color={CORAL}
                  strokeCap="round"
                  strokeJoin="round"
                />
                <Circle cx={chart.last.x} cy={chart.last.y} r={3} color={CORAL} />
                {guide && sel && (
                  <Group>
                    <Path path={guide} style="stroke" strokeWidth={1} color={INK} opacity={0.14} />
                    <Circle cx={sel.x} cy={sel.y} r={5.5} color={CARD_BG} />
                    <Circle cx={sel.x} cy={sel.y} r={4.5} color={CORAL} />
                  </Group>
                )}
              </Group>
            );
          })}
        </Canvas>
      </View>

      {/* Dymek z wartością zaznaczonego punktu — nad wszystkim, żeby nie ginął pod linią */}
      {selected && charts[selected.card] && (
        (() => {
          const chart = charts[selected.card]!;
          const point = chart.points[selected.idx];
          if (!point) return null;
          const label = labelForValue(cells[selected.card].axis, point.value);
          const line2 = `${point.value} · ${fmtShortDate(point.date)}`;
          const maxLen = Math.max(label?.length ?? 0, line2.length);
          const bubbleW = Math.max(BUBBLE_W, maxLen * 6.5 + 20);
          const bubbleH = label ? BUBBLE_H + 16 : BUBBLE_H;
          const top = selected.card * (cardH + CARD_GAP);
          const bubbleLeft = Math.max(
            CARD_PAD - 6,
            Math.min(width - CARD_PAD - bubbleW + 6, CARD_PAD + point.x - bubbleW / 2),
          );
          const bubbleTop = top + CARD_PAD + HEADER_H + GAP1 + Math.max(0, point.y - bubbleH - 10);
          return (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: bubbleLeft,
                top: bubbleTop,
                width: bubbleW,
                height: bubbleH,
                borderRadius: 8,
                backgroundColor: INK,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
              }}
            >
              {label && (
                <Text variant="caption" tone="paper" style={{ fontSize: 11, lineHeight: 13, fontWeight: '600' }}>
                  {label}
                </Text>
              )}
              <Text variant="caption" tone="paper" style={{ fontSize: 10, lineHeight: 12, opacity: 0.75 }}>
                {line2}
              </Text>
            </View>
          );
        })()
      )}
    </View>
  );
}

export default AxisTrendCardsImpl;
