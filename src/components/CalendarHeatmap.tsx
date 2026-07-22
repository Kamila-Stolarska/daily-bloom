// Miesięczny grid dni: każdy dzień z wpisem dostaje mały "poglądowy" kwiatek
// (MiniFlower — SVG, nie Skia) w rogu komórki, w kolorach palety DNA
// użytkowniczki. Bez heat-koloru tła — same komórki są jednolicie jasne,
// kwiatek jest jedynym sygnałem "tu jest wpis" (jak w sekcji Ogród, tylko
// mniejsze). MiniFlower celowo nie koduje realnych wartości osi (zawsze pełny
// rozkwit) — przy 31 komórkach naraz Skia <Canvas> per komórka wyczerpałby
// limit kontekstów WebGL, więc idziemy lekkim SVG.

import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './ui/text';
import { todayIso } from '../lib/store';
import type { Entry, Note } from '../lib/store';
import type { Dna } from '../lib/flower/dna';
import { MiniFlower } from './MiniFlower';

type Props = {
  entries: Record<string, Entry>;
  notesByDate: Record<string, Note[]>;
  month: Date;
  dna: Dna;
  dnaSeed: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (dateIso: string) => void;
};

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];
const WEEKDAY_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
const CELL = 44;
const TILE = 34;
const BADGE = 18;

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CalendarHeatmap({
  entries,
  notesByDate,
  month,
  dna,
  dnaSeed,
  onPrev,
  onNext,
  onSelectDate,
}: Props) {
  const today = todayIso();

  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    // Poniedziałek = 0 w naszej siatce
    const jsDow = first.getDay(); // 0=nd..6=sb
    const leading = (jsDow + 6) % 7; // ile pustych komórek przed 1.
    const cells: Array<{ iso: string | null; day: number | null }> = [];
    for (let i = 0; i < leading; i++) cells.push({ iso: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = isoDate(new Date(month.getFullYear(), month.getMonth(), d));
      cells.push({ iso, day: d });
    }
    while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });
    // Wiersze
    const rows: Array<typeof cells> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const label = `${MONTHS_PL[month.getMonth()]} ${month.getFullYear()}`;

  return (
    <View>
      {/* Nawigacja miesięczna */}
      <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
        <Pressable onPress={onPrev} hitSlop={12} accessibilityLabel="poprzedni miesiąc" style={{ padding: 6 }}>
          <Text variant="body" style={{ fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text variant="bodyMedium">{label}</Text>
        <Pressable onPress={onNext} hitSlop={12} accessibilityLabel="następny miesiąc" style={{ padding: 6 }}>
          <Text variant="body" style={{ fontSize: 18 }}>›</Text>
        </Pressable>
      </View>

      {/* Nagłówki dni tygodnia */}
      <View className="flex-row" style={{ marginBottom: 4 }}>
        {WEEKDAY_SHORT.map((w) => (
          <View key={w} style={{ width: CELL, alignItems: 'center' }}>
            <Text variant="mono" style={{ fontSize: 10, color: '#7A6F62' }}>{w.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {grid.map((row, rIdx) => (
        <View key={rIdx} className="flex-row">
          {row.map((cell, cIdx) => {
            if (!cell.iso) {
              return <View key={cIdx} style={{ width: CELL, height: CELL }} />;
            }
            const entry = entries[cell.iso];
            const isToday = cell.iso === today;
            const hasNote = !!notesByDate[cell.iso]?.length;
            return (
              <Pressable
                key={cIdx}
                onPress={() => onSelectDate(cell.iso!)}
                accessibilityLabel={`${cell.day} ${label}`}
                style={{
                  width: CELL,
                  height: CELL,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: TILE,
                    height: TILE,
                    borderRadius: 8,
                    backgroundColor: '#FBFAF2',
                    borderWidth: isToday ? 1.5 : 1,
                    borderColor: isToday ? '#1A1614' : '#E7DFD2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="mono" style={{ fontSize: 11, color: '#3B342C' }}>
                    {cell.day}
                  </Text>
                  {hasNote && !entry && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 3,
                        width: 3,
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: '#7A6F62',
                      }}
                    />
                  )}
                  {entry && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: -BADGE * 0.32,
                        right: -BADGE * 0.32,
                      }}
                    >
                      <MiniFlower dna={dna} dnaSeed={dnaSeed} size={BADGE} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
