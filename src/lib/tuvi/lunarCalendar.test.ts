import { describe, it, expect } from 'vitest';
import { solarToLunar, validateConversion, getBirthHour, getCanChiGio, THIEN_CAN, DIA_CHI } from './lunarCalendar';

describe('Lunar Calendar Conversion', () => {
  it('should pass all validation test cases', () => {
    expect(validateConversion()).toBe(true);
  });

  it('should convert 25/10/1979 to 5/9/Kỷ Mùi', () => {
    const result = solarToLunar(new Date(1979, 9, 25));
    expect(result.year).toBe(1979);
    expect(result.month).toBe(9);
    expect(result.day).toBe(5);
    expect(result.yearCanChi).toBe('Kỷ Mùi');
  });

  it('should convert 01/01/2000 to 25/11/Kỷ Mão (1999)', () => {
    const result = solarToLunar(new Date(2000, 0, 1));
    expect(result.year).toBe(1999);
    expect(result.month).toBe(11);
    expect(result.day).toBe(25);
  });

  it('should convert 31/01/1900 to 1/1/Canh Tý', () => {
    const result = solarToLunar(new Date(1900, 0, 31));
    expect(result.year).toBe(1900);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.yearCanChi).toBe('Canh Tý');
  });

  it('should convert 01/02/2025 correctly', () => {
    const result = solarToLunar(new Date(2025, 1, 1));
    // 01/02/2025 dương lịch = 4/1/Ất Tỵ âm lịch
    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(4);
    expect(result.yearCanChi).toBe('Ất Tỵ');
  });
});

describe('Birth Hour (Canh Giờ)', () => {
  it('should return Tý for hours 23-0', () => {
    expect(getBirthHour(23).name).toBe('Tý');
    expect(getBirthHour(0).name).toBe('Tý');
  });

  it('should return Sửu for hours 1-2', () => {
    expect(getBirthHour(1).name).toBe('Sửu');
    expect(getBirthHour(2).name).toBe('Sửu');
  });

  it('should return Ngọ for hours 11-12', () => {
    expect(getBirthHour(11).name).toBe('Ngọ');
    expect(getBirthHour(12).name).toBe('Ngọ');
  });
});

describe('Can Chi Giờ', () => {
  it('should calculate correct Can for Giờ Tý on day Giáp', () => {
    const canNgay = THIEN_CAN[0]; // Giáp
    const chiGio = DIA_CHI[0]; // Tý
    const result = getCanChiGio(canNgay, chiGio);
    expect(result.can.name).toBe('Giáp'); // Ngày Giáp, giờ Tý = Giáp Tý
  });

  it('should calculate correct Can for Giờ Tý on day Ất', () => {
    const canNgay = THIEN_CAN[1]; // Ất
    const chiGio = DIA_CHI[0]; // Tý
    const result = getCanChiGio(canNgay, chiGio);
    expect(result.can.name).toBe('Bính'); // Ngày Ất, giờ Tý = Bính Tý
  });
});
