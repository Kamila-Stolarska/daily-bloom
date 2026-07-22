// Daily Bloom — komponent renderujący kwiatek (Skia).
// Cienki wrapper wokół <FlowerContent /> — sam Canvas + delegacja.

import React from 'react';
import { Canvas } from '@shopify/react-native-skia';

import { Dna } from '../lib/flower/dna';
import { DayData } from '../lib/flower/types';
import { FlowerContent } from './FlowerContent';

type Props = {
  dna: Dna;
  day: DayData;
  size: number;
  showBg?: boolean;
};

export const Flower = React.memo(function Flower({ dna, day, size, showBg = false }: Props) {
  return (
    <Canvas style={{ width: size, height: size }}>
      <FlowerContent dna={dna} day={day} size={size} showBg={showBg} />
    </Canvas>
  );
});
