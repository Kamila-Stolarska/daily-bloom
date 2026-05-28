// Lab — focus na JEDNYM kwiatku.
// Iterujemy aż akwarela zacznie wyglądać jak referencja, potem wrócimy do siatki.

import { ScrollView, View, Text } from 'react-native';
import { OrganicFlower } from './OrganicFlower';
import { deriveDna } from '../lib/flower/dna';
import { DayData } from '../lib/flower/types';

// Hardcode: paleta "Akwarela" (index 0), archetyp 0, środkowy random seed.
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

// Deterministyczny seed dla jitteru (z user-id).
const DNA_SEED = 1234567;

export default function LabContent() {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
      <Text className="font-serif text-[32px] leading-[36px] text-ink mt-4 mb-1">
        Lab — jeden kwiatek
      </Text>
      <Text className="font-sans text-sm text-ink-muted mb-6">
        iteracja akwarelowa wg referencji
      </Text>

      <View className="items-center justify-center my-6">
        <OrganicFlower
          dna={HERO_DNA}
          day={HERO_DAY}
          size={420}
          dnaSeed={DNA_SEED}
        />
      </View>

      <Text className="font-serif-italic text-base text-ink-muted text-center mt-2">
        paleta Akwarela · DNA seed {DNA_SEED}
      </Text>
    </ScrollView>
  );
}
