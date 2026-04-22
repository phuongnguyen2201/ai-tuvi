import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export async function signInAsGuest() {
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { is_guest: true, created_via: 'guest_mode' } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  });
  if (error) throw error;
  return data;
}

export function isGuestUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.is_anonymous === true || user.user_metadata?.is_guest === true;
}

export async function signOutAll() {
  await supabase.auth.signOut();
}
