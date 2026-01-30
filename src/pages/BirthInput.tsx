import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Sparkles } from "lucide-react";
import { solarToLunar, CANH_GIO } from "@/lib/tuvi/lunarCalendar";

const birthHours = CANH_GIO.map((gio) => ({
  value: gio.name.toLowerCase(),
  label: gio.description,
  index: gio.index,
}));

const genders = [
  { value: "male", label: "Nam", emoji: "👨" },
  { value: "female", label: "Nữ", emoji: "👩" },
];

const BirthInput = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [hour, setHour] = useState<string>();
  const [gender, setGender] = useState<string>();

  const lunarDate = date ? solarToLunar(date) : null;

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

          {/* Lunar Date Display */}
          {lunarDate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gold/5 border border-gold/20">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold">
                Âm lịch: {lunarDate.day}/{lunarDate.month}{lunarDate.isLeapMonth ? ' (nhuận)' : ''}/{lunarDate.yearCanChi}
              </span>
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

        {/* Gender Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Giới tính
          </label>
          <div className="grid grid-cols-2 gap-3">
            {genders.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                className={cn(
                  "flex items-center justify-center gap-3 h-14 rounded-xl",
                  "border transition-all duration-300",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  gender === g.value
                    ? "bg-gold/10 border-gold shadow-[0_0_20px_hsl(43,74%,53%,0.2)]"
                    : "bg-surface-3 border-border hover:border-gold/30"
                )}
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className={cn(
                  "font-medium",
                  gender === g.value ? "text-gold" : "text-foreground"
                )}>
                  {g.label}
                </span>
              </button>
            ))}
          </div>
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
