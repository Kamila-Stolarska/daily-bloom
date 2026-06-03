// Logowanie i rejestracja przez email + hasło.
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';

type Mode = 'signIn' | 'signUp';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !pending;

  async function submit() {
    setErr(null);
    setInfo(null);
    setPending(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setInfo('Sprawdź skrzynkę — wysłaliśmy link aktywacyjny.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Coś poszło nie tak.');
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="px-7 pt-6">
        <Text variant="eyebrow">DAILY — BLOOM</Text>
      </View>
      <View className="flex-1 px-7 justify-center">
        <Text variant="eyebrow">WITAJ</Text>
        <Text
          variant="display"
          className="mt-4"
          style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1.5 }}
        >
          {isSignUp ? 'Załóż konto, żeby Twoje dni nie zginęły.' : 'Zaloguj się.'}
        </Text>
        <Text variant="caption" tone="muted" className="mt-4">
          {isSignUp
            ? 'Wpisy zapiszą się w chmurze i zobaczysz je z każdego urządzenia.'
            : 'Wpisz email i hasło, którymi się rejestrowałaś.'}
        </Text>

        <View className="mt-8" style={{ gap: 12 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email"
            placeholderTextColor="#9A8F82"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 16,
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#D8CFC2',
              color: '#1A1614',
              backgroundColor: '#FBF8F1',
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="hasło (min. 6 znaków)"
            placeholderTextColor="#9A8F82"
            autoCapitalize="none"
            secureTextEntry
            textContentType={isSignUp ? 'newPassword' : 'password'}
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 16,
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#D8CFC2',
              color: '#1A1614',
              backgroundColor: '#FBF8F1',
            }}
          />
        </View>

        <View className="mt-6">
          <Button variant="solid" onPress={submit} disabled={!canSubmit}>
            <Text tone="paper" variant="bodyMedium">
              {pending ? 'Chwila…' : isSignUp ? 'Załóż konto' : 'Zaloguj się'}
            </Text>
          </Button>
        </View>

        <View className="mt-4 items-center">
          <Button
            variant="link"
            onPress={() => {
              setErr(null);
              setInfo(null);
              setMode(isSignUp ? 'signIn' : 'signUp');
            }}
            disabled={pending}
          >
            <Text variant="caption" tone="muted">
              {isSignUp ? 'Mam już konto — zaloguj się' : 'Nie mam konta — załóż'}
            </Text>
          </Button>
        </View>

        {err ? (
          <Text variant="caption" className="mt-4" style={{ color: '#9A4040' }}>
            {err}
          </Text>
        ) : null}
        {info ? (
          <Text variant="caption" className="mt-4" style={{ color: '#3D6B4F' }}>
            {info}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
