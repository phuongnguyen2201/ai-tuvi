// src/services/TuViService.ts

import { astro } from 'iztro';
import { getNguHanhNapAm, checkElementRelation, NguHanhNapAm, NguHanhRelation } from '@/lib/tuvi/nguHanh';

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
  boshi12?: string;            // Bác Sĩ 12 thần (Bác Sĩ, Lực Sĩ, Thanh Long, Tiểu Hao...)
  jiangqian12?: string;        // Tướng Tiền 12 thần (Tướng Tinh, Phan An, Tuế Dịch, Tức Thần...)
  suiqian12?: string;          // Tuế Tiền 12 thần (Tuế Kiến, Hối Khí, Táng Môn, Điếu Khách...)
  stage?: {                    // Đại Hạn (10 năm)
    range: [number, number];   // VD: [44, 53]
    heavenlyStem: string;      // Can của đại hạn
  };
  ages?: number[];             // Tiểu Hạn - các tuổi vận hạn năm
  isSoulPalace: boolean;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;   // Lai Nhân Cung
}

export interface NapAmInfo {
  napAm: string;           // Tên Nạp Âm: "Thiên Thượng Hỏa"
  element: string;         // Ngũ hành: "Hỏa"
  meaning: string;         // Ý nghĩa
  color: string;           // Màu may mắn
  direction: string;       // Hướng tốt
}

export interface CucMenhRelation {
  cucElement: string;      // Ngũ hành của Cục: "Kim"
  menhElement: string;     // Ngũ hành Nạp Âm: "Hỏa"
  relation: 'tuong_sinh' | 'tuong_khac' | 'binh_hoa';
  description: string;     // "Mệnh Hỏa khắc Cục Kim"
  compatibility: number;   // Điểm tương thích
}

export interface TuViChartData {
  solarDate: string;
  lunarDate: string;
  lunarYear: string;
  birthHour: string;
  timeRange: string;           // Khoảng giờ: "01:00~03:00"
  gender: string;
  genderYinYang: string;
  sign: string;                // Cung hoàng đạo Tây phương: "Bọ Cạp"
  zodiac: string;              // Con giáp: "Mùi"
  cuc: { name: string; value: number };
  soulStar: string;
  bodyStar: string;
  fiveElements: string;
  napAm: NapAmInfo;
  cucMenhRelation: CucMenhRelation;
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
 * Trích xuất Can Chi từ chuỗi (vd: "Kỷ Mùi" -> { can: "Kỷ", chi: "Mùi" })
 */
function extractCanChi(canChi: string): { can: string; chi: string } {
  const parts = canChi.trim().split(/\s+/);
  if (parts.length >= 2) {
    return { can: parts[0], chi: parts[1] };
  }
  return { can: '', chi: parts[0] || '' };
}

/**
 * Trích xuất Địa Chi từ chuỗi Can Chi năm (vd: "Kỷ Mùi" -> "Mùi")
 */
function extractYearBranch(canChi: string): string {
  return extractCanChi(canChi).chi;
}

interface CucInfo {
  name: string;
  value: number;
  element: string;
}

function parseCuc(cucStr: string): CucInfo {
  const cucMap: Record<string, { value: number; element: string }> = {
    'Thủy Nhị Cục': { value: 2, element: 'Thủy' },
    'Mộc Tam Cục': { value: 3, element: 'Mộc' },
    'Kim Tứ Cục': { value: 4, element: 'Kim' },
    'Thổ Ngũ Cục': { value: 5, element: 'Thổ' },
    'Hỏa Lục Cục': { value: 6, element: 'Hỏa' },
  };
  
  for (const [name, info] of Object.entries(cucMap)) {
    if (cucStr?.includes(name)) return { name, ...info };
  }
  return { name: cucStr || '', value: 0, element: '' };
}

/**
 * Tính quan hệ giữa Mệnh (Nạp Âm) và Cục
 */
function getCucMenhRelation(napAmElement: string, cucElement: string): CucMenhRelation {
  const relation = checkElementRelation(napAmElement, cucElement);
  
  let description = '';
  if (relation.relation === 'tuong_sinh') {
    if (napAmElement === cucElement) {
      description = `Mệnh ${napAmElement} tương đồng Cục ${cucElement} - Bình hòa`;
    } else {
      description = `Mệnh ${napAmElement} sinh/được sinh bởi Cục ${cucElement} - Thuận lợi`;
    }
  } else if (relation.relation === 'tuong_khac') {
    description = `Mệnh ${napAmElement} khắc/bị khắc Cục ${cucElement} - Cần lưu ý`;
  } else {
    description = `Mệnh ${napAmElement} và Cục ${cucElement} - Bình hòa`;
  }

  return {
    cucElement,
    menhElement: napAmElement,
    relation: relation.relation,
    description,
    compatibility: relation.compatibility,
  };
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
    boshi12: palace.boshi12,             // Bác Sĩ 12 thần
    jiangqian12: palace.jiangqian12,     // Tướng Tiền 12 thần
    suiqian12: palace.suiqian12,         // Tuế Tiền 12 thần
    stage: palace.stage ? {              // Đại Hạn
      range: palace.stage.range,
      heavenlyStem: palace.stage.heavenlyStem,
    } : undefined,
    ages: palace.ages,                   // Tiểu Hạn
    isSoulPalace: palace.isSoulPalace || false,
    isBodyPalace: palace.isBodyPalace || false,
    isOriginalPalace: palace.isOriginalPalace || false,
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
  const { can: yearCan, chi: yearBranch } = extractCanChi(lunarYear);
  const thanChu = getThanChu(yearBranch);
  
  // Tính Nạp Âm từ Can Chi năm sinh
  const napAmData = getNguHanhNapAm(yearCan, yearBranch);
  const napAm: NapAmInfo = {
    napAm: napAmData.napAm,
    element: napAmData.name,
    meaning: napAmData.meaning,
    color: napAmData.color,
    direction: napAmData.direction,
  };
  
  // Tính quan hệ Cục - Mệnh
  const cucInfo = parseCuc(astrolabe.fiveElementsClass);
  const cucMenhRelation = getCucMenhRelation(napAm.element, cucInfo.element);
  
  return {
    solarDate: astrolabe.solarDate || '',
    lunarDate: astrolabe.lunarDate || '',
    lunarYear,
    birthHour: getLunarHourName(input.hour),
    timeRange: astrolabe.timeRange || '',         // Khoảng giờ
    gender: input.gender,
    genderYinYang: getYinYang(astrolabe.chineseDate, input.gender),
    sign: astrolabe.sign || '',                   // Cung hoàng đạo
    zodiac: astrolabe.zodiac || '',               // Con giáp
    cuc: cucInfo,
    soulStar: menhChu,
    bodyStar: thanChu,
    fiveElements: astrolabe.fiveElementsClass || '',
    napAm,
    cucMenhRelation,
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
