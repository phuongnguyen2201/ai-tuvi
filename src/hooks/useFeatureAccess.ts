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

    // Check premium trước (premium unlock tất cả)
    const { data: premium } = await supabase
      .from('user_features')
      .select('id')
      .eq('user_id', user.id)
      .eq('feature', 'premium')
      .maybeSingle();

    if (premium) { setHasAccess(true); setIsLoading(false); return; }

    // Check feature cụ thể
    const { data } = await supabase
      .from('user_features')
      .select('id')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .maybeSingle();

    setHasAccess(!!data);
    setIsLoading(false);
  }

  return { hasAccess, isLoading, refresh: checkAccess };
}
