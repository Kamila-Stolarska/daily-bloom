// Wspólne helpery dla /api/chat (streaming, frontend) i /api/v1/chat (JSON, dla agentów).

import type { SupabaseClient } from '@supabase/supabase-js';
import { embedText } from './embedding';

export const XAI_URL = 'https://api.x.ai/v1/chat/completions';
export const MODEL = 'grok-4-fast';

// grok-4-fast pricing — input $0.20/1M, output $0.50/1M tokenów.
export const PRICE_IN_PER_TOKEN_USD = 0.2 / 1_000_000;
export const PRICE_OUT_PER_TOKEN_USD = 0.5 / 1_000_000;

export type Role = 'user' | 'assistant' | 'system';
export type ChatMsg = { role: Role; content: string };

export type EntryRow = {
  date: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  something_good: boolean;
  something_hard: boolean;
};
export type NoteRow = { date: string; text: string; created_at: string };

// Wynik hybrid_search_entries RPC.
export type RelevantEntry = {
  date: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  something_good: boolean;
  something_hard: boolean;
  embedding_source: string | null;
  score: number;
};

export function describe(v: number): string {
  if (v <= 1) return 'bardzo mało';
  if (v === 2) return 'mało';
  if (v === 3) return 'średnio';
  if (v === 4) return 'sporo';
  return 'dużo';
}

export function weekdayPl(dateIso: string): string {
  const d = new Date(dateIso + 'T12:00:00');
  return ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'][d.getDay()];
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

export type Persona = {
  name: string;
  system_prompt: string; // może zawierać placeholder {{user_name}}
};

// Domyślna persona (Freud / "bliska przyjaciółka") — fallback gdy DB nieosiągalna.
// Treść 1:1 z migracji 20260623120000_therapists.sql.
export const DEFAULT_PERSONA: Persona = {
  name: 'Zygmunt Freud',
  system_prompt: `Jesteś bliską przyjaciółką {{user_name}} w aplikacji Daily Bloom. Rozmawiasz po polsku, ciepło, jak przy kawie.

KIM JESTEŚ:
- Bliska osoba, która naprawdę słucha. Trochę jak przyjaciółka po terapii — ma intuicję, czuje, ale nie diagnozuje.
- Znasz jej ostatnie dni z jej notatek i wpisów. Mówisz o nich konkretnie, ale ludzkim językiem.
- Mówisz do niej "ty". Per imię używaj rzadko, tylko gdy naturalnie pasuje.

DŁUGOŚĆ ODPOWIEDZI (kluczowe — model często to łamie):
- Lekkie pytania (co widzisz, jak tydzień, co lubię): 3–5 zdań.
- Trudne tematy (smutek, lęk, wypalenie, samotność, brak motywacji, leżenie w łóżku, "nie wiem co robić", "nic mi się nie chce"): MINIMUM 6–10 zdań, czasem więcej. To są momenty kiedy ona potrzebuje czuć że jesteś obok.
- ZAKAZANE odpowiedzi na trudne tematy w stylu "Brzmi jak ciężki okres. Rozumiem." (dwa zdania). To brzmi jak ktoś kto chce skończyć rozmowę. Jeśli odpowiadasz dwoma zdaniami na trudny temat — robisz źle.

CO MUSISZ ZROBIĆ przy trudnych tematach (po kolei):
1. Uznaj uczucie konkretnie — odbij jej własne słowa, nie generycznie.
2. Daj jej coś od siebie — refleksję, hipotezę, albo KONKRETNĄ RADĘ / SUGESTIĘ. Nie bój się radzić.
3. Możesz zapytać — ale tylko jeśli to dodaje (nie zamiast rady).

CZEGO NIE ROBISZ:
- Nie liczbujesz, nie tabelkujesz, nie analizujesz "po osiach".
- Bez emoji, bez list, bez podsumowań typu "podsumowując".
- Bez diagnoz medycznych/terapeutycznych.

KONTEKST (tylko dla Ciebie, NIE cytuj jako "energia 3"):
Skala jakościowa: bardzo mało / mało / średnio / sporo / dużo dla każdej osi (dzień, emocje, energia, ciało, zachwyt, sens). "Coś dobrego"/"coś trudnego" = tag tego dnia.`,
};

// Buduje blok kontekstu usera (wpisy + notatki + relevant) — niezależny od persony.
// Wstawiany na końcu finalnego promptu przez buildSystemPrompt.
export function buildUserContextBlock(
  entries: EntryRow[],
  notes: NoteRow[],
  relevant: RelevantEntry[] = [],
): string {
  const entriesStr =
    entries.length === 0
      ? '(brak wpisów w tym okresie)'
      : entries
          .map((e) => {
            const tags: string[] = [];
            if (e.something_good) tags.push('coś dobrego');
            if (e.something_hard) tags.push('coś trudnego');
            const tagsStr = tags.length ? ` — ${tags.join(', ')}` : '';
            const parts = [
              `dzień ${describe(e.day)}`,
              `emocje ${describe(e.emotions)}`,
              `energia ${describe(e.energy)}`,
              `ciało ${describe(e.body)}`,
              `zachwyt ${describe(e.delight)}`,
              `sens ${describe(e.meaning)}`,
            ];
            return `${e.date} (${weekdayPl(e.date)}): ${parts.join(', ')}${tagsStr}`;
          })
          .join('\n');

  const notesStr =
    notes.length === 0
      ? '(brak notatek)'
      : notes.map((n) => `[${n.date}] ${n.text}`).join('\n\n');

  const recentDates = new Set(entries.map((e) => e.date));
  const relevantFiltered = relevant.filter((r) => !recentDates.has(r.date));
  const relevantStr =
    relevantFiltered.length === 0
      ? ''
      : relevantFiltered
          .map((r) => {
            const tags: string[] = [];
            if (r.something_good) tags.push('coś dobrego');
            if (r.something_hard) tags.push('coś trudnego');
            const tagsStr = tags.length ? ` — ${tags.join(', ')}` : '';
            const parts = [
              `dzień ${describe(r.day)}`,
              `emocje ${describe(r.emotions)}`,
              `energia ${describe(r.energy)}`,
              `ciało ${describe(r.body)}`,
              `zachwyt ${describe(r.delight)}`,
              `sens ${describe(r.meaning)}`,
            ];
            const noteMatch = r.embedding_source?.match(/Notatka:\s*(.+)$/);
            const noteStr = noteMatch ? `\n   notatka: ${noteMatch[1].trim()}` : '';
            return `${r.date} (${weekdayPl(r.date)}): ${parts.join(', ')}${tagsStr}${noteStr}`;
          })
          .join('\n');

  const relevantBlock = relevantStr
    ? `

PASUJĄCE WPISY Z ODLEGLEJSZEJ HISTORII (dobrane semantycznie do tematu jej wiadomości — możesz się na nie powołać konkretną datą, ale tylko jeśli faktycznie pasują do rozmowy):
${relevantStr}`
    : '';

  return `OSTATNIE 7 DNI:
${entriesStr}

JEJ NOTATKI Z TYCH DNI:
${notesStr}${relevantBlock}

Jeśli pyta o coś czego nie ma we wpisach — powiedz wprost ("nie pisałaś o tym, opowiedz") i zapytaj. Bądź obecna, nie analityczna.`;
}

// Składa finalny system prompt: persona (z DB, z podmienionym {{user_name}})
// + data (wspólna dla wszystkich person) + blok kontekstu usera.
export function buildSystemPrompt(
  persona: Persona,
  name: string | null,
  entries: EntryRow[],
  notes: NoteRow[],
  relevant: RelevantEntry[] = [],
): string {
  const userName = name?.trim() || 'użytkowniczce';
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayWeekday = weekdayPl(todayIso);

  const personaPrompt = persona.system_prompt.replaceAll('{{user_name}}', userName);
  const contextBlock = buildUserContextBlock(entries, notes, relevant);

  return `${personaPrompt}

DZIŚ JEST: ${todayIso} (${todayWeekday}). Używaj tej daty do liczenia "wczoraj", "3 dni temu", "w zeszłym tygodniu" itp. — nigdy nie zgaduj.

${contextBlock}`;
}

export const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-max-age': '86400',
};

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  });
}

export function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// Wywołuje hybrid_search_entries RPC. Best-effort: błąd → pusta lista (czat działa dalej).
export async function fetchRelevantEntries(
  supabase: SupabaseClient,
  userId: string,
  message: string,
  k = 8,
): Promise<RelevantEntry[]> {
  const trimmed = message.trim();
  if (trimmed.length < 8) return [];
  try {
    const embedding = await embedText(trimmed);
    const { data, error } = await supabase.rpc('hybrid_search_entries', {
      p_user_id: userId,
      p_query: trimmed,
      // pgvector akceptuje literał '[0.1,0.2,...]' — PostgREST sam zrobi cast.
      p_query_embedding: `[${embedding.join(',')}]`,
      p_k: k,
    });
    if (error) {
      console.warn('hybrid_search rpc error:', error.message);
      return [];
    }
    return (data ?? []) as RelevantEntry[];
  } catch (e) {
    console.warn('hybrid_search failed:', (e as Error).message);
    return [];
  }
}

export function isValidDateIso(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + 'T00:00:00Z').getTime());
}

export type TherapistRow = {
  id: string;
  handle: string;
  name: string;
  system_prompt: string;
  is_default: boolean;
};

export type LoadPersonaResult =
  | { ok: true; persona: Persona; therapistId: string }
  | { ok: false; status: 403 | 404; error: string };

// Resolwer persony dla danego usera:
// - jeśli `requestedTherapistId` podane: sprawdza entitlement (is_default lub w user_therapists), zwraca personę albo 403.
// - jeśli nie: bierze profiles.active_therapist_id (jeśli nadal odblokowany), inaczej fallback do is_default.
// - jeśli DB nie zwraca nic sensownego: DEFAULT_PERSONA (żeby chat nigdy nie padł).
export async function loadPersonaForChat(
  supabase: SupabaseClient,
  userId: string,
  requestedTherapistId?: string | null,
): Promise<LoadPersonaResult> {
  if (requestedTherapistId) {
    const { data: t } = await supabase
      .from('therapists')
      .select('id, handle, name, system_prompt, is_default')
      .eq('id', requestedTherapistId)
      .eq('is_active', true)
      .maybeSingle<TherapistRow>();
    if (!t) return { ok: false, status: 404, error: 'therapist_not_found' };
    if (!t.is_default) {
      const { data: ent } = await supabase
        .from('user_therapists')
        .select('therapist_id')
        .eq('user_id', userId)
        .eq('therapist_id', t.id)
        .maybeSingle();
      if (!ent) return { ok: false, status: 403, error: 'therapist_not_unlocked' };
    }
    return { ok: true, persona: { name: t.name, system_prompt: t.system_prompt }, therapistId: t.id };
  }

  // Brak override w body — czytaj active_therapist_id z profilu.
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_therapist_id')
    .eq('user_id', userId)
    .maybeSingle<{ active_therapist_id: string | null }>();

  if (profile?.active_therapist_id) {
    const { data: t } = await supabase
      .from('therapists')
      .select('id, handle, name, system_prompt, is_default')
      .eq('id', profile.active_therapist_id)
      .eq('is_active', true)
      .maybeSingle<TherapistRow>();
    if (t) {
      // Walidacja entitlementu — gdyby user zdezaktywował zakup.
      if (t.is_default) {
        return { ok: true, persona: { name: t.name, system_prompt: t.system_prompt }, therapistId: t.id };
      }
      const { data: ent } = await supabase
        .from('user_therapists')
        .select('therapist_id')
        .eq('user_id', userId)
        .eq('therapist_id', t.id)
        .maybeSingle();
      if (ent) {
        return { ok: true, persona: { name: t.name, system_prompt: t.system_prompt }, therapistId: t.id };
      }
      // Aktywny terapeuta przestał być odblokowany — spadnij do defaultu.
    }
  }

  // Fallback: domyślny terapeuta z DB.
  const { data: def } = await supabase
    .from('therapists')
    .select('id, handle, name, system_prompt, is_default')
    .eq('is_default', true)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle<TherapistRow>();

  if (def) {
    return { ok: true, persona: { name: def.name, system_prompt: def.system_prompt }, therapistId: def.id };
  }

  // Awaryjnie: hardkodowana persona (gdyby migracja nie była jeszcze puszczona).
  return { ok: true, persona: DEFAULT_PERSONA, therapistId: 'default' };
}
