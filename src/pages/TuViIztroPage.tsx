// src/pages/TuViIztroPage.tsx - Page lập lá số dùng iztro library

import React, { useState, useEffect, useCallback } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { useSearchParams } from 'react-router-dom';
import { createTuViChart, TuViChartData, BirthInput } from '@/services/TuViService';
import TuViChartIztro from '@/components/TuViChartIztro';
import ChartInterpretationDisplay from '@/components/ChartInterpretationDisplay';
import TuViAnalysis from '@/components/TuViAnalysis';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, CheckCircle, XCircle, ExternalLink, Sparkles, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import PageLayout from '@/components/PageLayout';
import { MintMenhNFT } from '@/components/MintMenhNFT';
import { NFTPreview } from '@/components/NFTPreview';
import { NFTGallery } from '@/components/NFTGallery';
import { supabase } from '@/integrations/supabase/client';
import PaymentGate from '@/components/PaymentGate';
import VietQRPaymentModal from '@/components/VietQRPaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useChartAccess } from '@/hooks/useChartAccess';
import { toast } from 'sonner';

// Generate a chart hash from birth data
function generateChartHash(birthDate: Date, birthHour: string, gender: string, calendarType: string): string {
  const dateStr = format(birthDate, 'yyyy-MM-dd');
  return `${dateStr}_${birthHour}_${gender}_${calendarType}`;
}

// Simple markdown renderer for AI analysis results
function renderAnalysisMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-primary mt-5 mb-2 border-b border-primary/20 pb-1">{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-md font-semibold text-foreground mt-3 mb-1">{line.replace('### ', '')}</h3>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-foreground mt-2">{line.replace(/\*\*/g, '')}</p>;
    if (line.startsWith('- ')) return <li key={i} className="text-muted-foreground ml-4 list-disc">{formatInline(line.slice(2))}</li>;
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="text-muted-foreground leading-relaxed">{formatInline(line)}</p>;
  });
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const LUNAR_HOURS = [
  { value: '0', label: 'Tý (23:00 - 00:59)' },
  { value: '1', label: 'Sửu (01:00 - 02:59)' },
  { value: '2', label: 'Dần (03:00 - 04:59)' },
  { value: '3', label: 'Mão (05:00 - 06:59)' },
  { value: '4', label: 'Thìn (07:00 - 08:59)' },
  { value: '5', label: 'Tỵ (09:00 - 10:59)' },
  { value: '6', label: 'Ngọ (11:00 - 12:59)' },
  { value: '7', label: 'Mùi (13:00 - 14:59)' },
  { value: '8', label: 'Thân (15:00 - 16:59)' },
  { value: '9', label: 'Dậu (17:00 - 18:59)' },
  { value: '10', label: 'Tuất (19:00 - 20:59)' },
  { value: '11', label: 'Hợi (21:00 - 22:59)' },
];

export default function TuViIztroPage() {
  const address = useAddress();
  const { user } = useAuth();
  const [chart, setChart] = useState<TuViChartData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [personName, setPersonName] = useState('');
  const [birthDate, setBirthDate] = useState<Date>(new Date(2000, 0, 1));
  const [birthHour, setBirthHour] = useState('1');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');

  // Chart analysis state
  const [cachedAnalysis, setCachedAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [reAnalysisCount, setReAnalysisCount] = useState(0);

  // Edit birth info modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editBirthHour, setEditBirthHour] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editPersonName, setEditPersonName] = useState('');
  const [editCalendarType, setEditCalendarType] = useState('solar');

  // chartHash computed early so hooks can depend on it
  const chartHash = chart ? generateChartHash(birthDate, birthHour, gender, calendarType) : null;

  // Chart-level access check
  const { hasPaid, analysisRecord, isLoading: accessLoading, refresh: refreshAccess } = useChartAccess(chartHash);

  // Mint callback state
  const [searchParams, setSearchParams] = useSearchParams();
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');
  const [mintResult, setMintResult] = useState<any>(null);

  // (localStorage check removed - analysis now handled in modal)

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const mintSuccess = searchParams.get('mint_success');

    if (sessionId && mintSuccess === 'true' && mintStatus === 'idle') {
      setMintStatus('minting');

      supabase.functions.invoke('mint-menh-nft', {
        body: { sessionId }
      }).then(({ data, error: fnError }) => {
        if (fnError || !data?.success) {
          console.error('Mint error:', fnError || data?.error);
          setMintStatus('error');
        } else {
          console.log('Mint success:', data);
          setMintResult(data);
          setMintStatus('success');
        }
        // Clean URL
        setSearchParams({});
      });
    }
  }, [searchParams, mintStatus]);

  // Auto-fill from URL params (e.g. from Profile "Xem lại")
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam) return;

    const hourParam = searchParams.get('hour');
    const genderParam = searchParams.get('gender');
    const calendarParam = searchParams.get('calendar');
    const nameParam = searchParams.get('name');

    // Set form values
    const parsedDate = new Date(dateParam);
    if (!isNaN(parsedDate.getTime())) setBirthDate(parsedDate);
    if (hourParam) setBirthHour(hourParam);
    if (genderParam === 'Nam' || genderParam === 'Nữ') setGender(genderParam);
    if (calendarParam === 'lunar') setCalendarType('lunar');
    else setCalendarType('solar');
    if (nameParam) setPersonName(nameParam);

    // Auto-calculate chart
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();
    const input: BirthInput = {
      year,
      month,
      day,
      hour: parseInt(hourParam || '1'),
      gender: (genderParam as 'Nam' | 'Nữ') || 'Nam',
      isLunarDate: calendarParam === 'lunar',
    };

    try {
      const result = createTuViChart(input);
      setChart(result);
    } catch (err) {
      console.error('Auto-calculate error:', err);
    }

    // Clean URL params after processing
    setSearchParams({});
  }, []); // Run once on mount

  // chartHash already computed above (line 97)

  // Load analysis: check cache → call Claude if needed
  const loadAnalysis = useCallback(async (hash?: string) => {
    const targetHash = hash || chartHash;
    if (!targetHash) {
      console.error('[loadAnalysis] No chartHash!');
      return;
    }
    if (isAnalyzing) {
      console.log('[loadAnalysis] Already analyzing, skipping');
      return;
    }

    console.log('[loadAnalysis] Starting for hash:', targetHash);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const { data: existing } = await (supabase.from('chart_analyses') as any)
      .select('*')
      .eq('chart_hash', targetHash)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    console.log('[loadAnalysis] DB result:', existing);

    if (existing?.analysis_result) {
      // Validate cache - reject bad AI responses
      const isValidResult = !existing.analysis_result.includes('Tôi xin lỗi') &&
        !existing.analysis_result.includes('không thể thấy được lá số') &&
        existing.analysis_result.length > 100;
      
      if (isValidResult) {
        console.log('[loadAnalysis] Cache found, showing result');
        setCachedAnalysis(existing.analysis_result);
        setReAnalysisCount(existing.re_analysis_count || 0);
        setAnalysisError(false);
        return;
      } else {
        console.log('[loadAnalysis] Bad cache detected, clearing and re-analyzing...');
        await (supabase.from('chart_analyses') as any)
          .update({ analysis_result: null })
          .eq('id', existing.id);
        // Fall through to call Claude below
      }
    }

    if (existing) {
      console.log('[loadAnalysis] Calling Claude...');
      console.log('[loadAnalysis] DB analysis_type:', existing.analysis_type, '(DB field, not sent to Claude)');
      setIsAnalyzing(true);
      setAnalysisError(false);
      try {
        const chartDataToUse = chart || existing.chart_data;
        const invokeBody = {
          analysisType: 'luan_giai',
          chartData: chartDataToUse,
          personName: (existing.birth_data as any)?.personName || personName,
        };
        console.log('[loadAnalysis] Invoking with:', {
          analysisType: invokeBody.analysisType,
          hasChartData: !!invokeBody.chartData,
          personName: invokeBody.personName,
          chartDataPreview: JSON.stringify(chartDataToUse).slice(0, 100),
        });
        
        const { data, error: fnError } = await supabase.functions.invoke('analyze-chart', {
          body: invokeBody,
        });
        console.log('[loadAnalysis] Claude response:', data);
        if (fnError) throw fnError;
        if (!data?.analysis) throw new Error('No analysis returned');

        await (supabase.from('chart_analyses') as any)
          .update({ analysis_result: data.analysis })
          .eq('id', existing.id);

        setCachedAnalysis(data.analysis);
      } catch (err: any) {
        console.error('[loadAnalysis] Error:', {
          message: err?.message, code: err?.code, details: err?.details, hint: err?.hint, stack: err?.stack,
        });
        toast.error(err?.message || 'AI đang bận. Vui lòng thử lại sau 1-2 phút.');
        setAnalysisError(true);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    // No chart_analyses record found
    console.error('[loadAnalysis] No chart_analyses record found!');
    toast.error('Không tìm thấy dữ liệu. Vui lòng liên hệ hỗ trợ.');
  }, [chartHash, chart, personName, isAnalyzing]);

  // Pre-fill edit modal when opened
  useEffect(() => {
    if (showEditModal && analysisRecord?.birth_data) {
      const bd = analysisRecord.birth_data as any;
      setEditBirthDate(bd.birthDate || '');
      setEditBirthHour(bd.birthHour || '');
      setEditGender(bd.gender || 'Nam');
      setEditPersonName(bd.personName || '');
      setEditCalendarType(bd.calendarType || 'solar');
    }
  }, [showEditModal, analysisRecord]);

  // Handle edit birth info and re-analyze
  const handleEditAndReanalyze = async () => {
    if (!confirm(
      `Sẽ dùng 1 lượt chỉnh sửa. Còn ${2 - (reAnalysisCount || 0)} lượt. Tiếp tục?`
    )) return;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || !analysisRecord) return;

    setShowEditModal(false);
    setIsAnalyzing(true);
    setCachedAnalysis(null);

    try {
      // Calculate new chart hash
      const newChartHash = `${editBirthDate}_${editBirthHour}_${editGender}_${editCalendarType}`;

      // Recalculate chart with new inputs
      const dateParts = editBirthDate.split('-');
      const newInput: BirthInput = {
        year: parseInt(dateParts[0]),
        month: parseInt(dateParts[1]),
        day: parseInt(dateParts[2]),
        hour: parseInt(editBirthHour),
        gender: editGender as 'Nam' | 'Nữ',
        isLunarDate: editCalendarType === 'lunar',
      };

      const newChartData = createTuViChart(newInput);

      // Update form state to match
      setBirthDate(new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
      setBirthHour(editBirthHour);
      setGender(editGender as 'Nam' | 'Nữ');
      setPersonName(editPersonName);
      setCalendarType(editCalendarType as 'solar' | 'lunar');
      setChart(newChartData);

      // Update chart_analyses record
      const newCount = (reAnalysisCount || 0) + 1;
      await (supabase.from('chart_analyses') as any)
        .update({
          birth_data: {
            birthDate: editBirthDate,
            birthHour: editBirthHour,
            gender: editGender,
            calendarType: editCalendarType,
            personName: editPersonName,
          },
          chart_hash: newChartHash,
          chart_data: newChartData || {},
          analysis_result: null,
          re_analysis_count: newCount,
        })
        .eq('id', analysisRecord.id);

      setReAnalysisCount(newCount);

      // Refresh useChartAccess to detect updated record with new hash
      await refreshAccess();

      // Call Claude with new data
      const invokeBody = {
        analysisType: 'luan_giai',
        chartData: newChartData,
        personName: editPersonName,
      };
      const { data, error: fnError } = await supabase.functions.invoke('analyze-chart', {
        body: invokeBody,
      });
      if (fnError) throw fnError;
      if (!data?.analysis) throw new Error('No analysis returned');

      await (supabase.from('chart_analyses') as any)
        .update({ analysis_result: data.analysis })
        .eq('id', analysisRecord.id);

      setCachedAnalysis(data.analysis);
      setAnalysisError(false);
    } catch (err: any) {
      console.error('[handleEditAndReanalyze] Error:', err);
      toast.error(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      setAnalysisError(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debug state changes
  useEffect(() => {
    console.log('[Page] State changed:', {
      cachedAnalysis: !!cachedAnalysis,
      isAnalyzing,
      analysisError,
      hasPaid,
      accessLoading,
      chartHash,
    });
  }, [cachedAnalysis, isAnalyzing, analysisError, hasPaid, accessLoading, chartHash]);

  // Auto-load analysis when chart is ready and user has paid for this chart
  // Covers: 1) "Xem lại" from Profile, 2) post-payment, 3) page refresh with paid chart
  useEffect(() => {
    if (!chart || !user || !chartHash) {
      setCachedAnalysis(null);
      return;
    }
    if (!hasPaid || accessLoading) return;
    if (cachedAnalysis || isAnalyzing) return;

    console.log('[Page] Auto-loading analysis for:', chartHash);
    loadAnalysis(chartHash);
  }, [chartHash, user, hasPaid, accessLoading, cachedAnalysis, isAnalyzing, loadAnalysis]);

  const handlePaymentSuccess = (analysisResult?: string) => {
    setShowPayment(false);
    if (analysisResult) {
      setCachedAnalysis(analysisResult);
    } else {
      console.log('[Page] onSuccess, chartHash:', chartHash);
      loadAnalysis(chartHash || undefined);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const year = birthDate.getFullYear();
      const month = birthDate.getMonth() + 1;
      const day = birthDate.getDate();
      
      const input: BirthInput = {
        year,
        month,
        day,
        hour: parseInt(birthHour),
        gender,
        isLunarDate: calendarType === 'lunar',
      };
      
      const result = createTuViChart(input);
      console.log('TuVi Chart Result:', result);
      console.log('Palaces:', result.palaces.map(p => ({
        name: p.name,
        branch: p.earthlyBranch,
        isSoul: p.isSoulPalace,
        isBody: p.isBodyPalace,
        majorStars: p.majorStars.map(s => s.name),
      })));
      setChart(result);
    } catch (err: any) {
      console.error('[TuViIztroPage] Error creating chart:', {
        message: err?.message, code: err?.code, details: err?.details, hint: err?.hint, stack: err?.stack,
      });
      setError(err?.message || 'Có lỗi xảy ra khi lập lá số. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <h1 className="text-3xl font-bold text-center text-amber-400">
          {chart && personName ? `🔮 Lá số của ${personName}` : '🔮 Lập Lá Số Tử Vi'}
        </h1>
        {!chart && (
          <p className="text-center text-gray-400 text-sm">
            Nhập thông tin ngày sinh để xem lá số tử vi của bạn
          </p>
        )}

        {/* Mint status banner */}
        {mintStatus === 'minting' && (
          <Card className="border-amber-500/50 bg-amber-950/30">
            <CardContent className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              <div>
                <p className="font-semibold text-amber-300">Đang mint NFT...</p>
                <p className="text-sm text-gray-400">Vui lòng chờ trong giây lát, giao dịch đang được xử lý trên blockchain.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {mintStatus === 'success' && mintResult && (
          <Card className="border-green-500/50 bg-green-950/30">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-300">🎉 Mint NFT thành công!</p>
                <p className="text-sm text-gray-400">Token ID: #{mintResult.tokenId}</p>
                {mintResult.basescanUrl && (
                  <a
                    href={mintResult.basescanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline mt-1"
                  >
                    Xem giao dịch trên Basescan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMintStatus('idle')}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </CardContent>
          </Card>
        )}

        {mintStatus === 'error' && (
          <Card className="border-red-500/50 bg-red-950/30">
            <CardContent className="flex items-center gap-3 py-4">
              <XCircle className="h-5 w-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">Mint NFT thất bại</p>
                <p className="text-sm text-gray-400">Có lỗi xảy ra trong quá trình mint. Vui lòng thử lại sau.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMintStatus('idle')}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* NFT Gallery - always visible when wallet connected */}
        <NFTGallery key={address || 'disconnected'} />

        {/* Form nhập liệu */}
        <Card className="bg-slate-900/80 border-amber-600/30">
          <CardHeader>
            <CardTitle className="text-amber-300">Thông tin ngày sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Person name */}
              <div className="space-y-2">
                <Label htmlFor="personName" className="text-gray-300">Họ và tên <span className="text-red-400">*</span></Label>
                <Input
                  id="personName"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A, Mẹ, Chồng..."
                  required
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Calendar type */}
              <div className="space-y-2">
                <Label className="text-gray-300">Loại lịch</Label>
                <RadioGroup
                  value={calendarType}
                  onValueChange={(v) => setCalendarType(v as 'solar' | 'lunar')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solar" id="solar" />
                    <Label htmlFor="solar" className="text-gray-300 cursor-pointer">Dương lịch</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lunar" id="lunar" />
                    <Label htmlFor="lunar" className="text-gray-300 cursor-pointer">Âm lịch</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Birth date with Calendar */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-300">Ngày sinh</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-800 border-slate-600 text-white hover:bg-slate-700",
                          !birthDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày sinh"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={(date) => date && setBirthDate(date)}
                        captionLayout="dropdown-buttons"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Birth hour */}
                <div className="space-y-2">
                  <Label htmlFor="birthHour" className="text-gray-300">Giờ sinh</Label>
                  <Select value={birthHour} onValueChange={setBirthHour}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {LUNAR_HOURS.map((h) => (
                        <SelectItem key={h.value} value={h.value} className="text-white hover:bg-slate-700">
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Giới tính</Label>
                  <RadioGroup
                    value={gender}
                    onValueChange={(v) => setGender(v as 'Nam' | 'Nữ')}
                    className="flex gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Nam" id="nam" />
                      <Label htmlFor="nam" className="text-gray-300 cursor-pointer">Nam</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Nữ" id="nu" />
                      <Label htmlFor="nu" className="text-gray-300 cursor-pointer">Nữ</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold"
                disabled={isLoading}
              >
                {isLoading ? 'Đang tính toán...' : '🔮 Lập Lá Số'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Chart display */}
        {chart && (
          <div className="space-y-6">
            <TuViChartIztro chart={chart} />
            
            {/* Luận giải chi tiết */}
            {accessLoading ? (
              <Card className="p-6 bg-surface-3 border-gold/20 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-gold mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Đang kiểm tra...</p>
              </Card>
            ) : hasPaid && isAnalyzing ? (
              <Card className="p-6 bg-surface-3 border-gold/20 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
                <p className="text-foreground font-semibold">✨ Đang luận giải lá số...</p>
                <p className="text-muted-foreground text-sm">AI đang phân tích 12 cung và các sao. Thường mất 15-30 giây.</p>
              </Card>
            ) : hasPaid && analysisError && !cachedAnalysis ? (
              <Card className="p-6 bg-surface-3 border-primary/30 text-center space-y-3">
                <div className="text-4xl">🔮</div>
                <p className="text-primary font-semibold">Lá số của bạn đã được mở khóa!</p>
                <p className="text-muted-foreground text-sm">Hệ thống AI đang bận, vui lòng thử lại sau ít phút.</p>
                <p className="text-muted-foreground text-xs">Quyền truy cập của bạn được bảo lưu vĩnh viễn.</p>
                <Button
                  variant="gold"
                  onClick={() => {
                    setAnalysisError(false);
                    loadAnalysis(chartHash || undefined);
                  }}
                >
                  🔄 Thử lại ngay
                </Button>
                <p className="text-muted-foreground text-xs">Nếu vẫn lỗi sau nhiều lần thử, vui lòng liên hệ hỗ trợ qua Zalo.</p>
              </Card>
            ) : cachedAnalysis ? (
              <div id="analysis-result" className="space-y-6">
                <ChartInterpretationDisplay chart={chart} />
                <Card className="p-6 bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20">
                  <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Luận giải chi tiết bởi AI
                  </h2>
                  <div className="space-y-1">
                    {renderAnalysisMarkdown(cachedAnalysis)}
                  </div>
                  <div className="mt-8 pt-4 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground mb-3">
                      Luận giải bởi AI · Dựa trên lá số tử vi
                    </p>
                    {reAnalysisCount < 2 ? (
                      <div className="space-y-2 text-center">
                        <div className="flex gap-3 justify-center">
                          <Button
                            variant="purple"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Bạn còn ${2 - reAnalysisCount} lần phân tích lại miễn phí. Tiếp tục?`)) return;
                              if (!chartHash || !user) return;
                              await (supabase.from('chart_analyses') as any)
                                .update({ analysis_result: null, re_analysis_count: reAnalysisCount + 1 })
                                .eq('chart_hash', chartHash)
                                .eq('user_id', user.id);
                              setReAnalysisCount(prev => prev + 1);
                              setCachedAnalysis(null);
                              loadAnalysis(chartHash);
                            }}
                          >
                            🔄 Phân tích lại
                          </Button>
                          <Button
                            variant="mystical"
                            size="sm"
                            onClick={() => setShowEditModal(true)}
                          >
                            ✏️ Sửa thông tin sinh
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Còn {2 - reAnalysisCount} lần chỉnh sửa/phân tích lại miễn phí
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">
                        Đã dùng hết lượt chỉnh sửa miễn phí. Liên hệ hỗ trợ qua Zalo nếu cần.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="relative">
                <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
                  <ChartInterpretationDisplay chart={chart} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
                  <Card className="max-w-sm w-full mx-4 p-6 text-center border-border bg-card shadow-xl">
                    <div className="text-4xl mb-3">🔮</div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Luận giải chi tiết lá số</h3>
                    <p className="text-2xl font-bold text-primary mb-2">29.000đ</p>
                    <p className="text-sm text-muted-foreground mb-5">
                      {personName ? `Luận giải chi tiết cho ${personName}.` : 'Xem đầy đủ luận giải 12 cung.'} AI phân tích chuyên sâu. Mua 1 lần, xem mãi mãi.
                    </p>
                    <Button
                      variant="gold"
                      size="lg"
                      className="w-full mb-3"
                      onClick={() => {
                        if (!user) {
                          window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
                          return;
                        }
                        setShowPayment(true);
                      }}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Mở khóa với QR
                    </Button>
                    <p className="text-xs text-muted-foreground">Thanh toán nhanh qua ngân hàng</p>
                  </Card>
                </div>
                <VietQRPaymentModal
                  open={showPayment}
                  onOpenChange={setShowPayment}
                  feature="luan_giai"
                  onSuccess={async () => {
                    setShowPayment(false);
                    await refreshAccess();
                    handlePaymentSuccess();
                  }}
                  metadata={{ chartHash, birthDate: format(birthDate, 'yyyy-MM-dd'), birthHour, gender, calendarType, personName, chartData: chart }}
                />
              </div>
            )}
            
            {/* NFT Preview */}
            <NFTPreview
              chartData={chart}
              walletAddress={address}
              birthData={{
                name: personName,
                solarDate: format(birthDate, 'yyyy-MM-dd'),
                hour: parseInt(birthHour),
                gender,
                isLunar: calendarType === 'lunar',
              }}
            />
            
            {/* Mint NFT */}
            <MintMenhNFT
              chartData={chart}
              birthData={{
                name: personName,
                solarDate: format(birthDate, 'yyyy-MM-dd'),
                hour: parseInt(birthHour),
                gender,
                isLunar: calendarType === 'lunar',
              }}
            />
            
            {/* Debug info */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">📋 Thông tin chi tiết (để so sánh với tuvi.vn)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-400 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-amber-300 mb-1">Thông tin chung:</p>
                    <p>• Năm sinh: {chart.lunarYear}</p>
                    <p>• Bản Mệnh: <span className="text-red-300 font-medium">{chart.napAm?.napAm || '—'}</span></p>
                    <p>• Ngũ Hành Mệnh: <span className="text-red-300">{chart.napAm?.element || '—'}</span></p>
                    <p>• Ngũ Hành Cục: <span className="text-cyan-300">{chart.cuc.name}</span></p>
                    <p>• Quan hệ Mệnh-Cục: <span className={chart.cucMenhRelation?.relation === 'tuong_khac' ? 'text-red-400' : 'text-green-400'}>
                      {chart.cucMenhRelation?.description || '—'}
                    </span></p>
                    <p>• Mệnh Chủ: <span className="text-purple-300">{chart.soulStar || '—'}</span></p>
                    <p>• Thân Chủ: <span className="text-green-300">{chart.bodyStar || '—'}</span></p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-300 mb-1">Tứ Hóa:</p>
                    <p>• Hóa Lộc: <span className="text-green-400">{chart.tuHoa.hoaLoc.star || '—'}</span> ({chart.tuHoa.hoaLoc.palace || '—'})</p>
                    <p>• Hóa Quyền: <span className="text-orange-400">{chart.tuHoa.hoaQuyen.star || '—'}</span> ({chart.tuHoa.hoaQuyen.palace || '—'})</p>
                    <p>• Hóa Khoa: <span className="text-blue-400">{chart.tuHoa.hoaKhoa.star || '—'}</span> ({chart.tuHoa.hoaKhoa.palace || '—'})</p>
                    <p>• Hóa Kỵ: <span className="text-red-400">{chart.tuHoa.hoaKy.star || '—'}</span> ({chart.tuHoa.hoaKy.palace || '—'})</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-700 pt-2">
                  <p className="font-semibold text-amber-300 mb-2">Vị trí các cung và chính tinh:</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {chart.palaces.map((palace) => (
                      <div 
                        key={palace.earthlyBranch}
                        className={`p-2 rounded text-[10px] ${
                          palace.isSoulPalace 
                            ? 'bg-yellow-900/30 border border-yellow-500/50' 
                            : palace.isBodyPalace 
                              ? 'bg-cyan-900/30 border border-cyan-500/50'
                              : 'bg-slate-800/50'
                        }`}
                      >
                        <div className="font-bold text-amber-200">
                          {palace.name} ({palace.earthlyBranch})
                          {palace.isSoulPalace && <span className="ml-1 text-yellow-400">★Mệnh</span>}
                          {palace.isBodyPalace && <span className="ml-1 text-cyan-400">★Thân</span>}
                        </div>
                        <div className="text-purple-300">
                          {palace.majorStars.length > 0 
                            ? palace.majorStars.map(s => s.name).join(', ')
                            : '(vô chính diệu)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Birth Info Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-primary/30 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-primary font-bold text-lg mb-4">
              ✏️ Sửa thông tin sinh
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Sẽ dùng 1 lượt chỉnh sửa miễn phí (còn {2 - reAnalysisCount} lượt)
            </p>

            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-sm mb-1 block">Họ tên</Label>
                <Input
                  value={editPersonName}
                  onChange={e => setEditPersonName(e.target.value)}
                  className="bg-surface-3 border-border"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-1 block">Ngày sinh</Label>
                <Input
                  type="date"
                  value={editBirthDate}
                  onChange={e => setEditBirthDate(e.target.value)}
                  className="bg-surface-3 border-border"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-1 block">Giờ sinh</Label>
                <Select value={editBirthHour} onValueChange={setEditBirthHour}>
                  <SelectTrigger className="bg-surface-3 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LUNAR_HOURS.map(h => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-1 block">Giới tính</Label>
                <Select value={editGender} onValueChange={setEditGender}>
                  <SelectTrigger className="bg-surface-3 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-1 block">Loại lịch</Label>
                <Select value={editCalendarType} onValueChange={setEditCalendarType}>
                  <SelectTrigger className="bg-surface-3 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solar">Dương lịch</SelectItem>
                    <SelectItem value="lunar">Âm lịch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </Button>
              <Button
                variant="purple"
                className="flex-1"
                onClick={handleEditAndReanalyze}
              >
                🔮 Lập lại & Luận giải
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
