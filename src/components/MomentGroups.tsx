// Dwie grupy dni wg tagów: tylko dobre, tylko trudne. Karty w formie poziomego
// wykresu słupkowego (siatka + oś skali 1–5), kolory te same co znaczniki
// "coś dobrego/trudnego" na wykresie trendu. Bez sugerowania, że tag sam w
// sobie powoduje zmianę wyników.

import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Text } from './ui/text';
import { AXES, AXIS_LABELS_PL, type Axis } from '../lib/flower/types';
import type { MomentGroup, MomentGroupKey } from '../lib/insights/types';

type Props = {
  groups: Record<MomentGroupKey, MomentGroup>;
  coOccurrence: string | null;
};

const GOOD_COLOR = '#9461FC'; // jak znacznik "coś dobrego" na wykresie trendu
const HARD_COLOR = '#ED7BA1'; // jak znacznik "coś trudnego" na wykresie trendu
const TRACK_COLOR = '#EDE6D8';
const GRID_COLOR = '#DCD2C2';
const GRID_STOPS = [0, 25, 50, 75, 100];
const SCALE_TICKS = [1, 2, 3, 4, 5];

const GROUP_META: Record<'onlyGood' | 'onlyHard', { label: string; sub: string; accent: string }> = {
  onlyGood: { label: 'Tylko coś dobrego', sub: 'dni', accent: GOOD_COLOR },
  onlyHard: { label: 'Tylko coś trudnego', sub: 'dni', accent: HARD_COLOR },
};

function GridLines() {
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} pointerEvents="none">
      {GRID_STOPS.map((s) => (
        <View
          key={s}
          style={{
            position: 'absolute',
            left: `${s}%`,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeftWidth: 1,
            borderStyle: 'dashed',
            borderColor: GRID_COLOR,
          }}
        />
      ))}
    </View>
  );
}

function Bar({ axis, value, accent, gradientId }: { axis: Axis; value: number | null; accent: string; gradientId: string }) {
  const pct = value === null ? 0 : ((value - 1) / 4) * 100;
  return (
    <View style={{ marginBottom: 14 }}>
      <View className="flex-row items-baseline" style={{ marginBottom: 6, gap: 8 }}>
        <Text variant="body" style={{ fontWeight: '700' }}>{AXIS_LABELS_PL[axis]}</Text>
        <Text variant="caption" tone="muted">{value === null ? '—' : value.toFixed(1).replace('.', ',')}</Text>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: TRACK_COLOR, overflow: 'hidden' }}>
        {pct > 0 && (
          <Svg width={`${pct}%`} height={10}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={accent} stopOpacity={0.4} />
                <Stop offset="1" stopColor={accent} stopOpacity={0.95} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height={10} rx={5} fill={`url(#${gradientId})`} />
          </Svg>
        )}
      </View>
    </View>
  );
}

function GroupCard({ group, kind }: { group: MomentGroup; kind: 'onlyGood' | 'onlyHard' }) {
  const meta = GROUP_META[kind];
  return (
    <View
      style={{
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#FBFAF1',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1D8CE',
        padding: 14,
      }}
    >
      <Text variant="mono" style={{ fontSize: 10, color: '#7A6F62', letterSpacing: 0.5, marginBottom: 6 }}>
        {meta.label.toUpperCase()}
      </Text>
      <Text variant="display" style={{ fontSize: 24, lineHeight: 28, marginBottom: 14 }}>
        {group.count} <Text variant="caption" tone="muted">{meta.sub}</Text>
      </Text>
      {group.count === 0 ? (
        <Text variant="caption" tone="muted">brak dni w tej grupie</Text>
      ) : (
        <View style={{ position: 'relative' }}>
          <GridLines />
          {AXES.map((a) => (
            <Bar key={a} axis={a} value={group.averages[a]} accent={meta.accent} gradientId={`moment-bar-${kind}-${a}`} />
          ))}
          <View className="flex-row justify-between" style={{ marginTop: 2 }}>
            {SCALE_TICKS.map((t) => (
              <Text key={t} variant="caption" tone="muted" style={{ fontSize: 9 }}>
                {t}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export function MomentGroups({ groups }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 640;
  return (
    <View>
      <View style={{ flexDirection: isTablet ? 'row' : 'column', flexWrap: 'wrap', gap: 12 }}>
        <GroupCard group={groups.onlyGood} kind="onlyGood" />
        <GroupCard group={groups.onlyHard} kind="onlyHard" />
      </View>
    </View>
  );
}
