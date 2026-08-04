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

import { PostHogProvider } from 'posthog-react-native';

import '../global.css';
import { useStore } from '../lib/store';
import { identify, posthog, resetAnalytics, track } from '../lib/analytics';

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
    if (authed && name) {
      identify(useStore.getState().userId, { name });
    } else if (!authed) {
      resetAnalytics();
    }
  }, [hydrated, authed, name]);

  useEffect(() => {
    if (!hydrated) return;
    const path = '/' + segments.join('/');
    track('$screen', { $screen_name: segments[0] || 'home', path });
  }, [hydrated, segments]);

  useEffect(() => {
    if (!hydrated) return;
    const onAuth = segments[0] === 'auth';
    const onOnboarding = segments[0] === 'onboarding';
    const onDocs = segments[0] === 'docs';
    if (onDocs) return; // strona dokumentacji publiczna
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

  const tree = (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFF0' },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );

  return posthog ? <PostHogProvider client={posthog}>{tree}</PostHogProvider> : tree;
}
