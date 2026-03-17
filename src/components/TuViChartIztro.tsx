// src/components/TuViChartIztro.tsx - Component hiển thị lá số dùng iztro

import React, { useState } from 'react';
import { TuViChartData, PalaceInfo, StarInfo } from '@/services/TuViService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getStarMeaning, StarMeaning } from '@/lib/tuvi/starMeanings';
import { getPalaceMeaning, PalaceMeaning } from '@/lib/tuvi/palaceMeanings';
interface Props {
  chart: TuViChartData;
}

// Layout 4x4 grid theo chuẩn Tử Vi
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

function getMutagenBgColor(mutagen: string): string {
  const m = mutagen.toLowerCase();
  if (m.includes('lộc') || m === 'loc') return 'bg-green-900/30 border-green-500/50';
  if (m.includes('quyền') || m === 'quyen') return 'bg-orange-900/30 border-orange-500/50';
  if (m.includes('khoa')) return 'bg-blue-900/30 border-blue-500/50';
  if (m.includes('kỵ') || m.includes('kị')) return 'bg-red-900/30 border-red-500/50';
  return 'bg-yellow-900/30 border-yellow-500/50';
}

// =============== PALACE DETAIL MODAL ===============

interface PalaceDetailModalProps {
  palace: PalaceInfo | null;
  open: boolean;
  onClose: () => void;
}

function StarItem({ star, colorClass, palaceName }: { star: StarInfo; colorClass: string; palaceName?: string }) {
  const meaning = getStarMeaning(star.name);
  const [showMeaning, setShowMeaning] = useState(false);
  
  // Lấy ý nghĩa theo cung nếu có
  const getPalaceMeaning = (m: StarMeaning, palace?: string): string | undefined => {
    if (!palace) return undefined;
    const palaceMap: Record<string, keyof StarMeaning> = {
      'Mệnh': 'inMenh',
      'Tài Bạch': 'inTaiBach',
      'Quan Lộc': 'inQuanLoc',
      'Phu Thê': 'inPhuThe',
    };
    const key = palaceMap[palace];
    return key ? (m[key] as string) : undefined;
  };
  
  return (
    <div className="space-y-1">
      <div 
        onClick={() => meaning && setShowMeaning(!showMeaning)}
        className={`flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700 ${meaning ? 'cursor-pointer hover:bg-slate-700/50' : ''}`}
      >
        <span className={`font-medium ${colorClass}`}>
          {star.name}
          {meaning && <span className="ml-1 text-[10px] text-gray-500">ⓘ</span>}
        </span>
        <div className="flex items-center gap-2">
          {star.brightness && (
            <span className="text-xs text-gray-500">{star.brightness}</span>
          )}
          {star.mutagen && (
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getMutagenBgColor(star.mutagen)} ${getMutagenColor(star.mutagen)}`}>
              {star.mutagen}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Hiển thị ý nghĩa khi click */}
      {showMeaning && meaning && (
        <div className="ml-2 p-2 rounded bg-slate-900/80 border border-slate-600 text-xs space-y-1.5">
          {/* Tính chất và ngũ hành */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
              meaning.nature === 'cát' ? 'bg-green-900/50 text-green-300 border-green-500/50' :
              meaning.nature === 'hung' ? 'bg-red-900/50 text-red-300 border-red-500/50' :
              'bg-gray-900/50 text-gray-300 border-gray-500/50'
            }`}>
              {meaning.nature === 'cát' ? '✨ Cát tinh' : meaning.nature === 'hung' ? '⚠️ Hung tinh' : '⚖️ Trung tính'}
            </Badge>
            {meaning.element && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-800 text-gray-300 border-slate-600">
                {meaning.element}
              </Badge>
            )}
          </div>
          
          {/* Từ khóa */}
          <div className="flex gap-1 flex-wrap">
            {meaning.keywords.map((kw, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-amber-900/30 text-amber-300 rounded text-[10px]">
                {kw}
              </span>
            ))}
          </div>
          
          {/* Ý nghĩa chung */}
          <p className="text-gray-300 leading-relaxed">{meaning.meaning}</p>
          
          {/* Ý nghĩa theo cung */}
          {palaceName && getPalaceMeaning(meaning, palaceName) && (
            <div className="pt-1 border-t border-slate-700">
              <p className="text-[10px] text-amber-400 mb-0.5">Tại cung {palaceName}:</p>
              <p className="text-gray-300 leading-relaxed">{getPalaceMeaning(meaning, palaceName)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PalaceDetailModal({ palace, open, onClose }: PalaceDetailModalProps) {
  if (!palace) return null;

  const totalStars = palace.majorStars.length + palace.minorStars.length + (palace.adjectiveStars?.length || 0);
  const palaceMeaning = getPalaceMeaning(palace.name);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 border-amber-600/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className={`text-xl ${palace.isSoulPalace ? 'text-yellow-400' : palace.isBodyPalace ? 'text-cyan-400' : 'text-amber-400'}`}>
              Cung {palace.name}
            </span>
            <span className="text-sm text-gray-500">({palace.earthlyBranch})</span>
            {palace.isSoulPalace && (
              <Badge className="bg-yellow-500/30 text-yellow-200 border-yellow-500/50">MỆNH</Badge>
            )}
            {palace.isBodyPalace && (
              <Badge className="bg-cyan-500/30 text-cyan-200 border-cyan-500/50">THÂN</Badge>
            )}
            {palace.isOriginalPalace && (
              <Badge className="bg-purple-500/30 text-purple-200 border-purple-500/50">LAI NHÂN</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Ý nghĩa cung */}
            {palaceMeaning && (
              <div className="p-3 bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-600/40 rounded-lg space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  {palaceMeaning.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-800/50 text-amber-200 rounded text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{palaceMeaning.meaning}</p>
                
                <div className="pt-2 border-t border-amber-600/30">
                  <p className="text-xs text-amber-400 mb-1.5">📋 Cung này chi phối:</p>
                  <ul className="text-xs text-gray-400 space-y-0.5 list-disc list-inside">
                    {palaceMeaning.aspects.slice(0, 4).map((aspect, i) => (
                      <li key={i}>{aspect}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-2 border-t border-amber-600/30">
                  <p className="text-xs text-cyan-400 mb-1.5">❓ Câu hỏi thường gặp:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {palaceMeaning.questions.map((q, i) => (
                      <span key={i} className="px-2 py-0.5 bg-cyan-900/30 text-cyan-300 rounded text-[10px] italic">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Thống kê */}
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded">
                {palace.majorStars.length} chính tinh
              </span>
              <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded">
                {palace.minorStars.length} phụ tinh
              </span>
              <span className="px-2 py-1 bg-orange-900/30 text-orange-300 rounded">
                {palace.adjectiveStars?.length || 0} tạp diệu
              </span>
            </div>

            {/* Thần Sát 12 thần */}
            <div className="grid grid-cols-2 gap-2">
              {palace.changsheng12 && (
                <div className="p-2 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Trường Sinh:</span>
                  <span className="text-amber-300 font-medium text-sm">{palace.changsheng12}</span>
                </div>
              )}
              {palace.boshi12 && (
                <div className="p-2 bg-cyan-900/20 border border-cyan-600/30 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Bác Sĩ:</span>
                  <span className="text-cyan-300 font-medium text-sm">{palace.boshi12}</span>
                </div>
              )}
              {palace.jiangqian12 && (
                <div className="p-2 bg-pink-900/20 border border-pink-600/30 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Tướng Tiền:</span>
                  <span className="text-pink-300 font-medium text-sm">{palace.jiangqian12}</span>
                </div>
              )}
              {palace.suiqian12 && (
                <div className="p-2 bg-indigo-900/20 border border-indigo-600/30 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Tuế Tiền:</span>
                  <span className="text-indigo-300 font-medium text-sm">{palace.suiqian12}</span>
                </div>
              )}
            </div>

            {/* Chính Tinh */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Chính Tinh ({palace.majorStars.length})
              </h4>
              {palace.majorStars.length > 0 ? (
                <div className="space-y-1.5">
                  {palace.majorStars.map((star, i) => (
                    <StarItem key={`major-${i}`} star={star} colorClass="text-purple-300" palaceName={palace.name} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic pl-4">(Vô chính diệu)</p>
              )}
            </div>

            {/* Phụ Tinh */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-green-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Phụ Tinh ({palace.minorStars.length})
              </h4>
              {palace.minorStars.length > 0 ? (
                <div className="space-y-1.5">
                  {palace.minorStars.map((star, i) => (
                    <StarItem key={`minor-${i}`} star={star} colorClass="text-green-300" palaceName={palace.name} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic pl-4">(Không có)</p>
              )}
            </div>

            {/* Tạp Diệu */}
            {palace.adjectiveStars && palace.adjectiveStars.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-orange-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Tạp Diệu ({palace.adjectiveStars.length})
                </h4>
                <div className="space-y-1.5">
                  {palace.adjectiveStars.map((star, i) => (
                    <StarItem key={`adj-${i}`} star={star} colorClass="text-orange-300" palaceName={palace.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Đại Hạn & Tiểu Hạn */}
            {(palace.stage || palace.ages) && (
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-teal-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Vận Hạn
                </h4>
                {palace.stage && (
                  <div className="p-2 bg-teal-900/20 border border-teal-600/30 rounded-lg">
                    <span className="text-[10px] text-gray-400 block">Đại Hạn (10 năm):</span>
                    <span className="text-teal-300 font-medium">
                      {palace.stage.range[0]} - {palace.stage.range[1]} tuổi
                      <span className="text-gray-500 ml-1">({palace.stage.heavenlyStem})</span>
                    </span>
                  </div>
                )}
                {palace.ages && palace.ages.length > 0 && (
                  <div className="p-2 bg-slate-800/50 border border-slate-600/30 rounded-lg">
                    <span className="text-[10px] text-gray-400 block">Tiểu Hạn (tuổi):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {palace.ages.map((age, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-700 text-gray-300 text-xs rounded">
                          {age}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="pt-2 border-t border-slate-700 text-center">
          <span className="text-xs text-gray-500">
            Tổng cộng: {totalStars} sao trong cung
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============== PALACE CELL ===============

interface PalaceCellProps {
  palace: PalaceInfo;
  isActiveDaiHan?: boolean;
  onClick: () => void;
}

function PalaceCell({ palace, isActiveDaiHan, onClick }: PalaceCellProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        relative p-1 sm:p-2 border rounded-lg min-h-[100px] sm:min-h-[140px] flex flex-col cursor-pointer
        transition-all duration-200 hover:scale-[1.02] overflow-hidden
        ${palace.isSoulPalace 
          ? 'border-yellow-400 border-2 bg-gradient-to-br from-yellow-900/40 to-amber-900/30' 
          : palace.isBodyPalace
            ? 'border-cyan-400 border-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/20'
            : isActiveDaiHan
              ? 'border-teal-400 border-2 bg-gradient-to-br from-teal-900/30 to-emerald-900/20'
              : 'border-amber-600/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80'
        }
        hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10
        ${isActiveDaiHan ? 'ring-1 ring-teal-400/30' : ''}
      `}
    >
      {/* Đại Hạn */}
      {palace.stage && (
        <div className={`text-[8px] sm:text-[10px] text-center rounded px-0.5 sm:px-1 py-0.5 mb-0.5 sm:mb-1 truncate ${
          isActiveDaiHan
            ? 'bg-teal-500/30 text-teal-200 font-semibold'
            : 'text-muted-foreground bg-muted/50'
        }`}>
          {palace.stage.heavenlyStem} {palace.stage.range[0]}-{palace.stage.range[1]}
          {isActiveDaiHan && ' ◀'}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
        <span className="text-[9px] sm:text-xs text-amber-300/80 font-medium">{palace.earthlyBranch}</span>
        <div className="flex gap-0.5">
          {palace.isSoulPalace && (
            <Badge variant="outline" className="px-0.5 sm:px-1 py-0 text-[7px] sm:text-[9px] bg-yellow-500/30 text-yellow-200 border-yellow-500/50">
              MỆNH
            </Badge>
          )}
          {palace.isBodyPalace && (
            <Badge variant="outline" className="px-0.5 sm:px-1 py-0 text-[7px] sm:text-[9px] bg-cyan-500/30 text-cyan-200 border-cyan-500/50">
              THÂN
            </Badge>
          )}
        </div>
      </div>
      
      {/* Palace name */}
      <div className={`text-[13px] sm:text-sm font-bold sm:font-semibold text-center mb-0.5 sm:mb-1 truncate ${
        palace.isSoulPalace ? 'text-yellow-300' : palace.isBodyPalace ? 'text-cyan-300' : 'text-amber-200'
      }`}>
        {palace.name}
      </div>
      
      {/* Major stars */}
      <div className="flex flex-col gap-0.5 mb-0.5 sm:mb-1">
        {palace.majorStars.length > 0 ? (
          palace.majorStars.map((star, i) => (
            <div key={i} className="text-[11px] sm:text-xs font-bold text-center py-0.5 px-0.5 sm:px-1 rounded bg-purple-900/40 text-purple-300 truncate">
              {star.name}
              {star.mutagen && (
                <span className={`ml-0.5 sm:ml-1 text-[8px] sm:text-[10px] ${getMutagenColor(star.mutagen)}`}>
                  ({star.mutagen})
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-[8px] sm:text-[10px] text-gray-500 text-center italic">
            (Vô chính diệu)
          </div>
        )}
      </div>
      
      {/* Minor stars + Adjective stars */}
      <div className="flex-1 text-[7px] sm:text-[9px] overflow-hidden border-t border-amber-600/20 pt-0.5 sm:pt-1 mt-0.5 sm:mt-1 space-y-0.5">
        {/* Phụ tinh - màu xanh lá */}
        {palace.minorStars.length > 0 && (
          <div className="flex flex-wrap gap-x-0.5 sm:gap-x-1 gap-y-0 justify-center">
            {palace.minorStars.slice(0, 4).map((star, i) => (
              <span key={`minor-${i}`} className="truncate max-w-full text-green-400">
                {star.name}
                {star.mutagen && (
                  <span className={`ml-0.5 ${getMutagenColor(star.mutagen)}`}>
                    ({star.mutagen})
                  </span>
                )}
              </span>
            ))}
            {palace.minorStars.length > 4 && (
              <span className="text-green-600">+{palace.minorStars.length - 4}</span>
            )}
          </div>
        )}
        
        {/* Tạp diệu - màu cam/đỏ */}
        {palace.adjectiveStars && palace.adjectiveStars.length > 0 && (
          <div className="flex flex-wrap gap-x-0.5 sm:gap-x-1 gap-y-0 justify-center">
            {palace.adjectiveStars.slice(0, 3).map((star, i) => (
              <span key={`adj-${i}`} className="truncate max-w-full text-orange-400">
                {star.name}
              </span>
            ))}
            {palace.adjectiveStars.length > 3 && (
              <span className="text-orange-600">+{palace.adjectiveStars.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Click hint */}
      <div className="absolute bottom-1 right-1 text-[8px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Chi tiết →
      </div>
    </div>
  );
}

// =============== CENTER INFO ===============

function CenterInfo({ chart }: { chart: TuViChartData }) {
  // Color mapping for elements
  const elementColors: Record<string, string> = {
    'Kim': 'text-yellow-300',
    'Mộc': 'text-green-300',
    'Thủy': 'text-blue-300',
    'Hỏa': 'text-red-300',
    'Thổ': 'text-amber-300',
  };
  
  const relationColors: Record<string, string> = {
    'tuong_sinh': 'text-green-400 bg-green-900/30',
    'tuong_khac': 'text-red-400 bg-red-900/30',
    'binh_hoa': 'text-yellow-400 bg-yellow-900/30',
  };

  return (
    <div className="col-span-2 row-span-2 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-xl p-3 gap-1">
      <div className="text-xl font-bold text-amber-400 tracking-wider mb-1">
        紫微斗數
      </div>
      
      <div className="text-center space-y-0.5 w-full">
        <p className="text-xs text-gray-300">
          <span className="text-gray-500">Năm:</span> {chart.lunarYear}
        </p>
        <p className="text-xs text-gray-300">
          <span className="text-gray-500">Giờ:</span> {chart.birthHour} ({chart.timeRange}) • {chart.genderYinYang}
        </p>
        {/* Sign & Zodiac */}
        <p className="text-xs text-gray-400">
          🐾 {chart.zodiac} • ♈ {chart.sign}
        </p>
        
        {/* Nạp Âm - Bản Mệnh */}
        <div className="mt-1 pt-1 border-t border-amber-600/20">
          <p className="text-[10px] text-gray-500 mb-0.5">Bản Mệnh (Nạp Âm):</p>
          <p className={`text-sm font-bold ${elementColors[chart.napAm?.element] || 'text-white'}`}>
            {chart.napAm?.napAm || '—'}
          </p>
          <p className="text-[10px] text-gray-400">({chart.napAm?.meaning})</p>
          
          {/* Màu và Hướng may mắn */}
          {chart.napAm && (
            <div className="mt-1 grid grid-cols-2 gap-1 text-[9px]">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">🎨</span>
                <span className="text-gray-300">{chart.napAm.color}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">🧭</span>
                <span className="text-gray-300">{chart.napAm.direction}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Cục */}
        <div className="mt-1 pt-1 border-t border-amber-600/20">
          <p className="text-sm font-semibold text-cyan-300">
            {chart.cuc.name}
          </p>
        </div>
        
        {/* Quan hệ Mệnh - Cục */}
        {chart.cucMenhRelation && (
          <div className={`mt-1 p-1.5 rounded text-[10px] ${relationColors[chart.cucMenhRelation.relation] || ''}`}>
            <p className="font-medium">
              Mệnh {chart.cucMenhRelation.menhElement} {chart.cucMenhRelation.relation === 'tuong_khac' ? '⚔️' : chart.cucMenhRelation.relation === 'tuong_sinh' ? '✨' : '⚖️'} Cục {chart.cucMenhRelation.cucElement}
            </p>
            <p className="text-[9px] opacity-80">{chart.cucMenhRelation.description}</p>
          </div>
        )}
      </div>
      
      {/* Tứ Hóa */}
      <div className="mt-1 pt-1 border-t border-amber-600/30 w-full">
        <p className="text-[10px] text-gray-400 text-center mb-0.5">Tứ Hóa:</p>
        <div className="grid grid-cols-2 gap-0.5 text-[10px]">
          <span className="text-green-400">Lộc: {chart.tuHoa.hoaLoc.star || '—'}</span>
          <span className="text-orange-400">Quyền: {chart.tuHoa.hoaQuyen.star || '—'}</span>
          <span className="text-blue-400">Khoa: {chart.tuHoa.hoaKhoa.star || '—'}</span>
          <span className="text-red-400">Kỵ: {chart.tuHoa.hoaKy.star || '—'}</span>
        </div>
      </div>
    </div>
  );
}

// =============== MAIN COMPONENT ===============

export function TuViChartIztro({ chart }: Props) {
  const [selectedPalace, setSelectedPalace] = useState<PalaceInfo | null>(null);

  // Calculate current age (tuổi âm lịch ≈ year diff + 1) from solarDate
  const birthYear = parseInt(chart.solarDate?.split('-')[0] || chart.solarDate?.split('/')[0] || '0');
  const currentAge = birthYear > 0 ? new Date().getFullYear() - birthYear + 1 : 0;

  // Map earthly branch to palace
  const palaceMap = new Map<string, PalaceInfo>();
  chart.palaces.forEach(p => palaceMap.set(p.earthlyBranch, p));
  
  return (
    <>
      <Card className="w-full max-w-4xl mx-auto bg-slate-900/90 border-amber-600/30">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl text-amber-400">
            Lá Số Tử Vi - {chart.lunarYear}
          </CardTitle>
          <p className="text-sm text-gray-400">
            {chart.solarDate} (DL) | {chart.lunarDate} (ÂL) • Click vào cung để xem chi tiết
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
                
                const isActive = !!(palace.stage && currentAge >= palace.stage.range[0] && currentAge <= palace.stage.range[1]);
                
                return (
                  <PalaceCell 
                    key={`palace-${branch}`} 
                    palace={palace}
                    isActiveDaiHan={isActive}
                    onClick={() => setSelectedPalace(palace)}
                  />
                );
              })
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-500"></span>
              <span className="text-gray-400">Chính tinh</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span className="text-gray-400">Phụ tinh</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-orange-500"></span>
              <span className="text-gray-400">Tạp diệu</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-yellow-400 bg-yellow-900/30"></span>
              <span className="text-gray-400">Cung Mệnh</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-cyan-400 bg-cyan-900/30"></span>
              <span className="text-gray-400">Cung Thân</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-teal-400 bg-teal-900/30"></span>
              <span className="text-gray-400">Đại Hạn hiện tại</span>
            </div>
          </div>
          
          {/* Tứ Hóa Legend */}
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs border-t border-slate-700 pt-2">
            <span className="text-gray-500">Tứ Hóa:</span>
            <span className="text-green-400">Lộc</span>
            <span className="text-orange-400">Quyền</span>
            <span className="text-blue-400">Khoa</span>
            <span className="text-red-400">Kỵ</span>
          </div>
        </CardContent>
      </Card>

      {/* Palace Detail Modal */}
      <PalaceDetailModal 
        palace={selectedPalace}
        open={!!selectedPalace}
        onClose={() => setSelectedPalace(null)}
      />
    </>
  );
}

export default TuViChartIztro;
