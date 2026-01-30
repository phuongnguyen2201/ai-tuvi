/**
 * Vietnamese Zodiac Compatibility Module
 * Tính toán độ hợp tuổi giữa 12 con giáp
 */

// 12 con giáp theo thứ tự
export const ZODIAC_ANIMALS = [
  { chi: "Tý", animal: "Chuột", emoji: "🐀" },
  { chi: "Sửu", animal: "Trâu", emoji: "🐂" },
  { chi: "Dần", animal: "Hổ", emoji: "🐅" },
  { chi: "Mão", animal: "Mèo", emoji: "🐱" },
  { chi: "Thìn", animal: "Rồng", emoji: "🐉" },
  { chi: "Tỵ", animal: "Rắn", emoji: "🐍" },
  { chi: "Ngọ", animal: "Ngựa", emoji: "🐴" },
  { chi: "Mùi", animal: "Dê", emoji: "🐑" },
  { chi: "Thân", animal: "Khỉ", emoji: "🐵" },
  { chi: "Dậu", animal: "Gà", emoji: "🐔" },
  { chi: "Tuất", animal: "Chó", emoji: "🐕" },
  { chi: "Hợi", animal: "Heo", emoji: "🐷" },
] as const;

export type ZodiacChi = typeof ZODIAC_ANIMALS[number]["chi"];

/**
 * TAM HỢP - 4 nhóm tam hợp (3 tuổi rất hợp nhau)
 * Các tuổi trong cùng nhóm tam hợp hỗ trợ, bổ sung cho nhau
 */
export const TAM_HOP: ZodiacChi[][] = [
  ["Thân", "Tý", "Thìn"],   // Khỉ - Chuột - Rồng (Thủy cục)
  ["Hợi", "Mão", "Mùi"],    // Heo - Mèo - Dê (Mộc cục)
  ["Dần", "Ngọ", "Tuất"],   // Hổ - Ngựa - Chó (Hỏa cục)
  ["Tỵ", "Dậu", "Sửu"],     // Rắn - Gà - Trâu (Kim cục)
];

/**
 * LỤC HỢP - 6 cặp đại hợp (tốt nhất)
 * Đây là những cặp tuổi thiên định, hợp nhất trong 12 con giáp
 */
export const LUC_HOP: [ZodiacChi, ZodiacChi][] = [
  ["Tý", "Sửu"],    // Chuột - Trâu
  ["Dần", "Hợi"],   // Hổ - Heo
  ["Mão", "Tuất"],  // Mèo - Chó
  ["Thìn", "Dậu"],  // Rồng - Gà
  ["Tỵ", "Thân"],   // Rắn - Khỉ
  ["Ngọ", "Mùi"],   // Ngựa - Dê
];

/**
 * TƯƠNG XUNG (Lục Xung) - 6 cặp xung khắc
 * Các cặp tuổi đối nghịch nhau, dễ mâu thuẫn
 */
export const TUONG_XUNG: [ZodiacChi, ZodiacChi][] = [
  ["Tý", "Ngọ"],    // Chuột - Ngựa
  ["Sửu", "Mùi"],   // Trâu - Dê
  ["Dần", "Thân"],  // Hổ - Khỉ
  ["Mão", "Dậu"],   // Mèo - Gà
  ["Thìn", "Tuất"], // Rồng - Chó
  ["Tỵ", "Hợi"],    // Rắn - Heo
];

/**
 * TƯƠNG HẠI (Lục Hại) - 6 cặp tương hại
 * Các cặp tuổi gây hại cho nhau, khó hòa hợp
 */
export const TUONG_HAI: [ZodiacChi, ZodiacChi][] = [
  ["Tý", "Mùi"],    // Chuột - Dê
  ["Sửu", "Ngọ"],   // Trâu - Ngựa
  ["Dần", "Tỵ"],    // Hổ - Rắn
  ["Mão", "Thìn"],  // Mèo - Rồng
  ["Thân", "Hợi"],  // Khỉ - Heo
  ["Dậu", "Tuất"],  // Gà - Chó
];

/**
 * TƯƠNG HÌNH (Tam Hình) - Các nhóm tương hình
 * Gây bất hòa, tai họa
 */
export const TUONG_HINH: ZodiacChi[][] = [
  ["Dần", "Tỵ", "Thân"],  // Vô ân chi hình
  ["Sửu", "Tuất", "Mùi"], // Trì thế chi hình
  ["Tý", "Mão"],          // Vô lễ chi hình
  ["Thìn", "Thìn"],       // Tự hình
  ["Ngọ", "Ngọ"],         // Tự hình
  ["Dậu", "Dậu"],         // Tự hình
  ["Hợi", "Hợi"],         // Tự hình
];

/**
 * TƯƠNG PHÁ - 6 cặp tương phá
 * Gây phá hoại, cản trở lẫn nhau
 */
export const TUONG_PHA: [ZodiacChi, ZodiacChi][] = [
  ["Tý", "Dậu"],
  ["Sửu", "Thìn"],
  ["Dần", "Hợi"],
  ["Mão", "Ngọ"],
  ["Tỵ", "Thân"],
  ["Mùi", "Tuất"],
];

export type CompatibilityLevel = "Đại Hợp" | "Hợp" | "Bình Thường" | "Kỵ" | "Đại Kỵ";

export interface CompatibilityResult {
  score: number;
  level: CompatibilityLevel;
  explanation: string;
  advice: string;
  details: {
    isLucHop: boolean;
    isTamHop: boolean;
    isTuongXung: boolean;
    isTuongHai: boolean;
    isTuongHinh: boolean;
    isTuongPha: boolean;
  };
}

/**
 * Kiểm tra hai tuổi có trong cùng một cặp/nhóm không
 */
const isPairInList = (zodiac1: ZodiacChi, zodiac2: ZodiacChi, pairs: [ZodiacChi, ZodiacChi][]): boolean => {
  return pairs.some(([a, b]) => 
    (a === zodiac1 && b === zodiac2) || (a === zodiac2 && b === zodiac1)
  );
};

const isInSameGroup = (zodiac1: ZodiacChi, zodiac2: ZodiacChi, groups: ZodiacChi[][]): boolean => {
  return groups.some(group => group.includes(zodiac1) && group.includes(zodiac2));
};

/**
 * Tính độ hợp tuổi giữa hai con giáp
 */
export const calculateCompatibility = (zodiac1: ZodiacChi, zodiac2: ZodiacChi): CompatibilityResult => {
  // Kiểm tra các mối quan hệ
  const isLucHop = isPairInList(zodiac1, zodiac2, LUC_HOP);
  const isTamHop = isInSameGroup(zodiac1, zodiac2, TAM_HOP);
  const isTuongXung = isPairInList(zodiac1, zodiac2, TUONG_XUNG);
  const isTuongHai = isPairInList(zodiac1, zodiac2, TUONG_HAI);
  const isTuongHinh = isInSameGroup(zodiac1, zodiac2, TUONG_HINH);
  const isTuongPha = isPairInList(zodiac1, zodiac2, TUONG_PHA);

  const details = {
    isLucHop,
    isTamHop,
    isTuongXung,
    isTuongHai,
    isTuongHinh,
    isTuongPha,
  };

  // Cùng tuổi
  if (zodiac1 === zodiac2) {
    // Kiểm tra tự hình
    const selfPunishing = ["Thìn", "Ngọ", "Dậu", "Hợi"];
    if (selfPunishing.includes(zodiac1)) {
      return {
        score: 55,
        level: "Bình Thường",
        explanation: `Hai người cùng tuổi ${zodiac1} - thuộc nhóm Tự Hình. Tính cách giống nhau có thể gây xung đột.`,
        advice: "Cần học cách nhường nhịn và thấu hiểu lẫn nhau. Tránh cố chấp, bảo thủ.",
        details: { ...details, isTuongHinh: true },
      };
    }
    return {
      score: 70,
      level: "Bình Thường",
      explanation: `Hai người cùng tuổi ${zodiac1}. Có nhiều điểm chung trong tính cách và sở thích.`,
      advice: "Dễ hiểu nhau nhưng cần tránh đơn điệu. Hãy cùng nhau khám phá điều mới.",
      details,
    };
  }

  // LỤC HỢP - Đại Hợp (điểm cao nhất)
  if (isLucHop) {
    return {
      score: 95,
      level: "Đại Hợp",
      explanation: `${zodiac1} và ${zodiac2} thuộc Lục Hợp - cặp đôi thiên định, hạnh phúc viên mãn. Đây là sự kết hợp tuyệt vời nhất trong 12 con giáp.`,
      advice: "Hãy trân trọng mối quan hệ quý giá này. Cùng nhau phát triển và xây dựng tương lai tươi đẹp.",
      details,
    };
  }

  // TAM HỢP - Hợp
  if (isTamHop) {
    return {
      score: 85,
      level: "Hợp",
      explanation: `${zodiac1} và ${zodiac2} thuộc Tam Hợp - tương trợ lẫn nhau, cuộc sống hòa thuận. Cùng nhau phát triển và đạt được nhiều thành công.`,
      advice: "Đây là mối quan hệ tốt đẹp. Hãy tận dụng sự hỗ trợ lẫn nhau để cùng tiến bộ.",
      details,
    };
  }

  // TƯƠNG XUNG - Đại Kỵ (xấu nhất)
  if (isTuongXung) {
    return {
      score: 25,
      level: "Đại Kỵ",
      explanation: `${zodiac1} và ${zodiac2} thuộc Lục Xung - hai tuổi đối nghịch, dễ xảy ra mâu thuẫn và xung đột liên tục.`,
      advice: "Cần rất nhiều nỗ lực để duy trì mối quan hệ. Học cách kiểm soát cảm xúc, tránh tranh cãi. Có thể hóa giải bằng phong thủy.",
      details,
    };
  }

  // TƯƠNG HẠI - Kỵ
  if (isTuongHai) {
    return {
      score: 35,
      level: "Kỵ",
      explanation: `${zodiac1} và ${zodiac2} thuộc Lục Hại - hai tuổi gây hại cho nhau, khó hòa hợp trong cuộc sống.`,
      advice: "Cần thận trọng trong giao tiếp. Tránh những quyết định quan trọng khi đang bất đồng ý kiến.",
      details,
    };
  }

  // TƯƠNG HÌNH
  if (isTuongHinh) {
    return {
      score: 40,
      level: "Kỵ",
      explanation: `${zodiac1} và ${zodiac2} thuộc Tam Hình - dễ gây bất hòa, phiền não cho nhau.`,
      advice: "Cần kiên nhẫn và bao dung. Tránh áp đặt ý kiến cá nhân lên đối phương.",
      details,
    };
  }

  // TƯƠNG PHÁ
  if (isTuongPha) {
    return {
      score: 50,
      level: "Bình Thường",
      explanation: `${zodiac1} và ${zodiac2} thuộc Lục Phá - có thể gặp trở ngại nhưng không quá nghiêm trọng.`,
      advice: "Cần cởi mở và linh hoạt. Đừng quá cứng nhắc trong các vấn đề nhỏ.",
      details,
    };
  }

  // Mặc định - Bình thường
  return {
    score: 60,
    level: "Bình Thường",
    explanation: `${zodiac1} và ${zodiac2} không có mối quan hệ đặc biệt. Hạnh phúc phụ thuộc vào sự nỗ lực và thấu hiểu của cả hai bên.`,
    advice: "Mối quan hệ trung bình. Cần xây dựng sự tin tưởng và thấu hiểu lẫn nhau qua thời gian.",
    details,
  };
};

/**
 * Tìm 3 tuổi hợp nhất với một con giáp
 */
export const findBestMatches = (zodiac: ZodiacChi): { chi: ZodiacChi; score: number; level: CompatibilityLevel }[] => {
  const allZodiacs = ZODIAC_ANIMALS.map(z => z.chi);
  
  const results = allZodiacs
    .filter(z => z !== zodiac)
    .map(z => {
      const result = calculateCompatibility(zodiac, z);
      return { chi: z, score: result.score, level: result.level };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return results;
};

/**
 * Tìm 3 tuổi kỵ nhất với một con giáp
 */
export const findWorstMatches = (zodiac: ZodiacChi): { chi: ZodiacChi; score: number; level: CompatibilityLevel }[] => {
  const allZodiacs = ZODIAC_ANIMALS.map(z => z.chi);
  
  const results = allZodiacs
    .filter(z => z !== zodiac)
    .map(z => {
      const result = calculateCompatibility(zodiac, z);
      return { chi: z, score: result.score, level: result.level };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return results;
};

/**
 * Lấy thông tin con giáp từ tên Chi
 */
export const getZodiacInfo = (chi: ZodiacChi) => {
  return ZODIAC_ANIMALS.find(z => z.chi === chi);
};

/**
 * Lấy con giáp từ năm sinh
 */
export const getZodiacFromYear = (year: number): ZodiacChi => {
  const index = (year - 4) % 12;
  return ZODIAC_ANIMALS[index >= 0 ? index : index + 12].chi;
};
