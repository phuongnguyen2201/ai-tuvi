// src/pages/TuViIztroPage.tsx - Page lập lá số dùng iztro library

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createTuViChart, TuViChartData, BirthInput } from '@/services/TuViService';
import TuViChartIztro from '@/components/TuViChartIztro';
import ChartInterpretationDisplay from '@/components/ChartInterpretationDisplay';
import TuViAnalysis from '@/components/TuViAnalysis';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import PageLayout from '@/components/PageLayout';
import { MintMenhNFT } from '@/components/MintMenhNFT';
import { supabase } from '@/integrations/supabase/client';

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
  const [chart, setChart] = useState<TuViChartData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [birthDate, setBirthDate] = useState<Date>(new Date(1979, 9, 25));
  const [birthHour, setBirthHour] = useState('1');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');

  // Mint callback state
  const [searchParams, setSearchParams] = useSearchParams();
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');
  const [mintResult, setMintResult] = useState<any>(null);

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
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  
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
    } catch (err) {
      console.error('Error creating chart:', err);
      setError('Có lỗi xảy ra khi lập lá số. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <h1 className="text-3xl font-bold text-center text-amber-400">
          🔮 Lập Lá Số Tử Vi
        </h1>
        <p className="text-center text-gray-400 text-sm">
          Nhập thông tin ngày sinh để xem lá số tử vi của bạn
        </p>

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
        
        {/* Form nhập liệu */}
        <Card className="bg-slate-900/80 border-amber-600/30">
          <CardHeader>
            <CardTitle className="text-amber-300">Thông tin ngày sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
            
            {/* Luận giải tự động */}
            <ChartInterpretationDisplay chart={chart} />
            
            {/* AI-powered luận giải */}
            <TuViAnalysis chart={chart} />
            
            {/* Mint NFT */}
            <MintMenhNFT
              chartData={chart}
              birthData={{
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
    </PageLayout>
  );
}
