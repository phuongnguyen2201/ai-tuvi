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

    // Check boi_que_packages
    if (feature === 'boi_que') {
      const { data: pkg } = await supabase
        .from('boi_que_packages')
        .select('uses_remaining')
        .eq('user_id', user.id)
        .gt('uses_remaining', 0)
        .maybeSingle();

      console.log('[useFeatureAccess] boi_que pkg check:', { feature, hasPkg: !!pkg });
      setHasAccess(!!pkg);
      setIsLoading(false);
      return;
    }

    // Check kieu_packages if boi_kieu feature
    if (feature === 'boi_kieu') {
      const { data: pkg } = await supabase
        .from('kieu_packages')
        .select('uses_remaining')
        .eq('user_id', user.id)
        .gt('uses_remaining', 0)
        .maybeSingle();

      console.log('[useFeatureAccess] kieu pkg check:', { feature, hasPkg: !!pkg });
      setHasAccess(!!pkg);
      setIsLoading(false);
      return;
    }

    // Check luan_giai_packages
    if (feature === 'luan_giai') {
      const { data: pkg } = await supabase
        .from('luan_giai_packages')
        .select('remaining_uses')
        .eq('user_id', user.id)
        .eq('payment_status', 'confirmed')
        .gt('remaining_uses', 0)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[useFeatureAccess] luan_giai pkg check:', { feature, hasPkg: !!pkg });
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
    const extraChannels: ReturnType<typeof supabase.channel>[] = [];

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
        const vhChannel = supabase
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
        extraChannels.push(vhChannel);
      }

      // Listen for boi_que_packages changes
      if (feature === 'boi_que') {
        const bqChannel = supabase
          .channel('boi-que-pkg-' + user.id)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'boi_que_packages',
              filter: `user_id=eq.${user.id}`,
            },
            () => checkAccess()
          )
          .subscribe();
        extraChannels.push(bqChannel);
      }

      // Listen for kieu_packages changes
      if (feature === 'boi_kieu') {
        const kieuChannel = supabase
          .channel('kieu-pkg-' + user.id)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'kieu_packages',
              filter: `user_id=eq.${user.id}`,
            },
            () => checkAccess()
          )
          .subscribe();
        extraChannels.push(kieuChannel);
      }

      // Listen for luan_giai_packages changes
      if (feature === 'luan_giai') {
        const lgChannel = supabase
          .channel('luan-giai-pkg-' + user.id)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'luan_giai_packages',
              filter: `user_id=eq.${user.id}`,
            },
            () => checkAccess()
          )
          .subscribe();
        extraChannels.push(lgChannel);
      }
    });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
      extraChannels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [feature]);

  return { hasAccess, isLoading, refresh: checkAccess };
}
