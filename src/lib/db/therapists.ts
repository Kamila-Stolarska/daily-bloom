// Klient API katalogu terapeutów. Wywołuje /api/therapists (GET + POST).

import { supabase } from '../supabase';
import type { TherapistCatalogResponse } from '../types/therapist';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';
const URL = `${API_BASE}/api/therapists`;
const SYNC_URL = `${API_BASE}/api/therapists-sync`;

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('not-authenticated');
  return `Bearer ${token}`;
}

export async function fetchCatalog(): Promise<TherapistCatalogResponse> {
  const res = await fetch(URL, { headers: { authorization: await authHeader() } });
  if (!res.ok) throw new Error(`fetch-catalog-failed: ${res.status}`);
  return (await res.json()) as TherapistCatalogResponse;
}

export async function restorePurchases(): Promise<{ unlocked: string[] }> {
  const res = await fetch(SYNC_URL, { method: 'POST', headers: { authorization: await authHeader() } });
  if (!res.ok) throw new Error(`restore-failed: ${res.status}`);
  return (await res.json()) as { unlocked: string[] };
}

export async function selectTherapist(therapistId: string): Promise<void> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      authorization: await authHeader(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ therapist_id: therapistId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`select-failed: ${res.status} ${text}`);
  }
}
