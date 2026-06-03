// Wskaźnik "agent myśli" — outline kwiatka użytkowniczki z delikatnym oddechem + powolną rotacją.
// Używa tych samych dna/dnaSeed co home, więc kwiatek jest "jej".

import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { FlowerLazy } from '../FlowerLazy';
import { deriveDna } from '../../lib/flower/dna';
import type { DayData } from '../../lib/flower/types';
import { useStore } from '../../lib/store';

const NEUTRAL: DayData = {
  day: 5, emotions: 5, energy: 5, body: 5, delight: 5, meaning: 5,
  somethingGood: false, somethingHard: false,
};

const SIZE = 52;

export function ThinkingFlower() {
  const userId = useStore((s) => s.userId);
  const dna = useMemo(() => deriveDna(userId || 'anon'), [userId]);
  const dnaSeed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
    return Math.abs(h) || 1234567;
  }, [userId]);

  const scale = useSharedValue(0.92);
  const rot = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.92, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    rot.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [scale, rot]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <View
      className="self-start mb-3"
      style={{
        backgroundColor: '#FBFAF1',
        borderColor: '#EDE5D5',
        borderWidth: 1,
        borderRadius: 22,
        borderBottomLeftRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      <Animated.View style={[{ width: SIZE, height: SIZE }, animStyle]}>
        <FlowerLazy
          dna={dna}
          day={NEUTRAL}
          size={SIZE}
          dnaSeed={dnaSeed}
          outline
          outlineColor="#C8BCA8"
          outlineWidth={1.2}
        />
      </Animated.View>
    </View>
  );
}
