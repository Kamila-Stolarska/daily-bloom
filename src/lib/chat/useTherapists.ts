// Hook do katalogu terapeutów: pobiera listę z /api/therapists, trzyma aktywnego,
// pozwala go zmienić (POST /api/therapists). Re-fetch po `restore()` (np. po
// powrocie z Shopify checkoutu) — webhook do tego czasu zwykle już dotarł.

import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog, restorePurchases, selectTherapist } from '../db/therapists';
import type { TherapistCatalogItem } from '../types/therapist';

export function useTherapists() {
  const [catalog, setCatalog] = useState<TherapistCatalogItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCatalog();
      setCatalog(data.catalog);
      setActiveId(data.active_therapist_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setActive = useCallback(async (id: string) => {
    const prev = activeId;
    setActiveId(id); // optimistic
    try {
      await selectTherapist(id);
    } catch (e) {
      setActiveId(prev);
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }, [activeId]);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await restorePurchases();
      const data = await fetchCatalog();
      setCatalog(data.catalog);
      setActiveId(data.active_therapist_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const active = catalog.find((t) => t.id === activeId) ?? null;

  return { catalog, active, activeId, loading, error, reload, restore, setActive };
}
