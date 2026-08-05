// Podgląd dwóch wersji kwiatka powitalnego (grafika z Figmy) na białym tle,
// w oryginalnej proporcji viewBox 656x644 — do porównania w /lab.
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Text } from './ui/text';
import { KWIATEK_POWITALNY_7, KWIATEK_POWITALNY_8 } from '../assets/kwiatekPowitalnySvg';

const ASPECT = 644 / 656;

function FlowerCard({ label, xml, size }: { label: string; xml: string; size: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <SvgXml xml={xml} width={size} height={size * ASPECT} />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

export function WelcomeFlowerPreview({ size = 300 }: { size?: number }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 16 }}>
      <Text variant="eyebrow">KWIATEK POWITALNY — PODGLĄD</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
        <FlowerCard label="wersja 7" xml={KWIATEK_POWITALNY_7} size={size} />
        <FlowerCard label="wersja 8" xml={KWIATEK_POWITALNY_8} size={size} />
      </View>
    </View>
  );
}
