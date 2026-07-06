// Domain queries dla content-type `Post` w Strapi.
// Fetch idzie przez własne proxy /api/posts (Vercel), żeby STRAPI_TOKEN
// nie wyciekał do bundlu klienta.
// Schemat: title (string), slug (uid), content (richtext markdown), cover (media single).

import type { StrapiMedia, StrapiResponse } from './client';

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

export type StrapiPost = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  cover?: StrapiMedia | null;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
};

async function proxyGet(params: Record<string, string | number>): Promise<StrapiResponse<StrapiPost[]>> {
  if (!API_BASE) throw new Error('api-base-not-configured');
  const url = new URL(`${API_BASE}/api/posts`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`posts-${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as StrapiResponse<StrapiPost[]>;
}

export async function listPosts(opts?: { page?: number; pageSize?: number }): Promise<StrapiPost[]> {
  const res = await proxyGet({ page: opts?.page ?? 1, pageSize: opts?.pageSize ?? 25 });
  return res.data ?? [];
}

export async function getPostBySlug(slug: string): Promise<StrapiPost | null> {
  const res = await proxyGet({ slug });
  return res.data?.[0] ?? null;
}

export type { StrapiResponse };
