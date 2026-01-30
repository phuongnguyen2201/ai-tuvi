/**
 * Tu Vi Chart Calculation Engine
 * Core module for Purple Star Astrology chart generation
 */

// ========================= INTERFACES =========================

export interface ChinhTinh {
  id: string;
  name: string;
  group: 'TuVi' | 'ThienPhu';
  meaning: string;
  nature: 'cát' | 'hung' | 'trung_tính';
}

export interface Cung {
  index: number;
  name: string;
  diaChi: string;
  chinhTinh: ChinhTinh[];
  isMenh: boolean;
  isThan: boolean;
}

export interface TuViChart {
  cung: Cung[];
  cungMenhIndex: number;
  cungThanIndex: number;
  cucSo: number;
  cucName: string;
  tuViPosition: number;
  thienPhuPosition: number;
}

export interface BirthInfo {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  birthHourIndex: number; // 0-11 (Tý = 0, Sửu = 1, ...)
  canNamIndex: number; // 0-9 (Giáp = 0, Ất = 1, ...)
  gender: 'male' | 'female';
}

// ========================= CONSTANTS =========================

/**
 * 12 Cung names in order (starting from Mệnh)
 */
export const CUNG_NAMES = [
  'Mệnh',      // 0
  'Phụ Mẫu',   // 1
  'Phúc Đức',  // 2
  'Điền Trạch', // 3
  'Quan Lộc',  // 4
  'Nô Bộc',    // 5
  'Thiên Di',  // 6
  'Tật Ách',   // 7
  'Tài Bạch',  // 8
  'Tử Tức',    // 9
  'Phu Thê',   // 10
  'Huynh Đệ',  // 11
] as const;

/**
 * 12 Địa Chi positions (counter-clockwise from Dần)
 * This represents the fixed positions on the chart
 */
export const DIA_CHI_CUNG = [
  'Dần',  // 0
  'Mão',  // 1
  'Thìn', // 2
  'Tỵ',   // 3
  'Ngọ',  // 4
  'Mùi',  // 5
  'Thân', // 6
  'Dậu',  // 7
  'Tuất', // 8
  'Hợi',  // 9
  'Tý',   // 10
  'Sửu',  // 11
] as const;

/**
 * 14 Chính Tinh (Main Stars)
 */
export const CHINH_TINH: ChinhTinh[] = [
  // Tử Vi Group (6 stars)
  { id: 'tuVi', name: 'Tử Vi', group: 'TuVi', meaning: 'Đế vương, quyền lực, danh vọng', nature: 'cát' },
  { id: 'thienCo', name: 'Thiên Cơ', group: 'TuVi', meaning: 'Mưu lược, thông minh, biến động', nature: 'cát' },
  { id: 'thaiDuong', name: 'Thái Dương', group: 'TuVi', meaning: 'Quang minh, nam tính, sự nghiệp', nature: 'cát' },
  { id: 'vuKhuc', name: 'Vũ Khúc', group: 'TuVi', meaning: 'Tài lộc, võ nghiệp, cương trực', nature: 'cát' },
  { id: 'thienDong', name: 'Thiên Đồng', group: 'TuVi', meaning: 'Phúc đức, an nhàn, thiện lương', nature: 'cát' },
  { id: 'liemTrinh', name: 'Liêm Trinh', group: 'TuVi', meaning: 'Chính trực, tù ngục, đào hoa', nature: 'trung_tính' },
  
  // Thiên Phủ Group (8 stars)
  { id: 'thienPhu', name: 'Thiên Phủ', group: 'ThienPhu', meaning: 'Tài khố, ổn định, bảo thủ', nature: 'cát' },
  { id: 'thaiAm', name: 'Thái Âm', group: 'ThienPhu', meaning: 'Nữ tính, mẹ, tài sản, bất động sản', nature: 'cát' },
  { id: 'thamLang', name: 'Tham Lang', group: 'ThienPhu', meaning: 'Dục vọng, đào hoa, nghệ thuật', nature: 'trung_tính' },
  { id: 'cuMon', name: 'Cự Môn', group: 'ThienPhu', meaning: 'Khẩu thiệt, tranh cãi, ăn nói', nature: 'hung' },
  { id: 'thienTuong', name: 'Thiên Tướng', group: 'ThienPhu', meaning: 'Quý nhân, ấn tín, phù trợ', nature: 'cát' },
  { id: 'thienLuong', name: 'Thiên Lương', group: 'ThienPhu', meaning: 'Ấm đức, thọ, bác ái', nature: 'cát' },
  { id: 'thatSat', name: 'Thất Sát', group: 'ThienPhu', meaning: 'Uy quyền, sát phạt, quyết đoán', nature: 'hung' },
  { id: 'phaQuan', name: 'Phá Quân', group: 'ThienPhu', meaning: 'Phá hoại, biến động, tiên phong', nature: 'hung' },
];

/**
 * Offset positions for Tử Vi group stars (counter-clockwise from Tử Vi)
 */
const TU_VI_GROUP_OFFSETS: Record<string, number> = {
  tuVi: 0,
  thienCo: 1,   // 1 position counter-clockwise
  thaiDuong: 3, // 3 positions counter-clockwise
  vuKhuc: 4,    // 4 positions counter-clockwise
  thienDong: 5, // 5 positions counter-clockwise
  liemTrinh: 8, // 8 positions counter-clockwise
};

/**
 * Offset positions for Thiên Phủ group stars (clockwise from Thiên Phủ)
 */
const THIEN_PHU_GROUP_OFFSETS: Record<string, number> = {
  thienPhu: 0,
  thaiAm: 1,     // 1 position clockwise
  thamLang: 2,   // 2 positions clockwise
  cuMon: 3,      // 3 positions clockwise
  thienTuong: 4, // 4 positions clockwise
  thienLuong: 5, // 5 positions clockwise
  thatSat: 6,    // 6 positions clockwise
  phaQuan: 10,   // 10 positions clockwise
};

/**
 * Cục lookup table
 * Maps (Can năm index, Cung Mệnh địa chi) to Cục số
 * 
 * Can năm: 0=Giáp, 1=Ất, 2=Bính, 3=Đinh, 4=Mậu, 5=Kỷ, 6=Canh, 7=Tân, 8=Nhâm, 9=Quý
 * Cung position: 0=Dần, 1=Mão, 2=Thìn, 3=Tỵ, 4=Ngọ, 5=Mùi, 6=Thân, 7=Dậu, 8=Tuất, 9=Hợi, 10=Tý, 11=Sửu
 * 
 * Cục: 2=Thủy Nhị Cục, 3=Mộc Tam Cục, 4=Kim Tứ Cục, 5=Thổ Ngũ Cục, 6=Hỏa Lục Cục
 */
const CUC_TABLE: number[][] = [
  // Dần  Mão  Thìn  Tỵ   Ngọ  Mùi  Thân Dậu  Tuất Hợi  Tý   Sửu
  [   2,   6,   3,   5,   4,   2,   6,   3,   5,   4,   2,   6 ], // Giáp, Kỷ (0, 5)
  [   6,   3,   5,   4,   2,   6,   3,   5,   4,   2,   6,   3 ], // Ất, Canh (1, 6)
  [   5,   4,   2,   6,   3,   5,   4,   2,   6,   3,   5,   4 ], // Bính, Tân (2, 7)
  [   4,   2,   6,   3,   5,   4,   2,   6,   3,   5,   4,   2 ], // Đinh, Nhâm (3, 8)
  [   3,   5,   4,   2,   6,   3,   5,   4,   2,   6,   3,   5 ], // Mậu, Quý (4, 9)
];

const CUC_NAMES: Record<number, string> = {
  2: 'Thủy Nhị Cục',
  3: 'Mộc Tam Cục',
  4: 'Kim Tứ Cục',
  5: 'Thổ Ngũ Cục',
  6: 'Hỏa Lục Cục',
};

/**
 * Tử Vi star position lookup table
 * Maps (Cục số, Ngày âm lịch) to Tử Vi position (0-11)
 * 
 * Row: Cục số (2-6) -> index 0-4
 * Column: Ngày âm lịch (1-30) -> index 0-29
 */
const TU_VI_POSITION_TABLE: number[][] = [
  // Ngày 1-30 cho Thủy Nhị Cục (Cục 2)
  [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0, 0, 1, 1, 2, 2, 3],
  // Mộc Tam Cục (Cục 3)
  [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10],
  // Kim Tứ Cục (Cục 4)
  [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7],
  // Thổ Ngũ Cục (Cục 5)
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6],
  // Hỏa Lục Cục (Cục 6)
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5],
];

// ========================= CALCULATION FUNCTIONS =========================

/**
 * Calculate Cung Mệnh position
 * Formula: Start from Dần (index 0), count forward by lunarMonth, then count backward by birthHourIndex
 * 
 * @param lunarMonth - Tháng âm lịch (1-12)
 * @param birthHourIndex - Canh giờ sinh (0-11, Tý=0)
 * @returns Position index (0-11) on the chart
 */
export function calculateCungMenh(lunarMonth: number, birthHourIndex: number): number {
  // Start from Dần (index 0)
  // Count forward by lunarMonth (tháng 1 = Dần, tháng 2 = Mão, ...)
  // Then count backward by birthHourIndex
  const basePosition = (lunarMonth - 1) % 12; // 0-indexed
  const menhPosition = (basePosition - birthHourIndex + 12) % 12;
  return menhPosition;
}

/**
 * Calculate Cung Thân position
 * Formula: Start from Dần, count forward by lunarMonth, then count FORWARD by birthHourIndex
 * 
 * @param lunarMonth - Tháng âm lịch (1-12)
 * @param birthHourIndex - Canh giờ sinh (0-11, Tý=0)
 * @returns Position index (0-11) on the chart
 */
export function calculateCungThan(lunarMonth: number, birthHourIndex: number): number {
  const basePosition = (lunarMonth - 1) % 12;
  const thanPosition = (basePosition + birthHourIndex) % 12;
  return thanPosition;
}

/**
 * Calculate Cục số based on Can năm and Cung Mệnh position
 * 
 * @param canNamIndex - Can năm index (0-9, Giáp=0)
 * @param cungMenhPosition - Cung Mệnh position (0-11, Dần=0)
 * @returns Object with cục number and name
 */
export function calculateCucSo(canNamIndex: number, cungMenhPosition: number): { cuc: number; cucName: string } {
  // Map Can to CUC_TABLE row index
  // Giáp/Kỷ = 0, Ất/Canh = 1, Bính/Tân = 2, Đinh/Nhâm = 3, Mậu/Quý = 4
  const canGroup = canNamIndex % 5;
  const cuc = CUC_TABLE[canGroup][cungMenhPosition];
  return {
    cuc,
    cucName: CUC_NAMES[cuc],
  };
}

/**
 * Calculate Tử Vi star position
 * 
 * @param cucSo - Cục số (2-6)
 * @param lunarDay - Ngày âm lịch (1-30)
 * @returns Position index (0-11) where Tử Vi lands
 */
export function calculateTuViPosition(cucSo: number, lunarDay: number): number {
  // Cục 2 = index 0, Cục 3 = index 1, etc.
  const cucIndex = cucSo - 2;
  // Day 1-30 = index 0-29
  const dayIndex = Math.min(lunarDay, 30) - 1;
  return TU_VI_POSITION_TABLE[cucIndex][dayIndex];
}

/**
 * Calculate Thiên Phủ position
 * Thiên Phủ is symmetric to Tử Vi across the Dần-Thân axis
 * 
 * Formula: If Tử Vi is at position P, Thiên Phủ is at (12 - P) % 12
 * But need to account for the axis being Dần(0) - Thân(6)
 * 
 * @param tuViPosition - Tử Vi position (0-11)
 * @returns Thiên Phủ position (0-11)
 */
export function calculateThienPhuPosition(tuViPosition: number): number {
  // Thiên Phủ is symmetric to Tử Vi across Dần-Thân axis
  // If Tử Vi at Dần(0), Thiên Phủ at Dần(0)
  // If Tử Vi at Mão(1), Thiên Phủ at Sửu(11)
  // If Tử Vi at Thìn(2), Thiên Phủ at Tý(10)
  // Pattern: ThienPhu = (12 - TuVi) % 12, but shifted
  // Actually: ThienPhu = (12 - TuVi) % 12
  return (12 - tuViPosition) % 12;
}

/**
 * Distribute Chính Tinh (14 main stars) across the chart
 * 
 * @param tuViPosition - Tử Vi position (0-11)
 * @param thienPhuPosition - Thiên Phủ position (0-11)
 * @returns Map of star id to position
 */
export function distributeChinhTinh(
  tuViPosition: number, 
  thienPhuPosition: number
): Map<string, number> {
  const starPositions = new Map<string, number>();
  
  // Place Tử Vi group (counter-clockwise from Tử Vi)
  for (const [starId, offset] of Object.entries(TU_VI_GROUP_OFFSETS)) {
    // Counter-clockwise means subtracting (or adding 12 and taking mod)
    const position = (tuViPosition - offset + 12) % 12;
    starPositions.set(starId, position);
  }
  
  // Place Thiên Phủ group (clockwise from Thiên Phủ)
  for (const [starId, offset] of Object.entries(THIEN_PHU_GROUP_OFFSETS)) {
    // Clockwise means adding
    const position = (thienPhuPosition + offset) % 12;
    starPositions.set(starId, position);
  }
  
  return starPositions;
}

/**
 * Get ChinhTinh object by id
 */
export function getChinhTinhById(id: string): ChinhTinh | undefined {
  return CHINH_TINH.find(star => star.id === id);
}

/**
 * Distribute Cung names across the chart based on Cung Mệnh position
 * 
 * @param cungMenhPosition - Position where Mệnh cung lands (0-11)
 * @returns Array of 12 cung with their names and positions
 */
function distributeCungNames(cungMenhPosition: number): { name: string; position: number }[] {
  const result: { name: string; position: number }[] = [];
  
  for (let i = 0; i < 12; i++) {
    // Each subsequent cung is one position counter-clockwise
    const position = (cungMenhPosition - i + 12) % 12;
    result.push({
      name: CUNG_NAMES[i],
      position,
    });
  }
  
  return result;
}

/**
 * Create a complete Tu Vi chart
 * 
 * @param birthInfo - Birth information
 * @returns Complete TuViChart object
 */
export function createTuViChart(birthInfo: BirthInfo): TuViChart {
  // Step 1: Calculate Cung Mệnh and Cung Thân positions
  const cungMenhIndex = calculateCungMenh(birthInfo.lunarMonth, birthInfo.birthHourIndex);
  const cungThanIndex = calculateCungThan(birthInfo.lunarMonth, birthInfo.birthHourIndex);
  
  // Step 2: Calculate Cục số
  const { cuc: cucSo, cucName } = calculateCucSo(birthInfo.canNamIndex, cungMenhIndex);
  
  // Step 3: Calculate Tử Vi position
  const tuViPosition = calculateTuViPosition(cucSo, birthInfo.lunarDay);
  
  // Step 4: Calculate Thiên Phủ position
  const thienPhuPosition = calculateThienPhuPosition(tuViPosition);
  
  // Step 5: Distribute 14 main stars
  const starPositions = distributeChinhTinh(tuViPosition, thienPhuPosition);
  
  // Step 6: Distribute cung names
  const cungDistribution = distributeCungNames(cungMenhIndex);
  
  // Step 7: Build the 12 Cung array (organized by position 0-11)
  const cung: Cung[] = [];
  
  for (let position = 0; position < 12; position++) {
    // Find which cung name is at this position
    const cungInfo = cungDistribution.find(c => c.position === position);
    const cungName = cungInfo?.name || '';
    
    // Find which stars are at this position
    const starsAtPosition: ChinhTinh[] = [];
    starPositions.forEach((starPos, starId) => {
      if (starPos === position) {
        const star = getChinhTinhById(starId);
        if (star) {
          starsAtPosition.push(star);
        }
      }
    });
    
    cung.push({
      index: position,
      name: cungName,
      diaChi: DIA_CHI_CUNG[position],
      chinhTinh: starsAtPosition,
      isMenh: position === cungMenhIndex,
      isThan: position === cungThanIndex,
    });
  }
  
  return {
    cung,
    cungMenhIndex,
    cungThanIndex,
    cucSo,
    cucName,
    tuViPosition,
    thienPhuPosition,
  };
}

/**
 * Get summary information from a TuViChart
 */
export function getChartSummary(chart: TuViChart): {
  menhCung: Cung;
  thanCung: Cung;
  mainStarsInMenh: ChinhTinh[];
  cucInfo: string;
} {
  const menhCung = chart.cung[chart.cungMenhIndex];
  const thanCung = chart.cung[chart.cungThanIndex];
  
  return {
    menhCung,
    thanCung,
    mainStarsInMenh: menhCung.chinhTinh,
    cucInfo: chart.cucName,
  };
}

/**
 * Helper: Convert hour (0-23) to birth hour index (0-11)
 * Maps 24-hour format to 12 canh giờ
 */
export function hourToBirthHourIndex(hour: number): number {
  // Tý: 23-0, Sửu: 1-2, Dần: 3-4, etc.
  if (hour === 23 || hour === 0) return 0; // Tý
  return Math.floor((hour + 1) / 2);
}

/**
 * Debug: Print chart in a readable format
 */
export function debugPrintChart(chart: TuViChart): void {
  console.log('=== TU VI CHART ===');
  console.log(`Cục: ${chart.cucName} (${chart.cucSo})`);
  console.log(`Cung Mệnh: ${DIA_CHI_CUNG[chart.cungMenhIndex]}`);
  console.log(`Cung Thân: ${DIA_CHI_CUNG[chart.cungThanIndex]}`);
  console.log(`Tử Vi tại: ${DIA_CHI_CUNG[chart.tuViPosition]}`);
  console.log(`Thiên Phủ tại: ${DIA_CHI_CUNG[chart.thienPhuPosition]}`);
  console.log('\n12 Cung:');
  
  chart.cung.forEach(c => {
    const markers = [];
    if (c.isMenh) markers.push('[MỆNH]');
    if (c.isThan) markers.push('[THÂN]');
    const stars = c.chinhTinh.map(s => s.name).join(', ') || '(trống)';
    console.log(`  ${c.diaChi} - ${c.name} ${markers.join(' ')}: ${stars}`);
  });
}
