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
  ChevronRight,
  ChevronLeft,
  Star,
  Loader2,
  Save,
  Share2,
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

// ── Component ──
const VanHan = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TimeFrame>("year");
  const [timeOffset, setTimeOffset] = useState(0);

  // Chart selection
  const [charts, setCharts] = useState<any[]>([]);
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [showChartPicker, setShowChartPicker] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Package
  const [vanHanPackage, setVanHanPackage] = useState<any>(null);

  // Analysis
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load user charts from chart_analyses
  useEffect(() => {
    loadUserCharts();
  }, []);

  const loadUserCharts = async () => {
    setChartsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChartsLoading(false); return; }

    const { data } = await supabase
      .from('chart_analyses')
      .select('id, chart_hash, birth_data, chart_data, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setCharts(data || []);
    if (data && data.length > 0) {
      setSelectedChart(data[0]);
    }
    setChartsLoading(false);
  };

  // Load package for current timeframe
  const loadPackage = async (timeFrame: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('van_han_packages')
      .select('*')
      .eq('user_id', user.id)
      .eq('time_frame', timeFrame)
      .gt('uses_remaining', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setVanHanPackage(data);
  };

  useEffect(() => {
    if (selectedChart) loadPackage(activeTab);
  }, [activeTab, selectedChart]);

  // Reset offset when switching tabs
  useEffect(() => {
    setTimeOffset(0);
    setCurrentResult(null);
    setIsSaved(false);
  }, [activeTab]);

  // Reset result when changing time period
  useEffect(() => {
    setCurrentResult(null);
    setIsSaved(false);
  }, [timeOffset]);

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const timeInfo =
    activeTab === "week" ? getWeekInfo(timeOffset) :
    activeTab === "month" ? getMonthInfo(timeOffset) :
    getYearInfo(timeOffset);

  const maxOffset = activeTab === "year" ? 1 : 2;

  // Analyze
  const handleAnalyze = async () => {
    if (!selectedChart || !vanHanPackage) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check cache
    const { data: cached } = await supabase
      .from('van_han_analyses')
      .select('analysis_result')
      .eq('user_id', user.id)
      .eq('chart_hash', selectedChart.chart_hash)
      .eq('time_frame', activeTab)
      .eq('period', timeInfo.period)
      .maybeSingle();

    if (cached?.analysis_result) {
      setCurrentResult(cached.analysis_result);
      return;
    }

    // Call Claude
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-chart', {
        body: {
          analysisType: 'van_han',
          timeFrame: activeTab,
          period: timeInfo.period,
          chartData: selectedChart.birth_data,
          fullChartData: selectedChart.chart_data,
        }
      });

      if (error) throw error;
      const result = data?.analysis || "Không nhận được kết quả phân tích.";

      // Save to DB + decrement uses
      await supabase.from('van_han_analyses').insert({
        user_id: user.id,
        package_id: vanHanPackage.id,
        chart_hash: selectedChart.chart_hash,
        time_frame: activeTab,
        period: timeInfo.period,
        birth_data: selectedChart.birth_data,
        analysis_result: result,
      });

      await supabase.from('van_han_packages')
        .update({ uses_remaining: vanHanPackage.uses_remaining - 1 })
        .eq('id', vanHanPackage.id);

      setCurrentResult(result);
      loadPackage(activeTab);
    } catch (err) {
      console.error("AI analysis error:", err);
      toast.error("Lỗi khi phân tích. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      setIsSaved(true);
      toast.success("Đã lưu kết quả!");
    }
  };

  const handleShare = () => {
    if (currentResult) {
      navigator.clipboard.writeText(currentResult);
      toast.success("Đã sao chép kết quả!");
    }
  };

  // ── Markdown renderer ──
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

  // ── Render AI result ──
  const renderAiResult = () => {
    if (isAnalyzing) {
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
          <Button variant="gold" size="lg" onClick={handleAnalyze} disabled={!vanHanPackage}>
            <Sparkles className="w-5 h-5 mr-2" />
            Luận Giải AI {timeInfo.label}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Phân tích chuyên sâu bằng AI dựa trên lá số của bạn
          </p>
        </div>
      );
    }

    return (
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-secondary flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Luận Giải AI - {timeInfo.label}
          </h3>
        </div>
        <div className="space-y-1">
          {renderMarkdown(currentResult)}
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="goldOutline" size="sm" onClick={handleSave} disabled={isSaved}>
            {isSaved ? <Star className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {isSaved ? "Đã lưu" : "Lưu kết quả"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Chia sẻ
          </Button>
        </div>
      </div>
    );
  };

  // ── Chart Picker ──
  const renderChartPicker = () => {
    if (chartsLoading) {
      return <div className="animate-pulse rounded-lg bg-muted h-24" />;
    }

    if (charts.length === 0) {
      return (
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
      );
    }

    const bd = selectedChart?.birth_data;

    return (
      <div className="space-y-3">
        {/* Selected chart display */}
        <div className={cn(
          "rounded-2xl p-4 flex items-center justify-between",
          "bg-gradient-to-br from-surface-3 to-surface-2",
          "border border-primary/20"
        )}>
          <div>
            <p className="text-xs text-muted-foreground">Lá số đang chọn</p>
            <p className="font-medium text-foreground text-sm">
              {bd?.personName || 'Không tên'}
            </p>
            <p className="text-xs text-muted-foreground">
              {bd?.birthDate} · {bd?.gender}
            </p>
          </div>
          {charts.length > 1 && (
            <Button variant="goldOutline" size="sm" onClick={() => setShowChartPicker(!showChartPicker)}>
              Đổi lá số
            </Button>
          )}
        </div>

        {/* Chart picker modal */}
        {showChartPicker && (
          <div className="rounded-2xl p-4 bg-surface-3 border border-border">
            <h3 className="text-sm font-medium mb-3 text-foreground">Chọn lá số</h3>
            {charts.map(chart => (
              <button key={chart.id}
                onClick={() => { setSelectedChart(chart); setShowChartPicker(false); setCurrentResult(null); }}
                className={cn(
                  "w-full text-left p-3 rounded-xl mb-2 border transition-all",
                  selectedChart?.id === chart.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-surface-4 hover:border-muted-foreground"
                )}
              >
                <p className="font-medium text-sm text-foreground">
                  {chart.birth_data?.personName || 'Không tên'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {chart.birth_data?.birthDate} · {chart.birth_data?.gender}
                </p>
              </button>
            ))}
            <button onClick={() => navigate('/lap-la-so')}
              className="w-full text-center text-sm text-primary mt-2 hover:underline">
              + Tạo lá số mới
            </button>
          </div>
        )}
      </div>
    );
  };

  const packageDesc: Record<TimeFrame, string> = {
    week: "Gói 9 lần phân tích - 39.000đ",
    month: "Gói 6 lần phân tích - 39.000đ",
    year: "Gói 3 lần phân tích - 39.000đ",
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

        {/* Chart Picker */}
        {renderChartPicker()}

        {/* Content - only if chart selected */}
        {selectedChart && (
          <PaymentGate
            feature={currentTab.featureKey}
            title={`Luận giải vận hạn ${activeTab === "week" ? "tuần" : activeTab === "month" ? "tháng" : "năm"}`}
            price="39.000đ"
            description={packageDesc[activeTab]}
            onUnlocked={() => loadPackage(activeTab)}
          >
            <div className="space-y-4">
              {/* Uses remaining */}
              {vanHanPackage && (
                <div className="text-xs text-primary/70 text-center">
                  Còn {vanHanPackage.uses_remaining}/{vanHanPackage.uses_total} lần phân tích
                </div>
              )}

              {/* AI Analysis */}
              {renderAiResult()}
            </div>
          </PaymentGate>
        )}
      </div>
    </PageLayout>
  );
};

export default VanHan;
