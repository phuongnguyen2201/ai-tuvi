import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NFTPreviewProps {
  chartData: any;
  birthData: {
    name?: string;
    solarDate: string;
    hour: number;
    gender: string;
    isLunar?: boolean;
  };
  walletAddress?: string;
}

export function NFTPreview({ chartData, birthData, walletAddress }: NFTPreviewProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track last request to avoid duplicate calls
  const lastRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return; // Không gọi nếu chưa connect ví
    if (!chartData || !birthData?.solarDate) return;

    // Deduplicate: skip if same request
    const requestKey = `${birthData.solarDate}_${birthData.hour}_${birthData.gender}`;
    if (lastRequestRef.current === requestKey) return;

    const generatePreview = async () => {
      // Check auth first — generate-image requires a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session → skip silently, don't spam 401 errors
        return;
      }

      lastRequestRef.current = requestKey;
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
          body: {
            type: 'tuvi',
            data: { chartData, birthData },
          },
        });

        if (fnError) {
          console.error('Generate image error:', fnError);
          setError('Không thể tạo hình ảnh NFT.');
        } else if (data?.svg) {
          setSvgContent(data.svg);
        } else {
          setError('Không nhận được hình ảnh từ server.');
        }
      } catch (err) {
        console.error('Generate image exception:', err);
        setError('Có lỗi xảy ra khi tạo hình ảnh.');
      } finally {
        setLoading(false);
      }
    };

    generatePreview();
  }, [walletAddress, chartData, birthData?.solarDate, birthData?.hour, birthData?.gender]);

  return (
    <Card className="bg-slate-900/80 border-amber-600/30">
      <CardHeader>
        <CardTitle className="text-amber-300">🖼️ Preview NFT của bạn</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mr-3" />
            <span className="text-gray-400">Đang tạo hình ảnh NFT...</span>
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-4">{error}</p>
        ) : svgContent ? (
          <div
            className="flex justify-center rounded-lg overflow-hidden border border-amber-600/20"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
