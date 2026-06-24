-- pgvector + hybrid search dla `entries`.
-- Embedding 1536D z OpenAI text-embedding-3-small.
-- Tekstowa kolumna `embedding_source` agreguje osie + tagi + notatkę,
-- z niej automatycznie liczy się `search_tsv` (BM25 / ts_rank).
--
-- ZAAPLIKOWANE w Supabase 2026-06-10 przez MCP apply_migration("hybrid_search").

create extension if not exists vector;

alter table public.entries
  add column if not exists embedding vector(1536),
  add column if not exists embedding_source text,
  add column if not exists search_tsv tsvector
    generated always as (to_tsvector('simple', coalesce(embedding_source, ''))) stored;

create index if not exists entries_embedding_hnsw
  on public.entries using hnsw (embedding vector_cosine_ops);

create index if not exists entries_search_tsv_gin
  on public.entries using gin (search_tsv);

-- Hybrid search: vector cosine + ts_rank_cd, fuzja przez Reciprocal Rank Fusion (k=60).
-- security invoker → RLS naturalne. p_user_id jawne (seed/service_role też ma działać).
create or replace function public.hybrid_search_entries(
  p_user_id uuid,
  p_query text,
  p_query_embedding vector(1536),
  p_k integer default 8
)
returns table (
  id uuid,
  date date,
  day smallint,
  emotions smallint,
  energy smallint,
  body smallint,
  delight smallint,
  meaning smallint,
  something_good boolean,
  something_hard boolean,
  embedding_source text,
  score double precision,
  vec_rank integer,
  bm_rank integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with
    vec as (
      select
        e.id,
        row_number() over (order by e.embedding <=> p_query_embedding) as rk
      from public.entries e
      where e.user_id = p_user_id
        and e.embedding is not null
      order by e.embedding <=> p_query_embedding
      limit greatest(p_k * 10, 50)
    ),
    bm as (
      select
        e.id,
        row_number() over (
          order by ts_rank_cd(e.search_tsv, websearch_to_tsquery('simple', p_query)) desc
        ) as rk
      from public.entries e
      where e.user_id = p_user_id
        and e.search_tsv @@ websearch_to_tsquery('simple', p_query)
      order by ts_rank_cd(e.search_tsv, websearch_to_tsquery('simple', p_query)) desc
      limit greatest(p_k * 10, 50)
    ),
    fused as (
      select
        coalesce(v.id, b.id) as id,
        (case when v.rk is not null then 1.0 / (60 + v.rk) else 0 end)
        + (case when b.rk is not null then 1.0 / (60 + b.rk) else 0 end) as score,
        v.rk::int as vec_rank,
        b.rk::int as bm_rank
      from vec v
      full outer join bm b on b.id = v.id
    )
  select
    e.id, e.date, e.day, e.emotions, e.energy, e.body, e.delight, e.meaning,
    e.something_good, e.something_hard, e.embedding_source,
    f.score, f.vec_rank, f.bm_rank
  from fused f
  join public.entries e on e.id = f.id
  where e.user_id = p_user_id
  order by f.score desc
  limit p_k;
$$;

grant execute on function public.hybrid_search_entries(uuid, text, vector(1536), integer)
  to authenticated, anon, service_role;
