import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Sparkles } from "lucide-react";
import { solarToLunar, CANH_GIO, DIA_CHI } from "@/lib/tuvi/lunarCalendar";
import { getNguHanhFromYear } from "@/lib/tuvi/nguHanh";

const birthHours = CANH_GIO.map((gio) => ({
  value: gio.name.toLowerCase(),
  label: gio.description,
  index: gio.index,
}));

const BirthInput = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [hour, setHour] = useState<string>();
  const [gender, setGender] = useState<string>();

  const lunarDate = date ? solarToLunar(date) : null;
  
  // Get zodiac and element info
  const zodiacInfo = lunarDate ? (() => {
    const chiIndex = (lunarDate.year - 4) % 12;
    const chi = DIA_CHI[chiIndex < 0 ? chiIndex + 12 : chiIndex];
    const napAm = getNguHanhFromYear(lunarDate.year);
    return { chi, napAm };
  })() : null;

  const handleSubmit = () => {
    if (date && hour && gender) {
      navigate("/ket-qua", { 
        state: { date, hour, gender } 
      });
    }
  };

  const isFormValid = date && hour && gender;

  return (
    <PageLayout title="Lập Lá Số">
      <div className="space-y-6">
        {/* Introduction */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            Nhập thông tin ngày sinh để xem lá số tử vi của bạn
          </p>
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Ngày sinh dương lịch
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="mystical"
                size="lg"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5 text-gold" />
                {date ? format(date, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày sinh"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-surface-2 border-border" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="pointer-events-auto"
                captionLayout="dropdown-buttons"
                fromYear={1920}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>

          {/* Live Preview Panel - Lunar Date & Zodiac Info */}
          {lunarDate && zodiacInfo && (
            <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 animate-fade-in">
              {/* Lunar Date */}
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-sm text-gold font-medium">
                  Ngày {lunarDate.day} tháng {lunarDate.month}{lunarDate.isLeapMonth ? ' (nhuận)' : ''} năm {lunarDate.yearCanChi}
                </span>
              </div>
              
              {/* Zodiac & Element */}
              <div className="flex items-center gap-2 pl-6">
                <span className="text-2xl">{zodiacInfo.chi.animal}</span>
                <span className="text-sm text-foreground">
                  Tuổi <span className="font-semibold text-gold">{zodiacInfo.chi.vietnameseAnimal}</span>
                  {zodiacInfo.napAm && (
                    <> - Mệnh <span className="font-semibold text-gold">{zodiacInfo.napAm.name}</span>
                      <span className="text-muted-foreground text-xs ml-1">({zodiacInfo.napAm.napAm})</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hour Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Giờ sinh (12 canh)
          </label>
          <Select value={hour} onValueChange={setHour}>
            <SelectTrigger className="h-12 bg-surface-3 border-border hover:border-gold/30 transition-colors">
              <SelectValue placeholder="Chọn giờ sinh" />
            </SelectTrigger>
            <SelectContent className="bg-surface-2 border-border">
              {birthHours.map((h) => (
                <SelectItem 
                  key={h.value} 
                  value={h.value}
                  className="hover:bg-gold/10 focus:bg-gold/10"
                >
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender Picker - Radio Buttons */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Giới tính
          </label>
          <RadioGroup
            value={gender}
            onValueChange={setGender}
            className="grid grid-cols-2 gap-3"
          >
            <div>
              <RadioGroupItem value="male" id="male" className="peer sr-only" />
              <Label
                htmlFor="male"
                className={cn(
                  "flex items-center justify-center gap-3 h-14 rounded-xl cursor-pointer",
                  "border transition-all duration-300",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "peer-data-[state=checked]:bg-gold/10 peer-data-[state=checked]:border-gold peer-data-[state=checked]:shadow-[0_0_20px_hsl(43,74%,53%,0.2)]",
                  gender !== "male" && "bg-surface-3 border-border hover:border-gold/30"
                )}
              >
                <span className="text-2xl">👨</span>
                <span className={cn(
                  "font-medium",
                  gender === "male" ? "text-gold" : "text-foreground"
                )}>
                  Nam
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="female" id="female" className="peer sr-only" />
              <Label
                htmlFor="female"
                className={cn(
                  "flex items-center justify-center gap-3 h-14 rounded-xl cursor-pointer",
                  "border transition-all duration-300",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "peer-data-[state=checked]:bg-gold/10 peer-data-[state=checked]:border-gold peer-data-[state=checked]:shadow-[0_0_20px_hsl(43,74%,53%,0.2)]",
                  gender !== "female" && "bg-surface-3 border-border hover:border-gold/30"
                )}
              >
                <span className="text-2xl">👩</span>
                <span className={cn(
                  "font-medium",
                  gender === "female" ? "text-gold" : "text-foreground"
                )}>
                  Nữ
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            variant="gold"
            size="xl"
            className="w-full"
            disabled={!isFormValid}
            onClick={handleSubmit}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Xem Lá Số
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default BirthInput;
