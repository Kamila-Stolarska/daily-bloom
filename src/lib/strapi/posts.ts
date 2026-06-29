// Domain queries dla content-type `Post` w Strapi.
// Schemat: title (string), slug (uid), content (richtext markdown), cover (media single).

import { strapiGet, type StrapiMedia, type StrapiResponse } from './client';

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

export async function listPosts(opts?: { page?: number; pageSize?: number }): Promise<StrapiPost[]> {
  const res = await strapiGet<StrapiPost[]>('/api/posts', {
    'populate': '*',
    'sort': 'publishedAt:desc',
    'pagination[page]': opts?.page ?? 1,
    'pagination[pageSize]': opts?.pageSize ?? 25,
  });
  return res.data ?? [];
}

export async function getPostBySlug(slug: string): Promise<StrapiPost | null> {
  const res = await strapiGet<StrapiPost[]>('/api/posts', {
    'populate': '*',
    'filters[slug][$eq]': slug,
  });
  return res.data?.[0] ?? null;
}

export type { StrapiResponse };
