// src/components/TuViChartIztro.tsx - Component hiển thị lá số dùng iztro

import React from 'react';
import { TuViChartData, PalaceInfo } from '@/services/TuViService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  chart: TuViChartData;
}

// Layout 4x4 grid theo chuẩn Tử Vi
// Row 0: Tỵ, Ngọ, Mùi, Thân
// Row 1: Thìn, [center], [center], Dậu
// Row 2: Mão, [center], [center], Tuất
// Row 3: Dần, Sửu, Tý, Hợi

const GRID_LAYOUT: (string | null)[][] = [
  ['Tỵ', 'Ngọ', 'Mùi', 'Thân'],
  ['Thìn', null, null, 'Dậu'],
  ['Mão', null, null, 'Tuất'],
  ['Dần', 'Sửu', 'Tý', 'Hợi'],
];

function getMutagenColor(mutagen: string): string {
  const m = mutagen.toLowerCase();
  if (m.includes('lộc') || m === 'loc') return 'text-green-400';
  if (m.includes('quyền') || m === 'quyen') return 'text-orange-400';
  if (m.includes('khoa')) return 'text-blue-400';
  if (m.includes('kỵ') || m.includes('kị')) return 'text-red-400';
  return 'text-yellow-400';
}

function PalaceCell({ palace }: { palace: PalaceInfo }) {
  return (
    <div 
      className={`
        relative p-2 border rounded-lg min-h-[140px] flex flex-col
        transition-all duration-200 hover:scale-[1.02]
        ${palace.isSoulPalace 
          ? 'border-yellow-400 border-2 bg-gradient-to-br from-yellow-900/40 to-amber-900/30' 
          : palace.isBodyPalace
            ? 'border-cyan-400 border-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/20'
            : 'border-amber-600/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80'
        }
        hover:border-amber-400
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs text-amber-300/80 font-medium">{palace.earthlyBranch}</span>
        <div className="flex gap-1">
          {palace.isSoulPalace && (
            <Badge variant="outline" className="px-1 py-0 text-[9px] bg-yellow-500/30 text-yellow-200 border-yellow-500/50">
              MỆNH
            </Badge>
          )}
          {palace.isBodyPalace && (
            <Badge variant="outline" className="px-1 py-0 text-[9px] bg-cyan-500/30 text-cyan-200 border-cyan-500/50">
              THÂN
            </Badge>
          )}
        </div>
      </div>
      
      {/* Palace name */}
      <div className={`text-sm font-semibold text-center mb-1 ${
        palace.isSoulPalace ? 'text-yellow-300' : palace.isBodyPalace ? 'text-cyan-300' : 'text-amber-200'
      }`}>
        {palace.name}
      </div>
      
      {/* Major stars */}
      <div className="flex flex-col gap-0.5 mb-1">
        {palace.majorStars.length > 0 ? (
          palace.majorStars.map((star, i) => (
            <div key={i} className="text-xs font-bold text-center py-0.5 px-1 rounded bg-purple-900/40 text-purple-300">
              {star.name}
              {star.mutagen && (
                <span className={`ml-1 text-[10px] ${getMutagenColor(star.mutagen)}`}>
                  ({star.mutagen})
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-[10px] text-gray-500 text-center italic">
            (Vô chính diệu)
          </div>
        )}
      </div>
      
      {/* Minor stars (first 4) */}
      <div className="flex-1 text-[9px] text-gray-400 overflow-y-auto border-t border-amber-600/20 pt-1 mt-1">
        <div className="flex flex-wrap gap-x-1 gap-y-0.5 justify-center">
          {palace.minorStars.slice(0, 4).map((star, i) => (
            <span key={i} className="whitespace-nowrap">
              {star.name}
              {star.mutagen && (
                <span className={`ml-0.5 ${getMutagenColor(star.mutagen)}`}>
                  ({star.mutagen})
                </span>
              )}
            </span>
          ))}
          {palace.minorStars.length > 4 && (
            <span className="text-gray-500">+{palace.minorStars.length - 4}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CenterInfo({ chart }: { chart: TuViChartData }) {
  return (
    <div className="col-span-2 row-span-2 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-xl p-4 gap-2">
      <div className="text-2xl font-bold text-amber-400 tracking-wider mb-2">
        紫微斗數
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-300">
          <span className="text-gray-500">Năm:</span> {chart.lunarYear}
        </p>
        <p className="text-sm text-gray-300">
          <span className="text-gray-500">Giờ:</span> {chart.birthHour}
        </p>
        <p className="text-sm text-gray-300">
          <span className="text-gray-500">Giới tính:</span> {chart.genderYinYang}
        </p>
        <p className="text-sm font-semibold text-cyan-300">
          <span className="text-gray-500">Cục:</span> {chart.cuc.name}
        </p>
      </div>
      
      {/* Tứ Hóa */}
      <div className="mt-2 pt-2 border-t border-amber-600/30 w-full">
        <p className="text-xs text-gray-400 text-center mb-1">Tứ Hóa:</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-green-400">Lộc: {chart.tuHoa.hoaLoc.star || '—'}</span>
          <span className="text-orange-400">Quyền: {chart.tuHoa.hoaQuyen.star || '—'}</span>
          <span className="text-blue-400">Khoa: {chart.tuHoa.hoaKhoa.star || '—'}</span>
          <span className="text-red-400">Kỵ: {chart.tuHoa.hoaKy.star || '—'}</span>
        </div>
      </div>
    </div>
  );
}

export function TuViChartIztro({ chart }: Props) {
  // Map earthly branch to palace
  const palaceMap = new Map<string, PalaceInfo>();
  chart.palaces.forEach(p => palaceMap.set(p.earthlyBranch, p));
  
  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-900/90 border-amber-600/30">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-amber-400">
          Lá Số Tử Vi - {chart.lunarYear}
        </CardTitle>
        <p className="text-sm text-gray-400">
          {chart.solarDate} (DL) | {chart.lunarDate} (ÂL)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {GRID_LAYOUT.map((row, rowIndex) => (
            row.map((branch, colIndex) => {
              // Center cells
              if (branch === null) {
                if (rowIndex === 1 && colIndex === 1) {
                  return <CenterInfo key={`center-${rowIndex}-${colIndex}`} chart={chart} />;
                }
                return null; // Other center cells are part of the span
              }
              
              const palace = palaceMap.get(branch);
              if (!palace) {
                return (
                  <div 
                    key={`empty-${rowIndex}-${colIndex}`} 
                    className="min-h-[140px] border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600"
                  >
                    {branch}
                  </div>
                );
              }
              
              return <PalaceCell key={`palace-${branch}`} palace={palace} />;
            })
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500"></span>
            <span className="text-gray-400">Hóa Lộc</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-orange-500"></span>
            <span className="text-gray-400">Hóa Quyền</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-gray-400">Hóa Khoa</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-gray-400">Hóa Kỵ</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-yellow-400 bg-yellow-900/30"></span>
            <span className="text-gray-400">Cung Mệnh</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-cyan-400 bg-cyan-900/30"></span>
            <span className="text-gray-400">Cung Thân</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TuViChartIztro;
