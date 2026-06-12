// Zdjęcia per notatka — Supabase Storage (prywatny bucket `entry-photos`) + tabela `entry_photos`.
// Ścieżki w buckecie: `<user_id>/<dateIso>/<note_id>/<token>.<ext>` — RLS pilnuje że user ma dostęp
// tylko do swojego folderu. ON DELETE CASCADE z notes(id) zapewnia spójność wiersza w DB; pliki
// w buckecie czyścimy best-effort z `deleteNote` w store.

import { supabase } from '../supabase';

export const BUCKET = 'entry-photos';
const SIGNED_TTL_SEC = 60 * 60; // 1h

export type Photo = {
  id: string;
  noteId: string;
  dateIso: string;
  storagePath: string;
  signedUrl: string;
  width: number | null;
  height: number | null;
  orderIndex: number;
};

type Row = {
  id: string;
  user_id: string;
  note_id: string;
  date: string;
  storage_path: string;
  order_index: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      return 'jpg';
  }
}

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

async function attachSignedUrls(rows: Row[]): Promise<Photo[]> {
  if (rows.length === 0) return [];
  const paths = rows.map((r) => r.storage_path);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_TTL_SEC);
  if (error) throw error;
  const urlByPath = new Map<string, string>();
  for (const it of data ?? []) {
    if (it.signedUrl && it.path) urlByPath.set(it.path, it.signedUrl);
  }
  return rows.map((r) => ({
    id: r.id,
    noteId: r.note_id,
    dateIso: r.date,
    storagePath: r.storage_path,
    signedUrl: urlByPath.get(r.storage_path) ?? '',
    width: r.width,
    height: r.height,
    orderIndex: r.order_index,
  }));
}

// Wszystkie zdjęcia user'a, pogrupowane po note_id.
export async function listPhotosByNote(userId: string): Promise<Record<string, Photo[]>> {
  const { data, error } = await supabase
    .from('entry_photos')
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const photos = await attachSignedUrls(rows);
  const out: Record<string, Photo[]> = {};
  for (const p of photos) (out[p.noteId] ??= []).push(p);
  return out;
}

export type UploadInput = {
  data: Blob | ArrayBuffer | Uint8Array;
  contentType: string;
  width?: number;
  height?: number;
};

export async function uploadPhoto(
  userId: string,
  dateIso: string,
  noteId: string,
  input: UploadInput,
): Promise<Photo> {
  const ext = extFromMime(input.contentType);
  const path = `${userId}/${dateIso}/${noteId}/${randomToken()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.data, {
      contentType: input.contentType,
      upsert: false,
      cacheControl: '3600',
    });
  if (upErr) throw upErr;

  // Kolejność rośnie w obrębie tej samej notatki.
  const { count } = await supabase
    .from('entry_photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('note_id', noteId);
  const orderIndex = count ?? 0;

  const { data: row, error: insErr } = await supabase
    .from('entry_photos')
    .insert({
      user_id: userId,
      note_id: noteId,
      date: dateIso,
      storage_path: path,
      order_index: orderIndex,
      width: input.width ?? null,
      height: input.height ?? null,
    })
    .select('*')
    .single();
  if (insErr || !row) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
    throw insErr ?? new Error('insert-failed');
  }

  const [photo] = await attachSignedUrls([row as Row]);
  return photo;
}

export async function removePhoto(userId: string, photo: Photo): Promise<void> {
  const { error: delErr } = await supabase
    .from('entry_photos')
    .delete()
    .eq('id', photo.id)
    .eq('user_id', userId);
  if (delErr) throw delErr;
  await supabase.storage.from(BUCKET).remove([photo.storagePath]).catch(() => undefined);
}

// Best-effort cleanup wszystkich plików w buckecie powiązanych z notatką.
// Wpisy w tabeli są wycinane przez CASCADE z notes.id.
export async function removePhotosForNoteStorage(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths).catch(() => undefined);
}
