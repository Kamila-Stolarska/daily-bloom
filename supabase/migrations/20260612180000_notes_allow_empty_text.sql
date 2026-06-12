-- Notatki mogą być pustym tekstem — wtedy istnieją tylko jako kontener na zdjęcia.
-- CHECK constraint sprzed wprowadzenia zdjęć per-notka blokował pusty tekst.

alter table public.notes drop constraint if exists notes_text_check;
