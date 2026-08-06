// Bottom-sheet z listą terapeutów: odblokowani (radio) + sekcja "Dokup".
// Akcja "Kup" otwiera Shopify checkout w przeglądarce. Po powrocie picker
// można odświeżyć ręcznie przyciskiem "Odzyskaj zakup" (re-fetch katalogu).

import { Modal, Pressable, ScrollView, View, Linking } from 'react-native';
import { Text } from '../ui/text';
import type { TherapistCatalogItem } from '../../lib/types/therapist';

type Props = {
  visible: boolean;
  onClose: () => void;
  catalog: TherapistCatalogItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRestore: () => void;
  loading?: boolean;
};

function formatPrice(cents: number): string {
  if (cents === 0) return 'darmowy';
  return `${(cents / 100).toFixed(0)} PLN`;
}

// 5 płatków (góra, lewo, prawo, dół-lewo, dół-prawo) + 1 środek = 6 kółek.
function FlowerDots({ size = 12, color = '#1A1614' }: { size?: number; color?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const dot = size * 0.26;
  // y w dół: 270=góra, 0=prawo, 180=lewo, 60=dół-prawo, 120=dół-lewo
  const petals = [270, 0, 60, 120, 180].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      left: cx + r * Math.cos(rad) - dot / 2,
      top: cy + r * Math.sin(rad) - dot / 2,
    };
  });
  return (
    <View style={{ width: size, height: size }}>
      {petals.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: color,
          }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          left: cx - dot / 2,
          top: cy - dot / 2,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function TherapistPicker({ visible, onClose, catalog, activeId, onSelect, onRestore, loading }: Props) {
  const unlocked = catalog.filter((t) => t.is_unlocked);
  const locked = catalog.filter((t) => !t.is_unlocked);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(26,22,20,0.35)' }} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingBottom: 28,
          maxHeight: '80%',
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E1D8CE' }} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
          <Text variant="eyebrow" tone="ink">
            TERAPEUTA
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          {unlocked.map((t) => {
            const isActive = t.id === activeId;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  onSelect(t.id);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isActive ? '#1A1614' : '#E1D8CE',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.5)' : 'transparent',
                  marginBottom: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="body" tone="ink" style={{ fontSize: 16, fontWeight: '500' }}>
                      {t.name}
                    </Text>
                    {t.is_default ? (
                      <View
                        style={{
                          marginLeft: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          backgroundColor: '#E8E4D2',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#1A1614', marginRight: 5 }} />
                        <Text variant="caption" tone="ink" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
                          DARMOWY
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          marginLeft: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          backgroundColor: '#F4E2D8',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 11, marginRight: 4, color: '#1A1614' }}>{'\u2726\uFE0E'}</Text>
                        <Text variant="caption" tone="ink" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
                          PŁATNY
                        </Text>
                      </View>
                    )}
                  </View>
                  {t.short_bio ? (
                    <Text variant="caption" tone="muted" style={{ marginTop: 2, fontSize: 13, lineHeight: 18 }}>
                      {t.short_bio}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: isActive ? '#1A1614' : '#B5A99C',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isActive ? (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A1614' }} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          {locked.length > 0 ? (
            <>
              <View style={{ height: 12 }} />
              <Text variant="eyebrow" tone="muted" style={{ marginBottom: 8 }}>
                DOKUP TERAPEUTĘ
              </Text>
              {locked.map((t) => (
                <View
                  key={t.id}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E1D8CE',
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text variant="body" tone="ink" style={{ fontSize: 16, fontWeight: '500' }}>
                      {t.name}
                    </Text>
                    <View
                      style={{
                        marginLeft: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        backgroundColor: '#F4E2D8',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, marginRight: 4, color: '#1A1614' }}>{'\u2726\uFE0E'}</Text>
                      <Text variant="caption" tone="ink" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
                        PŁATNY
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text variant="caption" tone="ink" style={{ fontSize: 14 }}>
                      {formatPrice(t.price_cents)}
                    </Text>
                  </View>
                  {t.short_bio ? (
                    <Text variant="caption" tone="muted" style={{ fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
                      {t.short_bio}
                    </Text>
                  ) : null}
                  <Pressable
                    disabled={!t.checkout_url}
                    onPress={() => {
                      if (t.checkout_url) void Linking.openURL(t.checkout_url);
                    }}
                    style={{
                      backgroundColor: t.checkout_url ? '#1A1614' : '#B5A99C',
                      borderRadius: 14,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text tone="paper" style={{ fontSize: 14, fontWeight: '500' }}>
                      {t.checkout_url ? 'Kup' : 'Sklep niedostępny'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}

        </ScrollView>
      </View>
    </Modal>
  );
}
