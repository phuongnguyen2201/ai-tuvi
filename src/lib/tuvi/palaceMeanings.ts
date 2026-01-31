// src/lib/tuvi/palaceMeanings.ts - Ý nghĩa 12 cung trong lá số Tử Vi

export interface PalaceMeaning {
  name: string;
  keywords: string[];
  meaning: string;
  aspects: string[];  // Các khía cạnh chi phối
  questions: string[]; // Câu hỏi đời sống liên quan
}

export const PALACE_MEANINGS: Record<string, PalaceMeaning> = {
  'Mệnh': {
    name: 'Mệnh',
    keywords: ['Bản mệnh', 'Tính cách', 'Vận số', 'Tiềm năng'],
    meaning: 'Cung Mệnh là cung quan trọng nhất, đại diện cho bản thân, tính cách, số phận và tiềm năng của một người. Đây là nền tảng quyết định vận mệnh tổng thể.',
    aspects: [
      'Tính cách, bản chất con người',
      'Sức khỏe tổng quát',
      'Tiềm năng phát triển',
      'Vận may hay rủi trong đời',
      'Mức độ thành công trong cuộc sống'
    ],
    questions: [
      'Tôi là người như thế nào?',
      'Cuộc đời tôi sẽ ra sao?',
      'Tôi có tiềm năng gì?'
    ]
  },
  
  'Phụ Mẫu': {
    name: 'Phụ Mẫu',
    keywords: ['Cha mẹ', 'Học vấn', 'Tuổi trẻ', 'Giáo dục'],
    meaning: 'Cung Phụ Mẫu thể hiện mối quan hệ với cha mẹ, ông bà, cũng như quá trình học tập, giáo dục trong những năm đầu đời.',
    aspects: [
      'Mối quan hệ với cha mẹ',
      'Sự giúp đỡ từ bậc trưởng bối',
      'Quá trình học hành, giáo dục',
      'Tuổi thơ và môi trường nuôi dưỡng',
      'Gia sản thừa kế từ cha mẹ'
    ],
    questions: [
      'Mối quan hệ với cha mẹ có tốt không?',
      'Có được hưởng phúc từ gia đình không?',
      'Việc học hành có thuận lợi không?'
    ]
  },
  
  'Phúc Đức': {
    name: 'Phúc Đức',
    keywords: ['Phúc báo', 'Tâm linh', 'Hậu vận', 'An nhàn'],
    meaning: 'Cung Phúc Đức đại diện cho phúc phần, nghiệp báo từ đời trước, cũng như đời sống tinh thần và tuổi già.',
    aspects: [
      'Phúc báo, nghiệp lực',
      'Đời sống tinh thần, tâm linh',
      'Tuổi già có an nhàn không',
      'Khả năng hưởng thụ',
      'Thọ mệnh'
    ],
    questions: [
      'Cuối đời có sung sướng không?',
      'Có phúc đức dày hay mỏng?',
      'Tâm hồn có thanh thản không?'
    ]
  },
  
  'Điền Trạch': {
    name: 'Điền Trạch',
    keywords: ['Nhà cửa', 'Bất động sản', 'Tài sản', 'Đất đai'],
    meaning: 'Cung Điền Trạch cho biết về tài sản bất động sản, nhà cửa, đất đai và khả năng tích lũy của cải vật chất.',
    aspects: [
      'Nhà cửa, nơi ở',
      'Đất đai, bất động sản',
      'Tài sản cố định',
      'Môi trường sống',
      'Khả năng tích lũy tài sản'
    ],
    questions: [
      'Có mua được nhà không?',
      'Tài sản bất động sản có nhiều không?',
      'Nơi ở có ổn định không?'
    ]
  },
  
  'Quan Lộc': {
    name: 'Quan Lộc',
    keywords: ['Sự nghiệp', 'Công danh', 'Địa vị', 'Thành tựu'],
    meaning: 'Cung Quan Lộc thể hiện sự nghiệp, công việc, địa vị xã hội và mức độ thành đạt trong cuộc sống.',
    aspects: [
      'Sự nghiệp, công việc',
      'Chức vụ, địa vị',
      'Danh tiếng, uy tín',
      'Khả năng thăng tiến',
      'Môi trường làm việc'
    ],
    questions: [
      'Sự nghiệp có thành công không?',
      'Có làm quan/quản lý không?',
      'Công việc phù hợp là gì?'
    ]
  },
  
  'Nô Bộc': {
    name: 'Nô Bộc',
    keywords: ['Bạn bè', 'Đồng nghiệp', 'Nhân viên', 'Quan hệ xã hội'],
    meaning: 'Cung Nô Bộc (Giao Hữu) đại diện cho các mối quan hệ bạn bè, đồng nghiệp, cấp dưới và khả năng được giúp đỡ từ người khác.',
    aspects: [
      'Bạn bè, giao tiếp',
      'Cấp dưới, nhân viên',
      'Đối tác làm ăn',
      'Mạng lưới quan hệ xã hội',
      'Sự hỗ trợ từ người ngoài'
    ],
    questions: [
      'Có nhiều bạn tốt không?',
      'Có được người giúp đỡ không?',
      'Quan hệ xã hội có rộng không?'
    ]
  },
  
  'Thiên Di': {
    name: 'Thiên Di',
    keywords: ['Di chuyển', 'Xuất ngoại', 'Thay đổi', 'Quý nhân'],
    meaning: 'Cung Thiên Di cho biết về việc đi xa, thay đổi môi trường sống, hoạt động bên ngoài và sự giúp đỡ từ quý nhân khi rời xa quê.',
    aspects: [
      'Đi lại, di chuyển',
      'Xuất ngoại, định cư xa',
      'Hoạt động bên ngoài nhà',
      'Quý nhân phù trợ',
      'Sự thay đổi trong đời'
    ],
    questions: [
      'Có đi xa được không?',
      'Ra ngoài có gặp may không?',
      'Nên ở quê hay đi xa?'
    ]
  },
  
  'Tật Ách': {
    name: 'Tật Ách',
    keywords: ['Sức khỏe', 'Bệnh tật', 'Tai nạn', 'Thể chất'],
    meaning: 'Cung Tật Ách thể hiện tình trạng sức khỏe, những bệnh tật tiềm ẩn và các tai nạn, khó khăn có thể gặp phải.',
    aspects: [
      'Sức khỏe tổng thể',
      'Bệnh tật mãn tính',
      'Tai nạn, rủi ro',
      'Bộ phận cơ thể yếu',
      'Khả năng phục hồi'
    ],
    questions: [
      'Sức khỏe có tốt không?',
      'Cần đề phòng bệnh gì?',
      'Có hay gặp tai nạn không?'
    ]
  },
  
  'Tài Bạch': {
    name: 'Tài Bạch',
    keywords: ['Tiền bạc', 'Thu nhập', 'Tài chính', 'Kinh doanh'],
    meaning: 'Cung Tài Bạch đại diện cho tài chính, thu nhập, khả năng kiếm tiền và quản lý tiền bạc trong cuộc sống.',
    aspects: [
      'Thu nhập, tiền bạc',
      'Khả năng kiếm tiền',
      'Quản lý tài chính',
      'Nguồn thu nhập chính',
      'Mức độ giàu có'
    ],
    questions: [
      'Có giàu có không?',
      'Tiền đến từ nguồn nào?',
      'Khả năng giữ tiền có tốt không?'
    ]
  },
  
  'Tử Tức': {
    name: 'Tử Tức',
    keywords: ['Con cái', 'Hậu duệ', 'Sinh sản', 'Sáng tạo'],
    meaning: 'Cung Tử Tức cho biết về con cái, khả năng sinh sản, mối quan hệ với con và sự sáng tạo trong công việc.',
    aspects: [
      'Con cái, số lượng và giới tính',
      'Mối quan hệ với con',
      'Khả năng sinh sản',
      'Sự phát triển của con cái',
      'Tính sáng tạo'
    ],
    questions: [
      'Có con cái như thế nào?',
      'Con cái có hiếu không?',
      'Có khó sinh không?'
    ]
  },
  
  'Phu Thê': {
    name: 'Phu Thê',
    keywords: ['Hôn nhân', 'Vợ chồng', 'Tình duyên', 'Đối tác'],
    meaning: 'Cung Phu Thê thể hiện đời sống hôn nhân, tình duyên, mối quan hệ vợ chồng và đặc điểm của người bạn đời.',
    aspects: [
      'Hôn nhân, vợ chồng',
      'Tình yêu, duyên phận',
      'Đặc điểm người bạn đời',
      'Hạnh phúc gia đình',
      'Số lần kết hôn'
    ],
    questions: [
      'Hôn nhân có hạnh phúc không?',
      'Người bạn đời như thế nào?',
      'Bao giờ lấy vợ/chồng?'
    ]
  },
  
  'Huynh Đệ': {
    name: 'Huynh Đệ',
    keywords: ['Anh chị em', 'Đồng môn', 'Cạnh tranh', 'Hợp tác'],
    meaning: 'Cung Huynh Đệ đại diện cho mối quan hệ với anh chị em ruột, bạn đồng môn và khả năng hợp tác hay cạnh tranh.',
    aspects: [
      'Anh chị em ruột',
      'Bạn học, đồng môn',
      'Sự hỗ trợ từ anh em',
      'Cạnh tranh, ganh đua',
      'Hợp tác trong công việc'
    ],
    questions: [
      'Quan hệ với anh em có tốt không?',
      'Có được anh em giúp đỡ không?',
      'Anh em có hòa thuận không?'
    ]
  }
};

/**
 * Lấy ý nghĩa của một cung theo tên
 */
export function getPalaceMeaning(palaceName: string): PalaceMeaning | undefined {
  return PALACE_MEANINGS[palaceName];
}

/**
 * Lấy danh sách tất cả các cung
 */
export function getAllPalaceNames(): string[] {
  return Object.keys(PALACE_MEANINGS);
}
