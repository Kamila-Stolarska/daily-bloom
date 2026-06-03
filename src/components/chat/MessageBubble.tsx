import { View } from 'react-native';
import { Text } from '../ui/text';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

export function MessageBubble({ role, content }: Props) {
  if (role === 'assistant') {
    return (
      <View
        className="self-start max-w-[85%] mb-3 px-4 py-3"
        style={{
          backgroundColor: '#FBFAF1',
          borderColor: '#EDE5D5',
          borderWidth: 1,
          borderRadius: 22,
          borderBottomLeftRadius: 6,
        }}
      >
        <Text
          variant="body"
          tone="ink"
          style={{ fontSize: 15, lineHeight: 22 }}
        >
          {content || ' '}
        </Text>
      </View>
    );
  }
  return (
    <View
      className="self-end max-w-[85%] mb-3 px-4 py-3"
      style={{
        backgroundColor: '#1A1614',
        borderRadius: 22,
        borderBottomRightRadius: 6,
      }}
    >
      <Text
        variant="bodyMedium"
        tone="paper"
        style={{ fontSize: 15, lineHeight: 22 }}
      >
        {content}
      </Text>
    </View>
  );
}
