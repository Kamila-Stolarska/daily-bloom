// Onboarding: imię. Używa Button/Text z ui/.

import { useState } from 'react';
import { TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';

export default function Onboarding() {
  const setName = useStore((s) => s.setName);
  const [value, setValue] = useState('');

  async function submit() {
    const v = value.trim();
    if (!v) return;
    await setName(v);
    router.replace('/entry');
  }

  const enabled = !!value.trim();

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="px-7 pt-6 flex-row items-center justify-between">
          <Text variant="eyebrow">DAILY — BLOOM</Text>
        </View>

        <View className="flex-1 px-7 justify-center">
          <Text variant="eyebrow">WITAJ</Text>
          <Text
            variant="display"
            className="mt-4"
            style={{ fontSize: 48, lineHeight: 50, letterSpacing: -1.5 }}
          >
            Jak masz na imię?
          </Text>
          <Text variant="caption" tone="muted" className="mt-4">
            Twój mały dzienniczek, w którym każdego dnia zakwita inny, niepowtarzalny kwiatek — utkany z tego, jak właśnie się masz.
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="imię"
            placeholderTextColor="#7A6F6260"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
            className="font-serif text-ink mt-12 px-4 py-3 border-b border-ink-muted/30"
            style={{ fontSize: 28, letterSpacing: -0.5 }}
          />
        </View>

        <View className="px-6 pb-8">
          <Button variant="pill" label="zaczynamy" disabled={!enabled} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
