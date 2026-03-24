import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import PaymentGate from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { astro } from "iztro";
import { toast } from "sonner";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Share2,
  History,
  ChevronDown,
  ChevronUp,
  CreditCard,
  X,
  Lock,
  Calendar,
  Moon,
  Star,
} from "lucide-react";
// ── CHANGE 1: Import streaming hook ──
import { useStreamingAnalysis } from "@/hooks/useStreamingAnalysis";
import { useAuth } from "@/contexts/AuthContext";
import VietQRPaymentModal from "@/components/VietQRPaymentModal";
import { AnalysisDisclaimer } from "@/components/AnalysisDisclaimer";
import { getISOWeek, startOfISOWeek, endOfISOWeek, addWeeks } from "date-fns";

// ── Types ──
type TimeFrame = "week" | "month" | "year";

interface TabConfig {
  key: TimeFrame;
  label: string;
  icon: typeof Calendar;
  featureKey: string;
}

const TABS: TabConfig[] = [
  { key: "week", label: "Theo Tuần", icon: Calendar, featureKey: "van_han_week" },
  { key: "month", label: "Theo Tháng", icon: Moon, featureKey: "van_han_month" },
  { key: "year", label: "Theo Năm", icon: Star, featureKey: "van_han_year" },
];

// ── Helpers ──
// ══════════════════════════════════════════════════════════════
// FIX: Use ISO 8601 week numbering via date-fns
// Old formula was off-by-one for weeks where Jan 1 != Monday
// Example: March 2, 2026 is ISO week 10, old formula gave 9
// ══════════════════════════════════════════════════════════════
function getWeekInfo(offset: number) {
  const currentWeekStart = startOfISOWeek(new Date());
  const start = addWeeks(currentWeekStart, offset);
  const end = endOfISOWeek(start);
  const weekNum = getISOWeek(start);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return {
    label: `Tuần ${weekNum} (${fmt(start)} - ${fmt(end)}/${end.getFullYear()})`,
    period: `${start.getFullYear()}-W${String(weekNum).padStart(2, "0")}`,
  };
}

// ══════════════════════════════════════════════════════════════
// LUNAR CALENDAR UTILITIES FOR TỬ VI
// 流月 (Lưu Nguyệt) uses lunar months, 流年 (Lưu Niên) uses lunar years
// Week (流週) is NOT a traditional Tử Vi concept → stays solar
// ══════════════════════════════════════════════════════════════

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

/** Convert solar date → lunar month/year using built-in Intl API (Chinese calendar) */
function solarToLunar(solarDate: Date): { lunarYear: number; lunarMonth: number; lunarDay: number } {
  try {
    const formatted = new Intl.DateTimeFormat("en-u-ca-chinese", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(solarDate);

    // Build a map keyed by part type string to avoid TS strict type issues
    const partMap: Record<string, string> = {};
    formatted.forEach((p) => {
      partMap[String(p.type)] = p.value;
    });

    const lunarYear = partMap["relatedYear"] ? parseInt(partMap["relatedYear"]) : solarDate.getFullYear();
    const lunarMonth = partMap["month"] ? parseInt(partMap["month"].replace(/[^\d]/g, "")) : solarDate.getMonth() + 1;
    const lunarDay = partMap["day"] ? parseInt(partMap["day"].replace(/[^\d]/g, "")) : solarDate.getDate();

    return { lunarYear, lunarMonth, lunarDay };
  } catch {
    return {
      lunarYear: solarDate.getFullYear(),
      lunarMonth: solarDate.getMonth() + 1,
      lunarDay: solarDate.getDate(),
    };
  }
}

/** 天干地支 (Can Chi) of a lunar year — e.g. 2026 → "Bính Ngọ" */
function getYearCanChi(lunarYear: number): string {
  const stemIdx = (lunarYear - 4) % 10;
  const branchIdx = (lunarYear - 4) % 12;
  return `${THIEN_CAN[stemIdx]}${DIA_CHI[branchIdx]}`;
}

/**
 * 五虎遁 (Ngũ Hổ Độn): Can Chi of a lunar month
 * Month 1 = Dần(寅), Month 2 = Mão(卯), ..., Month 12 = Sửu(丑)
 * Thiên Can of month 1 depends on year's Thiên Can
 */
function getMonthCanChi(lunarYear: number, lunarMonth: number): string {
  const yearStemIdx = (lunarYear - 4) % 10;
  // Ngũ Hổ Độn formula: month1Stem = (yearStem % 5) * 2 + 2
  // Giáp/Kỷ→Bính(2), Ất/Canh→Mậu(4), Bính/Tân→Canh(6), Đinh/Nhâm→Nhâm(8), Mậu/Quý→Giáp(0)
  const month1Stem = ((yearStemIdx % 5) * 2 + 2) % 10;
  const monthStemIdx = (month1Stem + lunarMonth - 1) % 10;
  // Month 1 = Dần(2), Month 2 = Mão(3), ..., Month 11 = Tý(0), Month 12 = Sửu(1)
  const monthBranchIdx = (lunarMonth + 1) % 12;
  return `${THIEN_CAN[monthStemIdx]}${DIA_CHI[monthBranchIdx]}`;
}

function getMonthInfo(offset: number) {
  const now = solarToLunar(new Date());
  let m = now.lunarMonth + offset;
  let y = now.lunarYear;
  while (m > 12) {
    m -= 12;
    y++;
  }
  while (m < 1) {
    m += 12;
    y--;
  }

  const canChi = getMonthCanChi(y, m);
  return {
    label: `Tháng ${m} ÂL — ${canChi} (${y})`,
    period: `L${y}-${String(m).padStart(2, "0")}`,
  };
}

function getYearInfo(offset: number) {
  const now = solarToLunar(new Date());
  const y = now.lunarYear + offset;
  const canChi = getYearCanChi(y);
  return {
    label: `Năm ${canChi} (${y})`,
    period: `L${y}`,
  };
}

// Format period string for display in history panel
function formatPeriodLabel(timeFrame: string, period: string): string {
  if (timeFrame === "week") {
    const match = period.match(/^(\d{4})-W(\d{2})$/);
    if (match) return `Tuần ${parseInt(match[2])}/${match[1]}`;
  }
  if (timeFrame === "month") {
    // New lunar format: L2026-02
    const lunarMatch = period.match(/^L(\d{4})-(\d{2})$/);
    if (lunarMatch) {
      const yr = parseInt(lunarMatch[1]);
      const mo = parseInt(lunarMatch[2]);
      return `T${mo} ÂL (${getMonthCanChi(yr, mo)})`;
    }
    // Old solar format fallback: 2026-03
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (match) return `Tháng ${parseInt(match[2])}/${match[1]}`;
  }
  if (timeFrame === "year") {
    // New lunar format: L2026
    const lunarMatch = period.match(/^L(\d{4})$/);
    if (lunarMatch) {
      const yr = parseInt(lunarMatch[1]);
      return `${getYearCanChi(yr)} (${yr})`;
    }
    return `Năm ${period}`;
  }
  return period;
}

// ══════════════════════════════════════════════════════════════
// FREEMIUM: Truncate text to ~N words, preserving whole lines
// ══════════════════════════════════════════════════════════════
const FREE_PREVIEW_WORD_LIMIT = 500;

function truncateToWords(text: string, maxWords: number): { preview: string; isTruncated: boolean } {
  const lines = text.split("\n");
  let wordCount = 0;
  const previewLines: string[] = [];

  for (const line of lines) {
    const lineWords = line.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount + lineWords > maxWords && previewLines.length > 0) {
      break;
    }
    previewLines.push(line);
    wordCount += lineWords;
    if (wordCount >= maxWords) break;
  }

  const preview = previewLines.join("\n");
  const isTruncated = preview.length < text.length;
  return { preview, isTruncated };
}

// ── Component ──
const VanHan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TimeFrame>("year");
  const [timeOffset, setTimeOffset] = useState(0);

  // Chart selection
  const [charts, setCharts] = useState<any[]>([]);
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [showChartPicker, setShowChartPicker] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Package
  const [credits, setCredits] = useState<number>(0);
  const [everPurchased, setEverPurchased] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkedPendingPayment, setCheckedPendingPayment] = useState(false);

  // Analysis
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── FREEMIUM: DB-based free trial tracking ──
  const [freeTrialCount, setFreeTrialCount] = useState<number | null>(null);

  // ══════════════════════════════════════════════════════════════
  // CHANGE A: History state — past analyses grouped by tab
  // ══════════════════════════════════════════════════════════════
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  // Track which tab initiated the current stream — prevents stale text showing on tab switch
  const [streamingForTab, setStreamingForTab] = useState<string | null>(null);

  // ── CHANGE 2: Streaming hook ──
  const {
    isStreaming: isStreamingAI,
    streamedText,
    error: streamError,
    startStreaming,
    abort: abortStreaming,
  } = useStreamingAnalysis();

  // ══════════════════════════════════════════════════════════════
  // FREEMIUM: Derived state
  // ══════════════════════════════════════════════════════════════
  const hasCredits = credits > 0;
  const canUseFreeTrial = freeTrialCount === 0 && !hasCredits;
  // FIX: Only show streamedText if it belongs to the current tab
  const activeStreamedText = streamingForTab === activeTab ? streamedText : "";
  const displayText = currentResult || activeStreamedText;
  const isFreePreview = !!displayText && !hasCredits && !everPurchased;
  const canAnalyze = hasCredits || canUseFreeTrial;

  // Load user charts from chart_analyses
  useEffect(() => {
    loadUserCharts();
  }, []);

  // Load free trial count when user available
  useEffect(() => {
    if (user) {
      loadFreeTrialCount();
    }
  }, [user, activeTab]);

  const loadFreeTrialCount = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        setFreeTrialCount(0);
        return;
      }

      const { count } = await supabase
        .from("van_han_analyses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("time_frame", activeTab);

      setFreeTrialCount(count ?? 0);
    } catch {
      setFreeTrialCount(0);
    }
  };

  const loadUserCharts = async () => {
    setChartsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setChartsLoading(false);
      return;
    }

    const { data } = await supabase
      .from("chart_analyses")
      .select("id, chart_hash, birth_data, chart_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setCharts(data || []);
    if (data && data.length > 0) {
      setSelectedChart(data[0]);
    }
    setChartsLoading(false);
  };

  const loadCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("user_credits")
      .select("credits_remaining, credits_total")
      .eq("user_id", user.id)
      .maybeSingle();
    setCredits(data?.credits_remaining ?? 0);
    setEverPurchased((data?.credits_total ?? 0) > 0);
  };

  useEffect(() => {
    if (selectedChart) loadCredits();
  }, [activeTab, selectedChart]);

  // ══════════════════════════════════════════════════════════════
  // AUTO-OPEN: If user has pending payment for current tab's
  // feature → auto-open standalone payment modal (QR immediately)
  // This handles the case where PaymentGate is NOT rendered
  // (e.g. user already has a blur preview from free trial)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (checkedPendingPayment || showPaymentModal || hasCredits) return;
    const featureKey = TABS.find((t) => t.key === activeTab)?.featureKey;
    if (!featureKey) return;

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCheckedPendingPayment(true);
        return;
      }

      const { data: pending } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("feature_unlocked", featureKey)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

      if (pending) {
        console.log("[VanHan] Found pending payment for", featureKey, "→ auto-opening modal");
        setShowPaymentModal(true);
      }
      setCheckedPendingPayment(true);
    };
    check();
  }, [activeTab, checkedPendingPayment, showPaymentModal, hasCredits]);

  // Reset offset and streaming state when switching tabs
  useEffect(() => {
    setTimeOffset(0);
    setStreamingForTab(null);
    setCheckedPendingPayment(false);
  }, [activeTab]);

  // ══════════════════════════════════════════════════════════════
  // CHANGE A: Load analysis history when tab or chart changes
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    loadAnalysisHistory();
  }, [activeTab, selectedChart]);

  const loadAnalysisHistory = async () => {
    setHistoryLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHistoryLoading(false);
        return;
      }

      const { data } = await supabase
        .from("van_han_analyses")
        .select("id, chart_hash, time_frame, period, birth_data, analysis_result, created_at")
        .eq("user_id", user.id)
        .eq("time_frame", activeTab)
        .not("analysis_result", "is", null)
        .order("created_at", { ascending: false })
        .limit(30);

      setAnalysisHistory(data || []);
    } catch (err) {
      console.error("[History] Load error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const timeInfo =
    activeTab === "week"
      ? getWeekInfo(timeOffset)
      : activeTab === "month"
        ? getMonthInfo(timeOffset)
        : getYearInfo(timeOffset);

  const maxForward = activeTab === "week" ? 52 : activeTab === "month" ? 12 : 5;

  // Auto load cached result when chart/tab/period changes
  useEffect(() => {
    if (!selectedChart) return;
    autoLoadCached();
  }, [selectedChart, activeTab, timeOffset]);

  const autoLoadCached = async () => {
    // Clear history viewing state + stale streaming text
    setViewingHistoryId(null);
    abortStreaming();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cached } = await supabase
      .from("van_han_analyses")
      .select("analysis_result")
      .eq("user_id", user.id)
      .eq("chart_hash", selectedChart.chart_hash)
      .eq("time_frame", activeTab)
      .eq("period", timeInfo.period)
      .maybeSingle();

    if (cached?.analysis_result) {
      setCurrentResult(cached.analysis_result);
    } else {
      setCurrentResult(null);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // CHANGE A: Handle clicking a history item
  // ══════════════════════════════════════════════════════════════
  const handleLoadFromHistory = (item: any) => {
    // Find matching chart by chart_hash
    const matchingChart = charts.find((c) => c.chart_hash === item.chart_hash);
    if (matchingChart && matchingChart.id !== selectedChart?.id) {
      setSelectedChart(matchingChart);
    }

    // Show the cached result directly
    if (item.analysis_result) {
      setCurrentResult(item.analysis_result);
    }

    // Track which history item is being viewed
    setViewingHistoryId(item.id);

    setShowHistory(false);

    // Scroll to result
    setTimeout(() => {
      document.getElementById("van-han-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ── CHANGE 3: Analyze with STREAMING — supports both free trial & paid ──
  const handleAnalyze = async () => {
    if (!selectedChart) return;
    // ── FREEMIUM: Allow if has package OR free trial ──
    if (!hasCredits && !canUseFreeTrial) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Check cache first
    const { data: cached } = await supabase
      .from("van_han_analyses")
      .select("analysis_result")
      .eq("user_id", user.id)
      .eq("chart_hash", selectedChart.chart_hash)
      .eq("time_frame", activeTab)
      .eq("period", timeInfo.period)
      .maybeSingle();

    if (cached?.analysis_result) {
      setCurrentResult(cached.analysis_result);
      return;
    }

    // Compute chart data from iztro if missing
    let fullChartData = selectedChart.chart_data;
    if (!fullChartData || Object.keys(fullChartData).length < 5) {
      try {
        const bd = selectedChart.birth_data as any;
        const astrolabe =
          bd.calendarType === "lunar"
            ? astro.byLunar(
                bd.birthDate,
                parseInt(bd.birthHour || "0"),
                bd.gender === "Nam" ? "男" : "女",
                false,
                false,
                "vi-VN",
              )
            : astro.bySolar(
                bd.birthDate,
                parseInt(bd.birthHour || "0"),
                bd.gender === "Nam" ? "男" : "女",
                true,
                "vi-VN",
              );
        fullChartData = {
          solarDate: astrolabe.solarDate,
          lunarDate: astrolabe.lunarDate,
          lunarYear: bd.birthDate?.split("-")[0],
          gender: bd.gender,
          birthHour: bd.birthHour,
          cuc: astrolabe.fiveElementsClass,
          soulStar: astrolabe.soul,
          bodyStar: astrolabe.body,
          palaces: astrolabe.palaces?.map((p: any) => ({
            name: p.name,
            heavenlyStem: p.heavenlyStem,
            earthlyBranch: p.earthlyBranch,
            isSoulPalace: p.isSoulPalace,
            isBodyPalace: p.isBodyPalace,
            majorStars: p.majorStars,
            minorStars: p.minorStars,
          })),
        };
      } catch (e) {
        console.error("Failed to compute chart:", e);
        fullChartData = selectedChart.chart_data;
      }
    }

    // Call Claude with STREAMING
    setIsAnalyzing(true);
    setCurrentResult(null);
    setStreamingForTab(activeTab);

    try {
      const fullText = await startStreaming(
        {
          analysisType: "van_han",
          timeFrame: activeTab,
          period: timeInfo.period,
          periodLabel: timeInfo.label, // "Tháng 2 ÂL — Canh Dần (2026)" or "Năm Bính Ngọ (2026)"
          chartData: selectedChart.birth_data,
          fullChartData,
        },
        {
          onError: (err) => {
            console.error("[VanHan] Stream error:", err);
            toast.error(err || "AI đang bận. Vui lòng thử lại sau.");
          },
        },
      );

      if (!fullText || fullText.length < 50) {
        throw new Error("Không nhận được kết quả phân tích.");
      }

      // ── Save to DB for ALL users (free trial + paid) ──
      try {
        await supabase.from("van_han_analyses").insert({
          user_id: user.id,
          package_id: null,
          chart_hash: selectedChart.chart_hash,
          time_frame: activeTab,
          period: timeInfo.period,
          birth_data: selectedChart.birth_data,
          analysis_result: fullText,
        });
      } catch (saveErr) {
        console.warn("[VanHan] Save error (package_id may be required):", saveErr);
      }

      if (hasCredits) {
        const { data: creditResult } = await (supabase as any).rpc("use_credit", {
          p_user_id: user.id,
          p_feature: `van_han_${activeTab}`,
        });
        console.log("[VanHan] use_credit result:", creditResult);
      }

      // Update free trial count
      setFreeTrialCount((prev) => (prev ?? 0) + 1);

      setCurrentResult(fullText);
      loadCredits();

      // CHANGE A: Reload history so new analysis appears
      loadAnalysisHistory();
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast.error("Lỗi khi phân tích. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryAnalyze = async () => {
    if (!selectedChart) return;

    abortStreaming();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("van_han_analyses")
      .delete()
      .eq("user_id", user.id)
      .eq("chart_hash", selectedChart.chart_hash)
      .eq("time_frame", activeTab)
      .eq("period", timeInfo.period);

    setCurrentResult(null);
    loadAnalysisHistory();

    // Trigger new analysis immediately
    handleAnalyze();
  };

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/^#{1,3} /gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^[-•] /gm, "• ")
      .replace(/^> /gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const extractChamNgon = (text: string): string | null => {
    const match = text.match(/^>\s*(.+)$/m);
    return match ? match[1].trim() : null;
  };

  const handleShare = async (type: "full" | "quote") => {
    if (!currentResult) return;

    let shareText = "";
    if (type === "full") {
      const cleaned = cleanMarkdown(currentResult);
      shareText = `✨ ${timeInfo.label} - Tử Vi App\n\n${cleaned}\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
    } else {
      const chamNgon = extractChamNgon(currentResult);
      if (!chamNgon) {
        toast.error("Không tìm thấy câu châm ngôn");
        return;
      }
      shareText = `✨ ${chamNgon}\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tử Vi - ${timeInfo.label}`,
          text: shareText,
          url: "https://ai-tuvi.lovable.app",
        });
        return;
      } catch (e) {}
    }

    await navigator.clipboard.writeText(shareText);
    toast.success(type === "full" ? "📋 Đã sao chép luận giải!" : "📋 Đã sao chép châm ngôn!");
  };

  // ── Markdown renderer ──
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return (
          <h2 key={i} className="text-lg font-bold text-primary mt-5 mb-2 border-b border-primary/20 pb-1">
            {line.replace("## ", "")}
          </h2>
        );
      if (line.startsWith("### "))
        return (
          <h3 key={i} className="text-md font-semibold text-secondary mt-4 mb-2">
            {line.replace("### ", "")}
          </h3>
        );
      if (line.startsWith("# "))
        return (
          <h1 key={i} className="text-xl font-bold text-foreground mt-5 mb-3">
            {line.replace("# ", "")}
          </h1>
        );
      if (line.startsWith("> "))
        return (
          <blockquote
            key={i}
            className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3 bg-primary/5 py-2 rounded-r"
          >
            {line.replace("> ", "")}
          </blockquote>
        );
      if (line.startsWith("- ") || line.startsWith("* "))
        return (
          <li key={i} className="text-muted-foreground ml-4 list-disc text-sm">
            {renderBold(line.replace(/^[-*] /, ""))}
          </li>
        );
      if (/^\d+\. /.test(line))
        return (
          <li key={i} className="text-muted-foreground ml-4 list-decimal text-sm">
            {renderBold(line.replace(/^\d+\. /, ""))}
          </li>
        );
      if (line === "---" || line === "***") return <hr key={i} className="border-primary/20 my-4" />;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-muted-foreground leading-relaxed text-sm">
          {renderBold(line)}
        </p>
      );
    });
  };

  const renderBold = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-foreground font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // ── CHANGE 4: Render AI result with streaming + freemium states ──
  const renderAiResult = () => {
    // ── STATE A: STREAMING ──
    if ((isAnalyzing || isStreamingAI) && !currentResult) {
      return (
        <div
          id="van-han-result"
          className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20")}
        >
          <h3 className="font-display text-lg text-primary flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 animate-pulse" />
            Đang luận giải...
            <span className="text-xs font-normal text-muted-foreground ml-2">(streaming real-time)</span>
          </h3>
          {activeStreamedText ? (
            <div className="space-y-1">
              {renderMarkdown(activeStreamedText)}
              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Đang viết tiếp...</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="relative inline-block mb-4">
                <Sparkles className="w-10 h-10 text-primary animate-spin" />
              </div>
              <p className="font-display text-lg text-foreground mb-1">Đang kết nối AI...</p>
              <p className="text-sm text-muted-foreground">Kết quả sẽ hiện ra từng phần trong giây lát</p>
            </div>
          )}
        </div>
      );
    }

    // ── STATE B: NO RESULT — show analyze button or exhausted message ──
    if (!currentResult && !activeStreamedText) {
      // Sub-state: package exhausted + no free trial left
      if (!hasCredits && everPurchased) {
        return (
          <div id="van-han-result" className="text-center py-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Hết lượt phân tích</span>
            </div>
            <p className="text-sm text-muted-foreground">Mua thêm gói để luận giải {timeInfo.label}</p>
            <Button variant="gold" size="lg" onClick={() => setShowPaymentModal(true)}>
              <CreditCard className="w-5 h-5 mr-2" />
              Mua gói luận giải
            </Button>
          </div>
        );
      }

      return (
        <div id="van-han-result" className="text-center py-6">
          <Button variant="gold" size="lg" onClick={handleAnalyze} disabled={!canAnalyze}>
            <Sparkles className="w-5 h-5 mr-2" />
            {canUseFreeTrial ? "Thử miễn phí" : `Luận Giải AI ${timeInfo.label}`}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {canUseFreeTrial
              ? "1 lần miễn phí — xem bản rút gọn luận giải AI"
              : "Phân tích chuyên sâu bằng AI dựa trên lá số của bạn"}
          </p>
        </div>
      );
    }

    // ── STATE C: FREE PREVIEW — has result but no paid package ──
    if (isFreePreview) {
      const textToShow = currentResult || activeStreamedText;
      if (!textToShow) return null;

      const { preview } = truncateToWords(textToShow, FREE_PREVIEW_WORD_LIMIT);
      const tabLabel = activeTab === "week" ? "tuần" : activeTab === "month" ? "tháng" : "năm";

      return (
        <div
          id="van-han-result"
          className={cn(
            "rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20 overflow-hidden",
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg text-secondary">Luận Giải AI - {timeInfo.label}</h3>
            <span className="text-xs font-normal text-muted-foreground ml-1">— Bản xem trước</span>
          </div>

          {/* Visible preview portion */}
          <div className="space-y-1">{renderMarkdown(preview)}</div>

          {/* Gradient fade → blurred teaser → payment CTA */}
          <div className="relative mt-0">
            <div className="h-32 bg-gradient-to-b from-transparent via-card/80 to-card relative z-10" />

            <div
              className="blur-sm select-none pointer-events-none -mt-4 max-h-40 overflow-hidden opacity-60"
              aria-hidden="true"
            >
              {renderMarkdown(textToShow.slice(preview.length, preview.length + 600))}
            </div>

            <div className="relative z-20 -mt-32 pt-8 pb-2 bg-gradient-to-b from-card/90 to-card">
              <div className="text-center space-y-4 max-w-sm mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Nội dung bị giới hạn</span>
                </div>

                <h3 className="text-lg font-bold text-foreground">Mở khóa luận giải đầy đủ</h3>

                <p className="text-sm text-muted-foreground">
                  Bạn đang xem bản rút gọn. Thanh toán để xem toàn bộ luận giải chi tiết và được thêm 3 lần phân tích
                  vận hạn theo {tabLabel}.
                </p>

                <p className="text-2xl font-bold text-primary">39.000đ</p>
                <p className="text-xs text-muted-foreground -mt-2">
                  Xem full luận giải này + 3 lần phân tích {tabLabel} mới
                </p>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/auth?redirect=" + encodeURIComponent(window.location.pathname);
                      return;
                    }
                    setShowPaymentModal(true);
                  }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Mua gói Vận Hạn {tabLabel.charAt(0).toUpperCase() + tabLabel.slice(1)}
                </Button>
                <p className="text-xs text-muted-foreground">Thanh toán nhanh qua ngân hàng</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── STATE D: COMPLETED — show full result + greyed button (paid user) ──
    const fullDisplayText = currentResult || activeStreamedText;
    return (
      <div
        id="van-han-result"
        className={cn("rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-secondary flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Luận Giải AI - {timeInfo.label}
          </h3>
        </div>
        <div className="space-y-1">{renderMarkdown(fullDisplayText)}</div>
        <AnalysisDisclaimer variant="van_han" />

        {/* ── Grey out button — already analyzed ── */}
        <div className="mt-5 pt-4 border-t border-secondary/20">
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="w-full text-xs text-muted-foreground cursor-not-allowed opacity-50"
          >
            ✓ Đã luận giải {timeInfo.label} — Chọn thời gian hoặc lá số khác
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
          <Button variant="ghost" size="sm" onClick={() => handleShare("quote")} className="flex-1 text-xs">
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Chia sẻ châm ngôn
          </Button>
          <Button variant="goldOutline" size="sm" onClick={() => handleShare("full")} className="flex-1 text-xs">
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Chia sẻ luận giải
          </Button>
        </div>
        {hasCredits && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetryAnalyze}
            className="w-full mt-2 text-xs text-muted-foreground"
          >
            Luận giải lại ({credits} credits còn lại)
          </Button>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // CHANGE A: Render history panel — collapsible
  // ══════════════════════════════════════════════════════════════
  const renderHistoryPanel = () => {
    const filtered = analysisHistory.filter((a) => a.analysis_result && a.analysis_result.length > 50);
    if (filtered.length === 0) return null;

    const tabLabel = activeTab === "week" ? "tuần" : activeTab === "month" ? "tháng" : "năm";

    return (
      <div className="rounded-2xl bg-surface-3 border border-border overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-4 transition-colors"
        >
          <span className="flex items-center gap-2 text-primary font-semibold text-sm">
            <History className="w-4 h-4" />
            Luận giải theo {tabLabel} đã thực hiện ({filtered.length})
          </span>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showHistory && (
          <div className="px-4 pb-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              filtered.map((item) => {
                const bd = item.birth_data;
                // FIX: Use viewingHistoryId for history clicks,
                // fall back to chart_hash + period match for normal navigation
                const isCurrentSelection = viewingHistoryId
                  ? item.id === viewingHistoryId
                  : item.chart_hash === selectedChart?.chart_hash && item.period === timeInfo.period && !!currentResult;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleLoadFromHistory(item)}
                    className={cn(
                      "w-full text-left rounded-xl p-3 border transition-all",
                      isCurrentSelection
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-surface-4 hover:border-primary/30 hover:bg-surface-3",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-foreground truncate mr-2">
                        {bd?.personName || "Không tên"}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          {formatPeriodLabel(item.time_frame, item.period)}
                        </span>
                        {isCurrentSelection && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">
                            Đang xem
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bd?.birthDate} · {bd?.gender} ·{" "}
                      {new Date(item.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        )}
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
        <div
          className={cn(
            "rounded-2xl p-6 text-center",
            "bg-gradient-to-br from-surface-3 to-surface-2",
            "border border-border",
          )}
        >
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg text-foreground mb-2">Chưa có lá số</h3>
          <p className="text-sm text-muted-foreground mb-4">Bạn cần lập lá số tử vi trước để xem vận hạn chi tiết</p>
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
        <div
          className={cn(
            "rounded-2xl p-4 flex items-center justify-between",
            "bg-gradient-to-br from-surface-3 to-surface-2",
            "border border-primary/20",
          )}
        >
          <div>
            <p className="text-xs text-muted-foreground">Lá số đang chọn</p>
            <p className="font-medium text-foreground text-sm">{bd?.personName || "Không tên"}</p>
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

        {showChartPicker && (
          <div className="rounded-2xl p-4 bg-surface-3 border border-border">
            <h3 className="text-sm font-medium mb-3 text-foreground">Chọn lá số</h3>
            {charts.map((chart) => (
              <button
                key={chart.id}
                onClick={() => {
                  setSelectedChart(chart);
                  setShowChartPicker(false);
                  setCurrentResult(null);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-xl mb-2 border transition-all",
                  selectedChart?.id === chart.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-surface-4 hover:border-muted-foreground",
                )}
              >
                <p className="font-medium text-sm text-foreground">{chart.birth_data?.personName || "Không tên"}</p>
                <p className="text-xs text-muted-foreground">
                  {chart.birth_data?.birthDate} · {chart.birth_data?.gender}
                </p>
              </button>
            ))}
            <button
              onClick={() => navigate("/lap-la-so")}
              className="w-full text-center text-sm text-primary mt-2 hover:underline"
            >
              + Tạo lá số mới
            </button>
          </div>
        )}
      </div>
    );
  };

  const packageTitle: Record<TimeFrame, string> = {
    week: "Gói Vận Hạn Tuần - 39.000đ",
    month: "Gói Vận Hạn Tháng - 39.000đ",
    year: "Gói Vận Hạn Năm - 39.000đ",
  };

  const packageDesc: Record<TimeFrame, string> = {
    week: "Thanh toán 1 lần, luận giải 3 lần vận hạn theo tuần",
    month: "Thanh toán 1 lần, luận giải 3 lần vận hạn theo tháng",
    year: "Thanh toán 1 lần, luận giải 3 lần vận hạn theo năm",
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
          <h2 className="font-display text-2xl text-foreground">Dự Đoán Vận Hạn</h2>
          <p className="text-sm text-muted-foreground">Phân tích chi tiết vận mệnh theo thời gian</p>
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
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-4",
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === "week" ? "Tuần" : tab.key === "month" ? "Tháng" : "Năm"}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/* CHANGE A: History panel — below tabs                    */}
        {/* ════════════════════════════════════════════════════════ */}
        {renderHistoryPanel()}

        {/* Time Navigation */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setTimeOffset((o) => Math.max(o - 1, 0))}
            disabled={timeOffset <= 0}
            className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center hover:border-primary/30 transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="text-center">
            <p className="font-display text-foreground font-medium">{timeInfo.label}</p>
            {timeOffset === 0 && <p className="text-xs text-primary">Hiện tại</p>}
          </div>
          <button
            onClick={() => setTimeOffset((o) => Math.min(o + 1, maxForward))}
            disabled={timeOffset >= maxForward}
            className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center hover:border-primary/30 transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Chart Picker */}
        {renderChartPicker()}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Exhausted banner — prominent, when package used up        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedChart && !hasCredits && everPurchased && (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-amber-300 text-sm">Đã hết credits</p>
                  <p className="text-xs text-amber-200/60">
                    Thanh toán để luận giải tiếp · Lịch sử luận giải vẫn xem được
                  </p>
                </div>
              </div>
              <Button variant="gold" size="sm" onClick={() => setShowPaymentModal(true)} className="shrink-0">
                <CreditCard className="w-4 h-4 mr-1.5" />
                Mua thêm
              </Button>
            </div>
          </div>
        )}

        {/* VietQR Payment Modal with Cancel support */}
        <VietQRPaymentModal
          open={showPaymentModal}
          onOpenChange={(open) => {
            setShowPaymentModal(open);
          }}
          feature={currentTab.featureKey}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadCredits();
          }}
        />

        {/* Content - only if chart selected */}
        {selectedChart && (
          <>
            {/* ══════════════════════════════════════════════════════════ */}
            {/* FREEMIUM: If we have a result, are streaming, exhausted,  */}
            {/* or can use free trial → show directly (preview handles    */}
            {/* blur inline). Only gate when no access at all.            */}
            {/* ══════════════════════════════════════════════════════════ */}
            {currentResult || isAnalyzing || isStreamingAI || activeStreamedText || isPackageExhausted || canAnalyze ? (
              /* Has result, streaming, exhausted, or can analyze → show directly */
              <div className="space-y-4">
                {vanHanPackage && (
                  <div className="text-xs text-primary/70 text-center">
                    Còn {vanHanPackage.uses_remaining}/{vanHanPackage.uses_total} lần phân tích
                  </div>
                )}
                {!vanHanPackage && canUseFreeTrial && !currentResult && !isAnalyzing && !isStreamingAI && (
                  <div className="text-xs text-primary/70 text-center">✨ 1 lần miễn phí</div>
                )}
                {renderAiResult()}
              </div>
            ) : (
              /* No result + no access → PaymentGate wraps the analyze button */
              <PaymentGate
                feature={currentTab.featureKey}
                title={packageTitle[activeTab]}
                price="39.000đ"
                description={packageDesc[activeTab]}
                onUnlocked={() => loadPackage(activeTab)}
              >
                <div className="space-y-4">
                  {vanHanPackage && (
                    <div className="text-xs text-primary/70 text-center">
                      Còn {vanHanPackage.uses_remaining}/{vanHanPackage.uses_total} lần phân tích
                    </div>
                  )}
                  {renderAiResult()}
                </div>
              </PaymentGate>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default VanHan;
