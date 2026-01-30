/**
 * Ngũ Hành Nạp Âm - Vietnamese Five Elements System
 * File: lib/tuvi/nguHanh.ts
 * 
 * Tính mệnh (Kim/Mộc/Thủy/Hỏa/Thổ) dựa vào năm sinh Can Chi
 * Bảng Lục Thập Hoa Giáp - 60 năm Giáp Tý
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface NguHanhNapAm {
  name: string;           // Ngũ hành: Kim, Mộc, Thủy, Hỏa, Thổ
  napAm: string;          // Tên đầy đủ: Hải Trung Kim, Đại Lâm Mộc, etc.
  napAmHanViet: string;   // Hán Việt
  meaning: string;        // Ý nghĩa
  description: string;    // Mô tả chi tiết
  color: string;          // Màu may mắn
  colorHex: string;       // Mã màu
  direction: string;      // Hướng tốt
  luckyNumbers: number[]; // Số may mắn
  element: {
    generates: string;    // Sinh ra (tương sinh)
    generatedBy: string;  // Được sinh bởi
    controls: string;     // Khắc (khống chế)
    controlledBy: string; // Bị khắc bởi
  };
}

export interface NguHanhRelation {
  relation: 'tuong_sinh' | 'tuong_khac' | 'binh_hoa';
  description: string;
  compatibility: number; // 1-100
}

// ============================================
// NGŨ HÀNH CƠ BẢN
// ============================================

export const NGU_HANH = {
  Kim: {
    name: 'Kim',
    meaning: 'Kim loại, vàng bạc',
    color: 'Trắng, Vàng kim',
    colorHex: '#FFD700',
    direction: 'Tây',
    season: 'Thu',
    luckyNumbers: [4, 9],
    generates: 'Thủy',      // Kim sinh Thủy
    generatedBy: 'Thổ',     // Thổ sinh Kim
    controls: 'Mộc',        // Kim khắc Mộc
    controlledBy: 'Hỏa',    // Hỏa khắc Kim
  },
  Mộc: {
    name: 'Mộc',
    meaning: 'Cây cối, gỗ',
    color: 'Xanh lá, Xanh lục',
    colorHex: '#228B22',
    direction: 'Đông',
    season: 'Xuân',
    luckyNumbers: [3, 8],
    generates: 'Hỏa',       // Mộc sinh Hỏa
    generatedBy: 'Thủy',    // Thủy sinh Mộc
    controls: 'Thổ',        // Mộc khắc Thổ
    controlledBy: 'Kim',    // Kim khắc Mộc
  },
  Thủy: {
    name: 'Thủy',
    meaning: 'Nước',
    color: 'Đen, Xanh dương đậm',
    colorHex: '#000080',
    direction: 'Bắc',
    season: 'Đông',
    luckyNumbers: [1, 6],
    generates: 'Mộc',       // Thủy sinh Mộc
    generatedBy: 'Kim',     // Kim sinh Thủy
    controls: 'Hỏa',        // Thủy khắc Hỏa
    controlledBy: 'Thổ',    // Thổ khắc Thủy
  },
  Hỏa: {
    name: 'Hỏa',
    meaning: 'Lửa',
    color: 'Đỏ, Cam, Hồng',
    colorHex: '#FF4500',
    direction: 'Nam',
    season: 'Hạ',
    luckyNumbers: [2, 7],
    generates: 'Thổ',       // Hỏa sinh Thổ
    generatedBy: 'Mộc',     // Mộc sinh Hỏa
    controls: 'Kim',        // Hỏa khắc Kim
    controlledBy: 'Thủy',   // Thủy khắc Hỏa
  },
  Thổ: {
    name: 'Thổ',
    meaning: 'Đất',
    color: 'Vàng, Nâu',
    colorHex: '#DAA520',
    direction: 'Trung ương',
    season: 'Tứ quý (cuối mỗi mùa)',
    luckyNumbers: [0, 5],
    generates: 'Kim',       // Thổ sinh Kim
    generatedBy: 'Hỏa',     // Hỏa sinh Thổ
    controls: 'Thủy',       // Thổ khắc Thủy
    controlledBy: 'Mộc',    // Mộc khắc Thổ
  },
} as const;

// ============================================
// BẢNG NẠP ÂM - 60 NĂM GIÁP TÝ
// ============================================

/**
 * Bảng Lục Thập Hoa Giáp (60 năm)
 * Key: "CanChi" (không có dấu cách)
 * Mỗi cặp 2 năm liên tiếp có cùng Nạp Âm
 */
const NAP_AM_TABLE: Record<string, NguHanhNapAm> = {
  // ========== GIÁP TÝ - ẤT SỬU: HẢI TRUNG KIM ==========
  'GiápTý': {
    name: 'Kim',
    napAm: 'Hải Trung Kim',
    napAmHanViet: '海中金',
    meaning: 'Vàng trong biển',
    description: 'Kim loại quý ẩn sâu dưới đáy biển, tượng trưng cho sự tiềm ẩn, giá trị chưa được khám phá. Người mệnh này thường có tài năng tiềm ẩn, cần thời gian để tỏa sáng.',
    color: 'Trắng, Vàng kim',
    colorHex: '#FFD700',
    direction: 'Tây, Tây Bắc',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },
  'ẤtSửu': {
    name: 'Kim',
    napAm: 'Hải Trung Kim',
    napAmHanViet: '海中金',
    meaning: 'Vàng trong biển',
    description: 'Kim loại quý ẩn sâu dưới đáy biển, tượng trưng cho sự tiềm ẩn, giá trị chưa được khám phá. Người mệnh này thường có tài năng tiềm ẩn, cần thời gian để tỏa sáng.',
    color: 'Trắng, Vàng kim',
    colorHex: '#FFD700',
    direction: 'Tây, Tây Bắc',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },

  // ========== BÍNH DẦN - ĐINH MÃO: LÔ TRUNG HỎA ==========
  'BínhDần': {
    name: 'Hỏa',
    napAm: 'Lô Trung Hỏa',
    napAmHanViet: '爐中火',
    meaning: 'Lửa trong lò',
    description: 'Lửa được kiểm soát trong lò, tượng trưng cho sức mạnh được điều tiết. Người mệnh này nhiệt huyết nhưng biết kiềm chế, có khả năng lãnh đạo.',
    color: 'Đỏ, Cam, Hồng',
    colorHex: '#FF4500',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },
  'ĐinhMão': {
    name: 'Hỏa',
    napAm: 'Lô Trung Hỏa',
    napAmHanViet: '爐中火',
    meaning: 'Lửa trong lò',
    description: 'Lửa được kiểm soát trong lò, tượng trưng cho sức mạnh được điều tiết. Người mệnh này nhiệt huyết nhưng biết kiềm chế, có khả năng lãnh đạo.',
    color: 'Đỏ, Cam, Hồng',
    colorHex: '#FF4500',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },

  // ========== MẬU THÌN - KỶ TỴ: ĐẠI LÂM MỘC ==========
  'MậuThìn': {
    name: 'Mộc',
    napAm: 'Đại Lâm Mộc',
    napAmHanViet: '大林木',
    meaning: 'Cây rừng lớn',
    description: 'Cây đại thụ trong rừng già, tượng trưng cho sự vững chãi, bảo bọc. Người mệnh này thường đáng tin cậy, có thể che chở cho người khác.',
    color: 'Xanh lá, Xanh lục',
    colorHex: '#228B22',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },
  'KỷTỵ': {
    name: 'Mộc',
    napAm: 'Đại Lâm Mộc',
    napAmHanViet: '大林木',
    meaning: 'Cây rừng lớn',
    description: 'Cây đại thụ trong rừng già, tượng trưng cho sự vững chãi, bảo bọc. Người mệnh này thường đáng tin cậy, có thể che chở cho người khác.',
    color: 'Xanh lá, Xanh lục',
    colorHex: '#228B22',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },

  // ========== CANH NGỌ - TÂN MÙI: LỘ BÀNG THỔ ==========
  'CanhNgọ': {
    name: 'Thổ',
    napAm: 'Lộ Bàng Thổ',
    napAmHanViet: '路旁土',
    meaning: 'Đất bên đường',
    description: 'Đất ven đường đi, tượng trưng cho sự bình dị, gần gũi. Người mệnh này thường thân thiện, dễ hòa nhập nhưng đôi khi bị xem nhẹ.',
    color: 'Vàng, Nâu đất',
    colorHex: '#DAA520',
    direction: 'Trung ương, Tây Nam, Đông Bắc',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },
  'TânMùi': {
    name: 'Thổ',
    napAm: 'Lộ Bàng Thổ',
    napAmHanViet: '路旁土',
    meaning: 'Đất bên đường',
    description: 'Đất ven đường đi, tượng trưng cho sự bình dị, gần gũi. Người mệnh này thường thân thiện, dễ hòa nhập nhưng đôi khi bị xem nhẹ.',
    color: 'Vàng, Nâu đất',
    colorHex: '#DAA520',
    direction: 'Trung ương, Tây Nam, Đông Bắc',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },

  // ========== NHÂM THÂN - QUÝ DẬU: KIẾM PHONG KIM ==========
  'NhâmThân': {
    name: 'Kim',
    napAm: 'Kiếm Phong Kim',
    napAmHanViet: '劍鋒金',
    meaning: 'Vàng mũi kiếm',
    description: 'Kim loại được tôi luyện thành kiếm sắc bén, tượng trưng cho sự quyết đoán, sắc sảo. Người mệnh này thường thông minh, nhanh nhạy nhưng đôi khi quá sắc bén.',
    color: 'Trắng, Bạc',
    colorHex: '#C0C0C0',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },
  'QuýDậu': {
    name: 'Kim',
    napAm: 'Kiếm Phong Kim',
    napAmHanViet: '劍鋒金',
    meaning: 'Vàng mũi kiếm',
    description: 'Kim loại được tôi luyện thành kiếm sắc bén, tượng trưng cho sự quyết đoán, sắc sảo. Người mệnh này thường thông minh, nhanh nhạy nhưng đôi khi quá sắc bén.',
    color: 'Trắng, Bạc',
    colorHex: '#C0C0C0',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },

  // ========== GIÁP TUẤT - ẤT HỢI: SƠN ĐẦU HỎA ==========
  'GiápTuất': {
    name: 'Hỏa',
    napAm: 'Sơn Đầu Hỏa',
    napAmHanViet: '山頭火',
    meaning: 'Lửa đầu núi',
    description: 'Lửa cháy trên đỉnh núi, tượng trưng cho sự tỏa sáng, nổi bật. Người mệnh này thường có tham vọng cao, muốn được công nhận.',
    color: 'Đỏ, Cam',
    colorHex: '#FF6347',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },
  'ẤtHợi': {
    name: 'Hỏa',
    napAm: 'Sơn Đầu Hỏa',
    napAmHanViet: '山頭火',
    meaning: 'Lửa đầu núi',
    description: 'Lửa cháy trên đỉnh núi, tượng trưng cho sự tỏa sáng, nổi bật. Người mệnh này thường có tham vọng cao, muốn được công nhận.',
    color: 'Đỏ, Cam',
    colorHex: '#FF6347',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },

  // ========== BÍNH TÝ - ĐINH SỬU: GIẢN HẠ THỦY ==========
  'BínhTý': {
    name: 'Thủy',
    napAm: 'Giản Hạ Thủy',
    napAmHanViet: '澗下水',
    meaning: 'Nước dưới khe núi',
    description: 'Nước chảy dưới khe núi sâu, tượng trưng cho sự sâu sắc, ẩn mình. Người mệnh này thường trầm tĩnh, có chiều sâu nội tâm.',
    color: 'Đen, Xanh dương đậm',
    colorHex: '#000080',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },
  'ĐinhSửu': {
    name: 'Thủy',
    napAm: 'Giản Hạ Thủy',
    napAmHanViet: '澗下水',
    meaning: 'Nước dưới khe núi',
    description: 'Nước chảy dưới khe núi sâu, tượng trưng cho sự sâu sắc, ẩn mình. Người mệnh này thường trầm tĩnh, có chiều sâu nội tâm.',
    color: 'Đen, Xanh dương đậm',
    colorHex: '#000080',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },

  // ========== MẬU DẦN - KỶ MÃO: THÀNH ĐẦU THỔ ==========
  'MậuDần': {
    name: 'Thổ',
    napAm: 'Thành Đầu Thổ',
    napAmHanViet: '城頭土',
    meaning: 'Đất đầu thành',
    description: 'Đất xây thành lũy, tượng trưng cho sự vững chắc, bảo vệ. Người mệnh này thường đáng tin cậy, có trách nhiệm cao.',
    color: 'Vàng, Nâu',
    colorHex: '#D2691E',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },
  'KỷMão': {
    name: 'Thổ',
    napAm: 'Thành Đầu Thổ',
    napAmHanViet: '城頭土',
    meaning: 'Đất đầu thành',
    description: 'Đất xây thành lũy, tượng trưng cho sự vững chắc, bảo vệ. Người mệnh này thường đáng tin cậy, có trách nhiệm cao.',
    color: 'Vàng, Nâu',
    colorHex: '#D2691E',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },

  // ========== CANH THÌN - TÂN TỴ: BẠCH LẠP KIM ==========
  'CanhThìn': {
    name: 'Kim',
    napAm: 'Bạch Lạp Kim',
    napAmHanViet: '白蠟金',
    meaning: 'Vàng trong nến trắng',
    description: 'Vàng tinh khiết như sáp nến, tượng trưng cho sự thuần khiết, quý giá. Người mệnh này thường thanh cao, có phẩm chất tốt đẹp.',
    color: 'Trắng, Vàng nhạt',
    colorHex: '#FFFACD',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },
  'TânTỵ': {
    name: 'Kim',
    napAm: 'Bạch Lạp Kim',
    napAmHanViet: '白蠟金',
    meaning: 'Vàng trong nến trắng',
    description: 'Vàng tinh khiết như sáp nến, tượng trưng cho sự thuần khiết, quý giá. Người mệnh này thường thanh cao, có phẩm chất tốt đẹp.',
    color: 'Trắng, Vàng nhạt',
    colorHex: '#FFFACD',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },

  // ========== NHÂM NGỌ - QUÝ MÙI: DƯƠNG LIỄU MỘC ==========
  'NhâmNgọ': {
    name: 'Mộc',
    napAm: 'Dương Liễu Mộc',
    napAmHanViet: '楊柳木',
    meaning: 'Gỗ cây dương liễu',
    description: 'Cây liễu mềm mại, uyển chuyển, tượng trưng cho sự linh hoạt, thích nghi. Người mệnh này thường khéo léo, biết điều chỉnh theo hoàn cảnh.',
    color: 'Xanh lá nhạt',
    colorHex: '#90EE90',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },
  'QuýMùi': {
    name: 'Mộc',
    napAm: 'Dương Liễu Mộc',
    napAmHanViet: '楊柳木',
    meaning: 'Gỗ cây dương liễu',
    description: 'Cây liễu mềm mại, uyển chuyển, tượng trưng cho sự linh hoạt, thích nghi. Người mệnh này thường khéo léo, biết điều chỉnh theo hoàn cảnh.',
    color: 'Xanh lá nhạt',
    colorHex: '#90EE90',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },

  // ========== GIÁP THÂN - ẤT DẬU: TUYỀN TRUNG THỦY ==========
  'GiápThân': {
    name: 'Thủy',
    napAm: 'Tuyền Trung Thủy',
    napAmHanViet: '泉中水',
    meaning: 'Nước trong suối',
    description: 'Nước suối trong lành, tượng trưng cho sự tinh khiết, trong sáng. Người mệnh này thường chân thành, trong sáng trong suy nghĩ.',
    color: 'Xanh dương, Đen',
    colorHex: '#4169E1',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },
  'ẤtDậu': {
    name: 'Thủy',
    napAm: 'Tuyền Trung Thủy',
    napAmHanViet: '泉中水',
    meaning: 'Nước trong suối',
    description: 'Nước suối trong lành, tượng trưng cho sự tinh khiết, trong sáng. Người mệnh này thường chân thành, trong sáng trong suy nghĩ.',
    color: 'Xanh dương, Đen',
    colorHex: '#4169E1',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },

  // ========== BÍNH TUẤT - ĐINH HỢI: ỐC THƯỢNG THỔ ==========
  'BínhTuất': {
    name: 'Thổ',
    napAm: 'Ốc Thượng Thổ',
    napAmHanViet: '屋上土',
    meaning: 'Đất trên nóc nhà',
    description: 'Đất trên mái nhà (ngói), tượng trưng cho sự che chở, bảo vệ từ trên cao. Người mệnh này thường có tầm nhìn xa, biết lo liệu.',
    color: 'Vàng đất, Nâu',
    colorHex: '#CD853F',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },
  'ĐinhHợi': {
    name: 'Thổ',
    napAm: 'Ốc Thượng Thổ',
    napAmHanViet: '屋上土',
    meaning: 'Đất trên nóc nhà',
    description: 'Đất trên mái nhà (ngói), tượng trưng cho sự che chở, bảo vệ từ trên cao. Người mệnh này thường có tầm nhìn xa, biết lo liệu.',
    color: 'Vàng đất, Nâu',
    colorHex: '#CD853F',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },

  // ========== MẬU TÝ - KỶ SỬU: TÍCH LỊCH HỎA ==========
  'MậuTý': {
    name: 'Hỏa',
    napAm: 'Tích Lịch Hỏa',
    napAmHanViet: '霹靂火',
    meaning: 'Lửa sấm sét',
    description: 'Lửa từ sấm sét, tượng trưng cho sức mạnh bùng nổ, bất ngờ. Người mệnh này thường mạnh mẽ, có những hành động quyết liệt.',
    color: 'Đỏ tím, Tím',
    colorHex: '#9400D3',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },
  'KỷSửu': {
    name: 'Hỏa',
    napAm: 'Tích Lịch Hỏa',
    napAmHanViet: '霹靂火',
    meaning: 'Lửa sấm sét',
    description: 'Lửa từ sấm sét, tượng trưng cho sức mạnh bùng nổ, bất ngờ. Người mệnh này thường mạnh mẽ, có những hành động quyết liệt.',
    color: 'Đỏ tím, Tím',
    colorHex: '#9400D3',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },

  // ========== CANH DẦN - TÂN MÃO: TÙNG BÁCH MỘC ==========
  'CanhDần': {
    name: 'Mộc',
    napAm: 'Tùng Bách Mộc',
    napAmHanViet: '松柏木',
    meaning: 'Gỗ cây tùng bách',
    description: 'Cây tùng bách xanh tốt quanh năm, tượng trưng cho sự kiên cường, bền bỉ. Người mệnh này thường có nghị lực phi thường.',
    color: 'Xanh đậm',
    colorHex: '#006400',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },
  'TânMão': {
    name: 'Mộc',
    napAm: 'Tùng Bách Mộc',
    napAmHanViet: '松柏木',
    meaning: 'Gỗ cây tùng bách',
    description: 'Cây tùng bách xanh tốt quanh năm, tượng trưng cho sự kiên cường, bền bỉ. Người mệnh này thường có nghị lực phi thường.',
    color: 'Xanh đậm',
    colorHex: '#006400',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },

  // ========== NHÂM THÌN - QUÝ TỴ: TRƯỜNG LƯU THỦY ==========
  'NhâmThìn': {
    name: 'Thủy',
    napAm: 'Trường Lưu Thủy',
    napAmHanViet: '長流水',
    meaning: 'Nước chảy dài (sông lớn)',
    description: 'Nước sông chảy miên man không ngừng, tượng trưng cho sự bền bỉ, liên tục. Người mệnh này thường kiên trì, không bỏ cuộc.',
    color: 'Xanh dương đậm',
    colorHex: '#00008B',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },
  'QuýTỵ': {
    name: 'Thủy',
    napAm: 'Trường Lưu Thủy',
    napAmHanViet: '長流水',
    meaning: 'Nước chảy dài (sông lớn)',
    description: 'Nước sông chảy miên man không ngừng, tượng trưng cho sự bền bỉ, liên tục. Người mệnh này thường kiên trì, không bỏ cuộc.',
    color: 'Xanh dương đậm',
    colorHex: '#00008B',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },

  // ========== GIÁP NGỌ - ẤT MÙI: SA TRUNG KIM ==========
  'GiápNgọ': {
    name: 'Kim',
    napAm: 'Sa Trung Kim',
    napAmHanViet: '沙中金',
    meaning: 'Vàng trong cát',
    description: 'Vàng ẩn trong cát, tượng trưng cho giá trị tiềm ẩn cần được khai thác. Người mệnh này có tiềm năng lớn nhưng cần nỗ lực để phát huy.',
    color: 'Trắng, Vàng cát',
    colorHex: '#F4A460',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },
  'ẤtMùi': {
    name: 'Kim',
    napAm: 'Sa Trung Kim',
    napAmHanViet: '沙中金',
    meaning: 'Vàng trong cát',
    description: 'Vàng ẩn trong cát, tượng trưng cho giá trị tiềm ẩn cần được khai thác. Người mệnh này có tiềm năng lớn nhưng cần nỗ lực để phát huy.',
    color: 'Trắng, Vàng cát',
    colorHex: '#F4A460',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },

  // ========== BÍNH THÂN - ĐINH DẬU: SƠN HẠ HỎA ==========
  'BínhThân': {
    name: 'Hỏa',
    napAm: 'Sơn Hạ Hỏa',
    napAmHanViet: '山下火',
    meaning: 'Lửa dưới chân núi',
    description: 'Lửa cháy dưới chân núi, tượng trưng cho sự âm thầm, bền bỉ. Người mệnh này thường làm việc chăm chỉ mà không phô trương.',
    color: 'Đỏ cam',
    colorHex: '#FF7F50',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },
  'ĐinhDậu': {
    name: 'Hỏa',
    napAm: 'Sơn Hạ Hỏa',
    napAmHanViet: '山下火',
    meaning: 'Lửa dưới chân núi',
    description: 'Lửa cháy dưới chân núi, tượng trưng cho sự âm thầm, bền bỉ. Người mệnh này thường làm việc chăm chỉ mà không phô trương.',
    color: 'Đỏ cam',
    colorHex: '#FF7F50',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },

  // ========== MẬU TUẤT - KỶ HỢI: BÌNH ĐỊA MỘC ==========
  'MậuTuất': {
    name: 'Mộc',
    napAm: 'Bình Địa Mộc',
    napAmHanViet: '平地木',
    meaning: 'Cây trên đất bằng',
    description: 'Cây mọc trên đồng bằng, tượng trưng cho sự phát triển thuận lợi. Người mệnh này thường có cuộc sống ổn định, phát triển đều đặn.',
    color: 'Xanh lá',
    colorHex: '#32CD32',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },
  'KỷHợi': {
    name: 'Mộc',
    napAm: 'Bình Địa Mộc',
    napAmHanViet: '平地木',
    meaning: 'Cây trên đất bằng',
    description: 'Cây mọc trên đồng bằng, tượng trưng cho sự phát triển thuận lợi. Người mệnh này thường có cuộc sống ổn định, phát triển đều đặn.',
    color: 'Xanh lá',
    colorHex: '#32CD32',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },

  // ========== CANH TÝ - TÂN SỬU: BÍCH THƯỢNG THỔ ==========
  'CanhTý': {
    name: 'Thổ',
    napAm: 'Bích Thượng Thổ',
    napAmHanViet: '壁上土',
    meaning: 'Đất trên vách',
    description: 'Đất trát trên tường, tượng trưng cho sự bảo vệ, che chắn. Người mệnh này thường có khả năng bảo vệ người thân.',
    color: 'Vàng đất',
    colorHex: '#DEB887',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },
  'TânSửu': {
    name: 'Thổ',
    napAm: 'Bích Thượng Thổ',
    napAmHanViet: '壁上土',
    meaning: 'Đất trên vách',
    description: 'Đất trát trên tường, tượng trưng cho sự bảo vệ, che chắn. Người mệnh này thường có khả năng bảo vệ người thân.',
    color: 'Vàng đất',
    colorHex: '#DEB887',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },

  // ========== NHÂM DẦN - QUÝ MÃO: KIM BẠC KIM ==========
  'NhâmDần': {
    name: 'Kim',
    napAm: 'Kim Bạc Kim',
    napAmHanViet: '金箔金',
    meaning: 'Vàng lá mỏng',
    description: 'Vàng được dát mỏng, tượng trưng cho vẻ đẹp tinh tế, quý phái. Người mệnh này thường có gu thẩm mỹ cao, tinh tế.',
    color: 'Vàng kim',
    colorHex: '#FFD700',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },
  'QuýMão': {
    name: 'Kim',
    napAm: 'Kim Bạc Kim',
    napAmHanViet: '金箔金',
    meaning: 'Vàng lá mỏng',
    description: 'Vàng được dát mỏng, tượng trưng cho vẻ đẹp tinh tế, quý phái. Người mệnh này thường có gu thẩm mỹ cao, tinh tế.',
    color: 'Vàng kim',
    colorHex: '#FFD700',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },

  // ========== GIÁP THÌN - ẤT TỴ: PHÚ ĐĂNG HỎA ==========
  'GiápThìn': {
    name: 'Hỏa',
    napAm: 'Phú Đăng Hỏa',
    napAmHanViet: '覆燈火',
    meaning: 'Lửa đèn to (đèn lồng)',
    description: 'Ánh sáng từ đèn lồng, tượng trưng cho sự soi sáng, dẫn đường. Người mệnh này thường có khả năng hướng dẫn, dẫn dắt người khác.',
    color: 'Đỏ, Cam',
    colorHex: '#FF8C00',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },
  'ẤtTỵ': {
    name: 'Hỏa',
    napAm: 'Phú Đăng Hỏa',
    napAmHanViet: '覆燈火',
    meaning: 'Lửa đèn to (đèn lồng)',
    description: 'Ánh sáng từ đèn lồng, tượng trưng cho sự soi sáng, dẫn đường. Người mệnh này thường có khả năng hướng dẫn, dẫn dắt người khác.',
    color: 'Đỏ, Cam',
    colorHex: '#FF8C00',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },

  // ========== BÍNH NGỌ - ĐINH MÙI: THIÊN HÀ THỦY ==========
  'BínhNgọ': {
    name: 'Thủy',
    napAm: 'Thiên Hà Thủy',
    napAmHanViet: '天河水',
    meaning: 'Nước sông Ngân Hà',
    description: 'Nước từ thiên hà (mưa), tượng trưng cho sự ban phát từ trời cao. Người mệnh này thường có phúc đức, được trời thương.',
    color: 'Xanh dương nhạt',
    colorHex: '#87CEEB',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },
  'ĐinhMùi': {
    name: 'Thủy',
    napAm: 'Thiên Hà Thủy',
    napAmHanViet: '天河水',
    meaning: 'Nước sông Ngân Hà',
    description: 'Nước từ thiên hà (mưa), tượng trưng cho sự ban phát từ trời cao. Người mệnh này thường có phúc đức, được trời thương.',
    color: 'Xanh dương nhạt',
    colorHex: '#87CEEB',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },

  // ========== MẬU THÂN - KỶ DẬU: ĐẠI TRẠCH THỔ ==========
  'MậuThân': {
    name: 'Thổ',
    napAm: 'Đại Trạch Thổ',
    napAmHanViet: '大驛土',
    meaning: 'Đất đường lớn (trạm dịch)',
    description: 'Đất trạm nghỉ trên đường lớn, tượng trưng cho sự rộng rãi, đón tiếp. Người mệnh này thường hiếu khách, có nhiều bạn bè.',
    color: 'Vàng nâu',
    colorHex: '#B8860B',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },
  'KỷDậu': {
    name: 'Thổ',
    napAm: 'Đại Trạch Thổ',
    napAmHanViet: '大驛土',
    meaning: 'Đất đường lớn (trạm dịch)',
    description: 'Đất trạm nghỉ trên đường lớn, tượng trưng cho sự rộng rãi, đón tiếp. Người mệnh này thường hiếu khách, có nhiều bạn bè.',
    color: 'Vàng nâu',
    colorHex: '#B8860B',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },

  // ========== CANH TUẤT - TÂN HỢI: THOA XUYẾN KIM ==========
  'CanhTuất': {
    name: 'Kim',
    napAm: 'Thoa Xuyến Kim',
    napAmHanViet: '釵釧金',
    meaning: 'Vàng trang sức (trâm xuyến)',
    description: 'Vàng làm trang sức quý phái, tượng trưng cho vẻ đẹp, sang trọng. Người mệnh này thường có vẻ ngoài thu hút, quý phái.',
    color: 'Vàng kim, Bạc',
    colorHex: '#FFE4B5',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },
  'TânHợi': {
    name: 'Kim',
    napAm: 'Thoa Xuyến Kim',
    napAmHanViet: '釵釧金',
    meaning: 'Vàng trang sức (trâm xuyến)',
    description: 'Vàng làm trang sức quý phái, tượng trưng cho vẻ đẹp, sang trọng. Người mệnh này thường có vẻ ngoài thu hút, quý phái.',
    color: 'Vàng kim, Bạc',
    colorHex: '#FFE4B5',
    direction: 'Tây',
    luckyNumbers: [4, 9, 14, 19],
    element: { generates: 'Thủy', generatedBy: 'Thổ', controls: 'Mộc', controlledBy: 'Hỏa' },
  },

  // ========== NHÂM TÝ - QUÝ SỬU: TANG ĐỐ MỘC ==========
  'NhâmTý': {
    name: 'Mộc',
    napAm: 'Tang Đố Mộc',
    napAmHanViet: '桑柘木',
    meaning: 'Gỗ cây dâu tằm',
    description: 'Cây dâu nuôi tằm, tượng trưng cho sự cần cù, chăm chỉ. Người mệnh này thường siêng năng, biết tích lũy.',
    color: 'Xanh lá đậm',
    colorHex: '#2E8B57',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },
  'QuýSửu': {
    name: 'Mộc',
    napAm: 'Tang Đố Mộc',
    napAmHanViet: '桑柘木',
    meaning: 'Gỗ cây dâu tằm',
    description: 'Cây dâu nuôi tằm, tượng trưng cho sự cần cù, chăm chỉ. Người mệnh này thường siêng năng, biết tích lũy.',
    color: 'Xanh lá đậm',
    colorHex: '#2E8B57',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },

  // ========== GIÁP DẦN - ẤT MÃO: ĐẠI KHÊ THỦY ==========
  'GiápDần': {
    name: 'Thủy',
    napAm: 'Đại Khê Thủy',
    napAmHanViet: '大溪水',
    meaning: 'Nước khe lớn (suối lớn)',
    description: 'Suối nước lớn chảy mạnh, tượng trưng cho sức sống dồi dào. Người mệnh này thường năng động, tràn đầy năng lượng.',
    color: 'Xanh dương',
    colorHex: '#1E90FF',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },
  'ẤtMão': {
    name: 'Thủy',
    napAm: 'Đại Khê Thủy',
    napAmHanViet: '大溪水',
    meaning: 'Nước khe lớn (suối lớn)',
    description: 'Suối nước lớn chảy mạnh, tượng trưng cho sức sống dồi dào. Người mệnh này thường năng động, tràn đầy năng lượng.',
    color: 'Xanh dương',
    colorHex: '#1E90FF',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },

  // ========== BÍNH THÌN - ĐINH TỴ: SA TRUNG THỔ ==========
  'BínhThìn': {
    name: 'Thổ',
    napAm: 'Sa Trung Thổ',
    napAmHanViet: '沙中土',
    meaning: 'Đất trong cát',
    description: 'Đất lẫn trong cát, tượng trưng cho sự pha trộn, thích nghi. Người mệnh này thường linh hoạt, dễ hòa nhập.',
    color: 'Vàng cát',
    colorHex: '#EDC9AF',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },
  'ĐinhTỵ': {
    name: 'Thổ',
    napAm: 'Sa Trung Thổ',
    napAmHanViet: '沙中土',
    meaning: 'Đất trong cát',
    description: 'Đất lẫn trong cát, tượng trưng cho sự pha trộn, thích nghi. Người mệnh này thường linh hoạt, dễ hòa nhập.',
    color: 'Vàng cát',
    colorHex: '#EDC9AF',
    direction: 'Trung ương',
    luckyNumbers: [0, 5, 10, 15],
    element: { generates: 'Kim', generatedBy: 'Hỏa', controls: 'Thủy', controlledBy: 'Mộc' },
  },

  // ========== MẬU NGỌ - KỶ MÙI: THIÊN THƯỢNG HỎA ==========
  'MậuNgọ': {
    name: 'Hỏa',
    napAm: 'Thiên Thượng Hỏa',
    napAmHanViet: '天上火',
    meaning: 'Lửa trên trời (mặt trời)',
    description: 'Lửa mặt trời chiếu sáng khắp nơi, tượng trưng cho sự tỏa sáng vĩ đại. Người mệnh này thường có tầm ảnh hưởng lớn.',
    color: 'Đỏ rực, Vàng',
    colorHex: '#FF4500',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },
  'KỷMùi': {
    name: 'Hỏa',
    napAm: 'Thiên Thượng Hỏa',
    napAmHanViet: '天上火',
    meaning: 'Lửa trên trời (mặt trời)',
    description: 'Lửa mặt trời chiếu sáng khắp nơi, tượng trưng cho sự tỏa sáng vĩ đại. Người mệnh này thường có tầm ảnh hưởng lớn.',
    color: 'Đỏ rực, Vàng',
    colorHex: '#FF4500',
    direction: 'Nam',
    luckyNumbers: [2, 7, 12, 17],
    element: { generates: 'Thổ', generatedBy: 'Mộc', controls: 'Kim', controlledBy: 'Thủy' },
  },

  // ========== CANH THÂN - TÂN DẬU: THẠCH LỰU MỘC ==========
  'CanhThân': {
    name: 'Mộc',
    napAm: 'Thạch Lựu Mộc',
    napAmHanViet: '石榴木',
    meaning: 'Gỗ cây thạch lựu (lựu)',
    description: 'Cây lựu cho quả đỏ rực, tượng trưng cho sự sung túc, đông con. Người mệnh này thường có cuộc sống viên mãn.',
    color: 'Xanh lá, Đỏ',
    colorHex: '#8FBC8F',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },
  'TânDậu': {
    name: 'Mộc',
    napAm: 'Thạch Lựu Mộc',
    napAmHanViet: '石榴木',
    meaning: 'Gỗ cây thạch lựu (lựu)',
    description: 'Cây lựu cho quả đỏ rực, tượng trưng cho sự sung túc, đông con. Người mệnh này thường có cuộc sống viên mãn.',
    color: 'Xanh lá, Đỏ',
    colorHex: '#8FBC8F',
    direction: 'Đông',
    luckyNumbers: [3, 8, 13, 18],
    element: { generates: 'Hỏa', generatedBy: 'Thủy', controls: 'Thổ', controlledBy: 'Kim' },
  },

  // ========== NHÂM TUẤT - QUÝ HỢI: ĐẠI HẢI THỦY ==========
  'NhâmTuất': {
    name: 'Thủy',
    napAm: 'Đại Hải Thủy',
    napAmHanViet: '大海水',
    meaning: 'Nước biển lớn',
    description: 'Nước đại dương bao la, tượng trưng cho sự rộng lượng, bao dung. Người mệnh này thường có tâm hồn rộng mở, bao dung.',
    color: 'Xanh đậm, Đen',
    colorHex: '#191970',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },
  'QuýHợi': {
    name: 'Thủy',
    napAm: 'Đại Hải Thủy',
    napAmHanViet: '大海水',
    meaning: 'Nước biển lớn',
    description: 'Nước đại dương bao la, tượng trưng cho sự rộng lượng, bao dung. Người mệnh này thường có tâm hồn rộng mở, bao dung.',
    color: 'Xanh đậm, Đen',
    colorHex: '#191970',
    direction: 'Bắc',
    luckyNumbers: [1, 6, 11, 16],
    element: { generates: 'Mộc', generatedBy: 'Kim', controls: 'Hỏa', controlledBy: 'Thổ' },
  },
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Lấy Ngũ Hành Nạp Âm từ Can Chi năm sinh
 * @param canNam - Thiên Can (Giáp, Ất, Bính, ...)
 * @param chiNam - Địa Chi (Tý, Sửu, Dần, ...)
 * @returns NguHanhNapAm object
 */
export function getNguHanhNapAm(canNam: string, chiNam: string): NguHanhNapAm {
  const key = canNam + chiNam;
  const result = NAP_AM_TABLE[key];
  
  if (!result) {
    // Fallback nếu không tìm thấy
    console.warn(`Không tìm thấy Nạp Âm cho: ${key}`);
    return {
      name: 'Unknown',
      napAm: 'Unknown',
      napAmHanViet: '',
      meaning: '',
      description: 'Không tìm thấy thông tin',
      color: '',
      colorHex: '#808080',
      direction: '',
      luckyNumbers: [],
      element: { generates: '', generatedBy: '', controls: '', controlledBy: '' },
    };
  }
  
  return result;
}

/**
 * Lấy Ngũ Hành Nạp Âm từ năm dương lịch
 * @param year - Năm dương lịch (1900-2100)
 * @returns NguHanhNapAm object
 */
export function getNguHanhFromYear(year: number): NguHanhNapAm {
  const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  
  const can = THIEN_CAN[canIndex >= 0 ? canIndex : canIndex + 10];
  const chi = DIA_CHI[chiIndex >= 0 ? chiIndex : chiIndex + 12];
  
  return getNguHanhNapAm(can, chi);
}

/**
 * Kiểm tra tương sinh tương khắc giữa 2 mệnh
 * @param element1 - Mệnh thứ nhất (Kim/Mộc/Thủy/Hỏa/Thổ)
 * @param element2 - Mệnh thứ hai
 * @returns Quan hệ và mô tả
 */
export function checkElementRelation(element1: string, element2: string): NguHanhRelation {
  const e1 = NGU_HANH[element1 as keyof typeof NGU_HANH];
  const e2 = NGU_HANH[element2 as keyof typeof NGU_HANH];
  
  if (!e1 || !e2) {
    return {
      relation: 'binh_hoa',
      description: 'Không xác định',
      compatibility: 50,
    };
  }
  
  // element1 sinh element2
  if (e1.generates === element2) {
    return {
      relation: 'tuong_sinh',
      description: `${element1} sinh ${element2} - Mối quan hệ tốt đẹp, ${element1} hỗ trợ ${element2}`,
      compatibility: 85,
    };
  }
  
  // element2 sinh element1
  if (e2.generates === element1) {
    return {
      relation: 'tuong_sinh',
      description: `${element2} sinh ${element1} - Mối quan hệ tốt đẹp, ${element2} hỗ trợ ${element1}`,
      compatibility: 85,
    };
  }
  
  // element1 khắc element2
  if (e1.controls === element2) {
    return {
      relation: 'tuong_khac',
      description: `${element1} khắc ${element2} - Cần sự nhường nhịn và thấu hiểu`,
      compatibility: 40,
    };
  }
  
  // element2 khắc element1
  if (e2.controls === element1) {
    return {
      relation: 'tuong_khac',
      description: `${element2} khắc ${element1} - Cần sự nhường nhịn và thấu hiểu`,
      compatibility: 40,
    };
  }
  
  // Cùng mệnh
  if (element1 === element2) {
    return {
      relation: 'binh_hoa',
      description: `Cùng mệnh ${element1} - Dễ hiểu nhau nhưng có thể thiếu sự bổ sung`,
      compatibility: 70,
    };
  }
  
  // Bình hòa (không sinh không khắc)
  return {
    relation: 'binh_hoa',
    description: `${element1} và ${element2} bình hòa - Mối quan hệ trung tính, ổn định`,
    compatibility: 60,
  };
}

/**
 * Lấy danh sách màu may mắn dựa trên mệnh
 * @param element - Ngũ hành (Kim/Mộc/Thủy/Hỏa/Thổ)
 * @returns Mảng các màu may mắn
 */
export function getLuckyColors(element: string): { name: string; hex: string }[] {
  const colors: { name: string; hex: string }[] = [];
  const e = NGU_HANH[element as keyof typeof NGU_HANH];
  
  if (!e) return colors;
  
  // Màu bản mệnh
  colors.push({ name: e.color, hex: e.colorHex });
  
  // Màu tương sinh (mệnh được sinh)
  const generatedBy = NGU_HANH[e.generatedBy as keyof typeof NGU_HANH];
  if (generatedBy) {
    colors.push({ name: generatedBy.color, hex: generatedBy.colorHex });
  }
  
  return colors;
}

/**
 * Lấy danh sách màu nên tránh dựa trên mệnh
 * @param element - Ngũ hành (Kim/Mộc/Thủy/Hỏa/Thổ)
 * @returns Mảng các màu nên tránh
 */
export function getUnluckyColors(element: string): { name: string; hex: string }[] {
  const colors: { name: string; hex: string }[] = [];
  const e = NGU_HANH[element as keyof typeof NGU_HANH];
  
  if (!e) return colors;
  
  // Màu khắc mệnh
  const controlledBy = NGU_HANH[e.controlledBy as keyof typeof NGU_HANH];
  if (controlledBy) {
    colors.push({ name: controlledBy.color, hex: controlledBy.colorHex });
  }
  
  return colors;
}

/**
 * Lấy hướng tốt và hướng xấu dựa trên mệnh
 * @param element - Ngũ hành
 * @returns Object chứa hướng tốt và hướng xấu
 */
export function getDirections(element: string): { good: string[]; bad: string[] } {
  const directionMap: Record<string, { good: string[]; bad: string[] }> = {
    Kim: { good: ['Tây', 'Tây Bắc', 'Tây Nam'], bad: ['Nam'] },
    Mộc: { good: ['Đông', 'Đông Nam', 'Đông Bắc'], bad: ['Tây'] },
    Thủy: { good: ['Bắc', 'Đông', 'Tây'], bad: ['Trung ương', 'Tây Nam', 'Đông Bắc'] },
    Hỏa: { good: ['Nam', 'Đông', 'Đông Nam'], bad: ['Bắc'] },
    Thổ: { good: ['Trung ương', 'Tây Nam', 'Đông Bắc', 'Nam'], bad: ['Đông'] },
  };
  
  return directionMap[element] || { good: [], bad: [] };
}

// ============================================
// EXPORTS
// ============================================

export default {
  getNguHanhNapAm,
  getNguHanhFromYear,
  checkElementRelation,
  getLuckyColors,
  getUnluckyColors,
  getDirections,
  NGU_HANH,
  NAP_AM_TABLE,
};
