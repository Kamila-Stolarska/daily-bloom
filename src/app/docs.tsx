// /docs — dokumentacja publicznego API Daily Bloom dla developerów i agentów.
// Statyczna strona w stylu aplikacji: kremowe tło, Libre Bodoni do nagłówków, Inter do body.
// Kopiowanie bloków curl działa na web (navigator.clipboard); na native blok jest po prostu czytelny.

import { useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '../components/ui/text';

function copyToClipboard(text: string): boolean {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    void navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

function getBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://your-deployment.vercel.app';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 40 }}>
      <Text variant="h2" style={{ marginBottom: 16 }}>{title}</Text>
      {children}
    </View>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const canCopy = Platform.OS === 'web';
  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 8,
        backgroundColor: '#1C1C19',
        padding: 16,
        position: 'relative',
      }}
    >
      <Text
        selectable
        style={{
          color: '#F6F6EA',
          fontFamily: Platform.OS === 'web' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        {code}
      </Text>
      {canCopy && (
        <Pressable
          onPress={() => {
            if (copyToClipboard(code)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }
          }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: copied ? '#9CB59A' : '#3A3A36',
          }}
        >
          <Text style={{ color: '#F6F6EA', fontSize: 11, letterSpacing: 1 }}>
            {copied ? 'SKOPIOWANO' : 'KOPIUJ'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function Endpoint({
  method,
  path,
  description,
  request,
  response,
  curl,
}: {
  method: 'POST' | 'GET';
  path: string;
  description: string;
  request?: string;
  response: string;
  curl: string;
}) {
  return (
    <View style={{ marginTop: 28, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E2D2' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: method === 'POST' ? '#9CB59A' : '#C5B89C',
          }}
        >
          <Text style={{ color: '#1C1C19', fontSize: 11, letterSpacing: 1.4 }}>{method}</Text>
        </View>
        <Text variant="bodyMedium" style={{ fontSize: 16 }}>{path}</Text>
      </View>
      <Text variant="body" tone="muted" style={{ marginTop: 8 }}>{description}</Text>
      {request && (
        <>
          <Text variant="eyebrow" tone="muted" style={{ marginTop: 20 }}>Request body</Text>
          <CodeBlock code={request} />
        </>
      )}
      <Text variant="eyebrow" tone="muted" style={{ marginTop: 20 }}>Response 200</Text>
      <CodeBlock code={response} />
      <Text variant="eyebrow" tone="muted" style={{ marginTop: 20 }}>Przykład</Text>
      <CodeBlock code={curl} />
    </View>
  );
}

export default function DocsScreen() {
  const { width } = useWindowDimensions();
  const horizontalPad = Math.min(48, Math.max(20, width * 0.05));
  const maxWidth = Math.min(width - horizontalPad * 2, 720);
  const baseUrl = getBaseUrl();

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingTop: 24,
          paddingBottom: 80,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth }}>
          {/* Top */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">DAILY — BLOOM / API DOCS</Text>
            <Pressable onPress={() => router.back()} accessibilityLabel="Wróć">
              <Text variant="caption" tone="muted">← wstecz</Text>
            </Pressable>
          </View>

          {/* H1 */}
          <Text variant="h1" style={{ marginTop: 24, letterSpacing: -1.2 }}>
            Publiczne API
          </Text>
          <Text variant="body" tone="muted" style={{ marginTop: 12 }}>
            Trzy endpointy do programatycznej pracy z dzienniczkiem: dodawanie wpisu, rozmowa z agentem-terapeutą,
            odczyt wpisu po dacie. Wszystkie zwracają JSON i wymagają tej samej autoryzacji.
          </Text>

          <Section title="Base URL">
            <CodeBlock code={baseUrl} />
          </Section>

          <Section title="Autoryzacja">
            <Text variant="body" tone="muted">
              Każde żądanie potrzebuje nagłówka <Text variant="bodyMedium">Authorization: Bearer &lt;token&gt;</Text>,
              gdzie token to access_token z Supabase (PKCE). Najprostszy sposób, żeby go zdobyć: zaloguj się
              w aplikacji, a następnie w konsoli przeglądarki wpisz:
            </Text>
            <CodeBlock code={`const s = await window.__supabase?.auth?.getSession();\nconsole.log(s?.data?.session?.access_token);`} />
            <Text variant="body" tone="muted" style={{ marginTop: 12 }}>
              Token jest powiązany z konkretnym użytkownikiem — RLS w bazie automatycznie ogranicza dane do
              właściciela tokenu. Nigdy nie przekazuj <Text variant="bodyMedium">user_id</Text> w body — bierzemy
              je z tokenu.
            </Text>
          </Section>

          <Section title="Endpointy">
            <Endpoint
              method="POST"
              path="/api/v1/entries"
              description="Dodaje lub aktualizuje wpis dnia. Wpis jest unikalny po (user, data) — drugi POST tego samego dnia nadpisze poprzedni. Pole `date` jest opcjonalne — bez niego endpoint zapisuje na dziś (UTC). Opcjonalne pole `note` jednocześnie dodaje notatkę dla tej daty."
              request={`{
  "date": "${new Date().toISOString().slice(0, 10)}",   // opcjonalne, domyślnie dziś
  "day": 4,
  "emotions": 3,
  "energy": 2,
  "body": 3,
  "delight": 5,
  "meaning": 4,
  "somethingGood": true,
  "somethingHard": false,
  "note": "Dziś wyszłam na spacer i było lżej."          // opcjonalne
}`}
              response={`{
  "entry": {
    "dateIso": "${new Date().toISOString().slice(0, 10)}",
    "day": 4, "emotions": 3, "energy": 2,
    "body": 3, "delight": 5, "meaning": 4,
    "somethingGood": true,
    "somethingHard": false,
    "createdAtIso": "2026-06-05T10:30:00.000Z"
  },
  "note": {
    "id": "uuid",
    "date": "${new Date().toISOString().slice(0, 10)}",
    "text": "Dziś wyszłam na spacer i było lżej.",
    "createdAtIso": "2026-06-05T10:30:00.123Z"
  }
}`}
              curl={`curl -X POST ${baseUrl}/api/v1/entries \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"day":4,"emotions":3,"energy":2,"body":3,"delight":5,"meaning":4,"somethingGood":true,"somethingHard":false}'`}
            />

            <Endpoint
              method="POST"
              path="/api/v1/chat"
              description="Zadaje pytanie agentowi-terapeucie. Agent dostaje kontekst z 14 dni wstecz od daty rozmowy (wpisy + notatki + ostatnie 20 wiadomości). Endpoint czeka na pełną odpowiedź modelu i zwraca ją w JSON — bez streamingu, agent-friendly. Każde wywołanie zmniejsza credit_cents w profilu."
              request={`{
  "message": "Jak wyglądał mój ostatni tydzień?",
  "date": "${new Date().toISOString().slice(0, 10)}"   // opcjonalne, domyślnie dziś — wyznacza okno kontekstu
}`}
              response={`{
  "reply": "Widzę, że środa była ciężka — pisałaś że ledwo żyłaś…",
  "date": "${new Date().toISOString().slice(0, 10)}",
  "tokensIn": 1842,
  "tokensOut": 318,
  "creditCentsRemaining": 4923
}`}
              curl={`curl -X POST ${baseUrl}/api/v1/chat \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Jak wyglądał mój ostatni tydzień?"}'`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/entries/:date"
              description="Pobiera wpis i notatki dla podanej daty (YYYY-MM-DD). Brak wpisu zwraca entry: null (nie 404) — łatwiej parsować dla agenta. Notatki posortowane chronologicznie."
              response={`{
  "entry": {
    "dateIso": "${new Date().toISOString().slice(0, 10)}",
    "day": 4, "emotions": 3, "energy": 2,
    "body": 3, "delight": 5, "meaning": 4,
    "somethingGood": true,
    "somethingHard": false,
    "createdAtIso": "2026-06-05T10:30:00.000Z"
  },
  "notes": [
    { "id": "uuid", "date": "${new Date().toISOString().slice(0, 10)}",
      "text": "Dziś wyszłam na spacer i było lżej.",
      "createdAtIso": "2026-06-05T10:30:00.123Z" }
  ]
}`}
              curl={`curl ${baseUrl}/api/v1/entries/${new Date().toISOString().slice(0, 10)} \\
  -H "Authorization: Bearer $TOKEN"`}
            />
          </Section>

          <Section title="Modele danych">
            <Text variant="bodyMedium" style={{ marginTop: 12 }}>Entry</Text>
            <CodeBlock code={`{
  dateIso: string         // "YYYY-MM-DD"
  day: 1 | 2 | 3 | 4 | 5
  emotions: 1..5
  energy: 1..5
  body: 1..5
  delight: 1..5
  meaning: 1..5
  somethingGood: boolean
  somethingHard: boolean
  createdAtIso: string    // ISO 8601 z czasem
}`} />
            <Text variant="bodyMedium" style={{ marginTop: 20 }}>Note</Text>
            <CodeBlock code={`{
  id: string              // uuid
  date: string            // "YYYY-MM-DD"
  text: string            // max 4000 znaków
  createdAtIso: string
}`} />
            <Text variant="bodyMedium" style={{ marginTop: 20 }}>6 osi — co znaczą</Text>
            <Text variant="body" tone="muted" style={{ marginTop: 8 }}>
              day = ogólny dzień, emotions = emocje, energy = energia, body = ciało, delight = zachwyt,
              meaning = sens. Skala 1 (bardzo mało) → 5 (dużo).
            </Text>
          </Section>

          <Section title="Błędy">
            <Text variant="body" tone="muted">Wszystkie błędy zwracają JSON w kształcie:</Text>
            <CodeBlock code={`{ "error": "kod-bledu", "hint": "opcjonalna podpowiedź" }`} />
            <Text variant="body" tone="muted" style={{ marginTop: 16 }}>
              <Text variant="bodyMedium">400</Text> — niepoprawne body / data / wartości skali poza 1–5{'\n'}
              <Text variant="bodyMedium">401</Text> — brak lub nieważny Bearer token{'\n'}
              <Text variant="bodyMedium">402</Text> — brak kredytu (dotyczy /chat){'\n'}
              <Text variant="bodyMedium">404</Text> — brak profilu (rzadkie){'\n'}
              <Text variant="bodyMedium">500</Text> — błąd serwera{'\n'}
              <Text variant="bodyMedium">502</Text> — błąd modelu (dotyczy /chat)
            </Text>
          </Section>

          <View style={{ marginTop: 60, marginBottom: 20 }}>
            <Text variant="caption" tone="muted">
              Daily Bloom — projekt portfolio. API może się zmieniać. Wersja v1.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
