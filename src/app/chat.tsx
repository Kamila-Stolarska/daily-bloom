import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '../components/ui/text';
import { MessageBubble } from '../components/chat/MessageBubble';
import { StreamingDot } from '../components/chat/StreamingDot';
import { useChat } from '../lib/chat/useChat';
import { DictateButton } from '../components/note/DictateButton';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initial?: string; autofocus?: string; mic?: string }>();
  const insets = useSafeAreaInsets();
  const { messages, streaming, error, hydrated, send } = useChat();
  const [input, setInput] = useState(params.initial ?? '');
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  // Autofocus przy wejściu jeśli przyszliśmy z chat bara z tapnięciem na input.
  useEffect(() => {
    if (params.autofocus === '1') {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [params.autofocus]);

  // Auto-scroll do dołu przy nowych wiadomościach i stream chunkach.
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40);
    return () => clearTimeout(t);
  }, [messages, streaming]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    void send(text);
  };

  const canSend = input.trim().length > 0 && !streaming;
  const showWelcome = hydrated && messages.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
      {/* Topbar */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={16}
        >
          <Text variant="body" tone="ink" style={{ fontSize: 22 }}>
            ←
          </Text>
        </Pressable>
        <Text variant="eyebrow" tone="ink">
          DAILY — BLOOM
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {showWelcome && (
            <View className="flex-1 items-center justify-center px-6 py-10">
              <Text
                variant="h2"
                tone="ink"
                className="text-center font-serif"
                style={{ fontSize: 26, lineHeight: 32, letterSpacing: -0.5 }}
              >
                Tu możemy pogadać o tym,{'\n'}co ostatnio czujesz.
              </Text>
              <Text
                variant="caption"
                tone="muted"
                className="text-center mt-4"
                style={{ fontSize: 14, lineHeight: 20, maxWidth: 280 }}
              >
                Czytam Twoje wpisy i notatki z ostatnich dni. Pisz albo przytrzymaj mikrofon.
              </Text>
            </View>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role === 'system' ? 'assistant' : m.role} content={m.content} />
          ))}

          {streaming && messages[messages.length - 1]?.content === '' && <StreamingDot />}

          {error && (
            <View className="mt-2 mb-2 px-3 py-2" style={{ backgroundColor: '#F4E2D8', borderRadius: 12 }}>
              <Text variant="caption" tone="ink">
                {error}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View
          className="px-4 pb-3 pt-2"
          style={{
            paddingBottom: Math.max(12, insets.bottom),
            borderTopColor: '#EDE5D5',
            borderTopWidth: 1,
            backgroundColor: '#F6F6EA',
          }}
        >
          <View
            className="flex-row items-end"
            style={{
              backgroundColor: '#FBFAF1',
              borderColor: '#E1D8CE',
              borderWidth: 1,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 8,
              minHeight: 48,
            }}
          >
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Napisz wiadomość…"
              placeholderTextColor="#7A6F62"
              multiline
              style={{
                flex: 1,
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                lineHeight: 21,
                color: '#1A1614',
                paddingTop: 6,
                paddingBottom: 6,
                paddingRight: 8,
                maxHeight: 120,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
              }}
              editable={!streaming}
              onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
              blurOnSubmit={Platform.OS === 'web'}
            />
            <View style={{ marginLeft: 2 }}>
              <DictateButton
                onTranscribed={(text) => {
                  setInput((prev) => (prev ? `${prev} ${text}` : text));
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              hitSlop={10}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: canSend ? '#1A1614' : '#E1D8CE',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 6,
              }}
            >
              <Text tone="paper" style={{ fontSize: 18, lineHeight: 18 }}>
                ↑
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
