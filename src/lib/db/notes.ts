import { supabase } from '../supabase';
import type { Note } from '../store';

type Row = {
  id: string;
  user_id: string;
  date: string;
  text: string;
  created_at: string;
  updated_at: string;
};

function rowToNote(r: Row): Note {
  return { id: r.id, text: r.text, createdAtIso: r.created_at };
}

export async function listNotesByDate(userId: string): Promise<Record<string, Note[]>> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const out: Record<string, Note[]> = {};
  for (const r of (data ?? []) as Row[]) {
    (out[r.date] ??= []).push(rowToNote(r));
  }
  return out;
}

export async function addNote(
  userId: string,
  dateIso: string,
  text: string,
): Promise<Note> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('empty note');
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, date: dateIso, text: trimmed })
    .select('*')
    .single();
  if (error) throw error;
  return rowToNote(data as Row);
}

export async function updateNote(
  userId: string,
  id: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('empty note');
  const { error } = await supabase
    .from('notes')
    .update({ text: trimmed })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}
