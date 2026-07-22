// Logowanie i rejestracja przez email + hasło.
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { FlowerLazy } from '../components/FlowerLazy';
import { AmbientBlooms, type Bloom } from '../components/AmbientBlooms';
import { deriveDna } from '../lib/flower/dna';
import { PALETTES } from '../lib/flower/palettes';
import type { DayData } from '../lib/flower/types';

// Dekoracyjny kwiatek na ekranie powitalnym — deterministyczny, nie należy do żadnego usera.
// Ten sam komponent (FlowerLazy/OrganicFlower, Skia) co kwiatek dnia i kwiatki
// w Ogrodzie — bez tego wyglądał jak inny, uproszczony rysunek (MiniFlower to
// tylko lekki SVG-znacznik do siatek, nie "prawdziwy" kwiatek aplikacji).
// Pełny rozkwit na wszystkich osiach — to kwiatek powitalny, nie portret dnia.
const WELCOME_SEED = 'witaj-w-daily-bloom';
const WELCOME_DAY: DayData = {
  day: 5, emotions: 5, energy: 5, body: 5, delight: 5, meaning: 5,
  somethingGood: false, somethingHard: false,
};
function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1234567;
}

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

  const welcomeDna = useMemo(() => deriveDna(WELCOME_SEED), []);
  const welcomeDnaSeed = useMemo(() => seedHash(WELCOME_SEED), []);
  const welcomePalette = PALETTES[welcomeDna.paletteIndex % PALETTES.length];

  const { width: winW, height: winH } = useWindowDimensions();
  // Rozlane, akwarelowe plamy koloru w tle całego ekranu — kolory z tej samej
  // palety co kwiatek, żeby scena była spójna, a nie jakby kwiatek stał na
  // osobnym, niepowiązanym tle. Nisko nasycone i duże, żeby nie konkurowały
  // z kwiatkiem o uwagę (on ma zostać najbardziej wyrazistym elementem).
  const blooms = useMemo<Bloom[]>(
    () => [
      { cx: winW * 0.08, cy: winH * 0.06, r: Math.max(winW, winH) * 0.28, color: welcomePalette.petals[0] },
      { cx: winW * 0.95, cy: winH * 0.18, r: Math.max(winW, winH) * 0.24, color: welcomePalette.aura, opacity: 0.22 },
      { cx: winW * 0.02, cy: winH * 0.62, r: Math.max(winW, winH) * 0.22, color: welcomePalette.petals[3], opacity: 0.2 },
      { cx: winW * 0.98, cy: winH * 0.85, r: Math.max(winW, winH) * 0.3, color: welcomePalette.petals[4], opacity: 0.18 },
    ],
    [winW, winH, welcomePalette],
  );

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
      <AmbientBlooms width={winW} height={winH} blooms={blooms} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center pt-10" style={{ width: 210, height: 210, alignSelf: 'center' }}>
            <FlowerLazy dna={welcomeDna} day={WELCOME_DAY} size={210} dnaSeed={welcomeDnaSeed} grain />
          </View>

          <View className="items-center mt-4 px-8">
            <Text variant="eyebrow">WITAJ W</Text>
            <Text
              variant="display"
              className="mt-2 text-center"
              style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.2 }}
            >
              Daily Bloom
            </Text>
            <Text variant="caption" tone="muted" className="mt-3 text-center">
              Jedna chwila dziennie. Jeden kwiat, który rośnie razem z Tobą.
            </Text>
          </View>

          <View className="px-7 mt-9">
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="flex-1 h-px bg-ink-muted/20" />
              <Text variant="caption" tone="muted">
                {isSignUp ? 'załóż konto' : 'zaloguj się'}
              </Text>
              <View className="flex-1 h-px bg-ink-muted/20" />
            </View>

            <Text variant="h3" className="mt-6">
              {isSignUp ? 'Załóż konto, żeby Twoje dni nie zginęły.' : 'Miło Cię znów widzieć.'}
            </Text>
            <Text variant="caption" tone="muted" className="mt-2">
              {isSignUp
                ? 'Wpisy zapiszą się w chmurze i zobaczysz je z każdego urządzenia.'
                : 'Wpisz email i hasło, którymi się rejestrowałaś.'}
            </Text>

            <View className="mt-6" style={{ gap: 12 }}>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
