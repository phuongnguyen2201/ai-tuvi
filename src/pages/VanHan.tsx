import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import PaymentGate from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Heart,
  Coins,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  Star,
} from "lucide-react";

// Demo data cho vận hạn
const MONTHLY_FORECAST = [
  { month: 1, label: "Tháng 1", quality: "good", summary: "Khởi đầu thuận lợi, quý nhân phù trợ. Thích hợp lên kế hoạch cho cả năm." },
  { month: 2, label: "Tháng 2", quality: "excellent", summary: "Vận may đỉnh cao, tài lộc hanh thông. Cơ hội thăng tiến trong công việc." },
  { month: 3, label: "Tháng 3", quality: "neutral", summary: "Bình ổn, nên tập trung củng cố nền tảng. Tránh đầu tư mạo hiểm." },
  { month: 4, label: "Tháng 4", quality: "good", summary: "Tình duyên nở rộ, gặp nhiều người mới. Sức khỏe tốt, tinh thần phấn chấn." },
  { month: 5, label: "Tháng 5", quality: "challenging", summary: "Tiểu nhân xuất hiện, cần cẩn trọng trong giao tiếp. Giữ bình tĩnh." },
  { month: 6, label: "Tháng 6", quality: "good", summary: "Vận tài lộc khởi sắc, thu nhập tăng. Thích hợp mở rộng kinh doanh." },
  { month: 7, label: "Tháng 7", quality: "neutral", summary: "Tháng cô hồn, nên thận trọng. Tập trung vào gia đình và nội tâm." },
  { month: 8, label: "Tháng 8", quality: "excellent", summary: "Vận may trở lại mạnh mẽ. Cơ hội lớn trong sự nghiệp và tình duyên." },
  { month: 9, label: "Tháng 9", quality: "good", summary: "Ổn định, quý nhân giúp đỡ. Thích hợp học hỏi và phát triển bản thân." },
  { month: 10, label: "Tháng 10", quality: "challenging", summary: "Áp lực tài chính, chi tiêu nhiều. Cần kiểm soát ngân sách." },
  { month: 11, label: "Tháng 11", quality: "good", summary: "Hồi phục tốt, tình duyên thuận lợi. Gia đạo hòa thuận, vui vẻ." },
  { month: 12, label: "Tháng 12", quality: "excellent", summary: "Kết năm viên mãn, gặt hái thành quả. Nền tảng vững cho năm mới." },
];

const QUARTERLY_ANALYSIS = [
  {
    quarter: "Quý 1 (T1-T3)",
    career: "Khởi đầu mạnh mẽ, quý nhân phù trợ. Nên chủ động tìm kiếm cơ hội mới, đặc biệt trong tháng 2.",
    finance: "Tài lộc hanh thông, thu nhập ổn định. Tháng 2 là thời điểm vàng để đầu tư dài hạn.",
    love: "Người độc thân có cơ hội gặp đối tượng phù hợp. Người có đôi tình cảm thăng hoa.",
  },
  {
    quarter: "Quý 2 (T4-T6)",
    career: "Giai đoạn biến động, cần linh hoạt ứng phó. Tháng 5 cẩn thận tiểu nhân.",
    finance: "Tháng 6 tài lộc khởi sắc mạnh. Tránh cho vay mượn lớn trong tháng 5.",
    love: "Tháng 4 tình duyên nở rộ. Cặp đôi nên dành thời gian bên nhau nhiều hơn.",
  },
  {
    quarter: "Quý 3 (T7-T9)",
    career: "Sau giai đoạn trầm lắng tháng 7, tháng 8 bùng nổ cơ hội. Nắm bắt kịp thời.",
    finance: "Tài chính cải thiện dần. Tháng 8-9 là thời điểm tốt để mở rộng nguồn thu.",
    love: "Tháng 8 là đỉnh cao tình duyên trong năm. Người độc thân nên chủ động hơn.",
  },
  {
    quarter: "Quý 4 (T10-T12)",
    career: "Giai đoạn gặt hái, hoàn thành mục tiêu năm. Tháng 12 có tin vui về thăng tiến.",
    finance: "Tháng 10 chi tiêu nhiều nhưng tháng 11-12 bù đắp tốt. Tổng kết năm tích cực.",
    love: "Tháng 11-12 gia đạo hòa thuận. Thời điểm tốt cho kết hôn hoặc cam kết nghiêm túc.",
  },
];

const ADVICE = [
  "Năm 2026 là năm của sự đổi mới và phát triển. Hãy mạnh dạn theo đuổi mục tiêu.",
  "Tháng 2 và tháng 8 là hai tháng vàng - tập trung nguồn lực vào hai giai đoạn này.",
  "Cẩn trọng trong tháng 5 và tháng 10 - kiểm soát chi tiêu và lời nói.",
  "Xây dựng mối quan hệ tốt từ đầu năm sẽ mang lại lợi ích lớn cuối năm.",
  "Sức khỏe cần chú ý vào quý 3 - tập luyện đều đặn và nghỉ ngơi hợp lý.",
];

const qualityConfig = {
  excellent: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", icon: Star, label: "Rất tốt" },
  good: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", icon: TrendingUp, label: "Tốt" },
  neutral: { color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border", icon: ChevronRight, label: "Bình" },
  challenging: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: AlertTriangle, label: "Cẩn thận" },
};

const VanHan = () => {
  const navigate = useNavigate();
  const [hasChart, setHasChart] = useState(false);
  const [chartSummary, setChartSummary] = useState<{
    solarDate?: string;
    gender?: string;
    cucName?: string;
    soulPalace?: string;
  } | null>(null);

  useEffect(() => {
    // Check localStorage for existing chart data
    const savedChart = localStorage.getItem("tuvi_last_chart");
    if (savedChart) {
      try {
        const data = JSON.parse(savedChart);
        setHasChart(true);
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

  return (
    <PageLayout title="Vận Hạn Năm">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Năm 2026</span>
          </div>
          <h2 className="font-display text-2xl text-foreground">
            Dự Đoán Vận Hạn
          </h2>
          <p className="text-sm text-muted-foreground">
            Phân tích chi tiết vận mệnh theo từng tháng
          </p>
        </div>

        {/* No chart - prompt to create one */}
        {!hasChart && (
          <div className={cn(
            "rounded-2xl p-6 text-center",
            "bg-gradient-to-br from-surface-3 to-surface-2",
            "border border-border"
          )}>
            <div className="text-4xl mb-3">🔮</div>
            <h3 className="font-display text-lg text-foreground mb-2">
              Chưa có lá số
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bạn cần lập lá số tử vi trước để xem vận hạn chi tiết
            </p>
            <Button variant="gold" size="lg" onClick={() => navigate("/lap-la-so")}>
              Lập lá số ngay
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Has chart - show analysis */}
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
                    <p className="font-medium text-foreground">
                      {chartSummary.solarDate.split("-").reverse().join("/")}
                    </p>
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

            {/* FREE: Year Overview (fades out) */}
            <div className={cn(
              "rounded-2xl p-5 relative overflow-hidden",
              "bg-gradient-to-br from-surface-3 to-surface-2",
              "border border-border"
            )}>
              <h3 className="font-display text-lg text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Tổng Quan Vận Hạn 2026
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Năm 2026 là năm mang nhiều biến động tích cực cho bạn. Với cung Mệnh hiện tại, 
                  đây là giai đoạn thuận lợi để phát triển sự nghiệp và mở rộng các mối quan hệ.
                </p>
                <p>
                  Nửa đầu năm tập trung vào xây dựng nền tảng, nửa cuối năm là thời điểm gặt hái thành quả.
                </p>
                <p className="opacity-70">
                  Tài lộc có xu hướng tăng dần theo từng quý, đặc biệt quý 2 và quý 4 là hai giai đoạn...
                </p>
              </div>
              {/* Fade overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface-3 to-transparent pointer-events-none" />
            </div>

            {/* LOCKED: Detailed Analysis */}
            <PaymentGate feature="van_han">
              <div className="space-y-6">
                {/* Monthly Forecast */}
                <div className={cn(
                  "rounded-2xl p-5",
                  "bg-gradient-to-br from-surface-3 to-surface-2",
                  "border border-border"
                )}>
                  <h3 className="font-display text-lg text-primary mb-4">
                    📅 Vận Hạn 12 Tháng
                  </h3>
                  <div className="space-y-3">
                    {MONTHLY_FORECAST.map((m) => {
                      const config = qualityConfig[m.quality as keyof typeof qualityConfig];
                      const Icon = config.icon;
                      return (
                        <div
                          key={m.month}
                          className={cn(
                            "rounded-xl p-4 border transition-all",
                            config.bg,
                            config.border
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-foreground text-sm">{m.label}</span>
                            <div className={cn("flex items-center gap-1 text-xs font-medium", config.color)}>
                              <Icon className="w-3.5 h-3.5" />
                              {config.label}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {m.summary}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Best / Worst Months */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn("rounded-xl p-4 border border-primary/20 bg-primary/5")}>
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
                  <div className={cn("rounded-xl p-4 border border-destructive/20 bg-destructive/5")}>
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

                {/* Quarterly Deep Dive */}
                <div className={cn(
                  "rounded-2xl p-5",
                  "bg-gradient-to-br from-surface-3 to-surface-2",
                  "border border-border"
                )}>
                  <h3 className="font-display text-lg text-primary mb-4">
                    📊 Phân Tích Theo Quý
                  </h3>
                  <div className="space-y-5">
                    {QUARTERLY_ANALYSIS.map((q, i) => (
                      <div key={i} className="space-y-3">
                        <h4 className="font-semibold text-foreground text-sm border-b border-border pb-2">
                          {q.quarter}
                        </h4>
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

                {/* Advice */}
                <div className={cn(
                  "rounded-2xl p-5",
                  "bg-gradient-to-br from-secondary/10 to-surface-2",
                  "border border-secondary/20"
                )}>
                  <h3 className="font-display text-lg text-secondary mb-4 flex items-center gap-2">
                    💡 Lời Khuyên Cho Năm 2026
                  </h3>
                  <ul className="space-y-3">
                    {ADVICE.map((advice, i) => (
                      <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                        <span className="text-secondary font-bold shrink-0">{i + 1}.</span>
                        {advice}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </PaymentGate>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default VanHan;
