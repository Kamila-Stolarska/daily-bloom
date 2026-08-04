import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../components/ui/text';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ThinkingFlower } from '../components/chat/ThinkingFlower';
import { TherapistPicker } from '../components/chat/TherapistPicker';
import { useChat } from '../lib/chat/useChat';
import { useTherapists } from '../lib/chat/useTherapists';
import { DictateButton } from '../components/note/DictateButton';
import { BottomNav } from '../components/nav/BottomNav';

function ShopIcon({ size = 18, color = '#1A1614' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8h12l-1 12.2a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 8Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 8V6a3 3 0 0 1 6 0v2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ initial?: string; autofocus?: string; mic?: string }>();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const horizontalPad = winW < 380 ? 20 : winW > 480 ? 32 : 28;
  // Ta sama responsywna wartość co na Home — żeby "DAILY — BLOOM" nie skakało między ekranami.
  const topPad = winH < 720 ? 8 : winH > 880 ? 24 : 16;
  const therapists = useTherapists();
  const { messages, streaming, error, hydrated, send } = useChat(therapists.activeId);
  const [input, setInput] = useState(params.initial ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
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
      <View style={{ paddingHorizontal: horizontalPad, paddingTop: topPad, paddingBottom: 8 }}>
        <View className="flex-row items-start justify-between" style={{ marginBottom: 14 }}>
          <Text variant="eyebrow" tone="ink">
            DAILY — BLOOM
          </Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Sklep z terapeutami"
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1A1614',
            }}
          >
            <ShopIcon size={17} color="#FFFFF0" />
          </Pressable>
        </View>
        <Pressable onPress={() => setPickerOpen(true)} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="display" style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.2 }}>
            {therapists.active?.name ?? 'Terapeuta'}
          </Text>
          {therapists.active ? (
            therapists.active.is_default ? (
              <View
                style={{
                  marginLeft: 10,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 10,
                  backgroundColor: '#E8E4D2',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#1A1614', marginRight: 4 }} />
                <Text variant="caption" tone="ink" style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                  DARMOWY
                </Text>
              </View>
            ) : (
              <View
                style={{
                  marginLeft: 10,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 10,
                  backgroundColor: '#F4E2D8',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 10, marginRight: 3, color: '#1A1614' }}>{'\u2726\uFE0E'}</Text>
                <Text variant="caption" tone="ink" style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                  PŁATNY
                </Text>
              </View>
            )
          ) : null}
          <Text variant="eyebrow" tone="muted" style={{ marginLeft: 8 }}>
            ▾
          </Text>
        </Pressable>
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
            paddingHorizontal: horizontalPad,
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
                className="text-center mt-4 mb-6"
                style={{ fontSize: 14, lineHeight: 20, maxWidth: 280 }}
              >
                Czytam Twoje wpisy i notatki z ostatnich dni. Pisz albo przytrzymaj mikrofon.
              </Text>
              <View style={{ gap: 8, width: '100%', maxWidth: 320 }}>
                {[
                  'Jak wyglądał mój ostatni tydzień?',
                  'Co mi pomaga gdy mam gorszy dzień?',
                  'Co zauważasz w moich notatkach?',
                ].map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => {
                      if (streaming) return;
                      void send(q);
                    }}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      borderColor: '#E1D8CE',
                      borderWidth: 1,
                      borderRadius: 18,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text variant="body" tone="ink" style={{ fontSize: 14, lineHeight: 20 }}>
                      {q}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role === 'system' ? 'assistant' : m.role} content={m.content} />
          ))}

          {streaming && messages[messages.length - 1]?.content === '' && <ThinkingFlower />}

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
          className="pb-3 pt-2"
          style={{
            paddingHorizontal: horizontalPad,
            paddingBottom: 12,
            borderTopColor: '#EDE5D5',
            borderTopWidth: 1,
            backgroundColor: '#FFFFF0',
          }}
        >
          <View
            className="flex-row items-end"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
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

      <BottomNav floating={false} />

      <TherapistPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        catalog={therapists.catalog}
        activeId={therapists.activeId}
        onSelect={(id) => void therapists.setActive(id)}
        onRestore={() => void therapists.restore()}
        loading={therapists.loading}
      />
    </SafeAreaView>
  );
}
