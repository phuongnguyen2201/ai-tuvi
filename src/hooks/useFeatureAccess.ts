import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VAN_HAN_FEATURES = ['van_han_week', 'van_han_month', 'van_han_year'];
const TIME_FRAME_MAP: Record<string, string> = {
  van_han_week: 'week',
  van_han_month: 'month',
  van_han_year: 'year',
};

export function useFeatureAccess(feature: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = async () => {
    console.log('[useFeatureAccess] checkAccess called for feature:', feature);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.log('[useFeatureAccess] No user'); setIsLoading(false); return; }

    // Check premium first
    const { data: premium } = await supabase
      .from('user_features')
      .select('expires_at')
      .eq('user_id', user.id)
      .eq('feature', 'premium')
      .maybeSingle();

    if (premium && (!premium.expires_at || new Date(premium.expires_at) > new Date())) {
      setHasAccess(true); setIsLoading(false); return;
    }

    // Check van_han_packages if van_han feature
    if (VAN_HAN_FEATURES.includes(feature)) {
      const { data: pkg } = await supabase
        .from('van_han_packages')
        .select('uses_remaining')
        .eq('user_id', user.id)
        .eq('time_frame', TIME_FRAME_MAP[feature])
        .gt('uses_remaining', 0)
        .maybeSingle();

      console.log('[useFeatureAccess] van_han pkg check:', { feature, hasPkg: !!pkg });
      setHasAccess(!!pkg);
      setIsLoading(false);
      return;
    }

    // Check user_features as usual
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
    let pkgChannelRef: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Listen for user_features changes
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

      // Listen for van_han_packages changes
      if (VAN_HAN_FEATURES.includes(feature)) {
        pkgChannelRef = supabase
          .channel('van-han-pkg-' + user.id + '-' + feature)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'van_han_packages',
              filter: `user_id=eq.${user.id}`,
            },
            () => checkAccess()
          )
          .subscribe();
      }
    });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
      if (pkgChannelRef) supabase.removeChannel(pkgChannelRef);
    };
  }, [feature]);

  return { hasAccess, isLoading, refresh: checkAccess };
}
