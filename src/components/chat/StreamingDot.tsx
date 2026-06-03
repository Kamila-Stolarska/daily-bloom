import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Dot({ delay }: { delay: number }) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.3, { duration: 500 }),
      ),
      -1,
      false,
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#7A6F62',
          marginRight: 4,
          marginLeft: delay === 0 ? 0 : 0,
        },
        style,
      ]}
    />
  );
}

export function StreamingDot() {
  return (
    <View
      className="self-start mb-3 px-4 py-3 flex-row items-center"
      style={{
        backgroundColor: '#FBFAF1',
        borderColor: '#EDE5D5',
        borderWidth: 1,
        borderRadius: 22,
        borderBottomLeftRadius: 6,
      }}
    >
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}
