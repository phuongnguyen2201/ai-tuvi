/**
 * Phụ Tinh (Secondary Stars) Calculation Module
 * 
 * Bao gồm:
 * 1. Vòng Trường Sinh (12 sao)
 * 2. Vòng Lộc Tồn (13 sao)
 * 3. Vòng Thái Tuế (12 sao)
 * 4. Sao theo Can năm (Tứ Hóa, Thiên Khôi/Việt, etc.)
 * 5. Sao theo Chi năm (Thiên Mã, Hồng Loan, etc.)
 * 6. Sao theo tháng sinh (Tả Phù, Hữu Bật, etc.)
 * 7. Sao theo giờ sinh (Văn Xương, Văn Khúc, etc.)
 * 8. Sao kết hợp (Hỏa Tinh, Linh Tinh)
 */

// ========================= INTERFACES =========================

export interface PhuTinh {
  id: string;
  name: string;
  category: 'truong_sinh' | 'loc_ton' | 'thai_tue' | 'can_nam' | 'chi_nam' | 'thang_sinh' | 'gio_sinh' | 'ket_hop';
  nature: 'cát' | 'hung' | 'trung_tính';
}

export interface PhuTinhResult {
  position: number; // Vị trí trên địa bàn (0=Dần, 1=Mão, ...)
  star: PhuTinh;
}

export interface BirthInfoForPhuTinh {
  lunarDay: number;
  lunarMonth: number;
  birthHourIndex: number; // 0=Tý, 1=Sửu, ...
  canNamIndex: number;    // 0=Giáp, 1=Ất, ...
  chiNamIndex: number;    // 0=Tý, 1=Sửu, ...
  gender: 'male' | 'female';
  isYangYear: boolean;    // Năm Dương (Giáp, Bính, Mậu, Canh, Nhâm)
  cucSo: number;          // 2-6
}

// ========================= CONSTANTS =========================

const DIA_BAN = ['Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu'] as const;

/**
 * Chuyển từ Địa Chi index (0=Tý) sang Địa Bàn position (0=Dần)
 */
function diaChiToPosition(chiIndex: number): number {
  // Tý(0) -> position 10, Sửu(1) -> 11, Dần(2) -> 0, ...
  return (chiIndex + 10) % 12;
}

/**
 * Chuyển từ Địa Bàn position (0=Dần) sang Địa Chi index (0=Tý)
 */
function positionToDiaChi(position: number): number {
  return (position + 2) % 12;
}

// ========================= 1. VÒNG TRƯỜNG SINH (12 sao) =========================

const TRUONG_SINH_STARS: PhuTinh[] = [
  { id: 'truong-sinh', name: 'Trường Sinh', category: 'truong_sinh', nature: 'cát' },
  { id: 'moc-duc', name: 'Mộc Dục', category: 'truong_sinh', nature: 'trung_tính' },
  { id: 'quan-doi', name: 'Quan Đới', category: 'truong_sinh', nature: 'cát' },
  { id: 'lam-quan', name: 'Lâm Quan', category: 'truong_sinh', nature: 'cát' },
  { id: 'de-vuong', name: 'Đế Vượng', category: 'truong_sinh', nature: 'cát' },
  { id: 'suy', name: 'Suy', category: 'truong_sinh', nature: 'hung' },
  { id: 'benh', name: 'Bệnh', category: 'truong_sinh', nature: 'hung' },
  { id: 'tu', name: 'Tử', category: 'truong_sinh', nature: 'hung' },
  { id: 'mo', name: 'Mộ', category: 'truong_sinh', nature: 'trung_tính' },
  { id: 'tuyet', name: 'Tuyệt', category: 'truong_sinh', nature: 'hung' },
  { id: 'thai', name: 'Thai', category: 'truong_sinh', nature: 'trung_tính' },
  { id: 'duong', name: 'Dưỡng', category: 'truong_sinh', nature: 'cát' },
];

/**
 * Vị trí khởi đầu Trường Sinh theo Cục
 * Địa bàn position (0=Dần)
 */
const TRUONG_SINH_START: Record<number, number> = {
  2: 6,  // Thủy Nhị Cục: Thân (position 6)
  3: 9,  // Mộc Tam Cục: Hợi (position 9)
  4: 3,  // Kim Tứ Cục: Tỵ (position 3)
  5: 6,  // Thổ Ngũ Cục: Thân (position 6)
  6: 0,  // Hỏa Lục Cục: Dần (position 0)
};

/**
 * Tính vòng Trường Sinh
 * @param cucSo - Cục số (2-6)
 * @param isYangMale - Dương Nam hoặc Âm Nữ = true (đi thuận), ngược lại = false (đi nghịch)
 */
export function calculateTruongSinh(cucSo: number, isYangMale: boolean): PhuTinhResult[] {
  const startPos = TRUONG_SINH_START[cucSo] ?? 0;
  const direction = isYangMale ? 1 : -1; // Thuận (+1) hoặc Nghịch (-1)
  
  return TRUONG_SINH_STARS.map((star, index) => ({
    position: (startPos + index * direction + 120) % 12,
    star,
  }));
}

// ========================= 2. VÒNG LỘC TỒN (13 sao) =========================

const LOC_TON_STARS: PhuTinh[] = [
  { id: 'loc-ton', name: 'Lộc Tồn', category: 'loc_ton', nature: 'cát' },
  { id: 'bac-si', name: 'Bác Sĩ', category: 'loc_ton', nature: 'cát' },
  { id: 'luc-si', name: 'Lực Sĩ', category: 'loc_ton', nature: 'cát' },
  { id: 'thanh-long', name: 'Thanh Long', category: 'loc_ton', nature: 'cát' },
  { id: 'tieu-hao', name: 'Tiểu Hao', category: 'loc_ton', nature: 'hung' },
  { id: 'tuong-quan', name: 'Tướng Quân', category: 'loc_ton', nature: 'cát' },
  { id: 'tau-thu', name: 'Tấu Thư', category: 'loc_ton', nature: 'cát' },
  { id: 'phi-liem', name: 'Phi Liêm', category: 'loc_ton', nature: 'hung' },
  { id: 'hy-than', name: 'Hỷ Thần', category: 'loc_ton', nature: 'cát' },
  { id: 'benh-phu', name: 'Bệnh Phù', category: 'loc_ton', nature: 'hung' },
  { id: 'dai-hao', name: 'Đại Hao', category: 'loc_ton', nature: 'hung' },
  { id: 'phuc-binh', name: 'Phục Binh', category: 'loc_ton', nature: 'hung' },
  { id: 'quan-phu-loc', name: 'Quan Phủ', category: 'loc_ton', nature: 'hung' },
];

/**
 * Vị trí Lộc Tồn theo Can năm
 * Index = canNamIndex, Value = địa bàn position
 */
const LOC_TON_POSITION: Record<number, number> = {
  0: 0,   // Giáp -> Dần
  1: 1,   // Ất -> Mão
  2: 3,   // Bính -> Tỵ
  3: 4,   // Đinh -> Ngọ
  4: 3,   // Mậu -> Tỵ
  5: 4,   // Kỷ -> Ngọ
  6: 6,   // Canh -> Thân
  7: 7,   // Tân -> Dậu
  8: 9,   // Nhâm -> Hợi
  9: 10,  // Quý -> Tý
};

/**
 * Tính vòng Lộc Tồn
 * Lộc Tồn và Bác Sĩ cùng vị trí
 * Dương Nam/Âm Nữ: đi thuận từ Lộc Tồn
 * Âm Nam/Dương Nữ: đi nghịch từ Lộc Tồn
 */
export function calculateLocTon(canNamIndex: number, isYangMale: boolean): PhuTinhResult[] {
  const locTonPos = LOC_TON_POSITION[canNamIndex] ?? 0;
  const direction = isYangMale ? 1 : -1;
  
  const results: PhuTinhResult[] = [];
  
  // Lộc Tồn và Bác Sĩ cùng vị trí
  results.push({ position: locTonPos, star: LOC_TON_STARS[0] }); // Lộc Tồn
  results.push({ position: locTonPos, star: LOC_TON_STARS[1] }); // Bác Sĩ
  
  // Các sao còn lại
  for (let i = 2; i < LOC_TON_STARS.length; i++) {
    const pos = (locTonPos + (i - 1) * direction + 120) % 12;
    results.push({ position: pos, star: LOC_TON_STARS[i] });
  }
  
  return results;
}

/**
 * Tính Kình Dương và Đà La (liên quan đến Lộc Tồn)
 * Kình Dương: trước Lộc Tồn 1 cung (thuận)
 * Đà La: sau Lộc Tồn 1 cung (nghịch)
 */
export function calculateKinhDuongDaLa(canNamIndex: number): PhuTinhResult[] {
  const locTonPos = LOC_TON_POSITION[canNamIndex] ?? 0;
  
  return [
    {
      position: (locTonPos + 1) % 12,
      star: { id: 'kinh-duong', name: 'Kình Dương', category: 'can_nam', nature: 'hung' },
    },
    {
      position: (locTonPos - 1 + 12) % 12,
      star: { id: 'da-la', name: 'Đà La', category: 'can_nam', nature: 'hung' },
    },
  ];
}

// ========================= 3. VÒNG THÁI TUẾ (12 sao) =========================

const THAI_TUE_STARS: PhuTinh[] = [
  { id: 'thai-tue', name: 'Thái Tuế', category: 'thai_tue', nature: 'hung' },
  { id: 'thieu-duong', name: 'Thiếu Dương', category: 'thai_tue', nature: 'cát' },
  { id: 'tang-mon', name: 'Tang Môn', category: 'thai_tue', nature: 'hung' },
  { id: 'thieu-am', name: 'Thiếu Âm', category: 'thai_tue', nature: 'trung_tính' },
  { id: 'quan-phu-tue', name: 'Quan Phù', category: 'thai_tue', nature: 'hung' },
  { id: 'tu-phu', name: 'Tử Phù', category: 'thai_tue', nature: 'hung' },
  { id: 'tue-pha', name: 'Tuế Phá', category: 'thai_tue', nature: 'hung' },
  { id: 'long-duc', name: 'Long Đức', category: 'thai_tue', nature: 'cát' },
  { id: 'bach-ho', name: 'Bạch Hổ', category: 'thai_tue', nature: 'hung' },
  { id: 'phuc-duc', name: 'Phúc Đức', category: 'thai_tue', nature: 'cát' },
  { id: 'dieu-khach', name: 'Điếu Khách', category: 'thai_tue', nature: 'hung' },
  { id: 'truc-phu', name: 'Trực Phù', category: 'thai_tue', nature: 'trung_tính' },
];

/**
 * Tính vòng Thái Tuế
 * Thái Tuế đóng tại cung có Chi = Chi năm sinh
 * Các sao khác đi thuận từ đó
 */
export function calculateThaiTue(chiNamIndex: number): PhuTinhResult[] {
  const thaiTuePos = diaChiToPosition(chiNamIndex);
  
  return THAI_TUE_STARS.map((star, index) => ({
    position: (thaiTuePos + index) % 12,
    star,
  }));
}

// ========================= 4. SAO THEO CAN NĂM =========================

/**
 * Bảng Thiên Khôi theo Can năm
 */
const THIEN_KHOI_TABLE: Record<number, number> = {
  0: 11,  // Giáp -> Sửu
  1: 10,  // Ất -> Tý
  2: 9,   // Bính -> Hợi
  3: 9,   // Đinh -> Hợi
  4: 11,  // Mậu -> Sửu
  5: 10,  // Kỷ -> Tý
  6: 4,   // Canh -> Ngọ
  7: 4,   // Tân -> Ngọ
  8: 1,   // Nhâm -> Mão
  9: 1,   // Quý -> Mão
};

/**
 * Bảng Thiên Việt theo Can năm
 */
const THIEN_VIET_TABLE: Record<number, number> = {
  0: 5,   // Giáp -> Mùi
  1: 6,   // Ất -> Thân
  2: 7,   // Bính -> Dậu
  3: 7,   // Đinh -> Dậu
  4: 5,   // Mậu -> Mùi
  5: 6,   // Kỷ -> Thân
  6: 0,   // Canh -> Dần
  7: 0,   // Tân -> Dần
  8: 3,   // Nhâm -> Tỵ
  9: 3,   // Quý -> Tỵ
};

/**
 * Bảng Tứ Hóa theo Can năm
 * [Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ] -> tên sao chính tinh
 */
const TU_HOA_TABLE: Record<number, string[]> = {
  0: ['liem-trinh', 'pha-quan', 'vu-khuc', 'thai-duong'],     // Giáp
  1: ['thien-co', 'thien-luong', 'tu-vi', 'thai-am'],         // Ất
  2: ['thien-dong', 'thien-co', 'van-xuong', 'liem-trinh'],   // Bính
  3: ['thai-am', 'thien-dong', 'thien-co', 'cu-mon'],         // Đinh
  4: ['tham-lang', 'thai-am', 'thai-duong', 'thien-co'],      // Mậu
  5: ['vu-khuc', 'tham-lang', 'thien-luong', 'van-khuc'],     // Kỷ
  6: ['thai-duong', 'vu-khuc', 'thien-dong', 'thien-tuong'],  // Canh
  7: ['cu-mon', 'thai-duong', 'van-khuc', 'van-xuong'],       // Tân
  8: ['thien-luong', 'tu-vi', 'ta-phu', 'vu-khuc'],           // Nhâm
  9: ['pha-quan', 'cu-mon', 'thai-am', 'tham-lang'],          // Quý
};

/**
 * Tính Thiên Khôi, Thiên Việt
 */
export function calculateThienKhoiViet(canNamIndex: number): PhuTinhResult[] {
  return [
    {
      position: THIEN_KHOI_TABLE[canNamIndex] ?? 0,
      star: { id: 'thien-khoi', name: 'Thiên Khôi', category: 'can_nam', nature: 'cát' },
    },
    {
      position: THIEN_VIET_TABLE[canNamIndex] ?? 0,
      star: { id: 'thien-viet', name: 'Thiên Việt', category: 'can_nam', nature: 'cát' },
    },
  ];
}

/**
 * Get Tứ Hóa info (returns star IDs that receive each Hóa)
 */
export function getTuHoaInfo(canNamIndex: number): { hoaLoc: string; hoaQuyen: string; hoaKhoa: string; hoaKy: string } {
  const hoa = TU_HOA_TABLE[canNamIndex] ?? ['', '', '', ''];
  return {
    hoaLoc: hoa[0],
    hoaQuyen: hoa[1],
    hoaKhoa: hoa[2],
    hoaKy: hoa[3],
  };
}

/**
 * Bảng Tuần Không theo năm Giáp
 * Key = (năm - 4) % 60 / 10 (nhóm Giáp)
 */
const TUAN_KHONG_TABLE: Record<number, number[]> = {
  0: [8, 9],   // Giáp Tý -> Tuất, Hợi
  1: [10, 11], // Giáp Dần -> Tý, Sửu
  2: [0, 1],   // Giáp Thìn -> Dần, Mão
  3: [2, 3],   // Giáp Ngọ -> Thìn, Tỵ
  4: [4, 5],   // Giáp Thân -> Ngọ, Mùi
  5: [6, 7],   // Giáp Tuất -> Thân, Dậu
};

/**
 * Tính Tuần Không (2 cung)
 */
export function calculateTuanKhong(canNamIndex: number, chiNamIndex: number): PhuTinhResult[] {
  // Tìm nhóm Giáp
  const giaIndex = Math.floor(((canNamIndex - chiNamIndex + 12) % 12) / 2) % 6;
  const positions = TUAN_KHONG_TABLE[giaIndex] ?? [8, 9];
  
  return [
    {
      position: positions[0],
      star: { id: 'tuan-khong-1', name: 'Tuần', category: 'can_nam', nature: 'hung' },
    },
    {
      position: positions[1],
      star: { id: 'tuan-khong-2', name: 'Tuần', category: 'can_nam', nature: 'hung' },
    },
  ];
}

/**
 * Bảng Triệt Không theo Can năm
 */
const TRIET_KHONG_TABLE: Record<number, number[]> = {
  0: [6, 7],   // Giáp -> Thân, Dậu
  1: [4, 5],   // Ất -> Ngọ, Mùi
  2: [2, 3],   // Bính -> Thìn, Tỵ
  3: [0, 1],   // Đinh -> Dần, Mão
  4: [10, 11], // Mậu -> Tý, Sửu
  5: [6, 7],   // Kỷ -> Thân, Dậu
  6: [4, 5],   // Canh -> Ngọ, Mùi
  7: [2, 3],   // Tân -> Thìn, Tỵ
  8: [0, 1],   // Nhâm -> Dần, Mão
  9: [10, 11], // Quý -> Tý, Sửu
};

/**
 * Tính Triệt Không (2 cung)
 */
export function calculateTrietKhong(canNamIndex: number): PhuTinhResult[] {
  const positions = TRIET_KHONG_TABLE[canNamIndex] ?? [0, 1];
  
  return [
    {
      position: positions[0],
      star: { id: 'triet-khong-1', name: 'Triệt', category: 'can_nam', nature: 'hung' },
    },
    {
      position: positions[1],
      star: { id: 'triet-khong-2', name: 'Triệt', category: 'can_nam', nature: 'hung' },
    },
  ];
}

// ========================= 5. SAO THEO CHI NĂM =========================

/**
 * Bảng Thiên Mã theo Chi năm
 */
const THIEN_MA_TABLE: Record<number, number> = {
  0: 0,   // Tý -> Dần
  1: 9,   // Sửu -> Hợi
  2: 6,   // Dần -> Thân
  3: 3,   // Mão -> Tỵ
  4: 0,   // Thìn -> Dần
  5: 9,   // Tỵ -> Hợi
  6: 6,   // Ngọ -> Thân
  7: 3,   // Mùi -> Tỵ
  8: 0,   // Thân -> Dần
  9: 9,   // Dậu -> Hợi
  10: 6,  // Tuất -> Thân
  11: 3,  // Hợi -> Tỵ
};

/**
 * Bảng Hồng Loan theo Chi năm
 */
const HONG_LOAN_TABLE: Record<number, number> = {
  0: 1,   // Tý -> Mão
  1: 0,   // Sửu -> Dần
  2: 11,  // Dần -> Sửu
  3: 10,  // Mão -> Tý
  4: 9,   // Thìn -> Hợi
  5: 8,   // Tỵ -> Tuất
  6: 7,   // Ngọ -> Dậu
  7: 6,   // Mùi -> Thân
  8: 5,   // Thân -> Mùi
  9: 4,   // Dậu -> Ngọ
  10: 3,  // Tuất -> Tỵ
  11: 2,  // Hợi -> Thìn
};

/**
 * Bảng Thiên Hỷ theo Chi năm
 */
const THIEN_HY_TABLE: Record<number, number> = {
  0: 7,   // Tý -> Dậu
  1: 6,   // Sửu -> Thân
  2: 5,   // Dần -> Mùi
  3: 4,   // Mão -> Ngọ
  4: 3,   // Thìn -> Tỵ
  5: 2,   // Tỵ -> Thìn
  6: 1,   // Ngọ -> Mão
  7: 0,   // Mùi -> Dần
  8: 11,  // Thân -> Sửu
  9: 10,  // Dậu -> Tý
  10: 9,  // Tuất -> Hợi
  11: 8,  // Hợi -> Tuất
};

/**
 * Bảng Đào Hoa theo Chi năm
 */
const DAO_HOA_TABLE: Record<number, number> = {
  0: 7,   // Tý -> Dậu
  1: 4,   // Sửu -> Ngọ
  2: 1,   // Dần -> Mão
  3: 10,  // Mão -> Tý
  4: 7,   // Thìn -> Dậu
  5: 4,   // Tỵ -> Ngọ
  6: 1,   // Ngọ -> Mão
  7: 10,  // Mùi -> Tý
  8: 7,   // Thân -> Dậu
  9: 4,   // Dậu -> Ngọ
  10: 1,  // Tuất -> Mão
  11: 10, // Hợi -> Tý
};

/**
 * Bảng Cô Thần theo Chi năm
 */
const CO_THAN_TABLE: Record<number, number> = {
  0: 0,   // Tý -> Dần
  1: 0,   // Sửu -> Dần
  2: 3,   // Dần -> Tỵ
  3: 3,   // Mão -> Tỵ
  4: 3,   // Thìn -> Tỵ
  5: 6,   // Tỵ -> Thân
  6: 6,   // Ngọ -> Thân
  7: 6,   // Mùi -> Thân
  8: 9,   // Thân -> Hợi
  9: 9,   // Dậu -> Hợi
  10: 9,  // Tuất -> Hợi
  11: 0,  // Hợi -> Dần
};

/**
 * Bảng Quả Tú theo Chi năm
 */
const QUA_TU_TABLE: Record<number, number> = {
  0: 8,   // Tý -> Tuất
  1: 8,   // Sửu -> Tuất
  2: 11,  // Dần -> Sửu
  3: 11,  // Mão -> Sửu
  4: 11,  // Thìn -> Sửu
  5: 2,   // Tỵ -> Thìn
  6: 2,   // Ngọ -> Thìn
  7: 2,   // Mùi -> Thìn
  8: 5,   // Thân -> Mùi
  9: 5,   // Dậu -> Mùi
  10: 5,  // Tuất -> Mùi
  11: 8,  // Hợi -> Tuất
};

/**
 * Tính các sao theo Chi năm
 */
export function calculateChiNamStars(chiNamIndex: number): PhuTinhResult[] {
  return [
    {
      position: THIEN_MA_TABLE[chiNamIndex] ?? 0,
      star: { id: 'thien-ma', name: 'Thiên Mã', category: 'chi_nam', nature: 'cát' },
    },
    {
      position: HONG_LOAN_TABLE[chiNamIndex] ?? 0,
      star: { id: 'hong-loan', name: 'Hồng Loan', category: 'chi_nam', nature: 'cát' },
    },
    {
      position: (HONG_LOAN_TABLE[chiNamIndex] + 6) % 12, // Thiên Hỉ đối xứng Hồng Loan
      star: { id: 'thien-hi', name: 'Thiên Hỉ', category: 'chi_nam', nature: 'cát' },
    },
    {
      position: DAO_HOA_TABLE[chiNamIndex] ?? 0,
      star: { id: 'dao-hoa', name: 'Đào Hoa', category: 'chi_nam', nature: 'trung_tính' },
    },
    {
      position: CO_THAN_TABLE[chiNamIndex] ?? 0,
      star: { id: 'co-than', name: 'Cô Thần', category: 'chi_nam', nature: 'hung' },
    },
    {
      position: QUA_TU_TABLE[chiNamIndex] ?? 0,
      star: { id: 'qua-tu', name: 'Quả Tú', category: 'chi_nam', nature: 'hung' },
    },
  ];
}

// ========================= 6. SAO THEO THÁNG SINH =========================

/**
 * Tính Tả Phù (từ Thìn đếm thuận theo tháng)
 */
export function calculateTaPhu(lunarMonth: number): PhuTinhResult {
  const position = (2 + lunarMonth - 1) % 12; // Thìn = position 2, tháng 1
  return {
    position,
    star: { id: 'ta-phu', name: 'Tả Phù', category: 'thang_sinh', nature: 'cát' },
  };
}

/**
 * Tính Hữu Bật (từ Tuất đếm nghịch theo tháng)
 */
export function calculateHuuBat(lunarMonth: number): PhuTinhResult {
  const position = (8 - (lunarMonth - 1) + 12) % 12; // Tuất = position 8, tháng 1
  return {
    position,
    star: { id: 'huu-bat', name: 'Hữu Bật', category: 'thang_sinh', nature: 'cát' },
  };
}

/**
 * Tính Thiên Hình (từ Dậu đếm thuận theo tháng)
 */
export function calculateThienHinh(lunarMonth: number): PhuTinhResult {
  const position = (7 + lunarMonth - 1) % 12; // Dậu = position 7, tháng 1
  return {
    position,
    star: { id: 'thien-hinh', name: 'Thiên Hình', category: 'thang_sinh', nature: 'hung' },
  };
}

/**
 * Tính Thiên Riêu (từ Sửu đếm thuận theo tháng)
 */
export function calculateThienRieu(lunarMonth: number): PhuTinhResult {
  const position = (11 + lunarMonth - 1) % 12; // Sửu = position 11, tháng 1
  return {
    position,
    star: { id: 'thien-rieu', name: 'Thiên Riêu', category: 'thang_sinh', nature: 'trung_tính' },
  };
}

/**
 * Tính tất cả sao theo tháng sinh
 */
export function calculateThangSinhStars(lunarMonth: number): PhuTinhResult[] {
  return [
    calculateTaPhu(lunarMonth),
    calculateHuuBat(lunarMonth),
    calculateThienHinh(lunarMonth),
    calculateThienRieu(lunarMonth),
  ];
}

// ========================= 7. SAO THEO GIỜ SINH =========================

/**
 * Tính Văn Xương (từ Tuất đếm nghịch theo giờ)
 */
export function calculateVanXuong(birthHourIndex: number): PhuTinhResult {
  const position = (8 - birthHourIndex + 12) % 12; // Tuất = position 8, giờ Tý
  return {
    position,
    star: { id: 'van-xuong', name: 'Văn Xương', category: 'gio_sinh', nature: 'cát' },
  };
}

/**
 * Tính Văn Khúc (từ Thìn đếm thuận theo giờ)
 */
export function calculateVanKhuc(birthHourIndex: number): PhuTinhResult {
  const position = (2 + birthHourIndex) % 12; // Thìn = position 2, giờ Tý
  return {
    position,
    star: { id: 'van-khuc', name: 'Văn Khúc', category: 'gio_sinh', nature: 'cát' },
  };
}

/**
 * Tính Địa Không (từ Hợi đếm nghịch theo giờ)
 */
export function calculateDiaKhong(birthHourIndex: number): PhuTinhResult {
  const position = (9 - birthHourIndex + 12) % 12; // Hợi = position 9, giờ Tý
  return {
    position,
    star: { id: 'dia-khong', name: 'Địa Không', category: 'gio_sinh', nature: 'hung' },
  };
}

/**
 * Tính Địa Kiếp (từ Hợi đếm thuận theo giờ)
 */
export function calculateDiaKiep(birthHourIndex: number): PhuTinhResult {
  const position = (9 + birthHourIndex) % 12; // Hợi = position 9, giờ Tý
  return {
    position,
    star: { id: 'dia-kiep', name: 'Địa Kiếp', category: 'gio_sinh', nature: 'hung' },
  };
}

/**
 * Tính tất cả sao theo giờ sinh
 */
export function calculateGioSinhStars(birthHourIndex: number): PhuTinhResult[] {
  return [
    calculateVanXuong(birthHourIndex),
    calculateVanKhuc(birthHourIndex),
    calculateDiaKhong(birthHourIndex),
    calculateDiaKiep(birthHourIndex),
  ];
}

// ========================= 8. SAO KẾT HỢP (Hỏa Tinh, Linh Tinh) =========================

/**
 * Cung khởi Hỏa Tinh theo Chi năm
 */
const HOA_TINH_START: Record<string, number> = {
  'dan-ngo-tuat': 11,  // Dần, Ngọ, Tuất -> Sửu
  'than-ty-thin': 0,   // Thân, Tý, Thìn -> Dần
  'ty-dau-suu': 1,     // Tỵ, Dậu, Sửu -> Mão
  'hoi-mao-mui': 7,    // Hợi, Mão, Mùi -> Dậu
};

/**
 * Cung khởi Linh Tinh theo Chi năm
 */
const LINH_TINH_START: Record<string, number> = {
  'dan-ngo-tuat': 1,   // Dần, Ngọ, Tuất -> Mão
  'than-ty-thin': 8,   // Thân, Tý, Thìn -> Tuất
  'ty-dau-suu': 8,     // Tỵ, Dậu, Sửu -> Tuất
  'hoi-mao-mui': 8,    // Hợi, Mão, Mùi -> Tuất
};

function getChiGroup(chiNamIndex: number): string {
  if ([2, 6, 10].includes(chiNamIndex)) return 'dan-ngo-tuat';  // Dần(2), Ngọ(6), Tuất(10)
  if ([8, 0, 4].includes(chiNamIndex)) return 'than-ty-thin';   // Thân(8), Tý(0), Thìn(4)
  if ([5, 9, 1].includes(chiNamIndex)) return 'ty-dau-suu';     // Tỵ(5), Dậu(9), Sửu(1)
  return 'hoi-mao-mui';                                          // Hợi(11), Mão(3), Mùi(7)
}

/**
 * Tính Hỏa Tinh và Linh Tinh
 * Dương Nam/Âm Nữ: Hỏa đi thuận, Linh đi nghịch
 * Âm Nam/Dương Nữ: Hỏa đi nghịch, Linh đi thuận
 */
export function calculateHoaLinhTinh(
  chiNamIndex: number, 
  birthHourIndex: number, 
  isYangMale: boolean
): PhuTinhResult[] {
  const chiGroup = getChiGroup(chiNamIndex);
  const hoaStart = HOA_TINH_START[chiGroup] ?? 0;
  const linhStart = LINH_TINH_START[chiGroup] ?? 0;
  
  let hoaPos: number;
  let linhPos: number;
  
  if (isYangMale) {
    // Dương Nam/Âm Nữ: Hỏa thuận, Linh nghịch
    hoaPos = (hoaStart + birthHourIndex) % 12;
    linhPos = (linhStart - birthHourIndex + 12) % 12;
  } else {
    // Âm Nam/Dương Nữ: Hỏa nghịch, Linh thuận
    hoaPos = (hoaStart - birthHourIndex + 12) % 12;
    linhPos = (linhStart + birthHourIndex) % 12;
  }
  
  return [
    {
      position: hoaPos,
      star: { id: 'hoa-tinh', name: 'Hỏa Tinh', category: 'ket_hop', nature: 'hung' },
    },
    {
      position: linhPos,
      star: { id: 'linh-tinh', name: 'Linh Tinh', category: 'ket_hop', nature: 'hung' },
    },
  ];
}

// ========================= MAIN FUNCTION =========================

/**
 * Tính tất cả phụ tinh
 */
export function calculateAllPhuTinh(info: BirthInfoForPhuTinh): PhuTinhResult[] {
  const isYangMale = (info.isYangYear && info.gender === 'male') || 
                     (!info.isYangYear && info.gender === 'female');
  
  const results: PhuTinhResult[] = [];
  
  // 1. Vòng Trường Sinh
  results.push(...calculateTruongSinh(info.cucSo, isYangMale));
  
  // 2. Vòng Lộc Tồn
  results.push(...calculateLocTon(info.canNamIndex, isYangMale));
  results.push(...calculateKinhDuongDaLa(info.canNamIndex));
  
  // 3. Vòng Thái Tuế
  results.push(...calculateThaiTue(info.chiNamIndex));
  
  // 4. Sao theo Can năm
  results.push(...calculateThienKhoiViet(info.canNamIndex));
  results.push(...calculateTuanKhong(info.canNamIndex, info.chiNamIndex));
  results.push(...calculateTrietKhong(info.canNamIndex));
  
  // 5. Sao theo Chi năm
  results.push(...calculateChiNamStars(info.chiNamIndex));
  
  // 6. Sao theo tháng sinh
  results.push(...calculateThangSinhStars(info.lunarMonth));
  
  // 7. Sao theo giờ sinh
  results.push(...calculateGioSinhStars(info.birthHourIndex));
  
  // 8. Hỏa Tinh, Linh Tinh
  results.push(...calculateHoaLinhTinh(info.chiNamIndex, info.birthHourIndex, isYangMale));
  
  return results;
}

/**
 * Group phụ tinh theo vị trí (cung)
 */
export function groupPhuTinhByPosition(phuTinhList: PhuTinhResult[]): Map<number, PhuTinh[]> {
  const map = new Map<number, PhuTinh[]>();
  
  for (const item of phuTinhList) {
    const existing = map.get(item.position) || [];
    existing.push(item.star);
    map.set(item.position, existing);
  }
  
  return map;
}

// ========================= EXPORTS =========================

export {
  DIA_BAN,
  TRUONG_SINH_STARS,
  LOC_TON_STARS,
  THAI_TUE_STARS,
};
