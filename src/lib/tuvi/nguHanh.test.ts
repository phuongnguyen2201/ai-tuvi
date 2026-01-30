import { describe, it, expect } from 'vitest';
import {
  getNguHanhNapAm,
  getNguHanhFromYear,
  checkElementRelation,
  getLuckyColors,
  getUnluckyColors,
  getDirections,
  NGU_HANH,
} from './nguHanh';

describe('Ngũ Hành Nạp Âm', () => {
  describe('getNguHanhNapAm - Bảng Lục Thập Hoa Giáp', () => {
    it('should return correct Nạp Âm for Giáp Tý - Hải Trung Kim', () => {
      const result = getNguHanhNapAm('Giáp', 'Tý');
      expect(result.name).toBe('Kim');
      expect(result.napAm).toBe('Hải Trung Kim');
    });

    it('should return correct Nạp Âm for Ất Sửu - Hải Trung Kim', () => {
      const result = getNguHanhNapAm('Ất', 'Sửu');
      expect(result.name).toBe('Kim');
      expect(result.napAm).toBe('Hải Trung Kim');
    });

    it('should return correct Nạp Âm for Bính Dần - Lô Trung Hỏa', () => {
      const result = getNguHanhNapAm('Bính', 'Dần');
      expect(result.name).toBe('Hỏa');
      expect(result.napAm).toBe('Lô Trung Hỏa');
    });

    it('should return correct Nạp Âm for Kỷ Mùi - Thiên Thượng Hỏa', () => {
      const result = getNguHanhNapAm('Kỷ', 'Mùi');
      expect(result.name).toBe('Hỏa');
      expect(result.napAm).toBe('Thiên Thượng Hỏa');
    });

    it('should return correct Nạp Âm for Nhâm Tuất - Đại Hải Thủy', () => {
      const result = getNguHanhNapAm('Nhâm', 'Tuất');
      expect(result.name).toBe('Thủy');
      expect(result.napAm).toBe('Đại Hải Thủy');
    });

    it('should return correct Nạp Âm for Quý Hợi - Đại Hải Thủy', () => {
      const result = getNguHanhNapAm('Quý', 'Hợi');
      expect(result.name).toBe('Thủy');
      expect(result.napAm).toBe('Đại Hải Thủy');
    });

    it('should return Unknown for invalid Can Chi', () => {
      const result = getNguHanhNapAm('Invalid', 'Chi');
      expect(result.name).toBe('Unknown');
    });
  });

  describe('getNguHanhFromYear - Tính mệnh từ năm dương lịch', () => {
    it('should return correct mệnh for 1979 (Kỷ Mùi) - Thiên Thượng Hỏa', () => {
      const result = getNguHanhFromYear(1979);
      expect(result.name).toBe('Hỏa');
      expect(result.napAm).toBe('Thiên Thượng Hỏa');
    });

    it('should return correct mệnh for 1984 (Giáp Tý) - Hải Trung Kim', () => {
      const result = getNguHanhFromYear(1984);
      expect(result.name).toBe('Kim');
      expect(result.napAm).toBe('Hải Trung Kim');
    });

    it('should return correct mệnh for 1990 (Canh Ngọ) - Lộ Bàng Thổ', () => {
      const result = getNguHanhFromYear(1990);
      expect(result.name).toBe('Thổ');
      expect(result.napAm).toBe('Lộ Bàng Thổ');
    });

    it('should return correct mệnh for 1995 (Ất Hợi) - Sơn Đầu Hỏa', () => {
      const result = getNguHanhFromYear(1995);
      expect(result.name).toBe('Hỏa');
      expect(result.napAm).toBe('Sơn Đầu Hỏa');
    });

    it('should return correct mệnh for 2000 (Canh Thìn) - Bạch Lạp Kim', () => {
      const result = getNguHanhFromYear(2000);
      expect(result.name).toBe('Kim');
      expect(result.napAm).toBe('Bạch Lạp Kim');
    });

    it('should return correct mệnh for 2024 (Giáp Thìn) - Phú Đăng Hỏa', () => {
      const result = getNguHanhFromYear(2024);
      expect(result.name).toBe('Hỏa');
      expect(result.napAm).toBe('Phú Đăng Hỏa');
    });

    it('should return correct mệnh for 2025 (Ất Tỵ) - Phú Đăng Hỏa', () => {
      const result = getNguHanhFromYear(2025);
      expect(result.name).toBe('Hỏa');
      expect(result.napAm).toBe('Phú Đăng Hỏa');
    });
  });

  describe('checkElementRelation - Tương sinh tương khắc', () => {
    // Tương sinh tests
    it('should detect Kim sinh Thủy', () => {
      const result = checkElementRelation('Kim', 'Thủy');
      expect(result.relation).toBe('tuong_sinh');
      expect(result.compatibility).toBe(85);
    });

    it('should detect Thủy sinh Mộc', () => {
      const result = checkElementRelation('Thủy', 'Mộc');
      expect(result.relation).toBe('tuong_sinh');
      expect(result.compatibility).toBe(85);
    });

    it('should detect Mộc sinh Hỏa', () => {
      const result = checkElementRelation('Mộc', 'Hỏa');
      expect(result.relation).toBe('tuong_sinh');
      expect(result.compatibility).toBe(85);
    });

    it('should detect Hỏa sinh Thổ', () => {
      const result = checkElementRelation('Hỏa', 'Thổ');
      expect(result.relation).toBe('tuong_sinh');
      expect(result.compatibility).toBe(85);
    });

    it('should detect Thổ sinh Kim', () => {
      const result = checkElementRelation('Thổ', 'Kim');
      expect(result.relation).toBe('tuong_sinh');
      expect(result.compatibility).toBe(85);
    });

    // Tương khắc tests
    it('should detect Kim khắc Mộc', () => {
      const result = checkElementRelation('Kim', 'Mộc');
      expect(result.relation).toBe('tuong_khac');
      expect(result.compatibility).toBe(40);
    });

    it('should detect Mộc khắc Thổ', () => {
      const result = checkElementRelation('Mộc', 'Thổ');
      expect(result.relation).toBe('tuong_khac');
      expect(result.compatibility).toBe(40);
    });

    it('should detect Thổ khắc Thủy', () => {
      const result = checkElementRelation('Thổ', 'Thủy');
      expect(result.relation).toBe('tuong_khac');
      expect(result.compatibility).toBe(40);
    });

    it('should detect Thủy khắc Hỏa', () => {
      const result = checkElementRelation('Thủy', 'Hỏa');
      expect(result.relation).toBe('tuong_khac');
      expect(result.compatibility).toBe(40);
    });

    it('should detect Hỏa khắc Kim', () => {
      const result = checkElementRelation('Hỏa', 'Kim');
      expect(result.relation).toBe('tuong_khac');
      expect(result.compatibility).toBe(40);
    });

    // Cùng mệnh tests
    it('should detect same element (Kim - Kim)', () => {
      const result = checkElementRelation('Kim', 'Kim');
      expect(result.relation).toBe('binh_hoa');
      expect(result.compatibility).toBe(70);
    });

    it('should detect same element (Mộc - Mộc)', () => {
      const result = checkElementRelation('Mộc', 'Mộc');
      expect(result.relation).toBe('binh_hoa');
      expect(result.compatibility).toBe(70);
    });

    // Invalid element
    it('should handle invalid elements', () => {
      const result = checkElementRelation('Invalid', 'Element');
      expect(result.relation).toBe('binh_hoa');
      expect(result.compatibility).toBe(50);
    });
  });

  describe('getLuckyColors - Màu may mắn', () => {
    it('should return lucky colors for Kim', () => {
      const colors = getLuckyColors('Kim');
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0].name).toBe('Trắng, Vàng kim');
    });

    it('should return lucky colors for Mộc', () => {
      const colors = getLuckyColors('Mộc');
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0].name).toBe('Xanh lá, Xanh lục');
    });

    it('should return empty array for invalid element', () => {
      const colors = getLuckyColors('Invalid');
      expect(colors).toEqual([]);
    });
  });

  describe('getUnluckyColors - Màu nên tránh', () => {
    it('should return unlucky colors for Kim (Hỏa khắc Kim)', () => {
      const colors = getUnluckyColors('Kim');
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0].name).toBe('Đỏ, Cam, Hồng');
    });

    it('should return unlucky colors for Mộc (Kim khắc Mộc)', () => {
      const colors = getUnluckyColors('Mộc');
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0].name).toBe('Trắng, Vàng kim');
    });
  });

  describe('getDirections - Hướng tốt xấu', () => {
    it('should return correct directions for Kim', () => {
      const directions = getDirections('Kim');
      expect(directions.good).toContain('Tây');
      expect(directions.bad).toContain('Nam');
    });

    it('should return correct directions for Mộc', () => {
      const directions = getDirections('Mộc');
      expect(directions.good).toContain('Đông');
      expect(directions.bad).toContain('Tây');
    });

    it('should return correct directions for Thủy', () => {
      const directions = getDirections('Thủy');
      expect(directions.good).toContain('Bắc');
    });

    it('should return correct directions for Hỏa', () => {
      const directions = getDirections('Hỏa');
      expect(directions.good).toContain('Nam');
      expect(directions.bad).toContain('Bắc');
    });

    it('should return correct directions for Thổ', () => {
      const directions = getDirections('Thổ');
      expect(directions.good).toContain('Trung ương');
      expect(directions.bad).toContain('Đông');
    });

    it('should return empty arrays for invalid element', () => {
      const directions = getDirections('Invalid');
      expect(directions.good).toEqual([]);
      expect(directions.bad).toEqual([]);
    });
  });

  describe('NGU_HANH constants - Ngũ Hành cơ bản', () => {
    it('should have correct tương sinh cycle', () => {
      expect(NGU_HANH.Kim.generates).toBe('Thủy');
      expect(NGU_HANH.Thủy.generates).toBe('Mộc');
      expect(NGU_HANH.Mộc.generates).toBe('Hỏa');
      expect(NGU_HANH.Hỏa.generates).toBe('Thổ');
      expect(NGU_HANH.Thổ.generates).toBe('Kim');
    });

    it('should have correct tương khắc cycle', () => {
      expect(NGU_HANH.Kim.controls).toBe('Mộc');
      expect(NGU_HANH.Mộc.controls).toBe('Thổ');
      expect(NGU_HANH.Thổ.controls).toBe('Thủy');
      expect(NGU_HANH.Thủy.controls).toBe('Hỏa');
      expect(NGU_HANH.Hỏa.controls).toBe('Kim');
    });

    it('should have correct generatedBy (được sinh bởi)', () => {
      expect(NGU_HANH.Kim.generatedBy).toBe('Thổ');
      expect(NGU_HANH.Thủy.generatedBy).toBe('Kim');
      expect(NGU_HANH.Mộc.generatedBy).toBe('Thủy');
      expect(NGU_HANH.Hỏa.generatedBy).toBe('Mộc');
      expect(NGU_HANH.Thổ.generatedBy).toBe('Hỏa');
    });

    it('should have correct controlledBy (bị khắc bởi)', () => {
      expect(NGU_HANH.Kim.controlledBy).toBe('Hỏa');
      expect(NGU_HANH.Mộc.controlledBy).toBe('Kim');
      expect(NGU_HANH.Thổ.controlledBy).toBe('Mộc');
      expect(NGU_HANH.Thủy.controlledBy).toBe('Thổ');
      expect(NGU_HANH.Hỏa.controlledBy).toBe('Thủy');
    });
  });

  describe('Complete 60-year cycle validation', () => {
    // Test all 30 Nạp Âm pairs (60 years / 2 = 30 pairs)
    const napAmPairs = [
      { can1: 'Giáp', chi1: 'Tý', can2: 'Ất', chi2: 'Sửu', napAm: 'Hải Trung Kim', element: 'Kim' },
      { can1: 'Bính', chi1: 'Dần', can2: 'Đinh', chi2: 'Mão', napAm: 'Lô Trung Hỏa', element: 'Hỏa' },
      { can1: 'Mậu', chi1: 'Thìn', can2: 'Kỷ', chi2: 'Tỵ', napAm: 'Đại Lâm Mộc', element: 'Mộc' },
      { can1: 'Canh', chi1: 'Ngọ', can2: 'Tân', chi2: 'Mùi', napAm: 'Lộ Bàng Thổ', element: 'Thổ' },
      { can1: 'Nhâm', chi1: 'Thân', can2: 'Quý', chi2: 'Dậu', napAm: 'Kiếm Phong Kim', element: 'Kim' },
      { can1: 'Giáp', chi1: 'Tuất', can2: 'Ất', chi2: 'Hợi', napAm: 'Sơn Đầu Hỏa', element: 'Hỏa' },
      { can1: 'Bính', chi1: 'Tý', can2: 'Đinh', chi2: 'Sửu', napAm: 'Giản Hạ Thủy', element: 'Thủy' },
      { can1: 'Mậu', chi1: 'Dần', can2: 'Kỷ', chi2: 'Mão', napAm: 'Thành Đầu Thổ', element: 'Thổ' },
      { can1: 'Canh', chi1: 'Thìn', can2: 'Tân', chi2: 'Tỵ', napAm: 'Bạch Lạp Kim', element: 'Kim' },
      { can1: 'Nhâm', chi1: 'Ngọ', can2: 'Quý', chi2: 'Mùi', napAm: 'Dương Liễu Mộc', element: 'Mộc' },
      { can1: 'Giáp', chi1: 'Thân', can2: 'Ất', chi2: 'Dậu', napAm: 'Tuyền Trung Thủy', element: 'Thủy' },
      { can1: 'Bính', chi1: 'Tuất', can2: 'Đinh', chi2: 'Hợi', napAm: 'Ốc Thượng Thổ', element: 'Thổ' },
      { can1: 'Mậu', chi1: 'Tý', can2: 'Kỷ', chi2: 'Sửu', napAm: 'Tích Lịch Hỏa', element: 'Hỏa' },
      { can1: 'Canh', chi1: 'Dần', can2: 'Tân', chi2: 'Mão', napAm: 'Tùng Bách Mộc', element: 'Mộc' },
      { can1: 'Nhâm', chi1: 'Thìn', can2: 'Quý', chi2: 'Tỵ', napAm: 'Trường Lưu Thủy', element: 'Thủy' },
      { can1: 'Giáp', chi1: 'Ngọ', can2: 'Ất', chi2: 'Mùi', napAm: 'Sa Trung Kim', element: 'Kim' },
      { can1: 'Bính', chi1: 'Thân', can2: 'Đinh', chi2: 'Dậu', napAm: 'Sơn Hạ Hỏa', element: 'Hỏa' },
      { can1: 'Mậu', chi1: 'Tuất', can2: 'Kỷ', chi2: 'Hợi', napAm: 'Bình Địa Mộc', element: 'Mộc' },
      { can1: 'Canh', chi1: 'Tý', can2: 'Tân', chi2: 'Sửu', napAm: 'Bích Thượng Thổ', element: 'Thổ' },
      { can1: 'Nhâm', chi1: 'Dần', can2: 'Quý', chi2: 'Mão', napAm: 'Kim Bạc Kim', element: 'Kim' },
      { can1: 'Giáp', chi1: 'Thìn', can2: 'Ất', chi2: 'Tỵ', napAm: 'Phú Đăng Hỏa', element: 'Hỏa' },
      { can1: 'Bính', chi1: 'Ngọ', can2: 'Đinh', chi2: 'Mùi', napAm: 'Thiên Hà Thủy', element: 'Thủy' },
      { can1: 'Mậu', chi1: 'Thân', can2: 'Kỷ', chi2: 'Dậu', napAm: 'Đại Trạch Thổ', element: 'Thổ' },
      { can1: 'Canh', chi1: 'Tuất', can2: 'Tân', chi2: 'Hợi', napAm: 'Thoa Xuyến Kim', element: 'Kim' },
      { can1: 'Nhâm', chi1: 'Tý', can2: 'Quý', chi2: 'Sửu', napAm: 'Tang Đố Mộc', element: 'Mộc' },
      { can1: 'Giáp', chi1: 'Dần', can2: 'Ất', chi2: 'Mão', napAm: 'Đại Khê Thủy', element: 'Thủy' },
      { can1: 'Bính', chi1: 'Thìn', can2: 'Đinh', chi2: 'Tỵ', napAm: 'Sa Trung Thổ', element: 'Thổ' },
      { can1: 'Mậu', chi1: 'Ngọ', can2: 'Kỷ', chi2: 'Mùi', napAm: 'Thiên Thượng Hỏa', element: 'Hỏa' },
      { can1: 'Canh', chi1: 'Thân', can2: 'Tân', chi2: 'Dậu', napAm: 'Thạch Lựu Mộc', element: 'Mộc' },
      { can1: 'Nhâm', chi1: 'Tuất', can2: 'Quý', chi2: 'Hợi', napAm: 'Đại Hải Thủy', element: 'Thủy' },
    ];

    napAmPairs.forEach((pair) => {
      it(`should have correct Nạp Âm for ${pair.can1}${pair.chi1} - ${pair.can2}${pair.chi2}: ${pair.napAm}`, () => {
        const result1 = getNguHanhNapAm(pair.can1, pair.chi1);
        const result2 = getNguHanhNapAm(pair.can2, pair.chi2);
        
        expect(result1.napAm).toBe(pair.napAm);
        expect(result1.name).toBe(pair.element);
        expect(result2.napAm).toBe(pair.napAm);
        expect(result2.name).toBe(pair.element);
      });
    });
  });
});
