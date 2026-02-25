import { useState, useEffect } from 'react';
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
}

export function NFTPreview({ chartData, birthData }: NFTPreviewProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartData) return;

    const generatePreview = async () => {
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
  }, [chartData, birthData]);

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
