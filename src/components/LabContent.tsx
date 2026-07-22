// Lab — porównanie wariantów stylu kwiatka.

import type { ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import { OrganicFlower } from './OrganicFlower';
import { SoftBloomFlower, WatercolorBleedFlower } from './FlowerVariants';
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

type FlowerRender = (props: {
  dna: typeof HERO_DNA;
  day: DayData;
  size: number;
  dnaSeed: number;
}) => ReactElement;

function Variant({
  label,
  caption,
  Render,
}: {
  label: string;
  caption: string;
  Render: FlowerRender;
}) {
  return (
    <View className="items-center" style={{ marginBottom: 40 }}>
      <Text variant="eyebrow" style={{ marginBottom: 12 }}>
        {label}
      </Text>
      <View style={{ width: SIZE, height: SIZE, position: 'relative' }}>
        <Render dna={HERO_DNA} day={HERO_DAY} size={SIZE} dnaSeed={DNA_SEED} />
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
        Style kwiatka
      </Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: 28 }}>
        obecny + dwa nowe warianty wg inspiracji
      </Text>

      <Variant
        label="OBECNY — ORGANIC"
        caption="teardrop-płatki, gradient tip→base, delikatny grain"
        Render={(p) => <OrganicFlower {...p} grain animate={false} />}
      />

      <Variant
        label="A — SOFT BLOOM"
        caption="1:1 z flower.svg — białe płatki + gradient lime→orange, różowy blur w środku"
        Render={(p) => <SoftBloomFlower {...p} />}
      />

      <Variant
        label="B — WATERCOLOR BLEED"
        caption="krzyżujące się przezroczyste płatki + mocny grain, warm palette"
        Render={(p) => <WatercolorBleedFlower {...p} />}
      />
    </ScrollView>
  );
}
