import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  LibreBodoni_400Regular,
  LibreBodoni_500Medium,
  LibreBodoni_600SemiBold,
  LibreBodoni_700Bold,
  LibreBodoni_400Regular_Italic,
} from '@expo-google-fonts/libre-bodoni';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import '../global.css';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    LibreBodoni_400Regular,
    LibreBodoni_500Medium,
    LibreBodoni_600SemiBold,
    LibreBodoni_700Bold,
    LibreBodoni_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View className="flex-1 bg-paper" />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F6F6EA' },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
