import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFeatureAccess(feature: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = async () => {
    console.log('[useFeatureAccess] checkAccess called for feature:', feature);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.log('[useFeatureAccess] No user'); setIsLoading(false); return; }

    const { data: premium } = await supabase
      .from('user_features')
      .select('expires_at')
      .eq('user_id', user.id)
      .eq('feature', 'premium')
      .maybeSingle();

    if (premium && (!premium.expires_at || new Date(premium.expires_at) > new Date())) {
      setHasAccess(true); setIsLoading(false); return;
    }

    const { data } = await supabase
      .from('user_features')
      .select('expires_at')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .maybeSingle();

    const isValid = data && (!data.expires_at || new Date(data.expires_at) > new Date());
    console.log('[useFeatureAccess] checkAccess result:', { feature, hasData: !!data, isValid });
    setHasAccess(!!isValid);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAccess();

    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channelRef = supabase
        .channel('user-features-' + user.id + '-' + feature)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_features',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[useFeatureAccess] INSERT detected:', payload);
            checkAccess();
          }
        )
        .subscribe((status) => {
          console.log('[useFeatureAccess] Channel status:', status, 'for feature:', feature);
        });
    });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [feature]);

  return { hasAccess, isLoading, refresh: checkAccess };
}
