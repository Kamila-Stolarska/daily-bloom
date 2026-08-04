// /search — semantyczna wyszukiwarka wpisów dziennika.
// Faza 5 kursu: embedduje query (OpenAI 1536D), hybrid search (vector + BM25, RRF)
// po tabeli `entry_embeddings` w Supabase. Endpoint: POST /api/v1/search.

import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '../components/ui/text';
import { supabase } from '../lib/supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';
const URL_SEARCH = `${API_BASE}/api/v1/search`;

type Result = {
  date: string;
  strapiDocumentId: string;
  embeddingSource: string;
  score: number;
  vecRank: number | null;
  bmRank: number | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Musisz być zalogowana.');
      const res = await fetch(URL_SEARCH, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: q, k: 10 }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`search-failed: ${res.status} ${text}`);
      }
      const json = (await res.json()) as { results: Result[] };
      setResults(json.results ?? []);
    } catch (e) {
      setError((e as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFF0' }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ fontSize: 16 }}>← Wstecz</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text variant="h1" style={{ marginBottom: 8 }}>Szukaj</Text>
        <Text style={{ opacity: 0.6, fontSize: 14, marginBottom: 16 }}>
          Semantyczna wyszukiwarka po Twoich wpisach. Np. „dni gdy miałam dużo energii", „kiedy ostatnio było mi trudno".
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            placeholder="Wpisz pytanie po polsku…"
            placeholderTextColor="#7A6F62"
            returnKeyType="search"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#E2E2D2',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: '#1A1614',
              backgroundColor: '#FFFFFF',
            }}
          />
          <Pressable
            onPress={runSearch}
            disabled={loading || query.trim().length < 2}
            style={{
              backgroundColor: '#1A1614',
              borderRadius: 10,
              paddingHorizontal: 18,
              justifyContent: 'center',
              opacity: loading || query.trim().length < 2 ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#FFFFF0', fontWeight: '500' }}>
              {loading ? '…' : 'Szukaj'}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading && (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator color="#1C1C19" />
        </View>
      )}

      <FlatList
        data={results ?? []}
        keyExtractor={(r) => r.date + r.strapiDocumentId}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 }}
        ListEmptyComponent={
          !loading && results !== null ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              {error ? (
                <Text style={{ textAlign: 'center', opacity: 0.6, fontSize: 13 }}>{error}</Text>
              ) : (
                <Text style={{ textAlign: 'center', opacity: 0.5 }}>Brak wyników.</Text>
              )}
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/entry', params: { date: item.date } })}
            style={({ pressed }) => ({
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E2D2',
              padding: 14,
              backgroundColor: pressed ? '#EDEDDD' : '#FFFFFF',
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text variant="bodyMedium">{formatDate(item.date)}</Text>
              <Text style={{ fontSize: 11, opacity: 0.5, fontVariant: ['tabular-nums'] }}>
                score {item.score.toFixed(3)}
                {item.vecRank ? ` · vec #${item.vecRank}` : ''}
                {item.bmRank ? ` · bm #${item.bmRank}` : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 13, lineHeight: 20, color: '#3A3530' }}>
              {item.embeddingSource}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
