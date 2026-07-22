// Chronologiczna galeria: jeden Canvas per miesiąc (zamiast N na kwiatek),
// pressable overlays absolutnie na wierzchu. Redukuje WebGL contexts z ~20 do 3-5.

import { Pressable, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { Text } from './ui/text';
import { OrganicFlowerContent } from './OrganicFlowerContent';
import { entryToDayData, notesLength } from '../lib/store';
import { groupByMonth } from '../lib/stats';
import type { Entry, Note } from '../lib/store';
import type { Dna } from '../lib/flower/dna';

type Props = {
  entries: Entry[];
  notesByDate: Record<string, Note[]>;
  dna: Dna;
  dnaSeed: number;
  onSelectDate: (dateIso: string) => void;
  width: number;
};

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

const TILE = 96;
const FLOWER_SIZE = 72;
const GAP = 12;
const LABEL_H = 16;

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_PL[m - 1]} ${y}`;
}

export function FlowerGardenImpl({ entries, notesByDate, dna, dnaSeed, onSelectDate, width }: Props) {
  if (entries.length === 0) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <Text variant="body" tone="muted" className="text-center">
          Twój ogród jeszcze nie zakwitł.{'\n'}Zapisz pierwszy dzień, żeby zobaczyć kwiatek.
        </Text>
      </View>
    );
  }
  const months = groupByMonth(entries);
  const cols = Math.max(1, Math.floor((width + GAP) / (TILE + GAP)));

  return (
    <View>
      {months.map(({ month, entries: monthEntries }) => {
        const rows = Math.ceil(monthEntries.length / cols);
        const canvasH = rows * (TILE + LABEL_H) + Math.max(0, rows - 1) * GAP;
        return (
          <View key={month} style={{ marginBottom: 24 }}>
            <View className="flex-row items-center" style={{ marginBottom: 12 }}>
              <Text variant="eyebrow" style={{ color: '#7A6F62', marginRight: 12 }}>
                {monthLabel(month).toUpperCase()} — {monthEntries.length}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E1D8CE' }} />
            </View>
            <View style={{ width, height: canvasH, position: 'relative' }}>
              <Canvas style={{ width, height: canvasH, position: 'absolute', left: 0, top: 0 }}>
                {monthEntries.map((e, i) => {
                  const row = Math.floor(i / cols);
                  const col = i % cols;
                  const ox = col * (TILE + GAP) + (TILE - FLOWER_SIZE) / 2;
                  const oy = row * (TILE + LABEL_H + GAP) + (TILE - FLOWER_SIZE) / 2;
                  return (
                    <OrganicFlowerContent
                      key={e.dateIso}
                      dna={dna}
                      day={entryToDayData(e, notesLength(notesByDate[e.dateIso]))}
                      size={FLOWER_SIZE}
                      dnaSeed={dnaSeed}
                      ox={ox}
                      oy={oy}
                    />
                  );
                })}
              </Canvas>
              {monthEntries.map((e, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const left = col * (TILE + GAP);
                const top = row * (TILE + LABEL_H + GAP);
                return (
                  <Pressable
                    key={e.dateIso}
                    onPress={() => onSelectDate(e.dateIso)}
                    accessibilityLabel={`Wpis ${e.dateIso}`}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: TILE,
                      height: TILE + LABEL_H,
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Text variant="mono" style={{ fontSize: 9, color: '#7A6F62' }}>
                      {e.dateIso.slice(8)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default FlowerGardenImpl;
