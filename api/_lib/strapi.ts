// Server-side klient Strapi REST API (v5). Wywołania z Vercel proxy.
// Konfiguracja: STRAPI_URL + STRAPI_TOKEN (server-side, NIE EXPO_PUBLIC).

const RAW = process.env.STRAPI_URL ?? '';
const TOKEN = process.env.STRAPI_TOKEN ?? '';
export const STRAPI_URL = RAW.replace(/\/$/, '');

export type StrapiEntry = {
  id: number;
  documentId: string;
  userId: string;
  date: string;
  userDate: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  somethingGood: boolean;
  somethingHard: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

type StrapiListResponse<T> = { data: T[]; meta?: unknown };
type StrapiItemResponse<T> = { data: T; meta?: unknown };

function ensureConfigured(): void {
  if (!STRAPI_URL) throw new Error('strapi-url-not-configured');
  if (!TOKEN) throw new Error('strapi-token-not-configured');
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    accept: 'application/json',
    authorization: `Bearer ${TOKEN}`,
    ...(extra ?? {}),
  };
}

export function userDateKey(userId: string, date: string): string {
  return `${userId}__${date}`;
}

export async function findEntryByUserDate(userId: string, date: string): Promise<StrapiEntry | null> {
  ensureConfigured();
  const url = new URL(`${STRAPI_URL}/api/entries`);
  url.searchParams.set('filters[userDate][$eq]', userDateKey(userId, date));
  url.searchParams.set('pagination[pageSize]', '1');
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`strapi-${res.status}: ${await res.text().catch(() => '')}`);
  const json = (await res.json()) as StrapiListResponse<StrapiEntry>;
  return json.data?.[0] ?? null;
}

export async function listEntriesByUser(userId: string, opts?: { pageSize?: number }): Promise<StrapiEntry[]> {
  ensureConfigured();
  const url = new URL(`${STRAPI_URL}/api/entries`);
  url.searchParams.set('filters[userId][$eq]', userId);
  url.searchParams.set('sort', 'date:desc');
  url.searchParams.set('pagination[pageSize]', String(opts?.pageSize ?? 365));
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`strapi-${res.status}: ${await res.text().catch(() => '')}`);
  const json = (await res.json()) as StrapiListResponse<StrapiEntry>;
  return json.data ?? [];
}

type UpsertPayload = {
  userId: string;
  date: string;
  day: number;
  emotions: number;
  energy: number;
  body: number;
  delight: number;
  meaning: number;
  somethingGood: boolean;
  somethingHard: boolean;
};

export async function upsertEntry(payload: UpsertPayload): Promise<StrapiEntry> {
  ensureConfigured();
  const existing = await findEntryByUserDate(payload.userId, payload.date);
  const data = {
    userId: payload.userId,
    date: payload.date,
    userDate: userDateKey(payload.userId, payload.date),
    day: payload.day,
    emotions: payload.emotions,
    energy: payload.energy,
    body: payload.body,
    delight: payload.delight,
    meaning: payload.meaning,
    somethingGood: payload.somethingGood,
    somethingHard: payload.somethingHard,
  };

  if (existing) {
    const url = `${STRAPI_URL}/api/entries/${existing.documentId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: headers({ 'content-type': 'application/json' }),
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error(`strapi-update-${res.status}: ${await res.text().catch(() => '')}`);
    const json = (await res.json()) as StrapiItemResponse<StrapiEntry>;
    return json.data;
  }

  const url = `${STRAPI_URL}/api/entries`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json' }),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`strapi-create-${res.status}: ${await res.text().catch(() => '')}`);
  const json = (await res.json()) as StrapiItemResponse<StrapiEntry>;
  return json.data;
}
