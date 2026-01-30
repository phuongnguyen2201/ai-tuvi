/**
 * Test Page - Verify all Tu Vi calculations
 * Temporary development page
 */
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

import {
  solarToLunar,
  getBirthHour,
  getCanChiGio,
  formatLunarDate,
  CANH_GIO,
  DIA_CHI,
} from "@/lib/tuvi/lunarCalendar";
import { getNguHanhNapAm } from "@/lib/tuvi/nguHanh";
import {
  calculateCompatibility,
  findBestMatches,
  findWorstMatches,
  ZODIAC_ANIMALS,
  type ZodiacChi,
} from "@/lib/tuvi/compatibility";

const Test = () => {
  // Section 1: Lunar Calendar Test
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHourIndex, setSelectedHourIndex] = useState<string>("0");

  // Section 2: Compatibility Test
  const [zodiac1, setZodiac1] = useState<ZodiacChi>("Tý");
  const [zodiac2, setZodiac2] = useState<ZodiacChi>("Thìn");
  const [compatibilityResult, setCompatibilityResult] = useState<ReturnType<typeof calculateCompatibility> | null>(null);
  const [bestMatches, setBestMatches] = useState<ReturnType<typeof findBestMatches> | null>(null);
  const [worstMatches, setWorstMatches] = useState<ReturnType<typeof findWorstMatches> | null>(null);

  // Calculate lunar data
  const lunarData = useMemo(() => {
    if (!selectedDate) return null;
    
    const lunar = solarToLunar(selectedDate);
    const hourIndex = parseInt(selectedHourIndex);
    const birthHour = CANH_GIO[hourIndex];
    const canChiGio = getCanChiGio(lunar.canNgay, DIA_CHI[hourIndex]);
    
    // Get Ngu Hanh Nap Am using Can and Chi
    const nguHanh = getNguHanhNapAm(lunar.canNam.name, lunar.chiNam.name);
    
    return {
      lunar,
      birthHour,
      canChiGio,
      nguHanh,
      formattedLunar: formatLunarDate(lunar),
    };
  }, [selectedDate, selectedHourIndex]);

  const handleCheckCompatibility = () => {
    const result = calculateCompatibility(zodiac1, zodiac2);
    setCompatibilityResult(result);
    setBestMatches(findBestMatches(zodiac1));
    setWorstMatches(findWorstMatches(zodiac1));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Đại Hợp": return "text-green-400";
      case "Hợp": return "text-emerald-400";
      case "Bình Thường": return "text-yellow-400";
      case "Kỵ": return "text-orange-400";
      case "Đại Kỵ": return "text-red-400";
      default: return "text-foreground";
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getRelationshipTypes = (details: NonNullable<typeof compatibilityResult>['details']) => {
    const types: string[] = [];
    if (details.isLucHop) types.push("Lục Hợp");
    if (details.isTamHop) types.push("Tam Hợp");
    if (details.isTuongXung) types.push("Tương Xung");
    if (details.isTuongHai) types.push("Tương Hại");
    if (details.isTuongHinh) types.push("Tương Hình");
    if (details.isTuongPha) types.push("Tương Phá");
    return types.length > 0 ? types.join(", ") : "Không có quan hệ đặc biệt";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold to-purple-deep bg-clip-text text-transparent">
            🔮 Tu Vi Calculation Test Page
          </h1>
          <p className="text-muted-foreground mt-2">
            Trang test tính toán - Development only
          </p>
        </div>

        {/* Section 1: Lunar Calendar Test */}
        <Card className="bg-surface-2 border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold flex items-center gap-2">
              📅 Section 1: Lunar Calendar Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Row */}
            <div className="flex flex-wrap gap-4">
              {/* Date Picker */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-muted-foreground mb-2 block">Ngày sinh dương lịch</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-surface-3 border-border",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Hour Picker */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-muted-foreground mb-2 block">Giờ sinh (12 canh giờ)</label>
                <Select value={selectedHourIndex} onValueChange={setSelectedHourIndex}>
                  <SelectTrigger className="bg-surface-3 border-border">
                    <SelectValue placeholder="Chọn giờ sinh" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANH_GIO.map((gio, index) => (
                      <SelectItem key={gio.name} value={index.toString()}>
                        {gio.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Table */}
            {lunarData && (
              <div className="bg-surface-3 rounded-lg p-4 border border-border">
                <h3 className="text-lg font-semibold text-gold mb-4">Kết quả tính toán:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lunar Date */}
                  <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                    <span className="text-muted-foreground">Ngày âm lịch:</span>
                    <span className="font-medium text-foreground">
                      {lunarData.lunar.day}/{lunarData.lunar.month}/{lunarData.lunar.year}
                      {lunarData.lunar.isLeapMonth && " (nhuận)"}
                    </span>
                  </div>

                  {/* Year Can Chi */}
                  <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                    <span className="text-muted-foreground">Can Chi năm:</span>
                    <span className="font-medium text-gold">{lunarData.lunar.yearCanChi}</span>
                  </div>

                  {/* Month Can Chi */}
                  <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                    <span className="text-muted-foreground">Can Chi tháng:</span>
                    <span className="font-medium text-foreground">{lunarData.lunar.monthCanChi}</span>
                  </div>

                  {/* Day Can Chi */}
                  <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                    <span className="text-muted-foreground">Can Chi ngày:</span>
                    <span className="font-medium text-foreground">{lunarData.lunar.dayCanChi}</span>
                  </div>

                  {/* Hour Can Chi */}
                  <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                    <span className="text-muted-foreground">Can Chi giờ:</span>
                    <span className="font-medium text-foreground">
                      {lunarData.canChiGio.can.name} {lunarData.canChiGio.chi.name}
                    </span>
                  </div>

                  {/* Zodiac Animal */}
                  <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                    <span className="text-muted-foreground">Con giáp:</span>
                    <span className="font-medium text-foreground">
                      {lunarData.lunar.chiNam.animal} {lunarData.lunar.chiNam.vietnameseAnimal} ({lunarData.lunar.chiNam.name})
                    </span>
                  </div>

                  {/* Ngu Hanh Nap Am */}
                  {lunarData.nguHanh && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                        <span className="text-muted-foreground">Ngũ Hành Nạp Âm:</span>
                        <span className="font-medium text-purple-deep">
                          {lunarData.nguHanh.name} - {lunarData.nguHanh.napAm}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg">
                        <span className="text-muted-foreground">Màu may mắn:</span>
                        <span 
                          className="font-medium px-3 py-1 rounded"
                          style={{ 
                            backgroundColor: lunarData.nguHanh.colorHex + '30',
                            color: lunarData.nguHanh.colorHex
                          }}
                        >
                          {lunarData.nguHanh.color}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-surface-4 rounded-lg md:col-span-2">
                        <span className="text-muted-foreground">Hướng tốt:</span>
                        <span className="font-medium text-foreground">{lunarData.nguHanh.direction}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Zodiac Compatibility Test */}
        <Card className="bg-surface-2 border-purple-deep/20">
          <CardHeader>
            <CardTitle className="text-purple-deep flex items-center gap-2">
              💑 Section 2: Zodiac Compatibility Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Row */}
            <div className="flex flex-wrap gap-4 items-end">
              {/* Zodiac 1 */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-muted-foreground mb-2 block">Con giáp 1</label>
                <Select value={zodiac1} onValueChange={(v) => setZodiac1(v as ZodiacChi)}>
                  <SelectTrigger className="bg-surface-3 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZODIAC_ANIMALS.map((z) => (
                      <SelectItem key={z.chi} value={z.chi}>
                        {z.emoji} {z.chi} ({z.animal})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zodiac 2 */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-muted-foreground mb-2 block">Con giáp 2</label>
                <Select value={zodiac2} onValueChange={(v) => setZodiac2(v as ZodiacChi)}>
                  <SelectTrigger className="bg-surface-3 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZODIAC_ANIMALS.map((z) => (
                      <SelectItem key={z.chi} value={z.chi}>
                        {z.emoji} {z.chi} ({z.animal})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Check Button */}
              <Button 
                variant="gold" 
                size="lg"
                onClick={handleCheckCompatibility}
                className="min-w-[140px]"
              >
                Xem Độ Hợp
              </Button>
            </div>

            {/* Results */}
            {compatibilityResult && (
              <div className="space-y-6">
                {/* Score Section */}
                <div className="bg-surface-3 rounded-lg p-6 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">
                        {ZODIAC_ANIMALS.find(z => z.chi === zodiac1)?.emoji}
                      </span>
                      <span className="text-2xl text-muted-foreground">❤️</span>
                      <span className="text-4xl">
                        {ZODIAC_ANIMALS.find(z => z.chi === zodiac2)?.emoji}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-gold">{compatibilityResult.score}</div>
                      <div className="text-sm text-muted-foreground">điểm</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-surface-4">
                      <div 
                        className={cn("h-full transition-all", getProgressColor(compatibilityResult.score))}
                        style={{ width: `${compatibilityResult.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Level Badge */}
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className={cn(
                      "text-2xl font-bold",
                      getLevelColor(compatibilityResult.level)
                    )}>
                      {compatibilityResult.level}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-foreground">
                      Quan hệ: <span className="text-gold">{getRelationshipTypes(compatibilityResult.details)}</span>
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-3 rounded-lg p-4 border border-border">
                    <h4 className="text-gold font-semibold mb-2">📖 Giải thích:</h4>
                    <p className="text-foreground">{compatibilityResult.explanation}</p>
                  </div>
                  <div className="bg-surface-3 rounded-lg p-4 border border-border">
                    <h4 className="text-purple-deep font-semibold mb-2">💡 Lời khuyên:</h4>
                    <p className="text-foreground">{compatibilityResult.advice}</p>
                  </div>
                </div>

                {/* Best/Worst Matches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Best Matches */}
                  {bestMatches && (
                    <div className="bg-surface-3 rounded-lg p-4 border border-green-500/20">
                      <h4 className="text-green-400 font-semibold mb-3">
                        ✅ Top 3 tuổi hợp với {zodiac1}:
                      </h4>
                      <div className="space-y-2">
                        {bestMatches.map((match, index) => {
                          const zodiacInfo = ZODIAC_ANIMALS.find(z => z.chi === match.chi);
                          return (
                            <div 
                              key={match.chi}
                              className="flex items-center justify-between p-2 bg-surface-4 rounded"
                            >
                              <span>
                                {index + 1}. {zodiacInfo?.emoji} {match.chi}
                              </span>
                              <span className={cn("font-medium", getLevelColor(match.level))}>
                                {match.score} - {match.level}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Worst Matches */}
                  {worstMatches && (
                    <div className="bg-surface-3 rounded-lg p-4 border border-red-500/20">
                      <h4 className="text-red-400 font-semibold mb-3">
                        ⚠️ Top 3 tuổi kỵ với {zodiac1}:
                      </h4>
                      <div className="space-y-2">
                        {worstMatches.map((match, index) => {
                          const zodiacInfo = ZODIAC_ANIMALS.find(z => z.chi === match.chi);
                          return (
                            <div 
                              key={match.chi}
                              className="flex items-center justify-between p-2 bg-surface-4 rounded"
                            >
                              <span>
                                {index + 1}. {zodiacInfo?.emoji} {match.chi}
                              </span>
                              <span className={cn("font-medium", getLevelColor(match.level))}>
                                {match.score} - {match.level}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Debug Details */}
                <div className="bg-surface-4 rounded-lg p-4 border border-border/50">
                  <h4 className="text-muted-foreground font-medium mb-2">🔍 Debug Details:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <span className={compatibilityResult.details.isLucHop ? "text-green-400" : "text-muted-foreground"}>
                      Lục Hợp: {compatibilityResult.details.isLucHop ? "✓" : "✗"}
                    </span>
                    <span className={compatibilityResult.details.isTamHop ? "text-green-400" : "text-muted-foreground"}>
                      Tam Hợp: {compatibilityResult.details.isTamHop ? "✓" : "✗"}
                    </span>
                    <span className={compatibilityResult.details.isTuongXung ? "text-red-400" : "text-muted-foreground"}>
                      Tương Xung: {compatibilityResult.details.isTuongXung ? "✓" : "✗"}
                    </span>
                    <span className={compatibilityResult.details.isTuongHai ? "text-orange-400" : "text-muted-foreground"}>
                      Tương Hại: {compatibilityResult.details.isTuongHai ? "✓" : "✗"}
                    </span>
                    <span className={compatibilityResult.details.isTuongHinh ? "text-orange-400" : "text-muted-foreground"}>
                      Tương Hình: {compatibilityResult.details.isTuongHinh ? "✓" : "✗"}
                    </span>
                    <span className={compatibilityResult.details.isTuongPha ? "text-yellow-400" : "text-muted-foreground"}>
                      Tương Phá: {compatibilityResult.details.isTuongPha ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm">
          ⚠️ Đây là trang test cho development. Sẽ xóa sau khi verify xong.
        </div>
      </div>
    </div>
  );
};

export default Test;
