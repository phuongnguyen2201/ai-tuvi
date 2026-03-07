import { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Sun, Moon, Sparkles } from "lucide-react";
import { solarToLunar, LunarDate } from "@/lib/tuvi/lunarCalendar";

// ============================================
// 12 TRỰC (建除十二神)
// ============================================
const TRUC_12 = ["Kiến", "Trừ", "Mãn", "Bình", "Định",
                  "Chấp", "Phá", "Nguy", "Thành", "Thu",
                  "Khai", "Bế"];

const VIEC_TOT_THEO_TRUC: Record<string, string[]> = {
  "Kiến": ["Cầu phúc", "Tế lễ", "Gặp gỡ quan trọng"],
  "Trừ": ["Chữa bệnh", "Dọn dẹp", "Tắm gội", "Sửa chữa"],
  "Mãn": ["Mua sắm", "Tích trữ", "Nhập kho"],
  "Bình": ["Xuất hành", "Gặp bạn bè", "Ký kết"],
  "Định": ["Cưới hỏi", "Khai trương", "Động thổ", "Ký hợp đồng"],
  "Chấp": ["Trồng cây", "Làm vườn", "Săn bắn"],
  "Phá": ["Phá dỡ", "Tháo dỡ cũ"],
  "Nguy": ["Nghỉ ngơi", "Tĩnh dưỡng"],
  "Thành": ["Cưới hỏi", "Khai trương", "Mua nhà", "Đầu tư"],
  "Thu": ["Thu hoạch", "Thu nợ", "Tổng kết"],
  "Khai": ["Khai trương", "Xuất hành", "Học hành", "Cầu tài"],
  "Bế": ["Tích trữ", "Đóng cửa", "Bảo mật"],
};

const VIEC_XAU_THEO_TRUC: Record<string, string[]> = {
  "Kiến": ["Xuất hành xa", "Cưới hỏi"],
  "Trừ": ["Cưới hỏi", "Khai trương"],
  "Mãn": ["Kiện tụng", "Tranh chấp"],
  "Bình": ["An táng", "Phá dỡ"],
  "Định": ["An táng", "Kiện tụng"],
  "Chấp": ["Cưới hỏi", "Xuất hành"],
  "Phá": ["Cưới hỏi", "Khai trương", "Ký kết", "Mua bán lớn"],
  "Nguy": ["Xuất hành", "Leo trèo", "Mạo hiểm"],
  "Thành": ["An táng", "Kiện tụng"],
  "Thu": ["Cưới hỏi", "Khai trương"],
  "Khai": ["An táng", "Khóc than"],
  "Bế": ["Xuất hành", "Khai trương", "Cưới hỏi"],
};

// Ngày tốt: Bình, Định, Thành, Khai, Trừ
// Ngày xấu: Phá, Nguy, Bế, Kiến
const TRUC_TOT = ["Bình", "Định", "Thành", "Khai", "Trừ"];
const TRUC_XAU = ["Phá", "Nguy", "Bế", "Kiến"];

const getTruc = (lunarDate: LunarDate): string => {
  const index = (lunarDate.day + lunarDate.month * 2) % 12;
  return TRUC_12[index];
};

const isHoangDaoByTruc = (truc: string): boolean => {
  return TRUC_TOT.includes(truc);
};

// ============================================
// GIỜ HOÀNG ĐẠO theo Can ngày
// ============================================
const GIO_HOANG_DAO: Record<string, string[]> = {
  "Giáp": ["Tý", "Sửu", "Mão", "Tỵ", "Mùi", "Tuất"],
  "Ất":   ["Tý", "Dần", "Mão", "Tỵ", "Thân", "Dậu"],
  "Bính": ["Dần", "Thìn", "Tỵ", "Mùi", "Tuất", "Hợi"],
  "Đinh": ["Tý", "Sửu", "Thìn", "Mão", "Ngọ", "Hợi"],
  "Mậu":  ["Tý", "Sửu", "Dần", "Mão", "Ngọ", "Thân"],
  "Kỷ":   ["Tý", "Dần", "Tỵ", "Ngọ", "Thân", "Dậu"],
  "Canh": ["Sửu", "Dần", "Thìn", "Ngọ", "Thân", "Dậu"],
  "Tân":  ["Tý", "Dần", "Mão", "Thìn", "Ngọ", "Dậu"],
  "Nhâm": ["Dần", "Thìn", "Tỵ", "Ngọ", "Tuất", "Hợi"],
  "Quý":  ["Sửu", "Thìn", "Tỵ", "Mùi", "Tuất", "Hợi"],
};

const ALL_HOURS = [
  { name: "Tý", time: "23:00-01:00" },
  { name: "Sửu", time: "01:00-03:00" },
  { name: "Dần", time: "03:00-05:00" },
  { name: "Mão", time: "05:00-07:00" },
  { name: "Thìn", time: "07:00-09:00" },
  { name: "Tỵ", time: "09:00-11:00" },
  { name: "Ngọ", time: "11:00-13:00" },
  { name: "Mùi", time: "13:00-15:00" },
  { name: "Thân", time: "15:00-17:00" },
  { name: "Dậu", time: "17:00-19:00" },
  { name: "Tuất", time: "19:00-21:00" },
  { name: "Hợi", time: "21:00-23:00" },
];

const getIsHoangDaoDay = (d: Date): boolean => {
  const lunar = solarToLunar(d);
  const truc = getTruc(lunar);
  return isHoangDaoByTruc(truc);
};

const CustomCalendar = ({ date, setDate, currentMonth, setCurrentMonth }: {
  date: Date; setDate: (d: Date) => void;
  currentMonth: Date; setCurrentMonth: (d: Date) => void;
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const monthNames = ["1","2","3","4","5","6","7","8","9","10","11","12"];

  return (
    <div className="custom-calendar">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(new Date(year, month-1, 1))}
          className="p-2 rounded-full hover:bg-surface-4 text-foreground">‹</button>
        <span className="font-medium text-foreground">
          Tháng {monthNames[month]}, {year}
        </span>
        <button onClick={() => setCurrentMonth(new Date(year, month+1, 1))}
          className="p-2 rounded-full hover:bg-surface-4 text-foreground">›</button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {["T2","T3","T4","T5","T6","T7","CN"].map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const d = new Date(year, month, day);
          const isGood = getIsHoangDaoDay(d);
          const isSelected = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const lunar = solarToLunar(d);
          return (
            <button key={day} onClick={() => { setDate(d); (document.activeElement as HTMLElement)?.blur(); }}
              style={{
                borderRadius: '8px', padding: '4px 2px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                backgroundColor: isSelected ? '#7C3AED' : 'transparent',
                border: isToday && !isSelected ? '1px solid #7C3AED60' : '1px solid transparent',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}>
              <span style={{ fontSize: '13px', fontWeight: '600',
                color: isSelected ? 'white' : isGood ? '#D4AF37' : '#ef4444' }}>
                {day}
              </span>
              <span style={{ fontSize: '9px', lineHeight: 1,
                color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>
                {lunar.day}
              </span>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', opacity: 0.7,
                backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : isGood ? '#D4AF37' : '#ef4444' }} />
            </button>
          );
        })}
      </div>
      <div className="flex justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-xs text-muted-foreground">Hoàng Đạo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive opacity-70" />
          <span className="text-xs text-muted-foreground">Hắc Đạo</span>
        </div>
      </div>
    </div>
  );
};

const DayAnalysis = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const lunarDate = useMemo(() => solarToLunar(date), [date]);

  // goodDays/badDays removed - colors handled in DayContent
  const truc = useMemo(() => getTruc(lunarDate), [lunarDate]);
  const isHoangDao = isHoangDaoByTruc(truc);
  const goodThings = VIEC_TOT_THEO_TRUC[truc] || [];
  const badThings = VIEC_XAU_THEO_TRUC[truc] || [];

  const dayCan = lunarDate.dayCanChi.split(" ")[0];
  const goodHourNames = GIO_HOANG_DAO[dayCan] || [];
  const hours = ALL_HOURS.map(h => ({ ...h, good: goodHourNames.includes(h.name) }));

  const trucQuality = TRUC_TOT.includes(truc) ? "tốt" : TRUC_XAU.includes(truc) ? "xấu" : "trung bình";

  return (
    <PageLayout title="Xem Ngày">
      <div className="space-y-6">
        {/* Calendar */}
        <div className={cn(
          "rounded-2xl p-4",
          "bg-gradient-to-br from-surface-3 to-surface-2",
          "border border-border"
        )}>
          <CustomCalendar
            date={date}
            setDate={setDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
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
                {format(date, "EEEE, dd/MM/yyyy")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ngày {lunarDate.dayCanChi}, tháng {lunarDate.monthCanChi}, năm {lunarDate.yearCanChi}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-gold">
                  Âm lịch: {lunarDate.day}/{lunarDate.month}{lunarDate.isLeapMonth ? ' (nhuận)' : ''} - {lunarDate.yearCanChi}
                </span>
              </div>
              <p className="text-xs text-gold/70 mt-1">
                Trực: {truc} ({trucQuality})
              </p>
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
                  {hour.time.split("-")[0]}
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
