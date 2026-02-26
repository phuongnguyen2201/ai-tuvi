import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useChartAccess(chartHash: string | null) {
  const [hasPaid, setHasPaid] = useState(false);
  const [analysisRecord, setAnalysisRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = async () => {
    if (!chartHash) {
      setIsLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('chart_analyses')
      .select('*')
      .eq('chart_hash', chartHash)
      .eq('user_id', user.id)
      .maybeSingle();

    setHasPaid(!!data);
    setAnalysisRecord(data);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAccess();
  }, [chartHash]);

  return { hasPaid, analysisRecord, isLoading, refresh: checkAccess };
}
