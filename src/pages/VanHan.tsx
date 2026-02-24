import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import PaymentGate from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Heart,
  Coins,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Star,
  Loader2,
  Save,
  Share2,
  Calendar,
} from "lucide-react";

// ── Types ──
type TimeFrame = "week" | "month" | "year";

interface TabConfig {
  key: TimeFrame;
  label: string;
  icon: string;
  featureKey: string;
}

const TABS: TabConfig[] = [
  { key: "week", label: "Theo Tuần", icon: "📅", featureKey: "van_han_week" },
  { key: "month", label: "Theo Tháng", icon: "🌙", featureKey: "van_han_month" },
  { key: "year", label: "Theo Năm", icon: "⭐", featureKey: "van_han_year" },
];

// ── Helpers ──
function getWeekInfo(offset: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay() + 1 + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const weekNum = Math.ceil(
    ((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
  );
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return {
    label: `Tuần ${weekNum} (${fmt(start)} - ${fmt(end)}/${end.getFullYear()})`,
    period: `${start.getFullYear()}-W${String(weekNum).padStart(2, "0")}`,
  };
}

function getMonthInfo(offset: number) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return {
    label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
    period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
  };
}

function getYearInfo(offset: number) {
  const year = new Date().getFullYear() + offset;
  return { label: `Năm ${year}`, period: `${year}` };
}

// ── Demo data ──
const WEEKLY_DEMO = [
  { day: "Thứ 2", quality: "good" as const, note: "Ngày tốt để bắt đầu dự án mới, quý nhân phù trợ." },
  { day: "Thứ 3", quality: "excellent" as const, note: "Tài lộc hanh thông, thích hợp ký kết hợp đồng." },
  { day: "Thứ 4", quality: "neutral" as const, note: "Bình ổn, tập trung hoàn thành công việc dang dở." },
  { day: "Thứ 5", quality: "good" as const, note: "Tình duyên thuận lợi, gặp gỡ người thú vị." },
  { day: "Thứ 6", quality: "challenging" as const, note: "Cẩn thận lời nói, tránh tranh cãi không đáng." },
  { day: "Thứ 7", quality: "good" as const, note: "Ngày tốt cho gia đình, du lịch ngắn ngày." },
  { day: "Chủ nhật", quality: "excellent" as const, note: "Nghỉ ngơi, tích lũy năng lượng cho tuần mới." },
];

const MONTHLY_WEEKS_DEMO = [
  { week: "Tuần 1", summary: "Khởi đầu tốt, nhiều cơ hội mới xuất hiện. Nên chủ động tiếp cận." },
  { week: "Tuần 2", summary: "Áp lực công việc tăng, nhưng quý nhân hỗ trợ kịp thời." },
  { week: "Tuần 3", summary: "Tài lộc nổi bật, thu nhập từ nhiều nguồn. Tránh chi tiêu quá mức." },
  { week: "Tuần 4", summary: "Kết tháng ổn định, nên tổng kết và lên kế hoạch tháng tới." },
];

const MONTHLY_FORECAST = [
  { month: 1, label: "Tháng 1", quality: "good" as const, summary: "Khởi đầu thuận lợi, quý nhân phù trợ." },
  { month: 2, label: "Tháng 2", quality: "excellent" as const, summary: "Vận may đỉnh cao, tài lộc hanh thông." },
  { month: 3, label: "Tháng 3", quality: "neutral" as const, summary: "Bình ổn, nên củng cố nền tảng." },
  { month: 4, label: "Tháng 4", quality: "good" as const, summary: "Tình duyên nở rộ, sức khỏe tốt." },
  { month: 5, label: "Tháng 5", quality: "challenging" as const, summary: "Tiểu nhân xuất hiện, cẩn trọng giao tiếp." },
  { month: 6, label: "Tháng 6", quality: "good" as const, summary: "Tài lộc khởi sắc, mở rộng kinh doanh." },
  { month: 7, label: "Tháng 7", quality: "neutral" as const, summary: "Thận trọng, tập trung gia đình." },
  { month: 8, label: "Tháng 8", quality: "excellent" as const, summary: "Cơ hội lớn sự nghiệp và tình duyên." },
  { month: 9, label: "Tháng 9", quality: "good" as const, summary: "Ổn định, quý nhân giúp đỡ." },
  { month: 10, label: "Tháng 10", quality: "challenging" as const, summary: "Áp lực tài chính, kiểm soát ngân sách." },
  { month: 11, label: "Tháng 11", quality: "good" as const, summary: "Hồi phục, gia đạo hòa thuận." },
  { month: 12, label: "Tháng 12", quality: "excellent" as const, summary: "Kết năm viên mãn, gặt hái thành quả." },
];

const QUARTERLY_ANALYSIS = [
  {
    quarter: "Quý 1 (T1-T3)",
    career: "Khởi đầu mạnh mẽ, quý nhân phù trợ. Tháng 2 là đỉnh cao cơ hội.",
    finance: "Tài lộc hanh thông. Tháng 2 thích hợp đầu tư dài hạn.",
    love: "Người độc thân có cơ hội gặp đối tượng. Người có đôi thăng hoa.",
  },
  {
    quarter: "Quý 2 (T4-T6)",
    career: "Biến động, linh hoạt ứng phó. Tháng 5 cẩn thận tiểu nhân.",
    finance: "Tháng 6 tài lộc mạnh. Tránh cho vay mượn lớn tháng 5.",
    love: "Tháng 4 tình duyên nở rộ. Dành thời gian cho nhau.",
  },
  {
    quarter: "Quý 3 (T7-T9)",
    career: "Sau trầm lắng tháng 7, tháng 8 bùng nổ cơ hội.",
    finance: "Tháng 8-9 mở rộng nguồn thu.",
    love: "Tháng 8 đỉnh cao tình duyên. Chủ động hơn.",
  },
  {
    quarter: "Quý 4 (T10-T12)",
    career: "Gặt hái, hoàn thành mục tiêu. Tháng 12 tin vui thăng tiến.",
    finance: "Tháng 10 chi nhiều, 11-12 bù đắp. Tổng kết tích cực.",
    love: "Tháng 11-12 hòa thuận. Tốt cho cam kết nghiêm túc.",
  },
];

const qualityConfig = {
  excellent: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", icon: Star, label: "Rất tốt" },
  good: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", icon: TrendingUp, label: "Tốt" },
  neutral: { color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border", icon: ChevronRight, label: "Bình" },
  challenging: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: AlertTriangle, label: "Cẩn thận" },
};

// ── Component ──
const VanHan = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TimeFrame>("year");
  const [timeOffset, setTimeOffset] = useState(0);
  const [hasChart, setHasChart] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [chartSummary, setChartSummary] = useState<{
    solarDate?: string;
    gender?: string;
    cucName?: string;
    soulPalace?: string;
  } | null>(null);

  // Per-tab AI analysis state
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [aiLoadings, setAiLoadings] = useState<Record<TimeFrame, boolean>>({ week: false, month: false, year: false });
  const [aiSavedKeys, setAiSavedKeys] = useState<Set<string>>(new Set());

  // Load cached results from localStorage on mount
  useEffect(() => {
    const cached: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("van_han_")) {
        const val = localStorage.getItem(key);
        if (val) cached[key] = val;
      }
    }
    if (Object.keys(cached).length) setAiResults(cached);
  }, []);

  useEffect(() => {
    const savedChart = localStorage.getItem("tuvi_last_chart");
    if (savedChart) {
      try {
        const data = JSON.parse(savedChart);
        setHasChart(true);
        setChartData(data);
        setChartSummary({
          solarDate: data.solarDate,
          gender: data.gender,
          cucName: data.cuc?.name,
          soulPalace: data.palaces?.find((p: any) => p.isSoulPalace)?.name,
        });
      } catch {
        setHasChart(false);
      }
    }
  }, []);

  // Reset offset when switching tabs
  useEffect(() => {
    setTimeOffset(0);
  }, [activeTab]);

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const timeInfo =
    activeTab === "week" ? getWeekInfo(timeOffset) :
    activeTab === "month" ? getMonthInfo(timeOffset) :
    getYearInfo(timeOffset);

  const maxOffset = activeTab === "year" ? 1 : 2;

  const getCacheKey = useCallback(() => {
    // Use a simple key; userId can be added later
    return `van_han_${timeInfo.period}`;
  }, [timeInfo.period]);

  const currentResult = aiResults[getCacheKey()] || null;
  const currentLoading = aiLoadings[activeTab];
  const currentSaved = aiSavedKeys.has(getCacheKey());

  const handleAnalyze = useCallback(async (forceRefresh = false) => {
    if (!chartData) return;

    // Check cache first (unless forcing refresh)
    const cacheKey = getCacheKey();
    if (!forceRefresh && aiResults[cacheKey]) return;

    setAiLoadings(prev => ({ ...prev, [activeTab]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: {
          analysisType: "van_han",
          timeFrame: activeTab,
          period: timeInfo.period,
          chartData,
        },
      });

      if (error) throw error;
      const result = data?.analysis || "Không nhận được kết quả phân tích.";
      setAiResults(prev => ({ ...prev, [cacheKey]: result }));
      localStorage.setItem(cacheKey, result);
    } catch (err) {
      console.error("AI analysis error:", err);
      toast.error("Lỗi khi phân tích. Vui lòng thử lại.");
    } finally {
      setAiLoadings(prev => ({ ...prev, [activeTab]: false }));
    }
  }, [chartData, activeTab, timeInfo.period, getCacheKey, aiResults]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentResult) return;

    const { error } = await supabase.from("day_analyses").insert({
      user_id: user.id,
      solar_date: new Date().toISOString().split("T")[0],
      analysis: { type: "van_han", timeFrame: activeTab, period: timeInfo.period, content: currentResult },
      day_quality: "van_han",
    });

    if (error) {
      toast.error("Lỗi khi lưu kết quả");
    } else {
      setAiSavedKeys(prev => new Set(prev).add(getCacheKey()));
      toast.success("Đã lưu kết quả!");
    }
  };

  const handleShare = () => {
    if (currentResult) {
      navigator.clipboard.writeText(currentResult);
      toast.success("Đã sao chép kết quả!");
    }
  };

  // ── Free Preview Content ──
  const renderFreePreview = () => {
    const previews: Record<TimeFrame, string[]> = {
      week: [
        "Tuần này mang đến năng lượng tích cực cho công việc và các mối quan hệ.",
        "Giữa tuần có biến động nhẹ nhưng cuối tuần sẽ ổn định trở lại...",
      ],
      month: [
        "Tháng này là giai đoạn thuận lợi cho phát triển sự nghiệp và tài chính.",
        "Nửa đầu tháng tập trung xây dựng, nửa cuối gặt hái thành quả...",
      ],
      year: [
        "Năm 2026 mang nhiều biến động tích cực. Cung Mệnh hiện tại thuận lợi để phát triển.",
        "Nửa đầu năm xây dựng nền tảng, nửa cuối gặt hái thành quả.",
        "Tài lộc tăng dần theo quý, đặc biệt quý 2 và quý 4 là hai giai đoạn...",
      ],
    };

    return (
      <div className={cn(
        "rounded-2xl p-5 relative overflow-hidden",
        "bg-gradient-to-br from-surface-3 to-surface-2",
        "border border-border"
      )}>
        <h3 className="font-display text-lg text-primary mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Tổng Quan {timeInfo.label}
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          {previews[activeTab].map((line, i) => (
            <p key={i} className={i === previews[activeTab].length - 1 ? "opacity-70" : ""}>{line}</p>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface-3 to-transparent pointer-events-none" />
      </div>
    );
  };

  // ── Locked Week Content ──
  const renderWeekLocked = () => (
    <div className="space-y-4">
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-border")}>
        <h3 className="font-display text-lg text-primary mb-4">📅 Chi Tiết 7 Ngày</h3>
        <div className="space-y-2.5">
          {WEEKLY_DEMO.map((d) => {
            const cfg = qualityConfig[d.quality];
            const Icon = cfg.icon;
            return (
              <div key={d.day} className={cn("rounded-xl p-3 border", cfg.bg, cfg.border)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground text-sm">{d.day}</span>
                  <div className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{d.note}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-secondary/10 to-surface-2 border border-secondary/20")}>
        <h3 className="font-display text-lg text-secondary mb-3">💡 Lời Khuyên Tuần Này</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Tập trung vào các dự án quan trọng vào đầu tuần</li>
          <li>• Thứ 6 tránh đưa ra quyết định lớn</li>
          <li>• Cuối tuần dành cho gia đình và nghỉ ngơi</li>
        </ul>
      </div>
    </div>
  );

  // ── Locked Month Content ──
  const renderMonthLocked = () => (
    <div className="space-y-4">
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-border")}>
        <h3 className="font-display text-lg text-primary mb-4">🌙 Phân Tích Theo Tuần</h3>
        <div className="space-y-3">
          {MONTHLY_WEEKS_DEMO.map((w, i) => (
            <div key={i} className="rounded-xl p-4 border border-border bg-muted/20">
              <p className="font-medium text-foreground text-sm mb-1">{w.week}</p>
              <p className="text-xs text-muted-foreground">{w.summary}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Briefcase, label: "Sự nghiệp", color: "text-secondary", note: "Cơ hội thăng tiến, chủ động đề xuất ý tưởng" },
          { icon: Coins, label: "Tài lộc", color: "text-primary", note: "Thu nhập ổn định, tránh đầu tư mạo hiểm" },
          { icon: Heart, label: "Tình duyên", color: "text-destructive", note: "Thuận lợi cho người có đôi, độc thân kiên nhẫn" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-3 border border-border bg-surface-3 text-center">
            <item.icon className={cn("w-5 h-5 mx-auto mb-1.5", item.color)} />
            <p className={cn("text-xs font-medium mb-1", item.color)}>{item.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{item.note}</p>
          </div>
        ))}
      </div>
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-secondary/10 to-surface-2 border border-secondary/20")}>
        <h3 className="font-display text-sm text-secondary mb-2">📌 Ngày Đặc Biệt</h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>• Ngày 5, 14: Tài lộc hanh thông</li>
          <li>• Ngày 10: Quý nhân xuất hiện</li>
          <li>• Ngày 18: Cẩn thận giao tiếp</li>
          <li>• Ngày 25: Ngày tốt cho quyết định lớn</li>
        </ul>
      </div>
    </div>
  );

  // ── Locked Year Content ──
  const renderYearLocked = () => (
    <div className="space-y-6">
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-border")}>
        <h3 className="font-display text-lg text-primary mb-4">⭐ Vận Hạn 12 Tháng</h3>
        <div className="space-y-3">
          {MONTHLY_FORECAST.map((m) => {
            const cfg = qualityConfig[m.quality];
            const Icon = cfg.icon;
            return (
              <div key={m.month} className={cn("rounded-xl p-4 border", cfg.bg, cfg.border)}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-foreground text-sm">{m.label}</span>
                  <div className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{m.summary}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Tháng tốt nhất</span>
          </div>
          <div className="space-y-1.5">
            {["Tháng 2", "Tháng 8", "Tháng 12"].map((m) => (
              <p key={m} className="text-xs text-foreground flex items-center gap-1.5">
                <Star className="w-3 h-3 text-primary" /> {m}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-4 border border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Cần cẩn thận</span>
          </div>
          <div className="space-y-1.5">
            {["Tháng 5", "Tháng 10"].map((m) => (
              <p key={m} className="text-xs text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-destructive" /> {m}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-border")}>
        <h3 className="font-display text-lg text-primary mb-4">📊 Phân Tích Theo Quý</h3>
        <div className="space-y-5">
          {QUARTERLY_ANALYSIS.map((q, i) => (
            <div key={i} className="space-y-3">
              <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">{q.quarter}</h4>
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <Briefcase className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-secondary mb-0.5">Sự nghiệp</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{q.career}</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Coins className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-primary mb-0.5">Tài lộc</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{q.finance}</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Heart className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-destructive mb-0.5">Tình duyên</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{q.love}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const lockedContentMap: Record<TimeFrame, () => JSX.Element> = {
    week: renderWeekLocked,
    month: renderMonthLocked,
    year: renderYearLocked,
  };

  // ── AI Result Display ──
  const renderAiResult = () => {
    if (currentLoading) {
      return (
        <div className={cn("rounded-2xl p-8 text-center bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20")}>
          <div className="relative inline-block mb-4">
            <Sparkles className="w-10 h-10 text-primary animate-spin" />
          </div>
          <p className="font-display text-lg text-foreground mb-1">Đang phân tích lá số...</p>
          <p className="text-sm text-muted-foreground">AI đang luận giải vận hạn {timeInfo.label}</p>
        </div>
      );
    }

    if (!currentResult) {
      return (
        <div className="text-center py-6">
          <Button variant="gold" size="lg" onClick={() => handleAnalyze(false)}>
            <Sparkles className="w-5 h-5 mr-2" />
            Luận Giải AI {timeInfo.label}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Phân tích chuyên sâu bằng AI dựa trên lá số của bạn
          </p>
        </div>
      );
    }

    // Render markdown-style content
    const renderMarkdown = (text: string) => {
      return text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-primary mt-5 mb-2 border-b border-primary/20 pb-1">{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-md font-semibold text-secondary mt-4 mb-2">{line.replace('### ', '')}</h3>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-foreground mt-5 mb-3">{line.replace('# ', '')}</h1>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3 bg-primary/5 py-2 rounded-r">{line.replace('> ', '')}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-muted-foreground ml-4 list-disc text-sm">{renderBold(line.replace(/^[-*] /, ''))}</li>;
        if (/^\d+\. /.test(line)) return <li key={i} className="text-muted-foreground ml-4 list-decimal text-sm">{renderBold(line.replace(/^\d+\. /, ''))}</li>;
        if (line === '---' || line === '***') return <hr key={i} className="border-primary/20 my-4" />;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-muted-foreground leading-relaxed text-sm">{renderBold(line)}</p>;
      });
    };

    const renderBold = (text: string): React.ReactNode => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    return (
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-secondary flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Luận Giải AI - {timeInfo.label}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAnalyze(true)}
            disabled={currentLoading}
            title="Làm mới kết quả"
          >
            <Loader2 className={cn("w-4 h-4 mr-1", currentLoading && "animate-spin")} />
            Làm mới
          </Button>
        </div>
        <div className="space-y-1">
          {renderMarkdown(currentResult)}
        </div>
        <div className="flex gap-3 mt-5">
          <Button
            variant="goldOutline"
            size="sm"
            onClick={handleSave}
            disabled={currentSaved}
          >
            {currentSaved ? <Star className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {currentSaved ? "Đã lưu" : "Lưu kết quả"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Chia sẻ
          </Button>
        </div>
      </div>
    );
  };

  return (
    <PageLayout title="Vận Hạn">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Luận Giải AI</span>
          </div>
          <h2 className="font-display text-2xl text-foreground">
            Dự Đoán Vận Hạn
          </h2>
          <p className="text-sm text-muted-foreground">
            Phân tích chi tiết vận mệnh theo thời gian
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-surface-3 border border-border p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-4"
              )}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === "week" ? "Tuần" : tab.key === "month" ? "Tháng" : "Năm"}</span>
            </button>
          ))}
        </div>

        {/* Time Navigation */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setTimeOffset((o) => Math.max(o - 1, -maxOffset))}
            disabled={timeOffset <= -maxOffset}
            className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center hover:border-primary/30 transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="text-center">
            <p className="font-display text-foreground font-medium">{timeInfo.label}</p>
            {timeOffset === 0 && (
              <p className="text-xs text-primary">Hiện tại</p>
            )}
          </div>
          <button
            onClick={() => setTimeOffset((o) => Math.min(o + 1, maxOffset))}
            disabled={timeOffset >= maxOffset}
            className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center hover:border-primary/30 transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* No chart */}
        {!hasChart && (
          <div className={cn(
            "rounded-2xl p-6 text-center",
            "bg-gradient-to-br from-surface-3 to-surface-2",
            "border border-border"
          )}>
            <div className="text-4xl mb-3">🔮</div>
            <h3 className="font-display text-lg text-foreground mb-2">Chưa có lá số</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bạn cần lập lá số tử vi trước để xem vận hạn chi tiết
            </p>
            <Button variant="gold" size="lg" onClick={() => navigate("/lap-la-so")}>
              Lập lá số ngay
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Has chart */}
        {hasChart && (
          <>
            {/* Chart Summary */}
            <div className={cn(
              "rounded-2xl p-5",
              "bg-gradient-to-br from-surface-3 to-surface-2",
              "border border-primary/20"
            )}>
              <h3 className="font-display text-sm text-primary mb-3">Lá số của bạn</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {chartSummary?.solarDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Ngày sinh</p>
                    <p className="font-medium text-foreground">{chartSummary.solarDate.split("-").reverse().join("/")}</p>
                  </div>
                )}
                {chartSummary?.gender && (
                  <div>
                    <p className="text-xs text-muted-foreground">Giới tính</p>
                    <p className="font-medium text-foreground">{chartSummary.gender}</p>
                  </div>
                )}
                {chartSummary?.cucName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cục</p>
                    <p className="font-medium text-foreground">{chartSummary.cucName}</p>
                  </div>
                )}
                {chartSummary?.soulPalace && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cung Mệnh</p>
                    <p className="font-medium text-foreground">{chartSummary.soulPalace}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Free Preview */}
            {renderFreePreview()}

            {/* Locked Section */}
            <PaymentGate
              feature={currentTab.featureKey}
              title={`Luận giải ${activeTab === "week" ? "tuần" : activeTab === "month" ? "tháng" : "năm"} - ${activeTab === "week" ? "9.000đ" : activeTab === "month" ? "19.000đ" : "39.000đ"}`}
              description={`Mua 1 lần, xem vĩnh viễn cho ${timeInfo.label}`}
              onUnlocked={() => handleAnalyze(false)}
            >
              <div className="space-y-6">
                {lockedContentMap[activeTab]()}

                {/* AI Analysis Section */}
                {renderAiResult()}
              </div>
            </PaymentGate>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default VanHan;
