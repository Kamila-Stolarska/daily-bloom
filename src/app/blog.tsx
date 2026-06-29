// /blog — lista postów z Strapi CMS. Read-only z perspektywy aplikacji.

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '../components/ui/text';
import { listPosts, type StrapiPost } from '../lib/strapi/posts';
import { strapiMediaUrl, STRAPI_BASE } from '../lib/strapi/client';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function excerpt(content: string, n = 140): string {
  const clean = content.replace(/[#*_`>\-]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= n) return clean;
  return clean.slice(0, n).trimEnd() + '…';
}

export default function Blog() {
  const [posts, setPosts] = useState<StrapiPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listPosts();
      setPosts(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (posts === null && !error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6EA' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#1C1C19" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6EA' }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ fontSize: 16 }}>← Wstecz</Text>
        </Pressable>
        <Pressable onPress={() => void load()} hitSlop={12}>
          <Text style={{ fontSize: 14, opacity: 0.6 }}>Odśwież</Text>
        </Pressable>
      </View>

      <FlatList
        data={posts ?? []}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 24 }}>
            <Text variant="h1" style={{ marginBottom: 8 }}>Blog</Text>
            <Text style={{ opacity: 0.6, fontSize: 14 }}>
              {STRAPI_BASE ? `źródło: ${STRAPI_BASE}` : 'CMS nie skonfigurowany'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            {error ? (
              <>
                <Text style={{ textAlign: 'center', opacity: 0.8 }}>Nie udało się pobrać postów.</Text>
                <Text style={{ textAlign: 'center', opacity: 0.5, fontSize: 12, marginTop: 8 }}>{error}</Text>
              </>
            ) : (
              <Text style={{ textAlign: 'center', opacity: 0.6 }}>Brak postów. Dodaj pierwszy w panelu Strapi.</Text>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
        renderItem={({ item }) => {
          const img = strapiMediaUrl(item.cover ?? undefined, 'medium') ?? strapiMediaUrl(item.cover ?? undefined);
          return (
            <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF22' }}>
              {img && (
                <Image
                  source={{ uri: img }}
                  style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#EAEAD8' }}
                  resizeMode="cover"
                />
              )}
              <View style={{ padding: 16 }}>
                <Text variant="h2" style={{ marginBottom: 6 }}>{item.title}</Text>
                <Text style={{ fontSize: 12, opacity: 0.5, marginBottom: 10 }}>{formatDate(item.publishedAt)}</Text>
                <Text style={{ lineHeight: 22 }}>{excerpt(item.content ?? '')}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
