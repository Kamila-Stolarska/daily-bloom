import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="font-serif text-[44px] leading-[48px] text-ink text-center">
          Daily Bloom
        </Text>
        <Text className="mt-4 font-sans text-base text-ink-muted text-center">
          fundament gotowy.
        </Text>
      </View>
    </SafeAreaView>
  );
}
