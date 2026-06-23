// Typy katalogu terapeutów (zwracane przez GET /api/therapists).

export type TherapistCatalogItem = {
  id: string;
  handle: string;
  name: string;
  short_bio: string | null;
  avatar_url: string | null;
  price_cents: number;
  is_unlocked: boolean;
  is_default: boolean;
  checkout_url: string | null;
};

export type TherapistCatalogResponse = {
  active_therapist_id: string | null;
  catalog: TherapistCatalogItem[];
};
