import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, Sun, Moon, Sparkles } from "lucide-react";
import { solarToLunar } from "@/lib/tuvi/lunarCalendar";

// Demo data generators
const getHoangDao = (date: Date) => {
  const day = date.getDate();
  // Simplified logic for demo
  return day % 3 !== 0;
};

const getGoodThings = () => [
  "Cưới hỏi, ăn hỏi",
  "Khai trương, mở cửa hàng",
  "Động thổ, xây nhà",
  "Xuất hành, đi xa",
  "Ký kết hợp đồng",
];

const getBadThings = () => [
  "Kiện tụng, tranh chấp",
  "Phá dỡ, tháo dỡ",
  "An táng, cải táng",
];

const getGoodHours = () => [
  { name: "Tý", time: "23:00 - 01:00", good: true },
  { name: "Sửu", time: "01:00 - 03:00", good: false },
  { name: "Dần", time: "03:00 - 05:00", good: true },
  { name: "Mão", time: "05:00 - 07:00", good: true },
  { name: "Thìn", time: "07:00 - 09:00", good: false },
  { name: "Tỵ", time: "09:00 - 11:00", good: true },
  { name: "Ngọ", time: "11:00 - 13:00", good: true },
  { name: "Mùi", time: "13:00 - 15:00", good: false },
  { name: "Thân", time: "15:00 - 17:00", good: true },
  { name: "Dậu", time: "17:00 - 19:00", good: false },
  { name: "Tuất", time: "19:00 - 21:00", good: true },
  { name: "Hợi", time: "21:00 - 23:00", good: true },
];

const DayAnalysis = () => {
  const [date, setDate] = useState<Date>(new Date());

  const isHoangDao = getHoangDao(date);
  const lunarDate = solarToLunar(date);
  const goodThings = getGoodThings();
  const badThings = getBadThings();
  const hours = getGoodHours();

  return (
    <PageLayout title="Xem Ngày">
      <div className="space-y-6">
        {/* Calendar */}
        <div className={cn(
          "rounded-2xl p-4",
          "bg-gradient-to-br from-surface-3 to-surface-2",
          "border border-border"
        )}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            className="pointer-events-auto mx-auto"
            locale={vi}
          />
        </div>

        {/* Date Info Card */}
        <div className={cn(
          "rounded-2xl p-5",
          "bg-gradient-to-br from-surface-3 to-surface-2",
          "border",
          isHoangDao ? "border-gold/30" : "border-destructive/30"
        )}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {format(date, "EEEE, dd/MM/yyyy", { locale: vi })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ngày {lunarDate.dayCanChi}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-gold">
                  Âm lịch: {lunarDate.day}/{lunarDate.month}{lunarDate.isLeapMonth ? ' (nhuận)' : ''} - {lunarDate.yearCanChi}
                </span>
              </div>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full",
              isHoangDao 
                ? "bg-gold/10 border border-gold/30" 
                : "bg-destructive/10 border border-destructive/30"
            )}>
              {isHoangDao ? (
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-gold">Hoàng Đạo</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Hắc Đạo</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Good/Bad Things */}
        <div className="grid grid-cols-2 gap-4">
            {/* Good Things */}
          <div className={cn(
            "rounded-xl p-4",
            "bg-surface-3 border border-border"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold">Nên làm</span>
            </div>
            <ul className="space-y-2">
              {goodThings.map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Bad Things */}
          <div className={cn(
            "rounded-xl p-4",
            "bg-surface-3 border border-border"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Không nên</span>
            </div>
            <ul className="space-y-2">
              {badThings.map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Good Hours */}
        <div className={cn(
          "rounded-2xl p-5",
          "bg-gradient-to-br from-surface-3 to-surface-2",
          "border border-border"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg text-gold">Giờ Tốt Trong Ngày</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {hours.map((hour) => (
              <div
                key={hour.name}
                className={cn(
                  "p-2 rounded-lg text-center",
                  hour.good 
                    ? "bg-gold/10 border border-gold/30" 
                    : "bg-surface-4 border border-border"
                )}
              >
                <p className={cn(
                  "text-xs font-medium",
                  hour.good ? "text-gold" : "text-muted-foreground"
                )}>
                  {hour.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {hour.time.split(" - ")[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DayAnalysis;
