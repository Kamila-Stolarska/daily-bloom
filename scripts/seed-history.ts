/* eslint-disable no-console */
// Skrypt generujący ~200 historycznych wpisów dla dedykowanego usera demo.
//
// Wymaga w .env.local:
//   EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    (sekret — tylko lokalnie!)
//   XAI_API_KEY                  (Grok do notatek)
//   OPENAI_API_KEY               (text-embedding-3-small)
//
// Uruchomienie (Node 20+, użyj pełnej ścieżki nvm bo system ma stary Node 14):
//   /Users/kamilastolarska/.nvm/versions/node/v20.20.2/bin/node \
//     --import tsx --env-file=.env.local scripts/seed-history.ts
// Lub po `npm i -D tsx`:
//   PATH=/Users/kamilastolarska/.nvm/versions/node/v20.20.2/bin:$PATH \
//     npx tsx --env-file=.env.local scripts/seed-history.ts
//
// Idempotentne: pominie daty które już mają wpis, dopina embedding do
// wpisów które mają go NULL.

import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Brakuje zmiennej env: ${name}`);
    process.exit(1);
  }
  return v as string;
}

const SUPA_URL = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const XAI_KEY = requireEnv('XAI_API_KEY');
const OPENAI_KEY = requireEnv('OPENAI_API_KEY');

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? 'demo@dailybloom.local';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? `demo-${randomToken()}`;
const TARGET_ENTRIES = Number(process.env.SEED_COUNT ?? '200');
const SPAN_DAYS = Number(process.env.SEED_SPAN_DAYS ?? '270');

// Node 20 doesn't have native WebSocket — polyfill globally before creating client.
// @ts-expect-error — `ws` ships without bundled types; we only need its constructor here.
import WS from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).WebSocket ??= WS as unknown as typeof WebSocket;

const supabase = createClient(SUPA_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- Persona ----------
type Affect = Partial<{ day: number; emotions: number; energy: number; body: number; delight: number; meaning: number }>;
type Thread = {
  name: string;
  months?: number[];   // 0-indexed
  weekdays?: number[]; // 0=ndz
  sparse?: number;
  affects: Affect;
  hints: string[];
};

const PERSONA = {
  bio: 'Jestem 32-letnią kobietą, mieszkam w Warszawie. Pracuję jako designerka w startupie. Mam partnera (Marek), kotkę (Pestka), mamę dzwoniącą za często. Ćwiczę jogę kiedy mam siłę. Lubię gotować. Wiosną i latem zdrowieję, jesienią i zimą mi spada.',
  baseline: { day: 3, emotions: 3, energy: 3, body: 3, delight: 3, meaning: 3 } as Required<Affect>,
  threads: [
    { name: 'praca/deadline projektu', months: [2,3,9,10],
      affects: { energy: -1, day: -1, meaning: -1 },
      hints: ['deadline', 'klient', 'review', 'sprint', 'zoomy non stop'] },
    { name: 'joga rano', weekdays: [1,3,5], sparse: 0.6,
      affects: { body: +1, energy: +1, meaning: +1 },
      hints: ['joga', 'mata', 'rozciąganie', 'oddychanie'] },
    { name: 'kłótnia z Markiem', sparse: 0.05,
      affects: { emotions: -2, day: -1, delight: -1 },
      hints: ['Marek', 'kłótnia', 'milczeliśmy', 'wieczorem dystans'] },
    { name: 'lęk wieczorny / melancholia', months: [10,11,0,1], sparse: 0.45,
      affects: { emotions: -1, meaning: -1, day: -1 },
      hints: ['melancholia', 'pusto', 'lęk wieczorem', 'leżenie i gapienie', 'bezsensowność'] },
    { name: 'rozmowa z mamą', sparse: 0.12,
      affects: { emotions: -1, day: -1 },
      hints: ['mama dzwoniła', 'pytania o dziecko', 'wyrzuty', 'po telefonie z mamą'] },
    { name: 'spotkanie z przyjaciółmi', weekdays: [5,6], sparse: 0.35,
      affects: { delight: +1, emotions: +1, meaning: +1 },
      hints: ['kolacja u Asi', 'wino', 'śmieszki', 'do późna'] },
    { name: 'gotowanie / dobre jedzenie', sparse: 0.25,
      affects: { delight: +1, body: +1 },
      hints: ['zupa krem', 'makaron z grzybami', 'piekłam chleb', 'śniadanie w łóżku'] },
    { name: 'spacer / natura', sparse: 0.3,
      affects: { body: +1, meaning: +1, emotions: +1 },
      hints: ['Pole Mokotowskie', 'park', 'spacer 5 km', 'słońce na twarzy'] },
    { name: 'kiepski sen', sparse: 0.2,
      affects: { energy: -1, body: -1, day: -1 },
      hints: ['nie spałam', 'budziłam się o 4', 'głowa nie wyłącza'] },
    { name: 'kotka / Pestka', sparse: 0.4,
      affects: { delight: +1, emotions: +1 },
      hints: ['Pestka spała na mnie', 'kot mruczał', 'kotka skakała po stole'] },
    { name: 'okres / hormony', sparse: 0.1,
      affects: { body: -2, energy: -1, emotions: -1 },
      hints: ['ból brzucha', 'okres', 'termofor', 'paracetamol'] },
    { name: 'wyjście do kina/teatru', sparse: 0.04,
      affects: { delight: +1, meaning: +1 },
      hints: ['film w Muranowie', 'spektakl', 'po kinie kawa'] },
  ] as Thread[],
};

// ---------- Util ----------
function clamp(v: number, lo = 1, hi = 5): number { return Math.max(lo, Math.min(hi, Math.round(v))); }
function randn(): number {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * 0.6;
}
function pickDates(targetCount: number, spanDays: number, today: Date): string[] {
  const all: { iso: string; weight: number }[] = [];
  for (let i = 1; i <= spanDays; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const weight = i <= 60 ? 1.0 : i <= 150 ? 0.7 : 0.45;
    all.push({ iso, weight });
  }
  const picked = new Set<string>();
  let attempts = 0;
  while (picked.size < targetCount && attempts < spanDays * 6) {
    for (const x of all) {
      if (picked.size >= targetCount) break;
      if (Math.random() < x.weight * (targetCount / spanDays)) picked.add(x.iso);
    }
    attempts++;
  }
  return Array.from(picked).sort();
}

function activeThreads(date: Date): Thread[] {
  const month = date.getUTCMonth();
  const weekday = date.getUTCDay();
  return PERSONA.threads.filter((t) => {
    if (t.months && !t.months.includes(month)) return false;
    if (t.weekdays && !t.weekdays.includes(weekday)) return false;
    if (t.sparse !== undefined && Math.random() > t.sparse) return false;
    return true;
  });
}

function computeAxes(threads: Thread[]): Required<Affect> {
  const out: Required<Affect> = { ...PERSONA.baseline };
  for (const t of threads) {
    for (const [k, v] of Object.entries(t.affects) as [keyof Affect, number][]) {
      out[k] = (out[k] ?? 3) + v;
    }
  }
  return {
    day: clamp(out.day + randn()),
    emotions: clamp(out.emotions + randn()),
    energy: clamp(out.energy + randn()),
    body: clamp(out.body + randn()),
    delight: clamp(out.delight + randn()),
    meaning: clamp(out.meaning + randn()),
  };
}

// ---------- LLM (Grok) — notatka ----------
async function generateNote(date: string, axes: Required<Affect>, threads: Thread[]): Promise<string> {
  const themeHints = threads.flatMap((t) => t.hints).slice(0, 8);
  const prompt = `Napisz wpis do dziennika z dnia ${date}, w pierwszej osobie, po polsku, 2-4 zdania, bardzo naturalnie. NIE wymieniaj liczb ani osi. NIE pisz "dzisiaj było 4 na 5". Po prostu opisz dzień jak ktoś kto pisze do siebie.

Osoba: ${PERSONA.bio}

Aktywne dziś wątki (możesz wybrać 1-2): ${threads.map((t) => t.name).join(', ') || 'zwykły dzień'}.
Słowa-przynęty (możesz, ale nie musisz, użyć paru): ${themeHints.join(', ')}.

Nastrój dnia (do wewnątrz, nie pisz tego liczbowo): emocje ${axes.emotions}/5, energia ${axes.energy}/5, ciało ${axes.body}/5, zachwyt ${axes.delight}/5, sens ${axes.meaning}/5, ogółem ${axes.day}/5.

Pisz tak jak prawdziwa osoba — czasem urwane zdania, czasem konkret, bez kazań i bez podsumowywania. Nie zaczynaj od "Dzisiaj" za każdym razem. Bez emoji. Maks 4 zdania.`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${XAI_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4-fast',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 220,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`grok-failed ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

// ---------- OpenAI embeddings (batch) ----------
async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`openai-embed ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { data?: Array<{ embedding: number[]; index: number }> };
  const out = new Array<number[]>(texts.length);
  for (const d of data.data ?? []) out[d.index] = d.embedding;
  return out;
}

function buildEmbeddingSource(args: {
  date: string;
  axes: Required<Affect>;
  somethingGood: boolean;
  somethingHard: boolean;
  noteText: string;
}): string {
  const label = (v: number): string =>
    v <= 1 ? 'bardzo mało' : v === 2 ? 'mało' : v === 3 ? 'średnio' : v === 4 ? 'sporo' : 'dużo';
  const tags: string[] = [];
  if (args.somethingGood) tags.push('coś dobrego');
  if (args.somethingHard) tags.push('coś trudnego');
  const tagStr = tags.length ? `Tagi: ${tags.join(', ')}.` : '';
  return [
    `Data: ${args.date}.`,
    `Dzień ogólnie: ${label(args.axes.day)} (${args.axes.day}/5).`,
    `Emocje: ${label(args.axes.emotions)} (${args.axes.emotions}/5).`,
    `Energia: ${label(args.axes.energy)} (${args.axes.energy}/5).`,
    `Ciało: ${label(args.axes.body)} (${args.axes.body}/5).`,
    `Zachwyt: ${label(args.axes.delight)} (${args.axes.delight}/5).`,
    `Sens: ${label(args.axes.meaning)} (${args.axes.meaning}/5).`,
    tagStr,
    `Notatka: ${args.noteText}`,
  ].filter(Boolean).join(' ');
}

// ---------- Demo user ----------
async function ensureDemoUser(): Promise<string> {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase());
  if (existing) {
    console.log(`✓ Demo user istnieje: ${existing.id} (${DEMO_EMAIL})`);
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('create-user-failed');
  console.log(`✓ Utworzono demo user: ${data.user.id} (${DEMO_EMAIL})`);
  console.log(`   Hasło (zapisz!): ${DEMO_PASSWORD}`);

  await supabase.from('profiles').upsert(
    { user_id: data.user.id, name: 'Demo', flower_seed: data.user.id, credit_cents: 100000 },
    { onConflict: 'user_id' },
  );
  return data.user.id;
}

// ---------- Main ----------
async function main(): Promise<void> {
  const userId = await ensureDemoUser();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dates = pickDates(TARGET_ENTRIES, SPAN_DAYS, today);
  console.log(`✓ Wybrano ${dates.length} dat (range: ${dates[0]} → ${dates[dates.length - 1]})`);

  const { data: existing } = await supabase
    .from('entries')
    .select('date,embedding')
    .eq('user_id', userId)
    .in('date', dates);
  const existingMap = new Map<string, { hasEmbedding: boolean }>();
  for (const r of existing ?? []) {
    existingMap.set(r.date as string, { hasEmbedding: r.embedding !== null });
  }
  const newDates = dates.filter((d) => !existingMap.has(d));
  console.log(`✓ Nowe daty: ${newDates.length}, istniejące do uzupełnienia embedding: ${
    [...existingMap.values()].filter((x) => !x.hasEmbedding).length
  }`);

  type Pending = {
    date: string;
    axes: Required<Affect>;
    somethingGood: boolean;
    somethingHard: boolean;
    noteText: string;
    embeddingSource: string;
  };
  const pending: Pending[] = [];

  let i = 0;
  for (const date of newDates) {
    i++;
    const d = new Date(date + 'T12:00:00Z');
    const threads = activeThreads(d);
    const axes = computeAxes(threads);
    const somethingGood = axes.delight >= 4 || axes.delight >= axes.day + 1;
    const somethingHard = axes.emotions <= 2 || axes.day <= 2;

    let noteText = '';
    try { noteText = await generateNote(date, axes, threads); }
    catch (e) { console.warn(`  [${i}/${newDates.length}] ${date} — Grok fail:`, (e as Error).message); }

    const embeddingSource = buildEmbeddingSource({ date, axes, somethingGood, somethingHard, noteText });
    pending.push({ date, axes, somethingGood, somethingHard, noteText, embeddingSource });

    if (i % 10 === 0) console.log(`  Grok: ${i}/${newDates.length}`);
    await new Promise((r) => setTimeout(r, 220)); // throttle ~5 req/s
  }

  console.log(`✓ Embeddings start — nowych: ${pending.length}`);
  for (let off = 0; off < pending.length; off += 100) {
    const slice = pending.slice(off, off + 100);
    const vectors = await embedBatch(slice.map((p) => p.embeddingSource));
    const rows = slice.map((p, idx) => ({
      user_id: userId,
      date: p.date,
      day: p.axes.day,
      emotions: p.axes.emotions,
      energy: p.axes.energy,
      body: p.axes.body,
      delight: p.axes.delight,
      meaning: p.axes.meaning,
      something_good: p.somethingGood,
      something_hard: p.somethingHard,
      embedding_source: p.embeddingSource,
      embedding: vectors[idx],
    }));
    const { error: insErr } = await supabase.from('entries').upsert(rows, { onConflict: 'user_id,date' });
    if (insErr) throw insErr;
    const noteRows = slice
      .filter((p) => p.noteText.trim().length > 0)
      .map((p) => ({ user_id: userId, date: p.date, text: p.noteText.trim() }));
    if (noteRows.length) {
      const { error: nErr } = await supabase.from('notes').insert(noteRows);
      if (nErr) console.warn('  notes insert error:', nErr.message);
    }
    console.log(`  Embed batch ${off + slice.length}/${pending.length} ✓`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  const stale = [...existingMap.entries()].filter(([, v]) => !v.hasEmbedding).map(([date]) => date);
  if (stale.length > 0) {
    console.log(`  Backfill embedding dla ${stale.length} starych wpisów…`);
    const { data: staleRows } = await supabase
      .from('entries')
      .select('id,date,day,emotions,energy,body,delight,meaning,something_good,something_hard')
      .eq('user_id', userId)
      .in('date', stale);
    const { data: staleNotes } = await supabase
      .from('notes')
      .select('date,text')
      .eq('user_id', userId)
      .in('date', stale);
    const noteByDate = new Map<string, string>();
    for (const n of staleNotes ?? []) noteByDate.set(n.date as string, n.text as string);
    const rows = staleRows ?? [];
    for (let off = 0; off < rows.length; off += 100) {
      const slice = rows.slice(off, off + 100);
      const sources = slice.map((r) =>
        buildEmbeddingSource({
          date: r.date as string,
          axes: {
            day: r.day as number, emotions: r.emotions as number, energy: r.energy as number,
            body: r.body as number, delight: r.delight as number, meaning: r.meaning as number,
          },
          somethingGood: r.something_good as boolean,
          somethingHard: r.something_hard as boolean,
          noteText: noteByDate.get(r.date as string) ?? '',
        }),
      );
      const vectors = await embedBatch(sources);
      for (let idx = 0; idx < slice.length; idx++) {
        await supabase
          .from('entries')
          .update({ embedding_source: sources[idx], embedding: vectors[idx] })
          .eq('id', slice[idx].id as string);
      }
      console.log(`  Backfill ${off + slice.length}/${rows.length} ✓`);
    }
  }

  const { count } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  const { count: withEmb } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('embedding', 'is', null);

  console.log('\n=== GOTOWE ===');
  console.log(`DEMO_USER_ID=${userId}`);
  console.log(`DEMO_EMAIL=${DEMO_EMAIL}`);
  console.log(`entries: ${count} (z embedding: ${withEmb})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
