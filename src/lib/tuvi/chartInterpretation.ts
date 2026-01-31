// src/lib/tuvi/chartInterpretation.ts - Module luận giải tự động lá số Tử Vi

import { TuViChartData, PalaceInfo, StarInfo, getSoulPalace, getBodyPalace } from '@/services/TuViService';
import { getStarMeaning } from './starMeanings';
import { getPalaceMeaning } from './palaceMeanings';

export interface InterpretationSection {
  title: string;
  icon: string;
  content: string[];
  level: 'positive' | 'neutral' | 'negative' | 'info';
}

export interface ChartInterpretation {
  overview: InterpretationSection;
  personality: InterpretationSection;
  career: InterpretationSection;
  wealth: InterpretationSection;
  love: InterpretationSection;
  health: InterpretationSection;
  fortune: InterpretationSection;  // Vận hạn
  advice: InterpretationSection;
}

// Đánh giá sao trong cung
function evaluateStarsInPalace(palace: PalaceInfo): { good: string[]; bad: string[]; neutral: string[] } {
  const good: string[] = [];
  const bad: string[] = [];
  const neutral: string[] = [];
  
  const allStars = [...palace.majorStars, ...palace.minorStars, ...(palace.adjectiveStars || [])];
  
  for (const star of allStars) {
    const meaning = getStarMeaning(star.name);
    if (meaning) {
      if (meaning.nature === 'cát') good.push(star.name);
      else if (meaning.nature === 'hung') bad.push(star.name);
      else neutral.push(star.name);
    }
  }
  
  return { good, bad, neutral };
}

// Luận giải tổng quan
function interpretOverview(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  const soulPalace = getSoulPalace(chart);
  const bodyPalace = getBodyPalace(chart);
  
  // Thông tin cơ bản
  content.push(`Bạn sinh năm ${chart.lunarYear}, mệnh ${chart.napAm?.napAm || ''} (${chart.napAm?.element || ''}), ${chart.cuc.name}.`);
  
  // Quan hệ Mệnh - Cục
  if (chart.cucMenhRelation) {
    if (chart.cucMenhRelation.relation === 'tuong_sinh') {
      content.push(`✨ Mệnh ${chart.cucMenhRelation.menhElement} và Cục ${chart.cucMenhRelation.cucElement} tương sinh - đây là điềm tốt, cuộc đời thuận lợi, ít trắc trở.`);
    } else if (chart.cucMenhRelation.relation === 'tuong_khac') {
      content.push(`⚠️ Mệnh ${chart.cucMenhRelation.menhElement} và Cục ${chart.cucMenhRelation.cucElement} tương khắc - cần nỗ lực nhiều hơn để vượt qua khó khăn ban đầu.`);
    } else {
      content.push(`⚖️ Mệnh và Cục bình hòa - cuộc đời ổn định, không quá thăng trầm.`);
    }
  }
  
  // Mệnh Chủ và Thân Chủ
  content.push(`Mệnh Chủ là ${chart.soulStar}, Thân Chủ là ${chart.bodyStar} - hai sao này ảnh hưởng lớn đến tính cách và cuộc đời bạn.`);
  
  // Đánh giá cung Mệnh
  if (soulPalace) {
    const { good, bad } = evaluateStarsInPalace(soulPalace);
    if (good.length > bad.length) {
      content.push(`🌟 Cung Mệnh có nhiều cát tinh (${good.slice(0, 3).join(', ')}), cho thấy bạn có căn bản tốt và được trời phú nhiều ưu điểm.`);
    } else if (bad.length > good.length) {
      content.push(`⚡ Cung Mệnh có một số hung tinh cần lưu ý. Tuy nhiên, đây cũng là thử thách giúp bạn trưởng thành và mạnh mẽ hơn.`);
    }
  }
  
  return {
    title: 'Tổng Quan Lá Số',
    icon: '🔮',
    content,
    level: 'info'
  };
}

// Luận giải tính cách
function interpretPersonality(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  const soulPalace = getSoulPalace(chart);
  
  if (!soulPalace) {
    return { title: 'Tính Cách', icon: '🧠', content: ['Không đủ thông tin để luận giải.'], level: 'neutral' };
  }
  
  const majorStars = soulPalace.majorStars;
  let level: 'positive' | 'neutral' | 'negative' = 'neutral';
  
  if (majorStars.length === 0) {
    content.push('Cung Mệnh vô chính diệu - bạn là người linh hoạt, dễ thích nghi nhưng cần có định hướng rõ ràng trong cuộc sống.');
  } else {
    for (const star of majorStars) {
      const meaning = getStarMeaning(star.name);
      if (meaning) {
        content.push(`• ${star.name}: ${meaning.inMenh || meaning.meaning}`);
        if (meaning.nature === 'cát') level = 'positive';
        else if (meaning.nature === 'hung' && level !== 'positive') level = 'negative';
      }
    }
  }
  
  // Phân tích phụ tinh ảnh hưởng tính cách
  const minorStars = soulPalace.minorStars;
  const keyMinorStars = minorStars.filter(s => 
    ['Văn Xương', 'Văn Khúc', 'Tả Phụ', 'Hữu Bật', 'Thiên Khôi', 'Thiên Việt'].includes(s.name)
  );
  
  if (keyMinorStars.length > 0) {
    content.push(`Với ${keyMinorStars.map(s => s.name).join(', ')} đi kèm, bạn có thêm sự hỗ trợ về trí tuệ và quý nhân.`);
    level = 'positive';
  }
  
  return {
    title: 'Tính Cách & Con Người',
    icon: '🧠',
    content,
    level
  };
}

// Luận giải sự nghiệp
function interpretCareer(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  const careerPalace = chart.palaces.find(p => p.name === 'Quan Lộc');
  let level: 'positive' | 'neutral' | 'negative' = 'neutral';
  
  if (!careerPalace) {
    return { title: 'Sự Nghiệp', icon: '💼', content: ['Không tìm thấy cung Quan Lộc.'], level: 'neutral' };
  }
  
  const { good, bad } = evaluateStarsInPalace(careerPalace);
  
  if (careerPalace.majorStars.length === 0) {
    content.push('Cung Quan Lộc vô chính diệu - sự nghiệp phụ thuộc nhiều vào nỗ lực cá nhân và môi trường làm việc.');
  } else {
    for (const star of careerPalace.majorStars) {
      const meaning = getStarMeaning(star.name);
      if (meaning && meaning.inQuanLoc) {
        content.push(`• ${star.name}: ${meaning.inQuanLoc}`);
      }
    }
  }
  
  // Phân tích Hóa Quyền, Hóa Lộc trong sự nghiệp
  if (chart.tuHoa.hoaQuyen.palace === 'Quan Lộc') {
    content.push(`✨ Hóa Quyền tại Quan Lộc - bạn có quyền lực và ảnh hưởng trong công việc, dễ thăng tiến.`);
    level = 'positive';
  }
  if (chart.tuHoa.hoaLoc.palace === 'Quan Lộc') {
    content.push(`💰 Hóa Lộc tại Quan Lộc - sự nghiệp mang đến tài lộc dồi dào.`);
    level = 'positive';
  }
  if (chart.tuHoa.hoaKy.palace === 'Quan Lộc') {
    content.push(`⚠️ Hóa Kỵ tại Quan Lộc - cần cẩn thận với thị phi, áp lực công việc.`);
    level = bad.length > good.length ? 'negative' : 'neutral';
  }
  
  if (good.length > bad.length && level === 'neutral') level = 'positive';
  else if (bad.length > good.length && level === 'neutral') level = 'negative';
  
  return {
    title: 'Sự Nghiệp & Công Danh',
    icon: '💼',
    content,
    level
  };
}

// Luận giải tài chính
function interpretWealth(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  const wealthPalace = chart.palaces.find(p => p.name === 'Tài Bạch');
  let level: 'positive' | 'neutral' | 'negative' = 'neutral';
  
  if (!wealthPalace) {
    return { title: 'Tài Chính', icon: '💰', content: ['Không tìm thấy cung Tài Bạch.'], level: 'neutral' };
  }
  
  const { good, bad } = evaluateStarsInPalace(wealthPalace);
  
  if (wealthPalace.majorStars.length === 0) {
    content.push('Cung Tài Bạch vô chính diệu - tài chính biến động, cần quản lý chi tiêu cẩn thận.');
  } else {
    for (const star of wealthPalace.majorStars) {
      const meaning = getStarMeaning(star.name);
      if (meaning && meaning.inTaiBach) {
        content.push(`• ${star.name}: ${meaning.inTaiBach}`);
      }
    }
  }
  
  // Kiểm tra Lộc Tồn
  const hasLocTon = wealthPalace.minorStars.some(s => s.name === 'Lộc Tồn');
  if (hasLocTon) {
    content.push('💎 Lộc Tồn tại Tài Bạch - bạn có khả năng tích lũy tài sản, biết giữ của.');
    level = 'positive';
  }
  
  // Hóa Lộc
  if (chart.tuHoa.hoaLoc.palace === 'Tài Bạch') {
    content.push('✨ Hóa Lộc chiếu Tài Bạch - tài lộc dồi dào, dễ kiếm tiền.');
    level = 'positive';
  }
  
  if (good.length > bad.length && level === 'neutral') level = 'positive';
  else if (bad.length > good.length && level === 'neutral') level = 'negative';
  
  return {
    title: 'Tài Chính & Vật Chất',
    icon: '💰',
    content,
    level
  };
}

// Luận giải tình duyên
function interpretLove(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  const lovePalace = chart.palaces.find(p => p.name === 'Phu Thê');
  let level: 'positive' | 'neutral' | 'negative' = 'neutral';
  
  if (!lovePalace) {
    return { title: 'Tình Duyên', icon: '❤️', content: ['Không tìm thấy cung Phu Thê.'], level: 'neutral' };
  }
  
  const { good, bad } = evaluateStarsInPalace(lovePalace);
  
  if (lovePalace.majorStars.length === 0) {
    content.push('Cung Phu Thê vô chính diệu - tình duyên cần thời gian để ổn định, nên cưới muộn hơn.');
  } else {
    for (const star of lovePalace.majorStars) {
      const meaning = getStarMeaning(star.name);
      if (meaning && meaning.inPhuThe) {
        content.push(`• ${star.name}: ${meaning.inPhuThe}`);
      }
    }
  }
  
  // Kiểm tra Hồng Loan, Thiên Hỷ
  const allStars = [...lovePalace.minorStars, ...(lovePalace.adjectiveStars || [])];
  const hasHongLoan = allStars.some(s => s.name === 'Hồng Loan');
  const hasThienHy = allStars.some(s => s.name === 'Thiên Hỷ');
  
  if (hasHongLoan || hasThienHy) {
    content.push('🌸 Có Hồng Loan/Thiên Hỷ - duyên phận tốt đẹp, dễ gặp người phù hợp.');
    level = 'positive';
  }
  
  // Kiểm tra hung tinh đào hoa
  const hasThienRieu = allStars.some(s => s.name === 'Thiên Riêu');
  if (hasThienRieu) {
    content.push('⚠️ Có Thiên Riêu - cần cẩn thận với thị phi tình cảm, tránh ngoại tình.');
  }
  
  if (good.length > bad.length && level === 'neutral') level = 'positive';
  else if (bad.length > good.length && level === 'neutral') level = 'negative';
  
  return {
    title: 'Tình Duyên & Hôn Nhân',
    icon: '❤️',
    content,
    level
  };
}

// Luận giải sức khỏe
function interpretHealth(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  const healthPalace = chart.palaces.find(p => p.name === 'Tật Ách');
  let level: 'positive' | 'neutral' | 'negative' = 'neutral';
  
  if (!healthPalace) {
    return { title: 'Sức Khỏe', icon: '🏥', content: ['Không tìm thấy cung Tật Ách.'], level: 'neutral' };
  }
  
  const { good, bad } = evaluateStarsInPalace(healthPalace);
  
  content.push('Cung Tật Ách cho biết về sức khỏe và bệnh tật tiềm ẩn.');
  
  // Phân tích theo ngũ hành mệnh
  if (chart.napAm?.element) {
    const healthTips: Record<string, string> = {
      'Kim': 'Mệnh Kim cần chú ý phổi, đường hô hấp, da.',
      'Mộc': 'Mệnh Mộc cần chú ý gan, mật, mắt.',
      'Thủy': 'Mệnh Thủy cần chú ý thận, bàng quang, tai.',
      'Hỏa': 'Mệnh Hỏa cần chú ý tim, mạch máu, lưỡi.',
      'Thổ': 'Mệnh Thổ cần chú ý dạ dày, lá lách, miệng.',
    };
    if (healthTips[chart.napAm.element]) {
      content.push(`🔍 ${healthTips[chart.napAm.element]}`);
    }
  }
  
  // Hung tinh tại Tật Ách
  if (bad.length > 0) {
    content.push(`⚠️ Có ${bad.slice(0, 2).join(', ')} tại Tật Ách - cần chú ý sức khỏe, khám định kỳ.`);
    level = 'negative';
  }
  
  if (good.length > bad.length) {
    content.push('✨ Nhiều cát tinh bảo vệ - sức khỏe tương đối ổn định, ít bệnh tật nghiêm trọng.');
    level = 'positive';
  }
  
  return {
    title: 'Sức Khỏe',
    icon: '🏥',
    content,
    level
  };
}

// Luận giải vận hạn (Đại hạn & Tiểu hạn)
function interpretFortune(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  let level: 'positive' | 'neutral' | 'negative' = 'neutral';
  
  // Tính tuổi hiện tại (tuổi mụ = năm hiện tại - năm sinh + 1)
  const currentYear = new Date().getFullYear();
  // solarDate có dạng "YYYY-MM-DD", lấy năm sinh từ đó
  const birthYear = parseInt(chart.solarDate?.split('-')[0]) || currentYear - 30;
  const currentAge = currentYear - birthYear + 1; // Tuổi mụ
  
  content.push(`📅 Tuổi hiện tại (tính theo tuổi mụ): khoảng ${currentAge} tuổi.`);
  
  // Tìm Đại Hạn hiện tại
  let currentDaiHan: PalaceInfo | null = null;
  let nextDaiHan: PalaceInfo | null = null;
  
  for (const palace of chart.palaces) {
    if (palace.stage) {
      const [start, end] = palace.stage.range;
      if (currentAge >= start && currentAge <= end) {
        currentDaiHan = palace;
      }
      if (start > currentAge && (!nextDaiHan || start < (nextDaiHan.stage?.range[0] || Infinity))) {
        nextDaiHan = palace;
      }
    }
  }
  
  // Phân tích Đại Hạn hiện tại
  if (currentDaiHan && currentDaiHan.stage) {
    const { good, bad } = evaluateStarsInPalace(currentDaiHan);
    content.push(`\n🔷 ĐẠI HẠN HIỆN TẠI (${currentDaiHan.stage.range[0]}-${currentDaiHan.stage.range[1]} tuổi):`);
    content.push(`• Đang đi vào cung ${currentDaiHan.name} (${currentDaiHan.earthlyBranch}), Can ${currentDaiHan.stage.heavenlyStem}.`);
    
    if (currentDaiHan.majorStars.length > 0) {
      const starNames = currentDaiHan.majorStars.map(s => s.name).join(', ');
      content.push(`• Chính tinh: ${starNames}`);
    } else {
      content.push(`• Cung vô chính diệu - vận hạn phụ thuộc vào các sao phụ tinh và tam hợp.`);
    }
    
    // Đánh giá chung
    if (good.length > bad.length) {
      content.push(`✨ Giai đoạn này có nhiều cát tinh hỗ trợ (${good.slice(0, 3).join(', ')}), vận khí tương đối thuận lợi.`);
      level = 'positive';
    } else if (bad.length > good.length) {
      content.push(`⚠️ Giai đoạn này có ${bad.slice(0, 2).join(', ')} - cần cẩn thận, không nên mạo hiểm.`);
      level = 'negative';
    } else {
      content.push(`⚖️ Giai đoạn bình hòa, không quá tốt cũng không quá xấu.`);
    }
    
    // Kiểm tra Trường Sinh 12 thần
    if (currentDaiHan.changsheng12) {
      const changshengMeaning: Record<string, string> = {
        'Trường Sinh': 'khởi đầu mới, phát triển',
        'Mộc Dục': 'thử thách, cần cẩn thận',
        'Quan Đới': 'ổn định, chuẩn bị thăng tiến',
        'Lâm Quan': 'đỉnh cao, thành công',
        'Đế Vượng': 'cực thịnh, cần giữ gìn',
        'Suy': 'bắt đầu suy giảm',
        'Bệnh': 'cẩn thận sức khỏe',
        'Tử': 'kết thúc chu kỳ cũ',
        'Mộ': 'tích lũy, ẩn náu',
        'Tuyệt': 'khó khăn, chờ thời',
        'Thai': 'mầm mống mới',
        'Dưỡng': 'nuôi dưỡng, chuẩn bị',
      };
      const meaning = changshengMeaning[currentDaiHan.changsheng12] || '';
      content.push(`• Trường Sinh: ${currentDaiHan.changsheng12}${meaning ? ` - ${meaning}` : ''}`);
    }
  }
  
  // Tìm Tiểu Hạn năm nay
  let currentTieuHan: PalaceInfo | null = null;
  for (const palace of chart.palaces) {
    if (palace.ages && palace.ages.includes(currentAge)) {
      currentTieuHan = palace;
      break;
    }
  }
  
  if (currentTieuHan) {
    const { good, bad } = evaluateStarsInPalace(currentTieuHan);
    content.push(`\n🔶 TIỂU HẠN NĂM NAY (${currentAge} tuổi):`);
    content.push(`• Tiểu hạn đi vào cung ${currentTieuHan.name} (${currentTieuHan.earthlyBranch}).`);
    
    if (currentTieuHan.majorStars.length > 0) {
      content.push(`• Gặp sao: ${currentTieuHan.majorStars.map(s => s.name).join(', ')}`);
    }
    
    if (good.length > bad.length) {
      content.push(`✨ Năm nay vận khí tốt, có quý nhân giúp đỡ.`);
      if (level !== 'negative') level = 'positive';
    } else if (bad.length > good.length) {
      content.push(`⚠️ Năm nay cần cẩn thận, tránh đầu tư mạo hiểm.`);
      level = 'negative';
    }
  }
  
  // Dự báo Đại Hạn tiếp theo
  if (nextDaiHan && nextDaiHan.stage) {
    content.push(`\n📌 ĐẠI HẠN TIẾP THEO (${nextDaiHan.stage.range[0]}-${nextDaiHan.stage.range[1]} tuổi):`);
    content.push(`• Sẽ chuyển vào cung ${nextDaiHan.name} với ${nextDaiHan.majorStars.length > 0 ? nextDaiHan.majorStars.map(s => s.name).join(', ') : 'vô chính diệu'}.`);
  }
  
  return {
    title: 'Vận Hạn (Đại Hạn & Tiểu Hạn)',
    icon: '⏳',
    content,
    level
  };
}

// Lời khuyên tổng hợp
function generateAdvice(chart: TuViChartData): InterpretationSection {
  const content: string[] = [];
  
  // Dựa vào Nạp Âm
  if (chart.napAm) {
    content.push(`🎨 Màu may mắn: ${chart.napAm.color}`);
    content.push(`🧭 Hướng tốt: ${chart.napAm.direction}`);
  }
  
  // Dựa vào Tứ Hóa
  if (chart.tuHoa.hoaLoc.star) {
    content.push(`💫 Phát huy sao ${chart.tuHoa.hoaLoc.star} (Hóa Lộc) để tăng tài lộc.`);
  }
  if (chart.tuHoa.hoaKy.star) {
    content.push(`⚡ Cẩn thận với ${chart.tuHoa.hoaKy.star} (Hóa Kỵ) - đây là điểm cần lưu ý và cải thiện.`);
  }
  
  // Lời khuyên chung
  content.push('📚 Hãy nhớ: Lá số chỉ là tiềm năng, nỗ lực và tâm tính mới quyết định thành bại.');
  content.push('🙏 "Mệnh do thiên định, vận tự kỷ cầu" - Số mệnh do trời nhưng vận may tự mình tạo.');
  
  return {
    title: 'Lời Khuyên',
    icon: '💡',
    content,
    level: 'info'
  };
}

// Main function
export function interpretChart(chart: TuViChartData): ChartInterpretation {
  return {
    overview: interpretOverview(chart),
    personality: interpretPersonality(chart),
    career: interpretCareer(chart),
    wealth: interpretWealth(chart),
    love: interpretLove(chart),
    health: interpretHealth(chart),
    fortune: interpretFortune(chart),
    advice: generateAdvice(chart),
  };
}
