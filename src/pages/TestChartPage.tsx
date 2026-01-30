import React, { useState, useEffect } from 'react';
import TuViChartDisplay from '@/components/TuViChartDisplay';
import { 
  createTuViChart, 
  type TuViChart,
  type BirthInfo,
  DIA_BAN,
} from '@/lib/tuvi/tuviChart';
import { solarToLunar, getBirthHour, THIEN_CAN, DIA_CHI, CANH_GIO } from '@/lib/tuvi/lunarCalendar';
import { getNguHanhNapAm } from '@/lib/tuvi/nguHanh';

export default function TestChartPage() {
  const [chart, setChart] = useState<TuViChart | null>(null);
  const [birthInfoDisplay, setBirthInfoDisplay] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [solarDay, setSolarDay] = useState(25);
  const [solarMonth, setSolarMonth] = useState(10);
  const [solarYear, setSolarYear] = useState(1979);
  const [birthHour, setBirthHour] = useState(1); // 1:30 AM
  
  const generateChart = () => {
    try {
      setError(null);
      
      // Convert solar to lunar using solarToLunar
      const solarDate = new Date(solarYear, solarMonth - 1, solarDay);
      const lunar = solarToLunar(solarDate);
      
      // Get birth hour info
      const birthHourInfo = getBirthHour(birthHour);
      const birthHourIndex = birthHourInfo.index;
      
      // Calculate Can Chi indices from lunar year
      const canNamIndex = ((lunar.year - 4) % 10 + 10) % 10;
      const chiNamIndex = ((lunar.year - 4) % 12 + 12) % 12;
      
      // Create birth info
      const birthInfo: BirthInfo = {
        lunarDay: lunar.day,
        lunarMonth: lunar.month,
        lunarYear: lunar.year,
        birthHourIndex,
        canNamIndex: canNamIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        chiNamIndex,
        gender: 'male',
      };
      
      // Generate chart
      const newChart = createTuViChart(birthInfo);
      setChart(newChart);
      
      // Get Ngu Hanh Nap Am
      const canName = THIEN_CAN[canNamIndex].name;
      const chiName = DIA_CHI[chiNamIndex].name;
      const napAm = getNguHanhNapAm(canName, chiName);
      
      // Get Can Chi name
      const canChiName = `${canName} ${chiName}`;
      
      // Set display info
      setBirthInfoDisplay({
        canChi: canChiName,
        nguHanh: napAm?.name || 'N/A',
        napAm: napAm?.napAm || 'N/A',
        lunarDate: `${lunar.day}/${lunar.month}/${lunar.year}`,
        birthHour: birthHourInfo.description,
      });
      
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      console.error(err);
    }
  };
  
  // Generate on mount with default values
  useEffect(() => {
    generateChart();
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-amber-400 mb-8">
          🔮 Test Lá Số Tử Vi
        </h1>
        
        {/* Input Form */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-amber-600/30">
          <h2 className="text-lg font-semibold text-amber-300 mb-4">Nhập thông tin ngày sinh</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ngày (DL)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={solarDay}
                onChange={(e) => setSolarDay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tháng (DL)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={solarMonth}
                onChange={(e) => setSolarMonth(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Năm (DL)</label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={solarYear}
                onChange={(e) => setSolarYear(parseInt(e.target.value) || 1979)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Giờ sinh (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={birthHour}
                onChange={(e) => setBirthHour(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>
          
          <button
            onClick={generateChart}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
          >
            Lập Lá Số
          </button>
        </div>
        
        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* Chart Summary */}
        {chart && (
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-amber-600/30">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">Thông tin lá số</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Cục:</span>
                <div className="font-semibold text-cyan-300">{chart.cucName}</div>
              </div>
              <div>
                <span className="text-gray-400">Cung Mệnh:</span>
                <div className="font-semibold text-yellow-300">
                  {chart.cung.find(c => c.isMenh)?.diaChi || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Cung Thân:</span>
                <div className="font-semibold text-cyan-300">
                  {chart.cung.find(c => c.isThan)?.diaChi || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Tử Vi tại:</span>
                <div className="font-semibold text-purple-300">
                  {chart.cung.find(c => c.chinhTinh.some(s => s.id === 'tu-vi'))?.diaChi || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Chart Display */}
        {chart && birthInfoDisplay && (
          <TuViChartDisplay 
            chart={chart} 
            birthInfo={birthInfoDisplay}
            onCungClick={(cung) => console.log('Clicked cung:', cung)}
          />
        )}
        
        {/* Debug Info */}
        {chart && (
          <details className="mt-8 bg-slate-800/30 rounded-lg p-4">
            <summary className="cursor-pointer text-gray-400 hover:text-white">
              Debug Info (Click to expand)
            </summary>
            <pre className="mt-4 text-xs text-gray-400 overflow-auto">
              {JSON.stringify({ chart, birthInfoDisplay }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
