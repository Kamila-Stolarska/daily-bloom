// Dolna nawigacja (wersja testowa) — 4 zakładki: Home, Notatki, Terapeuta, Analiza.
// Stylistyka spójna z ChatBar (paper bg, subtelna górna linia, ink/ink-muted na ikonach).
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../ui/text';

export const BOTTOM_NAV_CONTENT_HEIGHT = 58;

const INK = '#1A1614';
const INK_MUTED = '#7A6F62';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-9"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NotesIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5h9l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M9 10h6M9 13.5h6M9 17h3.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function TherapistIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5c.5 2.3 1 3.2 3.3 3.7-2.3.5-2.8 1-3.3 3.3-.5-2.3-1-2.8-3.3-3.3 2.3-.5 2.8-1.4 3.3-3.7Z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d="M18 13c.3 1.5.6 2 2 2.3-1.4.3-1.7.8-2 2.3-.3-1.5-.6-2-2-2.3 1.4-.3 1.7-.8 2-2.3Z"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={16} r={2.3} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function AnalysisIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 19.5V13m6.5 6.5V7M18 19.5V10"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}

type Tab = {
  key: string;
  label: string;
  route: '/' | '/notes' | '/chat' | '/garden';
  Icon: (props: { color: string }) => JSX.Element;
};

const TABS: Tab[] = [
  { key: 'home', label: 'Home', route: '/', Icon: HomeIcon },
  { key: 'notes', label: 'Notatki', route: '/notes', Icon: NotesIcon },
  { key: 'chat', label: 'Terapeuta', route: '/chat', Icon: TherapistIcon },
  { key: 'garden', label: 'Analiza', route: '/garden', Icon: AnalysisIcon },
];

function isActive(pathname: string, route: Tab['route']): boolean {
  if (route === '/') return pathname === '/';
  return pathname.startsWith(route);
}

export function BottomNav({ floating = true }: { floating?: boolean }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View
      pointerEvents="box-none"
      style={{
        ...(floating
          ? { position: 'absolute', left: 0, right: 0, bottom: 0 }
          : null),
        backgroundColor: '#FFFFF0',
        borderTopColor: '#E1D8CE',
        borderTopWidth: 1,
        paddingBottom: Math.max(6, insets.bottom),
        paddingTop: 8,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {TABS.map(({ key, label, route, Icon }) => {
          const active = isActive(pathname, route);
          const color = active ? INK : INK_MUTED;
          return (
            <Pressable
              key={key}
              onPress={() => {
                if (!active) router.replace(route as never);
              }}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 }}
            >
              <View
                style={{
                  width: 40,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? '#EDE5D5' : 'transparent',
                }}
              >
                <Icon color={color} />
              </View>
              <Text
                variant="mono"
                style={{ color, fontSize: 10, letterSpacing: 0.3 }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
