-- RLS dla `public.entries` — user widzi tylko swoje wpisy.
-- Tabela istnieje w Supabase od pierwszej wersji projektu, ale jej DDL nie był w repo,
-- więc polityki RLS też nie były wersjonowane. Jakby ktoś odtworzył bazę z migracji
-- z repo, tabela poszłaby bez tej blokady. Ta migracja jest idempotentna i bezpiecznie
-- włącza RLS + polityki właściciela (analogicznie do `entry_photos`).

alter table public.entries enable row level security;

drop policy if exists "entries owner select" on public.entries;
create policy "entries owner select"
  on public.entries for select
  using (auth.uid() = user_id);

drop policy if exists "entries owner insert" on public.entries;
create policy "entries owner insert"
  on public.entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "entries owner update" on public.entries;
create policy "entries owner update"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "entries owner delete" on public.entries;
create policy "entries owner delete"
  on public.entries for delete
  using (auth.uid() = user_id);
