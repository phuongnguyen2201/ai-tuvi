// src/lib/tuvi/starMeanings.ts - Ý nghĩa các sao trong Tử Vi

export interface StarMeaning {
  name: string;
  type: 'major' | 'minor' | 'adjective';
  element?: string;           // Ngũ hành
  nature: 'cát' | 'hung' | 'trung tính';  // Tính chất
  keywords: string[];         // Từ khóa
  meaning: string;            // Ý nghĩa tổng quát
  inMenh?: string;            // Khi ở cung Mệnh
  inTaiBach?: string;         // Khi ở cung Tài Bạch
  inQuanLoc?: string;         // Khi ở cung Quan Lộc
  inPhuThe?: string;          // Khi ở cung Phu Thê
}

// 14 Chính Tinh
export const MAJOR_STARS: Record<string, StarMeaning> = {
  'Tử Vi': {
    name: 'Tử Vi',
    type: 'major',
    element: 'Thổ',
    nature: 'cát',
    keywords: ['Đế vương', 'Quyền lực', 'Cao quý', 'Tự trọng'],
    meaning: 'Sao chủ mệnh, tượng trưng cho vua chúa, quyền uy, danh vọng. Người có Tử Vi thường có phong thái cao quý, tự trọng, có khả năng lãnh đạo.',
    inMenh: 'Có phong cách cao quý, tự tin, thích được tôn trọng. Có tài lãnh đạo nhưng đôi khi kiêu ngạo.',
    inTaiBach: 'Tài lộc ổn định, được quý nhân giúp đỡ. Có cơ hội làm giàu từ vị trí quản lý.',
    inQuanLoc: 'Sự nghiệp thăng tiến, có khả năng làm lãnh đạo, quản lý cấp cao.',
    inPhuThe: 'Bạn đời có phong cách, địa vị. Hôn nhân được kính trọng.',
  },
  'Thiên Cơ': {
    name: 'Thiên Cơ',
    type: 'major',
    element: 'Mộc',
    nature: 'cát',
    keywords: ['Thông minh', 'Mưu trí', 'Sáng tạo', 'Biến động'],
    meaning: 'Sao trí tuệ, tượng trưng cho sự thông minh, sáng tạo, mưu lược. Thích hợp với công việc cần sự linh hoạt và sáng tạo.',
    inMenh: 'Thông minh lanh lợi, giỏi tính toán, nhưng hay lo lắng. Tư duy nhanh nhạy.',
    inTaiBach: 'Kiếm tiền bằng trí tuệ, kế hoạch. Tài chính biến động nhưng có cơ hội.',
    inQuanLoc: 'Phù hợp nghề cần tính toán: kế toán, lập trình, chiến lược, tư vấn.',
    inPhuThe: 'Bạn đời thông minh, nhanh nhẹn. Cần giao tiếp để hiểu nhau.',
  },
  'Thái Dương': {
    name: 'Thái Dương',
    type: 'major',
    element: 'Hỏa',
    nature: 'cát',
    keywords: ['Rạng rỡ', 'Quảng đại', 'Nổi tiếng', 'Bác ái'],
    meaning: 'Sao mặt trời, tượng trưng cho ánh sáng, danh tiếng, lòng bác ái. Thích hợp làm việc với công chúng, truyền thông.',
    inMenh: 'Tính cách cởi mở, hào phóng, thích giúp đỡ người khác. Có sức hút tự nhiên.',
    inTaiBach: 'Tài lộc đến từ danh tiếng, quan hệ. Hay chi tiêu rộng rãi.',
    inQuanLoc: 'Thành công trong lĩnh vực công chúng: chính trị, truyền thông, nghệ thuật.',
    inPhuThe: 'Nam có vợ đảm đang, nữ gặp chồng hào hoa. Hôn nhân công khai, rực rỡ.',
  },
  'Vũ Khúc': {
    name: 'Vũ Khúc',
    type: 'major',
    element: 'Kim',
    nature: 'cát',
    keywords: ['Tài chính', 'Cương quyết', 'Thực tế', 'Tiền bạc'],
    meaning: 'Sao tài tinh, chủ về tiền bạc, tài chính. Tính cách cương nghị, quyết đoán, thực tế.',
    inMenh: 'Tính cách thẳng thắn, cứng rắn, giỏi quản lý tiền bạc. Đôi khi cô đơn vì quá độc lập.',
    inTaiBach: 'Giỏi kiếm tiền, quản lý tài chính. Có khả năng tích lũy tài sản.',
    inQuanLoc: 'Phù hợp ngành tài chính, ngân hàng, kinh doanh, buôn bán.',
    inPhuThe: 'Hôn nhân muộn màng hơn. Cần người bạn đời hiểu và tôn trọng sự nghiệp.',
  },
  'Thiên Đồng': {
    name: 'Thiên Đồng',
    type: 'major',
    element: 'Thủy',
    nature: 'cát',
    keywords: ['Ôn hòa', 'An nhàn', 'Hưởng thụ', 'Nhạy cảm'],
    meaning: 'Sao phúc lộc, tượng trưng cho sự an nhàn, hưởng thụ. Tính tình hiền lành, dễ thương.',
    inMenh: 'Tính cách hiền lành, thân thiện, thích hưởng thụ cuộc sống. Đôi khi thiếu quyết đoán.',
    inTaiBach: 'Tài lộc ổn định, không quá giàu nhưng đủ tiêu. Thích hưởng thụ.',
    inQuanLoc: 'Phù hợp công việc nhẹ nhàng, nghệ thuật, giải trí, phục vụ.',
    inPhuThe: 'Hôn nhân êm đềm, hạnh phúc. Bạn đời hiền lành, đồng cảm.',
  },
  'Liêm Trinh': {
    name: 'Liêm Trinh',
    type: 'major',
    element: 'Hỏa',
    nature: 'trung tính',
    keywords: ['Đam mê', 'Quyết liệt', 'Phức tạp', 'Hai mặt'],
    meaning: 'Sao thứ phi, có hai mặt: vừa là quan tinh vừa là đào hoa. Tính cách phức tạp, đam mê.',
    inMenh: 'Cá tính mạnh, quyết liệt, có sức hút. Đôi khi cực đoan và cố chấp.',
    inTaiBach: 'Tài chính thăng trầm theo cảm xúc. Có thể giàu có nhờ đam mê.',
    inQuanLoc: 'Phù hợp ngành pháp luật, quân đội, nghệ thuật, giải trí.',
    inPhuThe: 'Tình cảm sâu sắc nhưng phức tạp. Cần tránh ngoại tình.',
  },
  'Thiên Phủ': {
    name: 'Thiên Phủ',
    type: 'major',
    element: 'Thổ',
    nature: 'cát',
    keywords: ['Kho tàng', 'Ổn định', 'Bảo thủ', 'An toàn'],
    meaning: 'Sao kho lẫm, tượng trưng cho sự tích trữ, ổn định, bền vững. Tính cách cẩn thận, bảo thủ.',
    inMenh: 'Tính cách ổn định, đáng tin cậy, biết tích lũy. Có phúc khí tự nhiên.',
    inTaiBach: 'Tài lộc ổn định, biết giữ tiền. Có khả năng tích lũy tài sản bền vững.',
    inQuanLoc: 'Phù hợp công việc ổn định: công chức, ngân hàng, bất động sản.',
    inPhuThe: 'Hôn nhân ổn định, bền vững. Bạn đời đáng tin cậy.',
  },
  'Thái Âm': {
    name: 'Thái Âm',
    type: 'major',
    element: 'Thủy',
    nature: 'cát',
    keywords: ['Dịu dàng', 'Bí ẩn', 'Nghệ thuật', 'Tình cảm'],
    meaning: 'Sao mặt trăng, tượng trưng cho vẻ đẹp, nghệ thuật, tình cảm. Nhạy cảm và lãng mạn.',
    inMenh: 'Tính cách dịu dàng, lãng mạn, có năng khiếu nghệ thuật. Hay mơ mộng.',
    inTaiBach: 'Tài lộc đến từ bất động sản, nghệ thuật. Biến động theo chu kỳ.',
    inQuanLoc: 'Phù hợp nghệ thuật, thiết kế, bất động sản, làm đêm.',
    inPhuThe: 'Nữ có chồng lãng mạn, nam có vợ đẹp. Hôn nhân cần sự thấu hiểu.',
  },
  'Tham Lang': {
    name: 'Tham Lang',
    type: 'major',
    element: 'Thủy',
    nature: 'trung tính',
    keywords: ['Đào hoa', 'Ham muốn', 'Đa tài', 'Biến hóa'],
    meaning: 'Sao đào hoa, tượng trưng cho dục vọng, ham muốn, tài năng đa dạng. Có khả năng thích nghi cao.',
    inMenh: 'Đa tài đa nghệ, hấp dẫn, nhưng hay thay đổi. Cần kiểm soát dục vọng.',
    inTaiBach: 'Kiếm tiền bằng nhiều cách, tài năng đa dạng. Tiền bạc đến đi nhanh.',
    inQuanLoc: 'Phù hợp ngành giải trí, kinh doanh, giao tiếp, nghệ thuật.',
    inPhuThe: 'Tình duyên phong phú nhưng phức tạp. Cần chung thủy.',
  },
  'Cự Môn': {
    name: 'Cự Môn',
    type: 'major',
    element: 'Thủy',
    nature: 'hung',
    keywords: ['Thị phi', 'Tranh cãi', 'Khẩu tài', 'Nghi ngờ'],
    meaning: 'Sao ám tinh, chủ về thị phi, tranh cãi. Nhưng cũng là sao khẩu tài, giỏi ăn nói.',
    inMenh: 'Thông minh, giỏi phân tích, nhưng hay nghi ngờ và tranh cãi.',
    inTaiBach: 'Kiếm tiền bằng miệng: luật sư, bán hàng, giáo viên. Cẩn thận thị phi.',
    inQuanLoc: 'Phù hợp ngành cần giao tiếp: luật, truyền thông, giảng dạy.',
    inPhuThe: 'Hay cãi vã với bạn đời. Cần học cách lắng nghe và nhường nhịn.',
  },
  'Thiên Tướng': {
    name: 'Thiên Tướng',
    type: 'major',
    element: 'Thủy',
    nature: 'cát',
    keywords: ['Ấn thụ', 'Quý nhân', 'Bảo bọc', 'Chính trực'],
    meaning: 'Sao ấn, tượng trưng cho sự bảo bọc, quý nhân phù trợ. Tính cách chính trực, đáng tin.',
    inMenh: 'Được quý nhân giúp đỡ, tính cách trung thực, đáng tin cậy.',
    inTaiBach: 'Tài lộc ổn định nhờ quý nhân. Có lộc ấn, được giúp đỡ.',
    inQuanLoc: 'Phù hợp làm tham mưu, thư ký, trợ lý cấp cao.',
    inPhuThe: 'Bạn đời là quý nhân, hỗ trợ lẫn nhau.',
  },
  'Thiên Lương': {
    name: 'Thiên Lương',
    type: 'major',
    element: 'Mộc',
    nature: 'cát',
    keywords: ['Che chở', 'Bác sĩ', 'Trường thọ', 'Từ bi'],
    meaning: 'Sao thọ, tượng trưng cho sự che chở, chữa bệnh, sống lâu. Tính cách từ bi, hay giúp người.',
    inMenh: 'Tính cách nhân hậu, hay giúp đỡ, có tuổi thọ cao. Thích triết lý.',
    inTaiBach: 'Tài lộc ổn định, không giàu có đột biến nhưng bền vững.',
    inQuanLoc: 'Phù hợp ngành y tế, giáo dục, từ thiện, tư vấn.',
    inPhuThe: 'Bạn đời chung thủy, biết chăm sóc. Hôn nhân bền lâu.',
  },
  'Thất Sát': {
    name: 'Thất Sát',
    type: 'major',
    element: 'Kim',
    nature: 'hung',
    keywords: ['Quyền lực', 'Chiến đấu', 'Cô độc', 'Dũng cảm'],
    meaning: 'Sao tướng quân, tượng trưng cho quyền lực, chiến đấu, dũng cảm. Tính cách mạnh mẽ, quyết đoán.',
    inMenh: 'Cá tính mạnh, độc lập, dũng cảm. Có khả năng lãnh đạo nhưng hay cô đơn.',
    inTaiBach: 'Kiếm tiền bằng sức lực, đấu tranh. Thăng trầm nhưng có thể thành công lớn.',
    inQuanLoc: 'Phù hợp quân đội, cảnh sát, kinh doanh mạo hiểm, thể thao.',
    inPhuThe: 'Hôn nhân khó khăn, hay xung đột. Cần người bạn đời mạnh mẽ.',
  },
  'Phá Quân': {
    name: 'Phá Quân',
    type: 'major',
    element: 'Thủy',
    nature: 'hung',
    keywords: ['Phá hoại', 'Đổi mới', 'Tiên phong', 'Nổi loạn'],
    meaning: 'Sao tiên phong, tượng trưng cho sự phá vỡ, đổi mới, cách mạng. Không ngại thay đổi.',
    inMenh: 'Thích thay đổi, phiêu lưu, không chịu được sự ổn định. Có tinh thần cách mạng.',
    inTaiBach: 'Tài chính thăng trầm lớn. Có thể giàu có hoặc trắng tay.',
    inQuanLoc: 'Phù hợp công việc cần sáng tạo, khởi nghiệp, nghệ thuật tiên phong.',
    inPhuThe: 'Hôn nhân nhiều biến động. Cần sự thấu hiểu và chấp nhận thay đổi.',
  },
};

// Các Phụ Tinh quan trọng
export const MINOR_STARS: Record<string, StarMeaning> = {
  'Văn Xương': {
    name: 'Văn Xương',
    type: 'minor',
    element: 'Kim',
    nature: 'cát',
    keywords: ['Học vấn', 'Văn chương', 'Khoa bảng', 'Thông minh'],
    meaning: 'Sao học vấn, chủ về thi cử, văn chương, bằng cấp. Giúp tăng trí tuệ và học hành.',
  },
  'Văn Khúc': {
    name: 'Văn Khúc',
    type: 'minor',
    element: 'Thủy',
    nature: 'cát',
    keywords: ['Nghệ thuật', 'Âm nhạc', 'Tài hoa', 'Đa tình'],
    meaning: 'Sao tài hoa, chủ về nghệ thuật, âm nhạc, thẩm mỹ. Có năng khiếu nghệ thuật bẩm sinh.',
  },
  'Tả Phụ': {
    name: 'Tả Phụ',
    type: 'minor',
    element: 'Thổ',
    nature: 'cát',
    keywords: ['Trợ giúp', 'Quý nhân', 'Hỗ trợ', 'Đồng nghiệp'],
    meaning: 'Sao quý nhân bên trái, chủ về sự hỗ trợ từ người khác, đặc biệt là đồng nghiệp nam.',
  },
  'Hữu Bật': {
    name: 'Hữu Bật',
    type: 'minor',
    element: 'Thủy',
    nature: 'cát',
    keywords: ['Trợ giúp', 'Quý nhân', 'Hỗ trợ', 'Phụ nữ'],
    meaning: 'Sao quý nhân bên phải, chủ về sự hỗ trợ từ người khác, đặc biệt là phụ nữ.',
  },
  'Lộc Tồn': {
    name: 'Lộc Tồn',
    type: 'minor',
    element: 'Thổ',
    nature: 'cát',
    keywords: ['Tài lộc', 'Tiết kiệm', 'Ổn định', 'Giữ của'],
    meaning: 'Sao tài lộc chính, chủ về tiền bạc tích lũy, biết giữ của, tài chính ổn định.',
  },
  'Thiên Khôi': {
    name: 'Thiên Khôi',
    type: 'minor',
    element: 'Hỏa',
    nature: 'cát',
    keywords: ['Quý nhân', 'Thầy giáo', 'Cấp trên', 'Đàn ông'],
    meaning: 'Sao quý nhân dương, chủ về sự giúp đỡ từ người đàn ông, cấp trên, thầy giáo.',
  },
  'Thiên Việt': {
    name: 'Thiên Việt',
    type: 'minor',
    element: 'Hỏa',
    nature: 'cát',
    keywords: ['Quý nhân', 'Phụ nữ', 'Mẹ', 'Ân nhân'],
    meaning: 'Sao quý nhân âm, chủ về sự giúp đỡ từ phụ nữ, mẹ, vợ, ân nhân.',
  },
  'Thiên Mã': {
    name: 'Thiên Mã',
    type: 'minor',
    element: 'Hỏa',
    nature: 'cát',
    keywords: ['Di chuyển', 'Thay đổi', 'Nhanh nhẹn', 'Xuất ngoại'],
    meaning: 'Sao di chuyển, chủ về sự thay đổi chỗ ở, công việc, xuất ngoại, đi lại nhiều.',
  },
  'Hóa Lộc': {
    name: 'Hóa Lộc',
    type: 'minor',
    nature: 'cát',
    keywords: ['Tài lộc', 'May mắn', 'Thuận lợi', 'Phát tài'],
    meaning: 'Sao hóa cát, biến sao gốc thành tốt lành, mang đến tài lộc và may mắn.',
  },
  'Hóa Quyền': {
    name: 'Hóa Quyền',
    type: 'minor',
    nature: 'cát',
    keywords: ['Quyền lực', 'Kiểm soát', 'Thăng tiến', 'Lãnh đạo'],
    meaning: 'Sao hóa quyền, mang đến quyền lực, khả năng kiểm soát và thăng tiến trong sự nghiệp.',
  },
  'Hóa Khoa': {
    name: 'Hóa Khoa',
    type: 'minor',
    nature: 'cát',
    keywords: ['Danh tiếng', 'Học vấn', 'Thành tựu', 'Thi cử'],
    meaning: 'Sao hóa khoa, mang đến danh tiếng, thành tựu trong học vấn và thi cử.',
  },
  'Hóa Kỵ': {
    name: 'Hóa Kỵ',
    type: 'minor',
    nature: 'hung',
    keywords: ['Trở ngại', 'Thị phi', 'Khó khăn', 'Lo lắng'],
    meaning: 'Sao hóa hung, mang đến trở ngại, thị phi, lo lắng trong lĩnh vực sao gốc chi phối.',
  },
};

// Các Tạp Diệu (Hung Tinh)
export const ADJECTIVE_STARS: Record<string, StarMeaning> = {
  'Kình Dương': {
    name: 'Kình Dương',
    type: 'adjective',
    element: 'Kim',
    nature: 'hung',
    keywords: ['Cương nghị', 'Tranh đấu', 'Tai nạn', 'Bướng bỉnh'],
    meaning: 'Sao sát, chủ về tranh đấu, tai nạn, nhưng cũng là sức mạnh vượt khó. Cần kiểm soát nóng nảy.',
  },
  'Đà La': {
    name: 'Đà La',
    type: 'adjective',
    element: 'Kim',
    nature: 'hung',
    keywords: ['Cản trở', 'Chậm trễ', 'Lưu luyến', 'Dây dưa'],
    meaning: 'Sao trì hoãn, chủ về sự chậm trễ, cản trở, dây dưa trong mọi việc.',
  },
  'Hỏa Tinh': {
    name: 'Hỏa Tinh',
    type: 'adjective',
    element: 'Hỏa',
    nature: 'hung',
    keywords: ['Nóng nảy', 'Bùng nổ', 'Nhanh', 'Bất ngờ'],
    meaning: 'Sao bùng nổ, chủ về sự kiện đột ngột, nóng nảy, nhưng cũng mang đến cơ hội bất ngờ.',
  },
  'Linh Tinh': {
    name: 'Linh Tinh',
    type: 'adjective',
    element: 'Hỏa',
    nature: 'hung',
    keywords: ['Cô độc', 'Biến động', 'Không ổn định', 'Bất ngờ'],
    meaning: 'Sao cô độc, chủ về sự biến động, không ổn định, nhưng có thể thúc đẩy thay đổi tích cực.',
  },
  'Địa Không': {
    name: 'Địa Không',
    type: 'adjective',
    element: 'Hỏa',
    nature: 'hung',
    keywords: ['Trống rỗng', 'Mất mát', 'Tâm linh', 'Sáng tạo'],
    meaning: 'Sao hư không, chủ về mất mát vật chất, nhưng mang đến tư duy sáng tạo và tâm linh.',
  },
  'Địa Kiếp': {
    name: 'Địa Kiếp',
    type: 'adjective',
    element: 'Hỏa',
    nature: 'hung',
    keywords: ['Tai kiếp', 'Mất mát', 'Phá sản', 'Thiệt hại'],
    meaning: 'Sao tai họa, chủ về mất mát tài sản, tai nạn, nhưng cũng là bài học để trưởng thành.',
  },
  'Thiên Hình': {
    name: 'Thiên Hình',
    type: 'adjective',
    element: 'Hỏa',
    nature: 'hung',
    keywords: ['Hình phạt', 'Pháp luật', 'Phẫu thuật', 'Kỷ luật'],
    meaning: 'Sao hình phạt, liên quan đến pháp luật, y tế, phẫu thuật. Cần cẩn thận về sức khỏe và pháp lý.',
  },
  'Thiên Riêu': {
    name: 'Thiên Riêu',
    type: 'adjective',
    nature: 'hung',
    keywords: ['Đào hoa xấu', 'Scandal', 'Ngoại tình', 'Thị phi'],
    meaning: 'Sao đào hoa xấu, chủ về thị phi tình cảm, ngoại tình, scandal. Cần giữ gìn đạo đức.',
  },
  'Đào Hoa': {
    name: 'Đào Hoa',
    type: 'adjective',
    nature: 'trung tính',
    keywords: ['Duyên dáng', 'Quyến rũ', 'Tình cảm', 'Nghệ thuật'],
    meaning: 'Sao duyên dáng, mang đến sức hấp dẫn, may mắn trong tình cảm và nghệ thuật.',
  },
  'Hồng Loan': {
    name: 'Hồng Loan',
    type: 'adjective',
    nature: 'cát',
    keywords: ['Kết hôn', 'Hạnh phúc', 'Duyên phận', 'Tình yêu'],
    meaning: 'Sao hỷ khánh, báo hiệu kết hôn, hạnh phúc gia đình, tin vui về tình cảm.',
  },
  'Thiên Hỷ': {
    name: 'Thiên Hỷ',
    type: 'adjective',
    nature: 'cát',
    keywords: ['Vui mừng', 'Có thai', 'Tin vui', 'Hỷ sự'],
    meaning: 'Sao hỷ sự, báo hiệu tin vui, có thai, kết hôn, thăng chức.',
  },
  'Thai': {
    name: 'Thai',
    type: 'adjective',
    nature: 'cát',
    keywords: ['Sinh sản', 'Sáng tạo', 'Khởi đầu', 'Mới mẻ'],
    meaning: 'Sao thai nghén, chủ về sinh sản, sáng tạo, khởi đầu mới, ý tưởng mới.',
  },
};

// Hàm lấy ý nghĩa sao theo tên
export function getStarMeaning(starName: string): StarMeaning | undefined {
  // Loại bỏ các ký tự đặc biệt trong tên sao
  const cleanName = starName.replace(/[()]/g, '').trim();
  
  return MAJOR_STARS[cleanName] || MINOR_STARS[cleanName] || ADJECTIVE_STARS[cleanName];
}

// Lấy tất cả ý nghĩa sao
export function getAllStarMeanings(): StarMeaning[] {
  return [
    ...Object.values(MAJOR_STARS),
    ...Object.values(MINOR_STARS),
    ...Object.values(ADJECTIVE_STARS),
  ];
}
