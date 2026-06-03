import { supabase } from '../supabase';

export type Profile = {
  userId: string;
  name: string | null;
  flowerSeed: string;
};

function genSeed(): string {
  return `u_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function getOrCreateProfile(
  userId: string,
  fallbackSeed?: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    return { userId: data.user_id, name: data.name, flowerSeed: data.flower_seed };
  }
  const seed = fallbackSeed && fallbackSeed.length > 0 ? fallbackSeed : genSeed();
  const { data: ins, error: insErr } = await supabase
    .from('profiles')
    .insert({ user_id: userId, flower_seed: seed })
    .select('*')
    .single();
  if (insErr) throw insErr;
  return { userId: ins.user_id, name: ins.name, flowerSeed: ins.flower_seed };
}

export async function setProfileName(userId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('user_id', userId);
  if (error) throw error;
}
