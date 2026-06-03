// Pływający chat-bar widoczny na ekranie home.
// Tap na pole tekstowe → push /chat z autofocusem.
// Tap na mic → push /chat i od razu start dyktowania (transkrypcja wpada w input).
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/text';

function MicIcon({ size = 20, color = '#1A1614' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 11a7 7 0 1 1-14 0M12 18v3"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openChat = (mic = false) => {
    const qs = mic ? 'mic=1' : 'autofocus=1';
    // expo-router typedRoutes może jeszcze nie znać /chat — używamy string-path.
    router.push(`/chat?${qs}` as never);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(12, insets.bottom + 4),
        paddingHorizontal: 16,
        paddingTop: 8,
        // Lekka delikatna mgiełka — tło ekranu i tak jest #F6F6EA, więc bar nie ginie.
        // BlurView celowo pomijamy (extra dep na native; zostawiamy na potem).
        backgroundColor: Platform.OS === 'web' ? 'rgba(246,246,234,0.92)' : '#F6F6EA',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FBFAF1',
          borderColor: '#E1D8CE',
          borderWidth: 1,
          borderRadius: 28,
          paddingLeft: 18,
          paddingRight: 6,
          paddingVertical: 6,
          minHeight: 52,
          // Subtelny cień tylko web — na iOS shadow* domyślnie zostawiamy bez (mniej "appkowo").
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 4px 18px rgba(26,22,20,0.06)' } as object)
            : {}),
        }}
      >
        <Pressable
          onPress={() => openChat(false)}
          style={{ flex: 1, paddingVertical: 8 }}
          accessibilityRole="button"
          accessibilityLabel="otwórz czat"
        >
          <Text
            variant="body"
            tone="muted"
            style={{ fontSize: 15, lineHeight: 20 }}
            numberOfLines={1}
          >
            napisz lub powiedz coś…
          </Text>
        </Pressable>

        <Pressable
          onPress={() => openChat(true)}
          accessibilityRole="button"
          accessibilityLabel="dyktuj do czatu"
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#1A1614',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MicIcon size={18} color="#F6F6EA" />
        </Pressable>
      </View>
    </View>
  );
}
