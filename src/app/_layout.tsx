import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
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
import { useStore } from '../lib/store';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useStore((s) => s.hydrated);
  const authed = useStore((s) => s.authed);
  const name = useStore((s) => s.name);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const onAuth = segments[0] === 'auth';
    const onOnboarding = segments[0] === 'onboarding';
    if (!authed) {
      if (!onAuth) router.replace('/auth');
    } else if (!name) {
      if (!onOnboarding) router.replace('/onboarding');
    } else if (onAuth || onOnboarding) {
      router.replace('/');
    }
  }, [hydrated, authed, name, segments, router]);

  return null;
}

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
      <AuthGate />
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
