/**
 * TuViAnalysis.tsx
 * AI-powered Tử Vi interpretation component
 * Uses Claude API via Supabase Edge Function
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Sparkles, 
  Brain, 
  Heart, 
  Briefcase, 
  Wallet, 
  Activity, 
  Calendar,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================
interface StarInfo {
  name: string;
  brightness?: string;
  mutagen?: string;
}

interface PalaceInfo {
  name: string;
  earthlyBranch: string;
  majorStars: StarInfo[];
  minorStars: StarInfo[];
  isSoulPalace: boolean;
  isBodyPalace: boolean;
}

interface TuHoaInfo {
  star: string;
  palace: string;
}

interface TuViChart {
  solarDate: string;
  lunarDate: string;
  lunarYear: string;
  birthHour: string;
  gender: string;
  genderYinYang: string;
  cuc: { name: string; value: number };
  fiveElements: string;
  palaces: PalaceInfo[];
  tuHoa: {
    hoaLoc: TuHoaInfo;
    hoaQuyen: TuHoaInfo;
    hoaKhoa: TuHoaInfo;
    hoaKy: TuHoaInfo;
  };
}

interface Props {
  chart: TuViChart;
}

type AnalysisType = 'full' | 'career' | 'love' | 'wealth' | 'health' | 'year';

// =============================================================================
// CONSTANTS
// =============================================================================
const analysisOptions: { value: AnalysisType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'full', 
    label: 'Toàn diện', 
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Luận giải tổng quan toàn bộ lá số'
  },
  { 
    value: 'career', 
    label: 'Sự nghiệp', 
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Công việc, nghề nghiệp phù hợp'
  },
  { 
    value: 'love', 
    label: 'Tình duyên', 
    icon: <Heart className="w-4 h-4" />,
    description: 'Hôn nhân, tình cảm, đối tượng phù hợp'
  },
  { 
    value: 'wealth', 
    label: 'Tài vận', 
    icon: <Wallet className="w-4 h-4" />,
    description: 'Tiền bạc, đầu tư, kinh doanh'
  },
  { 
    value: 'health', 
    label: 'Sức khỏe', 
    icon: <Activity className="w-4 h-4" />,
    description: 'Thể chất, tinh thần, phòng bệnh'
  },
  { 
    value: 'year', 
    label: `Năm ${new Date().getFullYear()}`, 
    icon: <Calendar className="w-4 h-4" />,
    description: 'Vận hạn năm nay chi tiết'
  },
];

// =============================================================================
// MARKDOWN RENDERER (Simple)
// =============================================================================
function SimpleMarkdown({ content }: { content: string }) {
  // Simple markdown parsing
  const lines = content.split('\n');
  
  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-lg font-bold text-amber-800 mt-6 mb-2 border-b border-amber-200 pb-1">
              {line.replace('## ', '')}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="text-md font-semibold text-amber-700 mt-4 mb-2">
              {line.replace('### ', '')}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-xl font-bold text-amber-900 mt-6 mb-3">
              {line.replace('# ', '')}
            </h1>
          );
        }
        
        // Blockquote
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-amber-400 pl-4 italic text-amber-800 my-3 bg-amber-50 py-2 rounded-r">
              {line.replace('> ', '')}
            </blockquote>
          );
        }
        
        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const text = line.replace(/^[-*] /, '');
          return (
            <li key={index} className="text-gray-700 ml-4 list-disc">
              {formatInlineMarkdown(text)}
            </li>
          );
        }
        
        // Numbered list
        if (/^\d+\. /.test(line)) {
          const text = line.replace(/^\d+\. /, '');
          return (
            <li key={index} className="text-gray-700 ml-4 list-decimal">
              {formatInlineMarkdown(text)}
            </li>
          );
        }
        
        // Horizontal rule
        if (line === '---' || line === '***') {
          return <hr key={index} className="border-amber-200 my-4" />;
        }
        
        // Empty line
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }
        
        // Regular paragraph
        return (
          <p key={index} className="text-gray-700 leading-relaxed">
            {formatInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

// Format inline markdown (bold, italic)
function formatInlineMarkdown(text: string): React.ReactNode {
  // Replace **bold** with <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-amber-900 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function TuViAnalysis({ chart }: Props) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('full');
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<{ input: number; output: number } | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setTokenUsage(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-chart', {
        body: {
          chart,
          question: question.trim() || undefined,
          analysisType,
        },
      });

      if (fnError) throw fnError;

      if (data.success) {
        setAnalysis(data.analysis);
        if (data.usage) {
          setTokenUsage({
            input: data.usage.inputTokens,
            output: data.usage.outputTokens,
          });
        }
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Có lỗi xảy ra khi phân tích. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!analysis) return;
    
    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShare = async () => {
    if (!analysis) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Luận giải Tử Vi',
          text: analysis.slice(0, 200) + '...',
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-6">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Brain className="w-6 h-6" />
          AI Luận Giải Tử Vi
          <span className="text-xs font-normal text-purple-600 ml-2">
            Powered by Claude
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Analysis Type Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Chọn loại luận giải:
          </label>
          <div className="flex flex-wrap gap-2">
            {analysisOptions.map((option) => (
              <Button
                key={option.value}
                variant={analysisType === option.value ? 'default' : 'outline'}
                size="sm"
                className={`flex items-center gap-2 ${
                  analysisType === option.value 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'hover:bg-purple-50 hover:border-purple-300'
                }`}
                onClick={() => setAnalysisType(option.value)}
                title={option.description}
              >
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Question */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Câu hỏi cụ thể (tùy chọn):
          </label>
          <Textarea
            placeholder="Ví dụ: Tôi có nên chuyển việc năm nay không? Khi nào là thời điểm tốt để kết hôn? Tôi nên đầu tư vào lĩnh vực nào?..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-6"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Đang phân tích lá số...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Luận Giải Lá Số
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">⚠️ Lỗi</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleAnalyze}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="mt-6 space-y-4">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Kết Quả Luận Giải
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-gray-600"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copied ? 'Đã copy' : 'Copy'}
                </Button>
                {navigator.share && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-600"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Chia sẻ
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 shadow-inner">
              <SimpleMarkdown content={analysis} />
            </div>

            {/* Token Usage (optional display) */}
            {tokenUsage && (
              <div className="text-xs text-gray-400 text-right">
                Tokens: {tokenUsage.input} input / {tokenUsage.output} output
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TuViAnalysis;
