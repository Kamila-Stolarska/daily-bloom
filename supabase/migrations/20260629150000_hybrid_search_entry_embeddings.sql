-- Hybrid search RPC dla tabeli `entry_embeddings` (Strapi-linked).
-- Faza 5 kursu: wektorowa + tekstowa (BM25) wyszukiwarka po wpisach dziennika,
-- z fuzją Reciprocal Rank Fusion (k=60). Wzorzec 1:1 z `hybrid_search_entries`,
-- ale operuje na nowej tabeli (user_id, date, strapi_document_id, embedding, ...).

create or replace function public.hybrid_search_entry_embeddings(
  p_user_id uuid,
  p_query text,
  p_query_embedding vector(1536),
  p_k integer default 10
)
returns table (
  date date,
  strapi_document_id text,
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
        e.date,
        e.strapi_document_id,
        e.embedding_source,
        row_number() over (order by e.embedding <=> p_query_embedding) as rk
      from public.entry_embeddings e
      where e.user_id = p_user_id
        and e.embedding is not null
      order by e.embedding <=> p_query_embedding
      limit greatest(p_k * 10, 50)
    ),
    bm as (
      select
        e.date,
        e.strapi_document_id,
        e.embedding_source,
        row_number() over (
          order by ts_rank_cd(e.search_tsv, websearch_to_tsquery('simple', p_query)) desc
        ) as rk
      from public.entry_embeddings e
      where e.user_id = p_user_id
        and e.search_tsv @@ websearch_to_tsquery('simple', p_query)
      order by ts_rank_cd(e.search_tsv, websearch_to_tsquery('simple', p_query)) desc
      limit greatest(p_k * 10, 50)
    ),
    fused as (
      select
        coalesce(v.date, b.date) as date,
        coalesce(v.strapi_document_id, b.strapi_document_id) as strapi_document_id,
        coalesce(v.embedding_source, b.embedding_source) as embedding_source,
        (case when v.rk is not null then 1.0 / (60 + v.rk) else 0 end)
        + (case when b.rk is not null then 1.0 / (60 + b.rk) else 0 end) as score,
        v.rk::int as vec_rank,
        b.rk::int as bm_rank
      from vec v
      full outer join bm b on b.date = v.date
    )
  select date, strapi_document_id, embedding_source, score, vec_rank, bm_rank
  from fused
  order by score desc
  limit p_k;
$$;

grant execute on function public.hybrid_search_entry_embeddings(uuid, text, vector(1536), integer)
  to authenticated, anon, service_role;
