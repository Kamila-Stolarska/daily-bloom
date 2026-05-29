// Lab — porównanie dwóch wariantów legendy kwiatka.

import { ScrollView, View } from 'react-native';
import { OrganicFlower } from './OrganicFlower';
import { FlowerChrome } from './FlowerChrome';
import { DayData } from '../lib/flower/types';
import { Text } from './ui/text';

const HERO_DNA = {
  paletteIndex: 0,
  archetypeIndex: 0,
  curvature: 0.7,
  asymmetry: 0.15,
  textureIndex: 0,
  rotationOffset: 8,
  pestilIndex: 0,
};

const HERO_DAY: DayData = {
  day: 5,
  emotions: 5,
  energy: 4,
  body: 5,
  delight: 5,
  meaning: 4,
  somethingGood: true,
  somethingHard: false,
  dateIso: '2026-05-28',
};

const DNA_SEED = 1234567;
const SIZE = 320;

function Variant({
  label,
  caption,
  showGrid,
}: {
  label: string;
  caption: string;
  showGrid: boolean;
}) {
  return (
    <View className="items-center" style={{ marginBottom: 40 }}>
      <Text variant="eyebrow" style={{ marginBottom: 12 }}>
        {label}
      </Text>
      <View style={{ width: SIZE, height: SIZE, position: 'relative' }}>
        <OrganicFlower
          dna={HERO_DNA}
          day={HERO_DAY}
          size={SIZE}
          dnaSeed={DNA_SEED}
          animate={false}
        />
        <FlowerChrome size={SIZE} rotationOffset={HERO_DNA.rotationOffset} showGrid={showGrid} />
      </View>
      <Text variant="caption" tone="muted" style={{ marginTop: 12, textAlign: 'center' }}>
        {caption}
      </Text>
    </View>
  );
}

export default function LabContent() {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 60 }}>
      <Text variant="h2" style={{ marginBottom: 4 }}>
        Legenda kwiatka
      </Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: 28 }}>
        dwa warianty do porównania
      </Text>

      <Variant
        label="WARIANT 1 — SIATKA + ETYKIETY"
        caption="pełna data-viz: pierścienie skali 1–5 i 6 promieni"
        showGrid={true}
      />

      <Variant
        label="WARIANT 2 — SAME ETYKIETY"
        caption="lżejsza wersja — bez siatki, kwiatek nadal pływa"
        showGrid={false}
      />
    </ScrollView>
  );
}
