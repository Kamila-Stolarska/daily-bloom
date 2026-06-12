-- Zdjęcia per dzień (wpis = data). Wiele zdjęć na dzień, kolejność user-defined.
-- Bucket `entry-photos` (prywatny) + RLS scoped przez prefix ścieżki `<user_id>/...`.

create table if not exists public.entry_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  storage_path text not null unique,
  order_index smallint not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index if not exists entry_photos_user_date_idx
  on public.entry_photos (user_id, date, order_index);

alter table public.entry_photos enable row level security;

drop policy if exists "entry_photos owner select" on public.entry_photos;
create policy "entry_photos owner select"
  on public.entry_photos for select
  using (auth.uid() = user_id);

drop policy if exists "entry_photos owner insert" on public.entry_photos;
create policy "entry_photos owner insert"
  on public.entry_photos for insert
  with check (auth.uid() = user_id);

drop policy if exists "entry_photos owner update" on public.entry_photos;
create policy "entry_photos owner update"
  on public.entry_photos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "entry_photos owner delete" on public.entry_photos;
create policy "entry_photos owner delete"
  on public.entry_photos for delete
  using (auth.uid() = user_id);

-- Bucket. Prywatny — dostęp tylko przez signed URLs / authenticated client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-photos',
  'entry-photos',
  false,
  10 * 1024 * 1024,  -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: scopowane do folderu `<user_id>/...`.
-- storage.foldername(name) zwraca tablicę segmentów ścieżki; pierwszy musi = auth.uid().

drop policy if exists "entry-photos owner select" on storage.objects;
create policy "entry-photos owner select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'entry-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry-photos owner insert" on storage.objects;
create policy "entry-photos owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'entry-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry-photos owner update" on storage.objects;
create policy "entry-photos owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'entry-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'entry-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "entry-photos owner delete" on storage.objects;
create policy "entry-photos owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'entry-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
