import { supabase } from '../supabase';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAtIso: string;
};

type Row = {
  id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
};

function rowToMessage(r: Row): ChatMessage {
  return { id: r.id, role: r.role, content: r.content, createdAtIso: r.created_at };
}

export async function listMessages(userId: string, limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Row[]).map(rowToMessage).reverse();
}
