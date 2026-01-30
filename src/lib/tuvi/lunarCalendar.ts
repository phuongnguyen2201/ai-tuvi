// ============================================
// LUNAR CALENDAR UTILITIES FOR TỬ VI
// ============================================

// Ngũ Hành
export type NguHanh = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';
export type YinYang = 'Dương' | 'Âm';
export type Gender = 'male' | 'female';

// ============================================
// THIÊN CAN (10 Heavenly Stems)
// ============================================
export interface ThienCan {
  name: string;
  element: NguHanh;
  yinYang: YinYang;
  index: number;
}

export const THIEN_CAN: ThienCan[] = [
  { name: 'Giáp', element: 'Mộc', yinYang: 'Dương', index: 0 },
  { name: 'Ất', element: 'Mộc', yinYang: 'Âm', index: 1 },
  { name: 'Bính', element: 'Hỏa', yinYang: 'Dương', index: 2 },
  { name: 'Đinh', element: 'Hỏa', yinYang: 'Âm', index: 3 },
  { name: 'Mậu', element: 'Thổ', yinYang: 'Dương', index: 4 },
  { name: 'Kỷ', element: 'Thổ', yinYang: 'Âm', index: 5 },
  { name: 'Canh', element: 'Kim', yinYang: 'Dương', index: 6 },
  { name: 'Tân', element: 'Kim', yinYang: 'Âm', index: 7 },
  { name: 'Nhâm', element: 'Thủy', yinYang: 'Dương', index: 8 },
  { name: 'Quý', element: 'Thủy', yinYang: 'Âm', index: 9 },
];

// ============================================
// ĐỊA CHI (12 Earthly Branches)
// ============================================
export interface DiaChi {
  name: string;
  animal: string;
  element: NguHanh;
  index: number;
}

export const DIA_CHI: DiaChi[] = [
  { name: 'Tý', animal: '🐀', element: 'Thủy', index: 0 },
  { name: 'Sửu', animal: '🐂', element: 'Thổ', index: 1 },
  { name: 'Dần', animal: '🐅', element: 'Mộc', index: 2 },
  { name: 'Mão', animal: '🐇', element: 'Mộc', index: 3 },
  { name: 'Thìn', animal: '🐉', element: 'Thổ', index: 4 },
  { name: 'Tỵ', animal: '🐍', element: 'Hỏa', index: 5 },
  { name: 'Ngọ', animal: '🐎', element: 'Hỏa', index: 6 },
  { name: 'Mùi', animal: '🐐', element: 'Thổ', index: 7 },
  { name: 'Thân', animal: '🐒', element: 'Kim', index: 8 },
  { name: 'Dậu', animal: '🐓', element: 'Kim', index: 9 },
  { name: 'Tuất', animal: '🐕', element: 'Thổ', index: 10 },
  { name: 'Hợi', animal: '🐖', element: 'Thủy', index: 11 },
];

// ============================================
// CANH GIỜ (12 Double Hours)
// ============================================
export interface CanhGio {
  name: string;
  diaChi: DiaChi;
  startHour: number;
  endHour: number;
  index: number;
}

export const CANH_GIO: CanhGio[] = [
  { name: 'Giờ Tý', diaChi: DIA_CHI[0], startHour: 23, endHour: 1, index: 0 },
  { name: 'Giờ Sửu', diaChi: DIA_CHI[1], startHour: 1, endHour: 3, index: 1 },
  { name: 'Giờ Dần', diaChi: DIA_CHI[2], startHour: 3, endHour: 5, index: 2 },
  { name: 'Giờ Mão', diaChi: DIA_CHI[3], startHour: 5, endHour: 7, index: 3 },
  { name: 'Giờ Thìn', diaChi: DIA_CHI[4], startHour: 7, endHour: 9, index: 4 },
  { name: 'Giờ Tỵ', diaChi: DIA_CHI[5], startHour: 9, endHour: 11, index: 5 },
  { name: 'Giờ Ngọ', diaChi: DIA_CHI[6], startHour: 11, endHour: 13, index: 6 },
  { name: 'Giờ Mùi', diaChi: DIA_CHI[7], startHour: 13, endHour: 15, index: 7 },
  { name: 'Giờ Thân', diaChi: DIA_CHI[8], startHour: 15, endHour: 17, index: 8 },
  { name: 'Giờ Dậu', diaChi: DIA_CHI[9], startHour: 17, endHour: 19, index: 9 },
  { name: 'Giờ Tuất', diaChi: DIA_CHI[10], startHour: 19, endHour: 21, index: 10 },
  { name: 'Giờ Hợi', diaChi: DIA_CHI[11], startHour: 21, endHour: 23, index: 11 },
];

// ============================================
// LUNAR DATE INTERFACE
// ============================================
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  canNam: ThienCan;
  chiNam: DiaChi;
  canThang: ThienCan;
  chiThang: DiaChi;
  canNgay: ThienCan;
  chiNgay: DiaChi;
}

// ============================================
// BIRTH INFO INTERFACE
// ============================================
export interface BirthInfo {
  solarDate: Date;
  lunarDate: LunarDate;
  birthHour: number;
  canhGio: CanhGio;
  canGio: ThienCan;
  chiGio: DiaChi;
  gender: Gender;
  yinYang: YinYang;
}

// ============================================
// LUNAR CALENDAR DATA (1900-2100)
// Encoded lunar calendar info for each year
// ============================================
const LUNAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520,
];

const LUNAR_YEAR_START = 1900;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the number of days in a lunar year
 */
function getLunarYearDays(year: number): number {
  let sum = 348;
  const info = LUNAR_INFO[year - LUNAR_YEAR_START];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

/**
 * Get the leap month (0 if no leap month)
 */
function getLeapMonth(year: number): number {
  return LUNAR_INFO[year - LUNAR_YEAR_START] & 0xf;
}

/**
 * Get the number of days in the leap month
 */
function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return (LUNAR_INFO[year - LUNAR_YEAR_START] & 0x10000) ? 30 : 29;
  }
  return 0;
}

/**
 * Get the number of days in a lunar month
 */
function getLunarMonthDays(year: number, month: number): number {
  return (LUNAR_INFO[year - LUNAR_YEAR_START] & (0x10000 >> month)) ? 30 : 29;
}

/**
 * Calculate Julian Day Number from solar date
 */
function solarToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/**
 * Get Thiên Can from index
 */
export function getThienCan(index: number): ThienCan {
  return THIEN_CAN[((index % 10) + 10) % 10];
}

/**
 * Get Địa Chi from index
 */
export function getDiaChi(index: number): DiaChi {
  return DIA_CHI[((index % 12) + 12) % 12];
}

// ============================================
// MAIN CONVERSION FUNCTIONS
// ============================================

/**
 * Convert solar date to lunar date
 */
export function solarToLunar(solarDate: Date): LunarDate {
  const year = solarDate.getFullYear();
  const month = solarDate.getMonth() + 1;
  const day = solarDate.getDate();
  
  // Base date: January 31, 1900 = Lunar 1/1/1900
  const baseDate = new Date(1900, 0, 31);
  const offset = Math.floor((solarDate.getTime() - baseDate.getTime()) / 86400000);
  
  let lunarYear = LUNAR_YEAR_START;
  let lunarMonth = 1;
  let lunarDay = 1;
  let isLeapMonth = false;
  
  // Calculate lunar year
  let daysRemaining = offset;
  let yearDays = getLunarYearDays(lunarYear);
  
  while (daysRemaining >= yearDays && lunarYear < LUNAR_YEAR_START + LUNAR_INFO.length - 1) {
    daysRemaining -= yearDays;
    lunarYear++;
    yearDays = getLunarYearDays(lunarYear);
  }
  
  // Calculate lunar month
  const leapMonth = getLeapMonth(lunarYear);
  let isAfterLeap = false;
  
  for (let i = 1; i <= 12; i++) {
    let monthDays: number;
    
    if (leapMonth > 0 && i === leapMonth + 1 && !isAfterLeap) {
      // This is the leap month
      monthDays = getLeapMonthDays(lunarYear);
      isAfterLeap = true;
      
      if (daysRemaining < monthDays) {
        isLeapMonth = true;
        lunarMonth = i - 1;
        break;
      }
      daysRemaining -= monthDays;
    }
    
    monthDays = getLunarMonthDays(lunarYear, i);
    
    if (daysRemaining < monthDays) {
      lunarMonth = i;
      break;
    }
    daysRemaining -= monthDays;
  }
  
  lunarDay = daysRemaining + 1;
  
  // Calculate Can Chi for year (based on lunar year)
  const canNamIndex = (lunarYear - 4) % 10;
  const chiNamIndex = (lunarYear - 4) % 12;
  
  // Calculate Can Chi for month
  // Can tháng: (Can năm * 2 + tháng) % 10
  const canThangIndex = (canNamIndex * 2 + lunarMonth) % 10;
  // Chi tháng: (tháng + 1) % 12 (tháng Giêng = Dần)
  const chiThangIndex = (lunarMonth + 1) % 12;
  
  // Calculate Can Chi for day using JDN
  const jdn = solarToJdn(year, month, day);
  const canNgayIndex = (jdn + 9) % 10;
  const chiNgayIndex = (jdn + 1) % 12;
  
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeapMonth,
    canNam: getThienCan(canNamIndex),
    chiNam: getDiaChi(chiNamIndex),
    canThang: getThienCan(canThangIndex),
    chiThang: getDiaChi(chiThangIndex),
    canNgay: getThienCan(canNgayIndex),
    chiNgay: getDiaChi(chiNgayIndex),
  };
}

/**
 * Get the Canh Gio (double hour) from hour (0-23)
 */
export function getBirthHour(hour: number): CanhGio {
  // Handle hour 23 (belongs to Tý of next day conceptually, but same Canh)
  if (hour === 23) {
    return CANH_GIO[0]; // Giờ Tý
  }
  
  // Calculate index: hours 1-2 = Sửu (index 1), hours 3-4 = Dần (index 2), etc.
  const index = Math.floor((hour + 1) / 2) % 12;
  return CANH_GIO[index];
}

/**
 * Calculate Can for the birth hour
 * Based on the day's Can and the hour's Chi
 */
function getCanGio(canNgay: ThienCan, canhGio: CanhGio): ThienCan {
  // Khởi Giáp từ ngày Giáp/Kỷ, Bính từ ngày Ất/Canh, etc.
  const startCanIndex = (canNgay.index % 5) * 2;
  const canGioIndex = (startCanIndex + canhGio.index) % 10;
  return getThienCan(canGioIndex);
}

/**
 * Create comprehensive birth information
 */
export function createBirthInfo(
  solarDate: Date,
  birthHour: number,
  gender: Gender
): BirthInfo {
  const lunarDate = solarToLunar(solarDate);
  const canhGio = getBirthHour(birthHour);
  const canGio = getCanGio(lunarDate.canNgay, canhGio);
  
  // Determine Yin/Yang based on gender and year
  // Nam sinh năm Dương -> Dương mệnh, Nam sinh năm Âm -> Âm mệnh
  // Nữ sinh năm Dương -> Âm mệnh, Nữ sinh năm Âm -> Dương mệnh
  const yearYinYang = lunarDate.canNam.yinYang;
  let yinYang: YinYang;
  
  if (gender === 'male') {
    yinYang = yearYinYang;
  } else {
    yinYang = yearYinYang === 'Dương' ? 'Âm' : 'Dương';
  }
  
  return {
    solarDate,
    lunarDate,
    birthHour,
    canhGio,
    canGio,
    chiGio: canhGio.diaChi,
    gender,
    yinYang,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format lunar date as string
 */
export function formatLunarDate(lunar: LunarDate): string {
  const leapStr = lunar.isLeapMonth ? ' (Nhuận)' : '';
  return `${lunar.day}/${lunar.month}${leapStr}/${lunar.year} - ${lunar.canNam.name} ${lunar.chiNam.name}`;
}

/**
 * Get zodiac animal from birth year
 */
export function getZodiacAnimal(year: number): DiaChi {
  const index = (year - 4) % 12;
  return getDiaChi(index);
}

/**
 * Get the element of a year based on Nạp Âm Ngũ Hành
 * (Simplified version - full table has 60 combinations)
 */
export function getNapAmNguHanh(canNam: ThienCan, chiNam: DiaChi): { name: string; element: NguHanh } {
  const napAmTable: Record<string, { name: string; element: NguHanh }> = {
    '00': { name: 'Hải Trung Kim', element: 'Kim' },
    '01': { name: 'Hải Trung Kim', element: 'Kim' },
    '22': { name: 'Lô Trung Hỏa', element: 'Hỏa' },
    '23': { name: 'Lô Trung Hỏa', element: 'Hỏa' },
    '44': { name: 'Đại Lâm Mộc', element: 'Mộc' },
    '45': { name: 'Đại Lâm Mộc', element: 'Mộc' },
    '66': { name: 'Lộ Bàng Thổ', element: 'Thổ' },
    '67': { name: 'Lộ Bàng Thổ', element: 'Thổ' },
    '88': { name: 'Kiếm Phong Kim', element: 'Kim' },
    '89': { name: 'Kiếm Phong Kim', element: 'Kim' },
    '02': { name: 'Giản Hạ Thủy', element: 'Thủy' },
    '03': { name: 'Giản Hạ Thủy', element: 'Thủy' },
    '24': { name: 'Thành Đầu Thổ', element: 'Thổ' },
    '25': { name: 'Thành Đầu Thổ', element: 'Thổ' },
    '46': { name: 'Bạch Lạp Kim', element: 'Kim' },
    '47': { name: 'Bạch Lạp Kim', element: 'Kim' },
    '68': { name: 'Dương Liễu Mộc', element: 'Mộc' },
    '69': { name: 'Dương Liễu Mộc', element: 'Mộc' },
    '80': { name: 'Tuyền Trung Thủy', element: 'Thủy' },
    '81': { name: 'Tuyền Trung Thủy', element: 'Thủy' },
    '04': { name: 'Tích Lịch Hỏa', element: 'Hỏa' },
    '05': { name: 'Tích Lịch Hỏa', element: 'Hỏa' },
    '26': { name: 'Tùng Bách Mộc', element: 'Mộc' },
    '27': { name: 'Tùng Bách Mộc', element: 'Mộc' },
    '48': { name: 'Trường Lưu Thủy', element: 'Thủy' },
    '49': { name: 'Trường Lưu Thủy', element: 'Thủy' },
    '60': { name: 'Sa Trung Kim', element: 'Kim' },
    '61': { name: 'Sa Trung Kim', element: 'Kim' },
    '82': { name: 'Ốc Thượng Thổ', element: 'Thổ' },
    '83': { name: 'Ốc Thượng Thổ', element: 'Thổ' },
    '06': { name: 'Sơn Hạ Hỏa', element: 'Hỏa' },
    '07': { name: 'Sơn Hạ Hỏa', element: 'Hỏa' },
    '28': { name: 'Bình Địa Mộc', element: 'Mộc' },
    '29': { name: 'Bình Địa Mộc', element: 'Mộc' },
    '40': { name: 'Bích Thượng Thổ', element: 'Thổ' },
    '41': { name: 'Bích Thượng Thổ', element: 'Thổ' },
    '62': { name: 'Kim Bạch Kim', element: 'Kim' },
    '63': { name: 'Kim Bạch Kim', element: 'Kim' },
    '84': { name: 'Phúc Đăng Hỏa', element: 'Hỏa' },
    '85': { name: 'Phúc Đăng Hỏa', element: 'Hỏa' },
    '08': { name: 'Thiên Hà Thủy', element: 'Thủy' },
    '09': { name: 'Thiên Hà Thủy', element: 'Thủy' },
    '20': { name: 'Đại Trạch Thổ', element: 'Thổ' },
    '21': { name: 'Đại Trạch Thổ', element: 'Thổ' },
    '42': { name: 'Xoa Xuyến Kim', element: 'Kim' },
    '43': { name: 'Xoa Xuyến Kim', element: 'Kim' },
    '64': { name: 'Phú Đăng Hỏa', element: 'Hỏa' },
    '65': { name: 'Phú Đăng Hỏa', element: 'Hỏa' },
    '86': { name: 'Thiên Thượng Hỏa', element: 'Hỏa' },
    '87': { name: 'Thiên Thượng Hỏa', element: 'Hỏa' },
    '10': { name: 'Thạch Lựu Mộc', element: 'Mộc' },
    '11': { name: 'Thạch Lựu Mộc', element: 'Mộc' },
    '32': { name: 'Đại Hải Thủy', element: 'Thủy' },
    '33': { name: 'Đại Hải Thủy', element: 'Thủy' },
    '54': { name: 'Sa Trung Thổ', element: 'Thổ' },
    '55': { name: 'Sa Trung Thổ', element: 'Thổ' },
    '76': { name: 'Thiên Thượng Hỏa', element: 'Hỏa' },
    '77': { name: 'Thiên Thượng Hỏa', element: 'Hỏa' },
    '98': { name: 'Đại Dịch Thổ', element: 'Thổ' },
    '99': { name: 'Đại Dịch Thổ', element: 'Thổ' },
  };
  
  const key = `${canNam.index}${chiNam.index}`;
  return napAmTable[key] || { name: 'Không xác định', element: 'Thổ' };
}
