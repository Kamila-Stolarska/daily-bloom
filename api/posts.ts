// /api/posts — publiczny proxy do Strapi `Post`. Token STRAPI_TOKEN żyje po
// stronie serwera (Vercel Environment Variables) i nie ląduje w bundlu klienta.
//
// GET /api/posts?page=1&pageSize=25         → lista postów (sort: publishedAt desc)
// GET /api/posts?slug=<slug>                → pojedynczy post po slugu (data: [post]|[])

import { CORS_HEADERS, jsonResponse } from './_lib/chat-shared';

export const config = { runtime: 'edge' };

const RAW = process.env.STRAPI_URL ?? '';
const TOKEN = process.env.STRAPI_TOKEN ?? '';
const STRAPI_URL = RAW.replace(/\/$/, '');

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'GET') return jsonResponse({ error: 'method-not-allowed' }, 405);

  if (!STRAPI_URL) return jsonResponse({ error: 'strapi-url-not-configured' }, 500);
  if (!TOKEN) return jsonResponse({ error: 'strapi-token-not-configured' }, 500);

  const u = new URL(req.url);
  const slug = u.searchParams.get('slug');
  const page = u.searchParams.get('page') ?? '1';
  const pageSize = u.searchParams.get('pageSize') ?? '25';

  const target = new URL(`${STRAPI_URL}/api/posts`);
  target.searchParams.set('populate', '*');
  target.searchParams.set('sort', 'publishedAt:desc');
  if (slug) {
    target.searchParams.set('filters[slug][$eq]', slug);
  } else {
    target.searchParams.set('pagination[page]', page);
    target.searchParams.set('pagination[pageSize]', pageSize);
  }

  const res = await fetch(target.toString(), {
    headers: { accept: 'application/json', authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return jsonResponse({ error: `strapi-${res.status}`, detail: body.slice(0, 200) }, 502);
  }
  const data = await res.json();
  return jsonResponse(data, 200);
}
