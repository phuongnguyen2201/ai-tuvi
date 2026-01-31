'use client';

import React, { useState } from 'react';
import type { TuViChart, Cung, ChinhTinh, PhuTinhInCung } from '@/lib/tuvi/tuviChart';
import { DIA_BAN, CHINH_TINH } from '@/lib/tuvi/tuviChart';

// ========================= INTERFACES =========================

interface TuViChartDisplayProps {
  chart: TuViChart;
  birthInfo: {
    canChi: string;        // "Kỷ Mùi"
    nguHanh: string;       // "Thiên Thượng Hỏa"
    napAm: string;         // "Thiên Thượng Hỏa"
    lunarDate: string;     // "5/9/1979"
    birthHour: string;     // "Giờ Sửu"
  };
  onCungClick?: (cung: Cung) => void;
}

interface CungCellProps {
  cung: Cung;
  isHighlighted?: boolean;
  onClick?: () => void;
}

interface CenterInfoProps {
  birthInfo: TuViChartDisplayProps['birthInfo'];
  cucName: string;
}

interface StarModalProps {
  cung: Cung | null;
  onClose: () => void;
}

// ========================= HELPER FUNCTIONS =========================

/**
 * Get color class for a star based on its group
 */
function getStarColorClass(star: ChinhTinh): string {
  if (star.group === 'TuVi') {
    return 'text-purple-400'; // Tử Vi hệ - màu tím
  } else {
    return 'text-cyan-400'; // Thiên Phủ hệ - màu xanh
  }
}

/**
 * Get star nature badge color
 */
function getNatureBadgeClass(nature: ChinhTinh['nature']): string {
  switch (nature) {
    case 'cát':
      return 'bg-green-600/30 text-green-300';
    case 'hung':
      return 'bg-red-600/30 text-red-300';
    default:
      return 'bg-gray-600/30 text-gray-300';
  }
}

/**
 * Get color class for PhuTinh based on its nature
 */
function getPhuTinhColorClass(nature: 'cát' | 'hung' | 'trung_tính'): string {
  switch (nature) {
    case 'cát':
      return 'text-green-400';
    case 'hung':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get background class for PhuTinh based on its category
 */
function getPhuTinhBgClass(category: string): string {
  switch (category) {
    case 'truong_sinh':
      return 'bg-amber-900/20';
    case 'loc_ton':
      return 'bg-yellow-900/20';
    case 'thai_tue':
      return 'bg-blue-900/20';
    default:
      return 'bg-slate-800/50';
  }
}

/**
 * Map địa bàn position (0-11) to grid position
 * Layout truyền thống:
 * Row 0: Tỵ(3), Ngọ(4), Mùi(5), Thân(6)
 * Row 1: Thìn(2), [center], [center], Dậu(7)
 * Row 2: Mão(1), [center], [center], Tuất(8)
 * Row 3: Dần(0), Sửu(11), Tý(10), Hợi(9)
 */
const POSITION_TO_GRID: Record<number, { row: number; col: number }> = {
  3: { row: 0, col: 0 },   // Tỵ
  4: { row: 0, col: 1 },   // Ngọ
  5: { row: 0, col: 2 },   // Mùi
  6: { row: 0, col: 3 },   // Thân
  2: { row: 1, col: 0 },   // Thìn
  7: { row: 1, col: 3 },   // Dậu
  1: { row: 2, col: 0 },   // Mão
  8: { row: 2, col: 3 },   // Tuất
  0: { row: 3, col: 0 },   // Dần
  11: { row: 3, col: 1 },  // Sửu
  10: { row: 3, col: 2 },  // Tý
  9: { row: 3, col: 3 },   // Hợi
};

// ========================= SUB-COMPONENTS =========================

/**
 * Individual Cung Cell Component
 */
function CungCell({ cung, isHighlighted, onClick }: CungCellProps) {
  const isMenh = cung.isMenh;
  const isThan = cung.isThan;
  
  // Phân loại phụ tinh: Cát (tốt) và Hung (xấu)
  const catTinh = cung.phuTinh?.filter(pt => pt.nature === 'cát') || [];
  const hungTinh = cung.phuTinh?.filter(pt => pt.nature === 'hung') || [];
  const trungTinh = cung.phuTinh?.filter(pt => pt.nature === 'trung_tính') || [];
  
  return (
    <div
      onClick={onClick}
      className={`
        relative p-2 border rounded-lg cursor-pointer
        transition-all duration-200 hover:scale-[1.02]
        min-h-[160px] flex flex-col
        ${isMenh 
          ? 'border-yellow-400 border-2 bg-gradient-to-br from-yellow-900/40 to-amber-900/30' 
          : isThan
            ? 'border-cyan-400 border-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/20'
            : 'border-amber-600/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80'
        }
        ${isHighlighted ? 'ring-2 ring-yellow-300' : ''}
        hover:border-amber-400
      `}
    >
      {/* Địa Chi - Top Left */}
      <div className="absolute top-1 left-2 text-xs text-amber-300/80 font-medium">
        {cung.diaChi}
      </div>
      
      {/* Badges - Top Right */}
      <div className="absolute top-1 right-2 flex gap-1">
        {isMenh && (
          <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/30 text-yellow-200 rounded font-bold">
            MỆNH
          </span>
        )}
        {isThan && (
          <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/30 text-cyan-200 rounded font-bold">
            THÂN
          </span>
        )}
      </div>
      
      {/* Tên Cung - Center Top */}
      <div className="text-center mt-4 mb-1">
        <span className={`
          text-sm font-semibold
          ${isMenh ? 'text-yellow-300' : isThan ? 'text-cyan-300' : 'text-amber-200'}
        `}>
          {cung.name}
        </span>
      </div>
      
      {/* Chính Tinh List */}
      <div className="flex flex-col gap-0.5 mb-1">
        {cung.chinhTinh.length > 0 ? (
          cung.chinhTinh.map((star) => (
            <div
              key={star.id}
              className={`
                text-xs font-bold text-center py-0.5 px-1 rounded
                ${getStarColorClass(star)}
                ${star.group === 'TuVi' ? 'bg-purple-900/40' : 'bg-cyan-900/40'}
              `}
            >
              {star.name}
            </div>
          ))
        ) : (
          <div className="text-[10px] text-gray-500 text-center italic">
            (Vô chính diệu)
          </div>
        )}
      </div>
      
      {/* Phụ Tinh - 2 columns: Cát (left) vs Hung (right) */}
      {(catTinh.length > 0 || hungTinh.length > 0 || trungTinh.length > 0) && (
        <div className="flex-1 grid grid-cols-2 gap-x-1 text-[9px] overflow-y-auto border-t border-amber-600/20 pt-1 mt-1">
          {/* Left column - Cát tinh (Tốt) */}
          <div className="space-y-0.5">
            {catTinh.slice(0, 6).map((pt) => (
              <div key={pt.id} className="text-green-400 truncate">
                {pt.name}
              </div>
            ))}
            {trungTinh.slice(0, 3).map((pt) => (
              <div key={pt.id} className="text-gray-400 truncate">
                {pt.name}
              </div>
            ))}
          </div>
          
          {/* Right column - Hung tinh (Xấu) */}
          <div className="space-y-0.5 text-right">
            {hungTinh.slice(0, 6).map((pt) => (
              <div key={pt.id} className="text-red-400 truncate">
                {pt.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Center Info Component - Hiển thị thông tin ở giữa lá số
 */
function CenterInfo({ birthInfo, cucName }: CenterInfoProps) {
  return (
    <div className="
      col-span-2 row-span-2 
      flex flex-col items-center justify-center
      bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
      border-2 border-amber-500/30 rounded-xl
      p-4 gap-2
    ">
      {/* Title */}
      <div className="text-lg font-bold text-amber-400 tracking-wider mb-2">
        LÁ SỐ TỬ VI
      </div>
      
      {/* Can Chi */}
      <div className="text-center">
        <span className="text-xs text-gray-400">Năm sinh:</span>
        <div className="text-xl font-bold text-yellow-300">{birthInfo.canChi}</div>
      </div>
      
      {/* Ngũ Hành Nạp Âm */}
      <div className="text-center">
        <span className="text-xs text-gray-400">Nạp Âm:</span>
        <div className="text-sm font-semibold text-orange-300">{birthInfo.napAm}</div>
      </div>
      
      {/* Cục */}
      <div className="text-center">
        <span className="text-xs text-gray-400">Cục:</span>
        <div className="text-sm font-bold text-cyan-300">{cucName}</div>
      </div>
      
      {/* Ngày giờ sinh */}
      <div className="text-center mt-2 pt-2 border-t border-amber-600/30">
        <div className="text-xs text-gray-400">Ngày: {birthInfo.lunarDate} (ÂL)</div>
        <div className="text-xs text-gray-400">{birthInfo.birthHour}</div>
      </div>
    </div>
  );
}

/**
 * Star Detail Modal Component
 */
function StarModal({ cung, onClose }: StarModalProps) {
  if (!cung) return null;
  
  // Phân loại phụ tinh
  const catTinh = cung.phuTinh?.filter(pt => pt.nature === 'cát') || [];
  const hungTinh = cung.phuTinh?.filter(pt => pt.nature === 'hung') || [];
  const trungTinh = cung.phuTinh?.filter(pt => pt.nature === 'trung_tính') || [];
  
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-amber-500/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-600/30">
          <div>
            <h3 className="text-xl font-bold text-amber-300">
              Cung {cung.name}
            </h3>
            <span className="text-sm text-gray-400">Vị trí: {cung.diaChi}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Badges */}
        <div className="flex gap-2 mb-4">
          {cung.isMenh && (
            <span className="px-3 py-1 bg-yellow-500/30 text-yellow-200 rounded-full text-sm font-bold">
              🌟 Cung Mệnh
            </span>
          )}
          {cung.isThan && (
            <span className="px-3 py-1 bg-cyan-500/30 text-cyan-200 rounded-full text-sm font-bold">
              ✨ Cung Thân
            </span>
          )}
        </div>
        
        {/* Chính Tinh */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Chính Tinh tọa thủ
          </h4>
          {cung.chinhTinh.length > 0 ? (
            cung.chinhTinh.map((star) => (
              <div 
                key={star.id}
                className={`
                  p-3 rounded-lg
                  ${star.group === 'TuVi' ? 'bg-purple-900/40 border border-purple-500/30' : 'bg-cyan-900/40 border border-cyan-500/30'}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold ${getStarColorClass(star)}`}>
                    {star.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getNatureBadgeClass(star.nature)}`}>
                    {star.nature === 'cát' ? 'Cát' : star.nature === 'hung' ? 'Hung' : 'Trung tính'}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {star.group === 'TuVi' ? 'Tử Vi hệ' : 'Thiên Phủ hệ'}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {star.meaning}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-gray-400 italic text-sm">
              Cung này vô chính diệu
            </div>
          )}
        </div>
        
        {/* Phụ Tinh */}
        {(catTinh.length > 0 || hungTinh.length > 0 || trungTinh.length > 0) && (
          <div className="space-y-3 border-t border-amber-600/30 pt-4">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Phụ Tinh ({catTinh.length + hungTinh.length + trungTinh.length} sao)
            </h4>
            
            {/* Cát Tinh */}
            {catTinh.length > 0 && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="text-xs font-semibold text-green-400 mb-2">
                  ✓ Cát Tinh ({catTinh.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {catTinh.map((pt) => (
                    <span 
                      key={pt.id}
                      className="px-2 py-0.5 bg-green-800/40 text-green-300 rounded text-xs"
                      title={pt.category}
                    >
                      {pt.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trung Tính */}
            {trungTinh.length > 0 && (
              <div className="bg-gray-900/30 border border-gray-500/30 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-400 mb-2">
                  ○ Trung Tính ({trungTinh.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {trungTinh.map((pt) => (
                    <span 
                      key={pt.id}
                      className="px-2 py-0.5 bg-gray-800/40 text-gray-300 rounded text-xs"
                      title={pt.category}
                    >
                      {pt.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Hung Tinh */}
            {hungTinh.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-400 mb-2">
                  ✗ Hung Tinh ({hungTinh.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {hungTinh.map((pt) => (
                    <span 
                      key={pt.id}
                      className="px-2 py-0.5 bg-red-800/40 text-red-300 rounded text-xs"
                      title={pt.category}
                    >
                      {pt.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

// ========================= MAIN COMPONENT =========================

/**
 * TuViChartDisplay - Main component to display Tu Vi chart
 * 
 * Layout: Traditional 4x4 grid with center info area
 */
export default function TuViChartDisplay({ chart, birthInfo, onCungClick }: TuViChartDisplayProps) {
  const [selectedCung, setSelectedCung] = useState<Cung | null>(null);
  
  // Create grid array (4x4)
  const grid: (Cung | 'center' | null)[][] = [
    [null, null, null, null],
    [null, 'center', 'center', null],
    [null, 'center', 'center', null],
    [null, null, null, null],
  ];
  
  // Place cung vào grid
  chart.cung.forEach((cung) => {
    const pos = POSITION_TO_GRID[cung.index];
    if (pos) {
      grid[pos.row][pos.col] = cung;
    }
  });
  
  const handleCungClick = (cung: Cung) => {
    setSelectedCung(cung);
    onCungClick?.(cung);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Chart Grid */}
      <div className="grid grid-cols-4 gap-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 rounded-2xl border border-amber-600/30">
        {grid.map((row, rowIdx) => (
          <React.Fragment key={rowIdx}>
            {row.map((cell, colIdx) => {
              // Center area
              if (cell === 'center') {
                // Only render center once (at position 1,1)
                if (rowIdx === 1 && colIdx === 1) {
                  return (
                    <CenterInfo 
                      key={`center-${rowIdx}-${colIdx}`}
                      birthInfo={birthInfo}
                      cucName={chart.cucName}
                    />
                  );
                }
                return null; // Skip other center cells
              }
              
              // Cung cell
              if (cell && typeof cell === 'object') {
                return (
                  <CungCell
                    key={`cung-${cell.index}`}
                    cung={cell}
                    onClick={() => handleCungClick(cell)}
                  />
                );
              }
              
              // Empty cell (shouldn't happen)
              return (
                <div key={`empty-${rowIdx}-${colIdx}`} className="min-h-[120px]" />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-purple-500"></span>
          <span className="text-gray-300">Tử Vi hệ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-cyan-500"></span>
          <span className="text-gray-300">Thiên Phủ hệ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-500"></span>
          <span className="text-gray-300">Cát tinh</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500"></span>
          <span className="text-gray-300">Hung tinh</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border-2 border-yellow-400 bg-yellow-900/30"></span>
          <span className="text-gray-300">Cung Mệnh</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border-2 border-cyan-400 bg-cyan-900/30"></span>
          <span className="text-gray-300">Cung Thân</span>
        </div>
      </div>
      
      {/* Modal */}
      <StarModal 
        cung={selectedCung} 
        onClose={() => setSelectedCung(null)} 
      />
    </div>
  );
}

// ========================= EXPORTS =========================

export { CungCell, CenterInfo, StarModal };
export type { TuViChartDisplayProps, CungCellProps, CenterInfoProps, StarModalProps };
