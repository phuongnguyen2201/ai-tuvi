import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useFeatureAccess(feature: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const now = new Date().toISOString();

    // Check premium trước (premium unlock tất cả)
    // expires_at IS NULL = lifetime, OR expires_at > now = còn hạn
    const { data: premium } = await supabase
      .from('user_features')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('feature', 'premium')
      .maybeSingle() as { data: { id: string; expires_at: string | null } | null };

    if (premium && (!premium.expires_at || premium.expires_at > now)) {
      setHasAccess(true); setIsLoading(false); return;
    }

    // Check feature cụ thể
    const { data } = await supabase
      .from('user_features')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .maybeSingle() as { data: { id: string; expires_at: string | null } | null };

    const isValid = data && (!data.expires_at || data.expires_at > now);
    setHasAccess(!!isValid);
    setIsLoading(false);
  }

  return { hasAccess, isLoading, refresh: checkAccess };
}
