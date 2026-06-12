-- Zdjęcia per notatka (refactor day-level → note-level).
-- Legacy day-level photos (note_id IS NULL) — wycięte poza migracją (bucket przez Storage API
-- + DELETE FROM entry_photos), bo psql nie może bezpośrednio kasować ze storage.objects.

-- Cleanup (idempotent — tabela już może być pusta jeśli migracja jest re-runem).
delete from public.entry_photos;

alter table public.entry_photos
  add column note_id uuid not null references public.notes(id) on delete cascade;

create index if not exists entry_photos_note_idx
  on public.entry_photos (note_id, order_index);
