import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { solarToLunar, CANH_GIO, formatLunarDate } from "@/lib/tuvi/lunarCalendar";
import {
  createTuViChart,
  DIA_BAN,
  TuViChart,
  BirthInfo as ChartBirthInfo,
} from "@/lib/tuvi/tuviChart";

// 4x4 grid positions for Tu Vi chart (12 cung + 4 center cells)
// Layout follows traditional Tu Vi chart arrangement
const GRID_POSITIONS: { row: number; col: number; cungIndex: number | null }[] = [
  // Row 0 (top): Tỵ, Ngọ, Mùi, Thân
  { row: 0, col: 0, cungIndex: 3 },  // Tỵ
  { row: 0, col: 1, cungIndex: 4 },  // Ngọ
  { row: 0, col: 2, cungIndex: 5 },  // Mùi
  { row: 0, col: 3, cungIndex: 6 },  // Thân
  // Row 1: Thìn, [center], [center], Dậu
  { row: 1, col: 0, cungIndex: 2 },  // Thìn
  { row: 1, col: 1, cungIndex: null }, // center
  { row: 1, col: 2, cungIndex: null }, // center
  { row: 1, col: 3, cungIndex: 7 },  // Dậu
  // Row 2: Mão, [center], [center], Tuất
  { row: 2, col: 0, cungIndex: 1 },  // Mão
  { row: 2, col: 1, cungIndex: null }, // center
  { row: 2, col: 2, cungIndex: null }, // center
  { row: 2, col: 3, cungIndex: 8 },  // Tuất
  // Row 3 (bottom): Dần, Sửu, Tý, Hợi
  { row: 3, col: 0, cungIndex: 0 },  // Dần
  { row: 3, col: 1, cungIndex: 11 }, // Sửu
  { row: 3, col: 2, cungIndex: 10 }, // Tý
  { row: 3, col: 3, cungIndex: 9 },  // Hợi
];

interface ChartResult {
  chart: TuViChart;
  lunarInfo: ReturnType<typeof solarToLunar>;
  birthHourName: string;
}

export default function TuViTest() {
  const [date, setDate] = useState<Date>();
  const [birthHour, setBirthHour] = useState<string>("");
  const [gender, setGender] = useState<string>("male");
  const [result, setResult] = useState<ChartResult | null>(null);

  const handleCalculate = () => {
    if (!date || !birthHour) return;

    const lunarInfo = solarToLunar(date);
    const birthHourIndex = parseInt(birthHour);
    const birthHourName = CANH_GIO[birthHourIndex].name;

    const birthInfo: ChartBirthInfo = {
      lunarDay: lunarInfo.day,
      lunarMonth: lunarInfo.month,
      lunarYear: lunarInfo.year,
      birthHourIndex,
      canNamIndex: lunarInfo.canNam.index,
      chiNamIndex: lunarInfo.chiNam.index,
      gender: gender as "male" | "female",
    };

    const chart = createTuViChart(birthInfo);

    setResult({
      chart,
      lunarInfo,
      birthHourName,
    });
  };

  const loadTestCase = (solarDate: Date, hourIndex: number, genderVal: string) => {
    setDate(solarDate);
    setBirthHour(hourIndex.toString());
    setGender(genderVal);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center hover:border-primary/50 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-semibold text-lg">Kiểm Tra Lá Số Tử Vi</h1>
            <p className="text-xs text-muted-foreground">Test Tu Vi Chart Calculations</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Sinh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Ngày sinh (Dương lịch)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Birth Hour */}
              <div className="space-y-2">
                <Label>Giờ sinh</Label>
                <Select value={birthHour} onValueChange={setBirthHour}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANH_GIO.map((gio) => (
                      <SelectItem key={gio.index} value={gio.index.toString()}>
                        {gio.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Giới tính</Label>
                <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Nam</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Nữ</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Calculate Button */}
              <div className="flex items-end">
                <Button onClick={handleCalculate} className="w-full" disabled={!date || !birthHour}>
                  Lập Lá Số
                </Button>
              </div>
            </div>

            {/* Test Cases */}
            <div className="pt-4 border-t">
              <Label className="text-muted-foreground">Test Cases:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTestCase(new Date(1979, 9, 25), 0, "male")}
                >
                  25/10/1979, Tý, Nam
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTestCase(new Date(1990, 1, 15), 6, "female")}
                >
                  15/02/1990, Ngọ, Nữ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTestCase(new Date(2000, 0, 1), 3, "male")}
                >
                  01/01/2000, Mão, Nam
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        {result && (
          <>
            {/* Birth Info & Chart Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông Tin Ngày Sinh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày âm lịch:</span>
                    <span className="font-medium">{formatLunarDate(result.lunarInfo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chi tiết:</span>
                    <span className="font-medium">
                      {result.lunarInfo.day}/{result.lunarInfo.month}/{result.lunarInfo.year}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Can Chi năm:</span>
                    <span className="font-medium">{result.lunarInfo.yearCanChi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Canh giờ sinh:</span>
                    <span className="font-medium">Giờ {result.birthHourName}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông Tin Lá Số</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cục:</span>
                    <span className="font-medium text-primary">{result.chart.cucName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cung Mệnh tại:</span>
                    <span className="font-medium text-amber-600">
                      {DIA_BAN[result.chart.cungMenhIndex]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cung Thân tại:</span>
                    <span className="font-medium text-purple-600">
                      {DIA_BAN[result.chart.cungThanIndex]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tử Vi tại:</span>
                    <span className="font-medium text-red-600">
                      {DIA_BAN[result.chart.tuViPosition]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thiên Phủ tại:</span>
                    <span className="font-medium text-blue-600">
                      {DIA_BAN[result.chart.thienPhuPosition]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lá Số 12 Cung</CardTitle>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded border-2 border-amber-500"></span>
                    Cung Mệnh
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded border-2 border-purple-500"></span>
                    Cung Thân
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1 md:gap-2">
                  {GRID_POSITIONS.map((pos, idx) => {
                    if (pos.cungIndex === null) {
                      // Center cells - show chart info
                      if (pos.row === 1 && pos.col === 1) {
                        return (
                          <div
                            key={idx}
                            className="col-span-2 row-span-2 bg-muted/50 rounded-lg p-4 flex flex-col items-center justify-center text-center"
                          >
                            <div className="text-lg font-bold text-primary mb-2">
                              {result.chart.cucName}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>Mệnh: {DIA_BAN[result.chart.cungMenhIndex]}</div>
                              <div>Thân: {DIA_BAN[result.chart.cungThanIndex]}</div>
                              <div className="pt-2 text-[10px]">
                                {result.lunarInfo.yearCanChi}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      // Skip other center cells (they're part of the 2x2)
                      return null;
                    }

                    const cung = result.chart.cung[pos.cungIndex];
                    const isMenh = cung.isMenh;
                    const isThan = cung.isThan;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "border rounded-lg p-2 min-h-[100px] md:min-h-[120px] flex flex-col",
                          isMenh && "border-amber-500 border-2 bg-amber-50/50 dark:bg-amber-950/20",
                          isThan && !isMenh && "border-purple-500 border-2 bg-purple-50/50 dark:bg-purple-950/20",
                          !isMenh && !isThan && "border-border"
                        )}
                      >
                        {/* Header: Địa Chi + Cung Name */}
                        <div className="flex justify-between items-start text-xs mb-1">
                          <span className="font-bold text-primary">{cung.diaChi}</span>
                          <span
                            className={cn(
                              "text-[10px] px-1 rounded",
                              isMenh && "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200",
                              isThan && !isMenh && "bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200",
                              !isMenh && !isThan && "bg-muted text-muted-foreground"
                            )}
                          >
                            {cung.name}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex-1 space-y-0.5">
                          {cung.chinhTinh.map((star) => (
                            <div
                              key={star.id}
                              className={cn(
                                "text-[10px] md:text-xs truncate",
                                star.nature === "cát" && "text-green-600 dark:text-green-400",
                                star.nature === "hung" && "text-red-600 dark:text-red-400",
                                star.nature === "trung_tính" && "text-blue-600 dark:text-blue-400"
                              )}
                            >
                              {star.name}
                            </div>
                          ))}
                          {cung.chinhTinh.length === 0 && (
                            <span className="text-[10px] text-muted-foreground italic">
                              (trống)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Debug Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-60">
                  {JSON.stringify(
                    {
                      input: {
                        lunarDay: result.lunarInfo.day,
                        lunarMonth: result.lunarInfo.month,
                        lunarYear: result.lunarInfo.year,
                        birthHourIndex: parseInt(birthHour),
                        canNamIndex: result.lunarInfo.canNam.index,
                        gender,
                      },
                      output: {
                        cucSo: result.chart.cucSo,
                        cucName: result.chart.cucName,
                        cungMenhIndex: result.chart.cungMenhIndex,
                        cungMenh: DIA_BAN[result.chart.cungMenhIndex],
                        cungThanIndex: result.chart.cungThanIndex,
                        cungThan: DIA_BAN[result.chart.cungThanIndex],
                        tuViPosition: result.chart.tuViPosition,
                        tuVi: DIA_BAN[result.chart.tuViPosition],
                        thienPhuPosition: result.chart.thienPhuPosition,
                        thienPhu: DIA_BAN[result.chart.thienPhuPosition],
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

