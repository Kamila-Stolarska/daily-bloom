// Niskopoziomowy klient Strapi REST API (v5).
// UWAGA: token do Strapi (STRAPI_TOKEN) NIE jest ekspozywany do klienta.
// Tutaj trzymamy tylko publiczny URL Strapi (potrzebny do rozwiązywania URL-i mediów).
//
// Konfiguracja przez env: EXPO_PUBLIC_STRAPI_URL (publiczna baza mediów).

const RAW_BASE = process.env.EXPO_PUBLIC_STRAPI_URL ?? '';

export const STRAPI_BASE = RAW_BASE.replace(/\/$/, '');

export type StrapiMediaFormat = {
  url: string;
  width: number;
  height: number;
};

export type StrapiMedia = {
  id: number;
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
  formats?: Record<string, StrapiMediaFormat>;
};

export type StrapiResponse<T> = {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export function strapiMediaUrl(media: StrapiMedia | null | undefined, format?: keyof StrapiMedia['formats'] & string): string | null {
  if (!media) return null;
  const candidate = format ? media.formats?.[format]?.url ?? media.url : media.url;
  if (!candidate) return null;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `${STRAPI_BASE}${candidate}`;
}

export async function strapiGet<T>(path: string, params?: Record<string, string | number | boolean>): Promise<StrapiResponse<T>> {
  if (!STRAPI_BASE) throw new Error('strapi-base-not-configured');

  const url = new URL(`${STRAPI_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`strapi-${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as StrapiResponse<T>;
}
