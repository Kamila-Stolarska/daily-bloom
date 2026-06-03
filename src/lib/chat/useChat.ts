// Hook do obsługi rozmowy z agentem.
// Trzyma listę wiadomości (load z Supabase przy mount), stan streamingu i błąd.
// `send(text)` POSTuje do /api/chat z Bearer access_token; przyrostowo dopisuje
// streamowane chunki do ostatniej assistant message.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../supabase';
import { listMessages, type ChatMessage } from '../db/chat';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';
const CHAT_URL = `${API_BASE}/api/chat`;

function genLocalId(): string {
  return `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load historii.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) {
          if (alive) setHydrated(true);
          return;
        }
        const msgs = await listMessages(session.user.id);
        if (alive) {
          setMessages(msgs);
          setHydrated(true);
        }
      } catch (e) {
        if (alive) {
          setError(String(e));
          setHydrated(true);
        }
      }
    })();
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setError('Nie jesteś zalogowana.');
      return;
    }

    const userMsg: ChatMessage = {
      id: genLocalId(),
      role: 'user',
      content: trimmed,
      createdAtIso: new Date().toISOString(),
    };
    const assistantId = genLocalId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAtIso: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errPayload = '';
        try {
          errPayload = await res.text();
        } catch {
          /* noop */
        }
        if (res.status === 402) {
          throw new Error('Kredyt na agenta się skończył.');
        }
        throw new Error(`Błąd ${res.status}: ${errPayload || 'nieznany'}`);
      }
      if (!res.body) {
        throw new Error('Brak streamu w odpowiedzi.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content || `[${msg}]` }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [streaming]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, streaming, error, hydrated, send, stop };
}

// API_BASE wymagane na natywnym (relative URL nie działa poza webem).
export function isChatConfigured(): boolean {
  if (Platform.OS === 'web') return true;
  return Boolean(API_BASE);
}
