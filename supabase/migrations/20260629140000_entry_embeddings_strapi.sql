-- Migracja: Strapi = źródło prawdy dla wpisów, Supabase = embeddingi + link do Strapi.
-- (Tydzień 5 AI Product Masterclass, Faza 5 — wyszukiwanie wektorowe.)
--
-- Stara tabela `public.entries` zostaje nietknięta jako backup (zgodnie z Fazą 3 kursu).
-- Nowa tabela `entry_embeddings` trzyma wektor + link do dokumentu Strapi.

create extension if not exists vector;

create table if not exists public.entry_embeddings (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  strapi_document_id text not null,
  embedding vector(1536),
  embedding_source text,
  search_tsv tsvector generated always as (to_tsvector('simple', coalesce(embedding_source, ''))) stored,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists entry_embeddings_embedding_hnsw
  on public.entry_embeddings using hnsw (embedding vector_cosine_ops);

create index if not exists entry_embeddings_search_tsv_gin
  on public.entry_embeddings using gin (search_tsv);

create index if not exists entry_embeddings_strapi_doc_idx
  on public.entry_embeddings (strapi_document_id);

alter table public.entry_embeddings enable row level security;

create policy "entry_embeddings: select own"
  on public.entry_embeddings for select
  using (auth.uid() = user_id);

create policy "entry_embeddings: insert own"
  on public.entry_embeddings for insert
  with check (auth.uid() = user_id);

create policy "entry_embeddings: update own"
  on public.entry_embeddings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "entry_embeddings: delete own"
  on public.entry_embeddings for delete
  using (auth.uid() = user_id);
