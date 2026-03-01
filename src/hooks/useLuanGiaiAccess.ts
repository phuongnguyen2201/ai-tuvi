import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LuanGiaiAccess {
  hasAccess: boolean;
  packageId: string | null;
  remaining: number;
  total: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useLuanGiaiAccess(): LuanGiaiAccess {
  const [hasAccess, setHasAccess] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: packages } = await supabase
      .from('luan_giai_packages')
      .select('id, remaining_uses, total_uses')
      .eq('user_id', user.id)
      .eq('payment_status', 'confirmed')
      .gt('remaining_uses', 0)
      .order('created_at', { ascending: false })
      .limit(1);

    if (packages && packages.length > 0) {
      setHasAccess(true);
      setPackageId(packages[0].id);
      setRemaining(packages[0].remaining_uses);
      setTotal(packages[0].total_uses);
    } else {
      setHasAccess(false);
      setPackageId(null);
      setRemaining(0);
      setTotal(0);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAccess();

    // Realtime listener for luan_giai_packages changes
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
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
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [checkAccess]);

  return { hasAccess, packageId, remaining, total, isLoading, refresh: checkAccess };
}

export async function decrementLuanGiaiUses(userId: string): Promise<boolean> {
  const { data: pkg } = await supabase
    .from('luan_giai_packages')
    .select('id, remaining_uses')
    .eq('user_id', userId)
    .eq('payment_status', 'confirmed')
    .gt('remaining_uses', 0)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (pkg) {
    await supabase
      .from('luan_giai_packages')
      .update({ remaining_uses: pkg.remaining_uses - 1 })
      .eq('id', pkg.id);
    return true;
  }
  return false;
}
