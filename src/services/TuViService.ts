// src/services/TuViService.ts

import { astro } from 'iztro';

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;  // 0-11 (Tý=0, Sửu=1, ..., Hợi=11)
  gender: 'Nam' | 'Nữ';  // iztro requires capitalized gender
  isLunarDate?: boolean;
  isLeapMonth?: boolean;
}

export interface StarInfo {
  name: string;
  type: 'major' | 'minor';
  mutagen?: string;
  brightness?: string;
}

export interface PalaceInfo {
  name: string;
  earthlyBranch: string;
  heavenlyStem?: string;
  majorStars: StarInfo[];      // 14 Chính tinh (Tử Vi, Thiên Cơ, Thái Dương...)
  minorStars: StarInfo[];      // Phụ tinh (Lộc Tồn, Văn Xương, Văn Khúc, Tả Phụ, Hữu Bật...)
  adjectiveStars: StarInfo[];  // Tạp diệu (Hỏa Tinh, Linh Tinh, Kình Dương, Đà La, Địa Không...)
  changsheng12?: string;       // Trường Sinh 12 thần (Trường Sinh, Mộc Dục, Quan Đới...)
  isSoulPalace: boolean;
  isBodyPalace: boolean;
}

export interface TuViChartData {
  solarDate: string;
  lunarDate: string;
  lunarYear: string;
  birthHour: string;
  gender: string;
  genderYinYang: string;
  cuc: { name: string; value: number };
  soulStar: string;
  bodyStar: string;
  fiveElements: string;
  palaces: PalaceInfo[];
  tuHoa: {
    hoaLoc: { star: string; palace: string };
    hoaQuyen: { star: string; palace: string };
    hoaKhoa: { star: string; palace: string };
    hoaKy: { star: string; palace: string };
  };
}

const EARTHLY_BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const YANG_STEMS = ['Giáp', 'Bính', 'Mậu', 'Canh', 'Nhâm'];

// Mệnh Chủ - xác định theo Địa Chi của giờ sinh
// Tý, Ngọ: Tham Lang | Sửu, Mùi: Cự Môn | Dần, Thân: Lộc Tồn
// Mão, Dậu: Văn Khúc | Thìn, Tuất: Liêm Trinh | Tỵ, Hợi: Vũ Khúc
const MENH_CHU_BY_HOUR: Record<number, string> = {
  0: 'Tham Lang',   // Tý
  1: 'Cự Môn',      // Sửu
  2: 'Lộc Tồn',     // Dần
  3: 'Văn Khúc',    // Mão
  4: 'Liêm Trinh',  // Thìn
  5: 'Vũ Khúc',     // Tỵ
  6: 'Tham Lang',   // Ngọ
  7: 'Cự Môn',      // Mùi
  8: 'Lộc Tồn',     // Thân
  9: 'Văn Khúc',    // Dậu
  10: 'Liêm Trinh', // Tuất
  11: 'Vũ Khúc',    // Hợi
};

// Thân Chủ - xác định theo Địa Chi của năm sinh
// Tý: Linh Tinh | Sửu: Thiên Tướng | Dần: Thiên Lương | Mão: Thiên Đồng
// Thìn: Văn Xương | Tỵ: Thiên Cơ | Ngọ: Hỏa Tinh | Mùi: Thiên Tướng
// Thân: Thiên Lương | Dậu: Thiên Đồng | Tuất: Văn Xương | Hợi: Thiên Cơ
const THAN_CHU_BY_YEAR_BRANCH: Record<string, string> = {
  'Tý': 'Linh Tinh',
  'Sửu': 'Thiên Tướng',
  'Dần': 'Thiên Lương',
  'Mão': 'Thiên Đồng',
  'Thìn': 'Văn Xương',
  'Tỵ': 'Thiên Cơ',
  'Ngọ': 'Hỏa Tinh',
  'Mùi': 'Thiên Tướng',
  'Thân': 'Thiên Lương',
  'Dậu': 'Thiên Đồng',
  'Tuất': 'Văn Xương',
  'Hợi': 'Thiên Cơ',
};

export function solarHourToLunarIndex(hour: number): number {
  if (hour === 23 || hour === 0) return 0;
  return Math.floor((hour + 1) / 2);
}

export function getLunarHourName(index: number): string {
  return EARTHLY_BRANCHES[index % 12];
}

/**
 * Tính Mệnh Chủ dựa vào giờ sinh (0-11)
 */
function getMenhChu(hourIndex: number): string {
  return MENH_CHU_BY_HOUR[hourIndex % 12] || '';
}

/**
 * Tính Thân Chủ dựa vào Địa Chi năm sinh
 */
function getThanChu(yearBranch: string): string {
  return THAN_CHU_BY_YEAR_BRANCH[yearBranch] || '';
}

/**
 * Trích xuất Địa Chi từ chuỗi Can Chi năm (vd: "Kỷ Mùi" -> "Mùi")
 */
function extractYearBranch(canChi: string): string {
  const parts = canChi.trim().split(/\s+/);
  return parts.length >= 2 ? parts[1] : parts[0];
}

function parseCuc(cucStr: string): { name: string; value: number } {
  const cucMap: Record<string, number> = {
    'Thủy Nhị Cục': 2,
    'Mộc Tam Cục': 3,
    'Kim Tứ Cục': 4,
    'Thổ Ngũ Cục': 5,
    'Hỏa Lục Cục': 6,
  };
  
  for (const [name, value] of Object.entries(cucMap)) {
    if (cucStr?.includes(name)) return { name, value };
  }
  return { name: cucStr || '', value: 0 };
}

function getYinYang(chineseDate: string, gender: string): string {
  const yearPart = chineseDate?.split(' - ')[0] || '';
  const isYang = YANG_STEMS.some(s => yearPart.includes(s));
  
  if (gender === 'Nam') {
    return isYang ? 'Dương Nam' : 'Âm Nam';
  }
  return isYang ? 'Dương Nữ' : 'Âm Nữ';
}

function convertPalace(palace: any): PalaceInfo {
  return {
    name: palace.name || '',
    earthlyBranch: palace.earthlyBranch || '',
    heavenlyStem: palace.heavenlyStem,
    majorStars: (palace.majorStars || []).map((s: any) => ({
      name: s.name,
      type: 'major' as const,
      mutagen: s.mutagen,
      brightness: s.brightness,
    })),
    minorStars: (palace.minorStars || []).map((s: any) => ({
      name: s.name,
      type: 'minor' as const,
      mutagen: s.mutagen,
      brightness: s.brightness,
    })),
    adjectiveStars: (palace.adjectiveStars || []).map((s: any) => ({
      name: s.name,
      type: 'minor' as const,
      mutagen: s.mutagen,
      brightness: s.brightness,
    })),
    changsheng12: palace.changsheng12,
    isSoulPalace: palace.isSoulPalace || false,
    isBodyPalace: palace.isBodyPalace || false,
  };
}

function extractTuHoa(palaces: PalaceInfo[]) {
  const tuHoa = {
    hoaLoc: { star: '', palace: '' },
    hoaQuyen: { star: '', palace: '' },
    hoaKhoa: { star: '', palace: '' },
    hoaKy: { star: '', palace: '' },
  };
  
  for (const palace of palaces) {
    const allStars = [...palace.majorStars, ...palace.minorStars];
    for (const star of allStars) {
      if (!star.mutagen) continue;
      const m = star.mutagen.toLowerCase();
      if (m.includes('lộc') || m === 'loc') tuHoa.hoaLoc = { star: star.name, palace: palace.name };
      else if (m.includes('quyền') || m === 'quyen') tuHoa.hoaQuyen = { star: star.name, palace: palace.name };
      else if (m.includes('khoa')) tuHoa.hoaKhoa = { star: star.name, palace: palace.name };
      else if (m.includes('kỵ') || m.includes('kị')) tuHoa.hoaKy = { star: star.name, palace: palace.name };
    }
  }
  return tuHoa;
}

export function createTuViChart(input: BirthInput): TuViChartData {
  const dateStr = `${input.year}-${input.month}-${input.day}`;
  
  const astrolabe = input.isLunarDate
    ? astro.byLunar(dateStr, input.hour, input.gender, input.isLeapMonth || false, true, 'vi-VN')
    : astro.bySolar(dateStr, input.hour, input.gender, true, 'vi-VN');
  
  const palaces = (astrolabe.palaces || []).map(convertPalace);
  const chineseParts = (astrolabe.chineseDate || '').split(' - ');
  const lunarYear = chineseParts[0] || '';
  
  // Tính Mệnh Chủ và Thân Chủ theo công thức truyền thống
  const menhChu = getMenhChu(input.hour);
  const yearBranch = extractYearBranch(lunarYear);
  const thanChu = getThanChu(yearBranch);
  
  return {
    solarDate: astrolabe.solarDate || '',
    lunarDate: astrolabe.lunarDate || '',
    lunarYear,
    birthHour: getLunarHourName(input.hour),
    gender: input.gender,
    genderYinYang: getYinYang(astrolabe.chineseDate, input.gender),
    cuc: parseCuc(astrolabe.fiveElementsClass),
    soulStar: menhChu,
    bodyStar: thanChu,
    fiveElements: astrolabe.fiveElementsClass || '',
    palaces,
    tuHoa: extractTuHoa(palaces),
  };
}

export function getSoulPalace(chart: TuViChartData): PalaceInfo | undefined {
  return chart.palaces.find(p => p.isSoulPalace);
}

export function getBodyPalace(chart: TuViChartData): PalaceInfo | undefined {
  return chart.palaces.find(p => p.isBodyPalace);
}
