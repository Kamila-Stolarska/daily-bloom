// Interaktywny wykres trendu jednej wybranej osi (sekcja 7 specyfikacji Insights).
// Oś Y stała 1–5, brak wpisu = przerwa w linii (bez interpolacji), tap na punkt
// otwiera dzień, opcjonalna średnia krocząca jako delikatny trend.

import { lazy, Suspense, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from './ui/text';
import { ensureSkiaWeb } from '../lib/loadSkiaWeb';
import { AXES, AXIS_LABELS_PL, type Axis } from '../lib/flower/types';
import type { DailyInsightPoint } from '../lib/insights/types';
import { formatShortDatePl } from '../lib/dateLabels';

type Props = {
  points: DailyInsightPoint[]; // pełen zakres dat, chronologicznie, z null dla luk
  width: number;
  onSelectDate: (dateIso: string) => void;
  onShowList: () => void;
};

// Paleta karty jak w AxisTrendCardsImpl — spójność z resztą wykresów trendu.
const CARD_BG = '#FBFAF1';
const CARD_BORDER = '#E1D8CE';
const INK = '#1A1614';
const MUTED = '#7A6F62';
const CARD_PAD = 18;
const CORAL = '#FDA674';
const GOOD_COLOR = '#9461FC'; // jak znacznik "coś dobrego" w MomentGroups
const HARD_COLOR = '#ED7BA1'; // jak znacznik "coś trudnego" w MomentGroups

const CHART_H = 160;
const PAD_Y = 10;
const PAD_X = 10;

function fmtShortDate(iso: string): string {
  const parts = iso.split('-');
  return `${parts[2]}.${parts[1]}`;
}

function ListIcon({ color = INK }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6h12M9 12h12M9 18h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text variant="caption" tone="muted">{label}</Text>
    </View>
  );
}

export function AxisTrendChart({ points, width, onSelectDate, onShowList }: Props) {
  const [axis, setAxis] = useState<Axis>('day');

  const Impl = useMemo(
    () =>
      lazy(async () => {
        await ensureSkiaWeb();
        const mod = await import('./AxisTrendChartImpl');
        return { default: mod.AxisTrendChartImpl };
      }),
    [],
  );

  const chartW = Math.max(width - CARD_PAD * 2, 30);
  const n = points.length;

  const xFor = (i: number) => (n <= 1 ? chartW / 2 : PAD_X + (i / (n - 1)) * (chartW - PAD_X * 2));
  const yFor = (v: number) => CHART_H - PAD_Y - ((v - 1) / 4) * (CHART_H - PAD_Y * 2);

  const existing = useMemo(
    () =>
      points
        .map((p, i) => ({ i, value: p[axis], point: p }))
        .filter((x): x is { i: number; value: number; point: DailyInsightPoint } => x.value !== null),
    [points, axis],
  );

  const segments = useMemo(() => {
    const out: Array<Array<{ x: number; y: number }>> = [];
    let current: Array<{ x: number; y: number }> = [];
    let lastIndex: number | null = null;
    for (const e of existing) {
      if (lastIndex !== null && e.i !== lastIndex + 1) {
        if (current.length > 0) out.push(current);
        current = [];
      }
      current.push({ x: xFor(e.i), y: yFor(e.value) });
      lastIndex = e.i;
    }
    if (current.length > 0) out.push(current);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, chartW]);

  const markers = useMemo(
    () =>
      existing.map((e) => ({
        x: xFor(e.i),
        y: yFor(e.value),
        good: e.point.hasGoodMoment,
        hard: e.point.hasDifficultMoment,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existing, chartW],
  );

  return (
    <View>
      <View className="flex-row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {AXES.map((a) => {
          const active = a === axis;
          return (
            <Pressable
              key={a}
              onPress={() => setAxis(a)}
              accessibilityLabel={`pokaż trend: ${AXIS_LABELS_PL[a]}`}
              hitSlop={4}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                minHeight: 44,
                justifyContent: 'center',
                borderRadius: 999,
                backgroundColor: active ? '#1A1614' : 'transparent',
                borderWidth: 1,
                borderColor: active ? '#1A1614' : '#E1D8CE',
              }}
            >
              <Text variant="caption" style={{ color: active ? '#F6F6EA' : '#1A1614', letterSpacing: 0.3 }}>
                {AXIS_LABELS_PL[a]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          backgroundColor: CARD_BG,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: CARD_BORDER,
          padding: CARD_PAD,
        }}
      >
        <View className="flex-row items-start justify-between" style={{ marginBottom: 14 }}>
          <View>
            <Text variant="h3">
              Trend w czasie - {AXIS_LABELS_PL[axis].toLocaleLowerCase('pl-PL')}
            </Text>
          </View>
          <Pressable
            onPress={onShowList}
            accessibilityRole="button"
            accessibilityLabel="pokaż jako listę"
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: CARD_BORDER,
            }}
          >
            <ListIcon />
          </Pressable>
        </View>

        <View style={{ width: chartW, height: CHART_H, position: 'relative' }}>
          {existing.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Text variant="caption" tone="muted">brak wpisów w tym okresie</Text>
            </View>
          ) : (
            <Suspense fallback={null}>
              <Impl chartW={chartW} chartH={CHART_H} segments={segments} averagePath={null} markers={markers} />
            </Suspense>
          )}
          {existing.map((e) => {
            const x = xFor(e.i);
            const y = yFor(e.value);
            const tags = [
              e.point.hasGoodMoment ? 'coś dobrego' : null,
              e.point.hasDifficultMoment ? 'coś trudnego' : null,
            ].filter(Boolean).join(', ');
            return (
              <Pressable
                key={e.point.date}
                onPress={() => onSelectDate(e.point.date)}
                accessibilityLabel={`${formatShortDatePl(e.point.date)}, ${AXIS_LABELS_PL[axis]} ${e.value} na 5${tags ? `, ${tags}` : ''}`}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  left: x - 22,
                  top: y - 22,
                  width: 44,
                  height: 44,
                }}
              />
            );
          })}
        </View>

        {n > 0 && (
          <View className="flex-row justify-between" style={{ marginTop: 6 }}>
            <Text variant="mono" style={{ fontSize: 9, color: MUTED }}>
              {fmtShortDate(points[0].date)}
            </Text>
            <Text variant="mono" style={{ fontSize: 9, color: MUTED }}>
              {fmtShortDate(points[n - 1].date)}
            </Text>
          </View>
        )}

        {existing.length > 0 && (
          <View className="flex-row flex-wrap items-center" style={{ marginTop: 14, gap: 14 }}>
            <LegendDot color={CORAL} label="zwykły dzień" />
            <LegendDot color={GOOD_COLOR} label="coś dobrego" />
            <LegendDot color={HARD_COLOR} label="coś trudnego" />
          </View>
        )}
      </View>
    </View>
  );
}
