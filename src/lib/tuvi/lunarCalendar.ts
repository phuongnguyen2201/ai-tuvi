/**
 * Vietnamese Lunar Calendar Converter
 * File: lib/tuvi/lunarCalendar.ts
 * 
 * Chuyển đổi chính xác từ Dương lịch sang Âm lịch
 * Sử dụng lookup table cho độ chính xác cao
 */

// ============================================
// LUNAR CALENDAR DATA (1900-2100)
// ============================================

/**
 * Mỗi năm được encode thành số hex chứa thông tin:
 * - Bit 0-3: Tháng nhuận (0 = không có, 1-12 = tháng nhuận)
 * - Bit 4-15: Số ngày mỗi tháng (0 = 29 ngày, 1 = 30 ngày)
 * - Bit 16: Số ngày tháng nhuận (0 = 29, 1 = 30)
 */
const LUNAR_YEAR_DATA: number[] = [
  // 1900-1909
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  // 1910-1919
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  // 1920-1929
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  // 1930-1939
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  // 1940-1949
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  // 1950-1959
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  // 1960-1969
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  // 1970-1979
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  // 1980-1989
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  // 1990-1999
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  // 2000-2009
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  // 2010-2019
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  // 2020-2029
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  // 2030-2039
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  // 2040-2049
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  // 2050-2059
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  // 2060-2069
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  // 2070-2079
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  // 2080-2089
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  // 2090-2099
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  // 2100
  0x0d520,
];

// Ngày đầu tiên của năm âm lịch 1900 theo dương lịch
const LUNAR_BASE_DATE = new Date(1900, 0, 31); // 31/01/1900

// ============================================
// THIÊN CAN (10 Heavenly Stems)
// ============================================
export const THIEN_CAN = [
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
] as const;

// ============================================
// ĐỊA CHI (12 Earthly Branches)
// ============================================
export const DIA_CHI = [
  { name: 'Tý', animal: '🐀', vietnameseAnimal: 'Chuột', element: 'Thủy', index: 0 },
  { name: 'Sửu', animal: '🐂', vietnameseAnimal: 'Trâu', element: 'Thổ', index: 1 },
  { name: 'Dần', animal: '🐅', vietnameseAnimal: 'Hổ', element: 'Mộc', index: 2 },
  { name: 'Mão', animal: '🐱', vietnameseAnimal: 'Mèo', element: 'Mộc', index: 3 },
  { name: 'Thìn', animal: '🐉', vietnameseAnimal: 'Rồng', element: 'Thổ', index: 4 },
  { name: 'Tỵ', animal: '🐍', vietnameseAnimal: 'Rắn', element: 'Hỏa', index: 5 },
  { name: 'Ngọ', animal: '🐴', vietnameseAnimal: 'Ngựa', element: 'Hỏa', index: 6 },
  { name: 'Mùi', animal: '🐐', vietnameseAnimal: 'Dê', element: 'Thổ', index: 7 },
  { name: 'Thân', animal: '🐵', vietnameseAnimal: 'Khỉ', element: 'Kim', index: 8 },
  { name: 'Dậu', animal: '🐔', vietnameseAnimal: 'Gà', element: 'Kim', index: 9 },
  { name: 'Tuất', animal: '🐕', vietnameseAnimal: 'Chó', element: 'Thổ', index: 10 },
  { name: 'Hợi', animal: '🐖', vietnameseAnimal: 'Heo', element: 'Thủy', index: 11 },
] as const;

// ============================================
// 12 CANH GIỜ (Time Periods)
// ============================================
export const CANH_GIO = [
  { name: 'Tý', start: '23:00', end: '00:59', startHour: 23, endHour: 1, index: 0, description: 'Giờ Tý (23h-1h)' },
  { name: 'Sửu', start: '01:00', end: '02:59', startHour: 1, endHour: 3, index: 1, description: 'Giờ Sửu (1h-3h)' },
  { name: 'Dần', start: '03:00', end: '04:59', startHour: 3, endHour: 5, index: 2, description: 'Giờ Dần (3h-5h)' },
  { name: 'Mão', start: '05:00', end: '06:59', startHour: 5, endHour: 7, index: 3, description: 'Giờ Mão (5h-7h)' },
  { name: 'Thìn', start: '07:00', end: '08:59', startHour: 7, endHour: 9, index: 4, description: 'Giờ Thìn (7h-9h)' },
  { name: 'Tỵ', start: '09:00', end: '10:59', startHour: 9, endHour: 11, index: 5, description: 'Giờ Tỵ (9h-11h)' },
  { name: 'Ngọ', start: '11:00', end: '12:59', startHour: 11, endHour: 13, index: 6, description: 'Giờ Ngọ (11h-13h)' },
  { name: 'Mùi', start: '13:00', end: '14:59', startHour: 13, endHour: 15, index: 7, description: 'Giờ Mùi (13h-15h)' },
  { name: 'Thân', start: '15:00', end: '16:59', startHour: 15, endHour: 17, index: 8, description: 'Giờ Thân (15h-17h)' },
  { name: 'Dậu', start: '17:00', end: '18:59', startHour: 17, endHour: 19, index: 9, description: 'Giờ Dậu (17h-19h)' },
  { name: 'Tuất', start: '19:00', end: '20:59', startHour: 19, endHour: 21, index: 10, description: 'Giờ Tuất (19h-21h)' },
  { name: 'Hợi', start: '21:00', end: '22:59', startHour: 21, endHour: 23, index: 11, description: 'Giờ Hợi (21h-23h)' },
] as const;

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ThienCan = typeof THIEN_CAN[number];
export type DiaChi = typeof DIA_CHI[number];
export type CanhGio = typeof CANH_GIO[number];

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  leapMonth: number; // Tháng nhuận trong năm (0 nếu không có)
  yearCanChi: string; // e.g., "Kỷ Mùi"
  monthCanChi: string;
  dayCanChi: string;
  canNam: ThienCan;
  chiNam: DiaChi;
  canThang: ThienCan;
  chiThang: DiaChi;
  canNgay: ThienCan;
  chiNgay: DiaChi;
}

export interface BirthInfo {
  solarDate: Date;
  lunarDate: LunarDate;
  birthHour: CanhGio;
  canGio: ThienCan;
  chiGio: DiaChi;
  gender: 'male' | 'female';
  zodiacAnimal: DiaChi;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Lấy tháng nhuận của năm (0 nếu không có)
 */
function getLeapMonth(lunarYear: number): number {
  if (lunarYear < 1900 || lunarYear > 2100) return 0;
  return LUNAR_YEAR_DATA[lunarYear - 1900] & 0xf;
}

/**
 * Lấy số ngày trong tháng nhuận
 */
function getLeapMonthDays(lunarYear: number): number {
  if (getLeapMonth(lunarYear) === 0) return 0;
  return (LUNAR_YEAR_DATA[lunarYear - 1900] & 0x10000) ? 30 : 29;
}

/**
 * Lấy số ngày trong một tháng âm lịch
 */
function getLunarMonthDays(lunarYear: number, lunarMonth: number): number {
  if (lunarYear < 1900 || lunarYear > 2100) return 30;
  return (LUNAR_YEAR_DATA[lunarYear - 1900] & (0x10000 >> lunarMonth)) ? 30 : 29;
}

/**
 * Tổng số ngày trong năm âm lịch
 */
function getLunarYearDays(lunarYear: number): number {
  let totalDays = 0;
  for (let month = 1; month <= 12; month++) {
    totalDays += getLunarMonthDays(lunarYear, month);
  }
  // Cộng thêm tháng nhuận nếu có
  totalDays += getLeapMonthDays(lunarYear);
  return totalDays;
}

/**
 * Tính số ngày Julian từ ngày dương lịch
 */
function getJulianDayNumber(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// ============================================
// MAIN CONVERSION FUNCTION
// ============================================

/**
 * Chuyển đổi ngày dương lịch sang âm lịch
 * @param solarDate - Ngày dương lịch (Date object)
 * @returns LunarDate object
 */
export function solarToLunar(solarDate: Date): LunarDate {
  // Tính số ngày từ ngày base (31/01/1900)
  const baseTime = LUNAR_BASE_DATE.getTime();
  const inputTime = new Date(solarDate.getFullYear(), solarDate.getMonth(), solarDate.getDate()).getTime();
  let offset = Math.floor((inputTime - baseTime) / 86400000);
  
  // Tìm năm âm lịch
  let lunarYear = 1900;
  let daysInYear = getLunarYearDays(lunarYear);
  
  while (offset >= daysInYear && lunarYear < 2100) {
    offset -= daysInYear;
    lunarYear++;
    daysInYear = getLunarYearDays(lunarYear);
  }
  
  // Tháng nhuận trong năm
  const leapMonth = getLeapMonth(lunarYear);
  let isLeapMonth = false;
  
  // Tìm tháng âm lịch
  let lunarMonth = 1;
  let daysInMonth = getLunarMonthDays(lunarYear, lunarMonth);
  
  while (offset >= daysInMonth && lunarMonth <= 12) {
    offset -= daysInMonth;
    
    // Kiểm tra tháng nhuận
    if (lunarMonth === leapMonth && !isLeapMonth) {
      // Đang ở tháng nhuận
      daysInMonth = getLeapMonthDays(lunarYear);
      isLeapMonth = true;
    } else {
      if (isLeapMonth) {
        isLeapMonth = false;
      }
      lunarMonth++;
      if (lunarMonth <= 12) {
        daysInMonth = getLunarMonthDays(lunarYear, lunarMonth);
      }
    }
  }
  
  // Ngày âm lịch
  const lunarDay = offset + 1;
  
  // Tính Can Chi năm
  const canNamIndex = (lunarYear - 4) % 10;
  const chiNamIndex = (lunarYear - 4) % 12;
  const canNam = THIEN_CAN[canNamIndex >= 0 ? canNamIndex : canNamIndex + 10];
  const chiNam = DIA_CHI[chiNamIndex >= 0 ? chiNamIndex : chiNamIndex + 12];
  
  // Tính Can Chi tháng
  // Can tháng: Dựa vào Can năm
  // Năm Giáp/Kỷ: tháng Giêng là Bính Dần
  // Năm Ất/Canh: tháng Giêng là Mậu Dần
  // Năm Bính/Tân: tháng Giêng là Canh Dần
  // Năm Đinh/Nhâm: tháng Giêng là Nhâm Dần
  // Năm Mậu/Quý: tháng Giêng là Giáp Dần
  const canThangStart = [2, 4, 6, 8, 0]; // Bính, Mậu, Canh, Nhâm, Giáp
  const canThangStartIndex = canThangStart[canNamIndex % 5];
  const canThangIndex = (canThangStartIndex + lunarMonth - 1) % 10;
  const chiThangIndex = (lunarMonth + 1) % 12; // Tháng 1 = Dần (index 2)
  const canThang = THIEN_CAN[canThangIndex];
  const chiThang = DIA_CHI[chiThangIndex];
  
  // Tính Can Chi ngày (dựa vào Julian Day Number)
  const jdn = getJulianDayNumber(solarDate);
  const canNgayIndex = (jdn + 9) % 10;
  const chiNgayIndex = (jdn + 1) % 12;
  const canNgay = THIEN_CAN[canNgayIndex];
  const chiNgay = DIA_CHI[chiNgayIndex];
  
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeapMonth,
    leapMonth,
    yearCanChi: `${canNam.name} ${chiNam.name}`,
    monthCanChi: `${canThang.name} ${chiThang.name}`,
    dayCanChi: `${canNgay.name} ${chiNgay.name}`,
    canNam,
    chiNam,
    canThang,
    chiThang,
    canNgay,
    chiNgay,
  };
}

/**
 * Lấy canh giờ từ giờ sinh (0-23)
 */
export function getBirthHour(hour: number): CanhGio {
  // Giờ Tý: 23-1
  if (hour >= 23 || hour < 1) return CANH_GIO[0];
  // Các giờ khác: mỗi 2 tiếng
  const index = Math.floor((hour + 1) / 2);
  return CANH_GIO[index];
}

/**
 * Tính Can Chi giờ
 * Can giờ dựa vào Can ngày:
 * - Ngày Giáp/Kỷ: giờ Tý là Giáp Tý
 * - Ngày Ất/Canh: giờ Tý là Bính Tý
 * - Ngày Bính/Tân: giờ Tý là Mậu Tý
 * - Ngày Đinh/Nhâm: giờ Tý là Canh Tý
 * - Ngày Mậu/Quý: giờ Tý là Nhâm Tý
 */
export function getCanChiGio(canNgay: ThienCan, chiGio: DiaChi): { can: ThienCan; chi: DiaChi } {
  const canGioStart = [0, 2, 4, 6, 8]; // Giáp, Bính, Mậu, Canh, Nhâm
  const canGioStartIndex = canGioStart[canNgay.index % 5];
  const canGioIndex = (canGioStartIndex + chiGio.index) % 10;
  
  return {
    can: THIEN_CAN[canGioIndex],
    chi: chiGio,
  };
}

/**
 * Tạo thông tin sinh đầy đủ
 */
export function createBirthInfo(
  solarDate: Date,
  birthHour: number,
  gender: 'male' | 'female'
): BirthInfo {
  const lunarDate = solarToLunar(solarDate);
  const birthHourInfo = getBirthHour(birthHour);
  const chiGio = DIA_CHI[birthHourInfo.index];
  const canChiGio = getCanChiGio(lunarDate.canNgay, chiGio);
  
  return {
    solarDate,
    lunarDate,
    birthHour: birthHourInfo,
    canGio: canChiGio.can,
    chiGio: canChiGio.chi,
    gender,
    zodiacAnimal: lunarDate.chiNam,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format ngày âm lịch thành string
 */
export function formatLunarDate(lunar: LunarDate): string {
  const leapText = lunar.isLeapMonth ? ' (nhuận)' : '';
  return `Ngày ${lunar.day} tháng ${lunar.month}${leapText} năm ${lunar.yearCanChi}`;
}

/**
 * Lấy con giáp từ năm sinh
 */
export function getZodiacAnimal(lunarYear: number): DiaChi {
  const chiIndex = (lunarYear - 4) % 12;
  return DIA_CHI[chiIndex >= 0 ? chiIndex : chiIndex + 12];
}

/**
 * Lấy thông tin năm Can Chi
 */
export function getYearCanChi(lunarYear: number): { can: ThienCan; chi: DiaChi; name: string } {
  const canIndex = (lunarYear - 4) % 10;
  const chiIndex = (lunarYear - 4) % 12;
  const can = THIEN_CAN[canIndex >= 0 ? canIndex : canIndex + 10];
  const chi = DIA_CHI[chiIndex >= 0 ? chiIndex : chiIndex + 12];
  
  return {
    can,
    chi,
    name: `${can.name} ${chi.name}`,
  };
}

/**
 * Kiểm tra năm có tháng nhuận không
 */
export function hasLeapMonth(lunarYear: number): boolean {
  return getLeapMonth(lunarYear) > 0;
}

/**
 * Lấy thông tin tháng nhuận
 */
export function getLeapMonthInfo(lunarYear: number): { month: number; days: number } | null {
  const leapMonth = getLeapMonth(lunarYear);
  if (leapMonth === 0) return null;
  
  return {
    month: leapMonth,
    days: getLeapMonthDays(lunarYear),
  };
}

// ============================================
// VALIDATION & TESTING
// ============================================

/**
 * Validate kết quả chuyển đổi
 * Test cases đã biết:
 * - 25/10/1979 → 5/9/Kỷ Mùi (âm lịch)
 * - 01/01/2000 → 25/11/Kỷ Mão
 * - 31/01/1900 → 1/1/Canh Tý
 */
export function validateConversion(): boolean {
  const testCases = [
    { solar: new Date(1979, 9, 25), expectedLunar: { year: 1979, month: 9, day: 5 } },
    { solar: new Date(2000, 0, 1), expectedLunar: { year: 1999, month: 11, day: 25 } },
    { solar: new Date(1900, 0, 31), expectedLunar: { year: 1900, month: 1, day: 1 } },
  ];
  
  let allPassed = true;
  
  for (const test of testCases) {
    const result = solarToLunar(test.solar);
    const passed = 
      result.year === test.expectedLunar.year &&
      result.month === test.expectedLunar.month &&
      result.day === test.expectedLunar.day;
    
    if (!passed) {
      console.error(`Test failed for ${test.solar.toDateString()}:`, {
        expected: test.expectedLunar,
        got: { year: result.year, month: result.month, day: result.day },
      });
      allPassed = false;
    }
  }
  
  return allPassed;
}

export default {
  solarToLunar,
  getBirthHour,
  getCanChiGio,
  createBirthInfo,
  formatLunarDate,
  getZodiacAnimal,
  getYearCanChi,
  hasLeapMonth,
  getLeapMonthInfo,
  validateConversion,
  THIEN_CAN,
  DIA_CHI,
  CANH_GIO,
};
