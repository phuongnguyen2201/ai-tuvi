// src/pages/TuViIztroPage.tsx - Page lập lá số dùng iztro library (Streaming AI)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { createTuViChart, TuViChartData, BirthInput } from "@/services/TuViService";
import TuViChartIztro from "@/components/TuViChartIztro";
import ChartInterpretationDisplay from "@/components/ChartInterpretationDisplay";
import TuViAnalysis from "@/components/TuViAnalysis";
import { AnalysisDisclaimer } from "@/components/AnalysisDisclaimer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Sparkles, Lock, History, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PageLayout from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import VietQRPaymentModal from "@/components/VietQRPaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useStreamingAnalysis } from "@/hooks/useStreamingAnalysis";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import AuthPromptCard from "@/components/AuthPromptCard";

// ── Helpers ──

function generateChartHash(birthDate: Date, birthHour: string, gender: string, calendarType: string): string {
  const dateStr = format(birthDate, "yyyy-MM-dd");
  return `${dateStr}_${birthHour}_${gender}_${calendarType}`;
}

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

function renderAnalysisMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return (
        <h2 key={i} className="text-lg font-bold text-primary mt-5 mb-2 border-b border-primary/20 pb-1">
          {line.replace("## ", "")}
        </h2>
      );
    if (line.startsWith("### "))
      return (
        <h3 key={i} className="text-md font-semibold text-foreground mt-3 mb-1">
          {line.replace("### ", "")}
        </h3>
      );
    if (line.startsWith("**") && line.endsWith("**"))
      return (
        <p key={i} className="font-bold text-foreground mt-2">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="text-muted-foreground ml-4 list-disc">
          {formatInline(line.slice(2))}
        </li>
      );
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-muted-foreground leading-relaxed">
        {formatInline(line)}
      </p>
    );
  });
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

const LUNAR_HOURS = [
  { value: "0", label: "Tý (23:00 - 00:59)" },
  { value: "1", label: "Sửu (01:00 - 02:59)" },
  { value: "2", label: "Dần (03:00 - 04:59)" },
  { value: "3", label: "Mão (05:00 - 06:59)" },
  { value: "4", label: "Thìn (07:00 - 08:59)" },
  { value: "5", label: "Tỵ (09:00 - 10:59)" },
  { value: "6", label: "Ngọ (11:00 - 12:59)" },
  { value: "7", label: "Mùi (13:00 - 14:59)" },
  { value: "8", label: "Thân (15:00 - 16:59)" },
  { value: "9", label: "Dậu (17:00 - 18:59)" },
  { value: "10", label: "Tuất (19:00 - 20:59)" },
  { value: "11", label: "Hợi (21:00 - 22:59)" },
];

export default function TuViIztroPage() {
  const { user } = useAuth();
  const [chart, setChart] = useState<TuViChartData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [personName, setPersonName] = useState("");
  const [birthDate, setBirthDate] = useState<Date>(new Date(2000, 0, 1));
  const [birthHour, setBirthHour] = useState("1");
  const [gender, setGender] = useState<"Nam" | "Nữ">("Nam");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");

  // Form dirty tracking
  const [lastSubmitted, setLastSubmitted] = useState<{
    personName: string;
    birthDate: string;
    birthHour: string;
    gender: string;
    calendarType: string;
  } | null>(null);

  const isFormDirty =
    !lastSubmitted ||
    personName !== lastSubmitted.personName ||
    format(birthDate, "yyyy-MM-dd") !== lastSubmitted.birthDate ||
    birthHour !== lastSubmitted.birthHour ||
    gender !== lastSubmitted.gender ||
    calendarType !== lastSubmitted.calendarType;

  // Chart analysis state
  const [cachedAnalysis, setCachedAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [checkedPendingPayment, setCheckedPendingPayment] = useState(false);

  // History state
  const [chartHistory, setChartHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  // Free trial tracking
  const [freeTrialCount, setFreeTrialCount] = useState<number | null>(null);
  const [everPurchased, setEverPurchased] = useState(false);

  // URL params
  const [searchParams, setSearchParams] = useSearchParams();

  // Package-based access
  const { hasAccess, credits, isLoading: accessLoading, refresh: refreshAccess } = useFeatureAccess("luan_giai");

  // Streaming AI analysis
  const {
    isStreaming: isStreamingAI,
    streamedText,
    error: streamError,
    startStreaming,
    abort: abortStreaming,
  } = useStreamingAnalysis();

  const chartHash = chart ? generateChartHash(birthDate, birthHour, gender, calendarType) : null;
  const isAnalyzingRef = useRef(false);

  // Derived state
  const isFreePreview = !!(cachedAnalysis || streamedText) && !hasAccess && !everPurchased;
  const canUseFreeTrial = freeTrialCount === 0 && !hasAccess;

  useEffect(() => {
    if (user) {
      loadFreeTrialCount();
      loadChartHistory();
    }
  }, [user]);

  // Auto-open pending payment modal
  useEffect(() => {
    if (checkedPendingPayment || showPayment || !chart || hasAccess || accessLoading) return;

    const checkPending = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        setCheckedPendingPayment(true);
        return;
      }

      const { data: pending } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("feature_unlocked", "luan_giai")
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

      if (pending) {
        console.log("[TuViIztroPage] Found pending luan_giai payment → auto-opening modal");
        setShowPayment(true);
      }
      setCheckedPendingPayment(true);
    };
    checkPending();
  }, [chart, checkedPendingPayment, showPayment, hasAccess, accessLoading]);

  const loadFreeTrialCount = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        setFreeTrialCount(0);
        return;
      }

      const { count } = await (supabase.from("chart_analyses") as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .not("analysis_result", "is", null);

      setFreeTrialCount(count ?? 0);

      const { data: creditData } = await (supabase as any)
        .from("user_credits")
        .select("credits_total")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      setEverPurchased((creditData?.credits_total ?? 0) > 0);
    } catch {
      setFreeTrialCount(0);
    }
  };

  const loadChartHistory = async () => {
    setHistoryLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data } = await (supabase.from("chart_analyses") as any)
        .select("id, chart_hash, birth_data, analysis_result, created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setChartHistory(data || []);
    } catch (err) {
      console.error("[History] Load error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadFromHistory = (item: any) => {
    const bd = item.birth_data;
    if (!bd) return;

    if (bd.personName) setPersonName(bd.personName);
    if (bd.birthDate) {
      const parsed = new Date(bd.birthDate);
      if (!isNaN(parsed.getTime())) setBirthDate(parsed);
    }
    if (bd.birthHour) setBirthHour(bd.birthHour);
    if (bd.gender === "Nam" || bd.gender === "Nữ") setGender(bd.gender);
    if (bd.calendarType) setCalendarType(bd.calendarType as "solar" | "lunar");

    try {
      const parsed = new Date(bd.birthDate);
      const input: BirthInput = {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        day: parsed.getDate(),
        hour: parseInt(bd.birthHour || "1"),
        gender: bd.gender || "Nam",
        isLunarDate: bd.calendarType === "lunar",
      };
      const result = createTuViChart(input);
      setChart(result);
    } catch (e) {
      console.error("[History] Failed to recreate chart:", e);
      return;
    }

    const hasValidAnalysis = item.analysis_result && item.analysis_result.length > 100;
    setCachedAnalysis(hasValidAnalysis ? item.analysis_result : null);
    setAnalysisError(false);

    setLastSubmitted({
      personName: bd.personName || "",
      birthDate: bd.birthDate || "",
      birthHour: bd.birthHour || "1",
      gender: bd.gender || "Nam",
      calendarType: bd.calendarType || "solar",
    });

    setViewingHistoryId(item.id);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auto-fill from URL params
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam) return;

    const hourParam = searchParams.get("hour");
    const genderParam = searchParams.get("gender");
    const calendarParam = searchParams.get("calendar");
    const nameParam = searchParams.get("name");

    const parsedDate = new Date(dateParam);
    if (!isNaN(parsedDate.getTime())) setBirthDate(parsedDate);
    if (hourParam) setBirthHour(hourParam);
    if (genderParam === "Nam" || genderParam === "Nữ") setGender(genderParam);
    if (calendarParam === "lunar") setCalendarType("lunar");
    else setCalendarType("solar");
    if (nameParam) setPersonName(nameParam);

    const input: BirthInput = {
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth() + 1,
      day: parsedDate.getDate(),
      hour: parseInt(hourParam || "1"),
      gender: (genderParam as "Nam" | "Nữ") || "Nam",
      isLunarDate: calendarParam === "lunar",
    };

    try {
      setChart(createTuViChart(input));
    } catch (err) {
      console.error("Auto-calculate error:", err);
    }
    setSearchParams({});
  }, []);

  // Load or call AI interpretation (STREAMING)
  const loadAnalysis = useCallback(
    async (isFreeTrial = false, skipCache = false) => {
      if (!chartHash || !chart) return;
      if (isAnalyzingRef.current) return;

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Check cache (skip when re-analyzing)
      let existing: any = null;
      if (!skipCache) {
        const { data } = await (supabase.from("chart_analyses") as any)
          .select("*")
          .eq("chart_hash", chartHash)
          .eq("user_id", currentUser.id)
          .maybeSingle();
        existing = data;

        if (existing?.analysis_result) {
          const isValidResult =
            !existing.analysis_result.includes("Tôi xin lỗi") &&
            !existing.analysis_result.includes("không thể thấy được lá số") &&
            existing.analysis_result.length > 100;

          if (isValidResult) {
            setCachedAnalysis(existing.analysis_result);
            setAnalysisError(false);
            return;
          } else {
            await (supabase.from("chart_analyses") as any).update({ analysis_result: null }).eq("id", existing.id);
          }
        }
      }

      // No valid cache — stream from Claude
      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      setAnalysisError(false);
      setCachedAnalysis(null);

      try {
        const fullText = await startStreaming(
          {
            analysisType: "luan_giai",
            chartData: chart,
            personName,
          },
          {
            onError: (err) => {
              console.error("[loadAnalysis] Stream error:", err);
              toast.error(err || "AI đang bận. Vui lòng thử lại sau 1-2 phút.");
              setAnalysisError(true);
            },
          },
        );

        if (!fullText || fullText.length < 100) {
          throw new Error("No analysis returned");
        }

        // Save result to DB
        if (existing) {
          await (supabase.from("chart_analyses") as any).update({ analysis_result: fullText }).eq("id", existing.id);
        } else {
          await (supabase.from("chart_analyses") as any).insert({
            user_id: currentUser.id,
            chart_hash: chartHash,
            birth_data: {
              birthDate: format(birthDate, "yyyy-MM-dd"),
              birthHour,
              gender,
              calendarType,
              personName,
            },
            chart_data: chart,
            analysis_result: fullText,
            analysis_type: "full",
          });
        }

        // Only decrement credits if NOT free trial
        if (!isFreeTrial) {
          await (supabase as any).rpc("use_credit", {
            p_user_id: currentUser.id,
            p_feature: "luan_giai",
          });
          await refreshAccess();
        }

        setCachedAnalysis(fullText);
        setFreeTrialCount((prev) => (prev ?? 0) + 1);
        loadChartHistory();
      } catch (err: any) {
        if (!analysisError) {
          console.error("[loadAnalysis] Error:", err);
          toast.error(err?.message || "AI đang bận. Vui lòng thử lại sau 1-2 phút.");
          setAnalysisError(true);
        }
      } finally {
        isAnalyzingRef.current = false;
        setIsAnalyzing(false);
      }
    },
    [
      chartHash,
      chart,
      personName,
      birthDate,
      birthHour,
      gender,
      calendarType,
      refreshAccess,
      startStreaming,
      analysisError,
    ],
  );

  const handleInterpret = useCallback(async () => {
    if (hasAccess && credits > 0) {
      await loadAnalysis(false);
      return;
    }
    if (canUseFreeTrial) {
      await loadAnalysis(true);
      return;
    }
    setShowPayment(true);
  }, [hasAccess, credits, canUseFreeTrial, loadAnalysis]);

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    refreshAccess();
    loadFreeTrialCount();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setCachedAnalysis(null);
    setAnalysisError(false);

    try {
      const input: BirthInput = {
        year: birthDate.getFullYear(),
        month: birthDate.getMonth() + 1,
        day: birthDate.getDate(),
        hour: parseInt(birthHour),
        gender,
        isLunarDate: calendarType === "lunar",
      };

      const result = createTuViChart(input);
      setChart(result);

      setLastSubmitted({
        personName,
        birthDate: format(birthDate, "yyyy-MM-dd"),
        birthHour,
        gender,
        calendarType,
      });

      if (user) {
        const hash = generateChartHash(birthDate, birthHour, gender, calendarType);
        const { data: existing } = await (supabase.from("chart_analyses") as any)
          .select("analysis_result")
          .eq("chart_hash", hash)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing?.analysis_result && existing.analysis_result.length > 100) {
          setCachedAnalysis(existing.analysis_result);
        }
      }
    } catch (err: any) {
      console.error("[TuViIztroPage] Error creating chart:", err);
      setError(err?.message || "Có lỗi xảy ra khi lập lá số. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render collapsible history panel ──
  const renderHistory = () => {
    if (!user || chartHistory.length === 0) return null;

    return (
      <div className="rounded-2xl bg-slate-900/80 border border-amber-600/30 overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-amber-300 font-semibold">
            <History className="w-4 h-4" />
            Lá số & luận giải đã lập ({chartHistory.length})
          </span>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showHistory && (
          <div className="px-4 pb-4 space-y-2 max-h-[50vh] overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              </div>
            ) : (
              chartHistory.map((item) => {
                const bd = item.birth_data;
                const hasAnalysis = item.analysis_result && item.analysis_result.length > 100;
                const hourLabel =
                  LUNAR_HOURS.find((h) => h.value === bd?.birthHour)?.label?.split(" ")[0] || bd?.birthHour;
                const isViewing = viewingHistoryId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleLoadFromHistory(item)}
                    className={cn(
                      "w-full text-left rounded-xl p-3 border transition-all",
                      isViewing
                        ? "border-secondary/50 bg-secondary/10"
                        : "bg-slate-800/50 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-white truncate mr-2">{bd?.personName || "Không tên"}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasAnalysis ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                            Đã luận giải
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-medium">
                            Chưa luận giải
                          </span>
                        )}
                        {isViewing && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">
                            Đang xem
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {bd?.birthDate} · Giờ {hourLabel} · {bd?.gender} ·{" "}
                      {bd?.calendarType === "lunar" ? "Âm lịch" : "Dương lịch"}
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

  // ── Render analysis section with all states ──
  const renderAnalysisSection = () => {
    const displayText = cachedAnalysis || streamedText;

    // ── STATE 1: STREAMING ──
    if ((isAnalyzing || isStreamingAI) && !cachedAnalysis) {
      return (
        <div id="analysis-result" className="space-y-6">
          <ChartInterpretationDisplay chart={chart!} />
          <Card className="p-6 bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Đang luận giải...
              <span className="text-sm font-normal text-muted-foreground ml-2">(streaming real-time)</span>
            </h2>
            {streamedText ? (
              <div className="space-y-1">
                {renderAnalysisMarkdown(streamedText)}
                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-primary/10">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Đang viết tiếp...</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                <p className="text-foreground font-semibold">Đang kết nối AI...</p>
                <p className="text-muted-foreground text-sm">Kết quả sẽ hiện ra từng phần trong giây lát.</p>
              </div>
            )}
          </Card>
        </div>
      );
    }

    // ── STATE 2: ERROR ──
    if (analysisError && !displayText) {
      return (
        <Card className="p-6 bg-surface-3 border-primary/30 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-primary font-semibold">Hệ thống AI đang bận</p>
          <p className="text-muted-foreground text-sm">Vui lòng thử lại sau ít phút.</p>
          <Button
            variant="gold"
            onClick={() => {
              setAnalysisError(false);
              loadAnalysis();
            }}
          >
                   🔄 Thử lại ngay
          </Button>
        </Card>
      );
    }

    // ── STATE 3: FREE PREVIEW — has result but no paid access ──
    if (displayText && isFreePreview) {
      const { preview } = truncateToWords(displayText, FREE_PREVIEW_WORD_LIMIT);

      return (
        <div id="analysis-result" className="space-y-6">
          <ChartInterpretationDisplay chart={chart!} />
          <Card className="p-6 bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20 overflow-hidden">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Luận giải chi tiết bởi AI
              <span className="text-xs font-normal text-muted-foreground ml-2">— Bản xem trước</span>
            </h2>

            <div className="space-y-1">{renderAnalysisMarkdown(preview)}</div>

            <div className="relative mt-0">
              <div className="h-32 bg-gradient-to-b from-transparent via-card/80 to-card relative z-10" />
              <div
                className="blur-sm select-none pointer-events-none -mt-4 max-h-40 overflow-hidden opacity-60"
                aria-hidden="true"
              >
                {renderAnalysisMarkdown(displayText.slice(preview.length, preview.length + 600))}
              </div>

              <div className="relative z-20 -mt-32 pt-8 pb-2 bg-gradient-to-b from-card/90 to-card">
                <div className="text-center space-y-4 max-w-sm mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">Nội dung bị giới hạn</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">Mở khóa luận giải đầy đủ</h3>

                   <p className="text-sm text-muted-foreground">
                    Bạn đang xem bản rút gọn. Mua credits để xem toàn bộ luận giải chi tiết
                    {personName ? ` cho ${personName}` : ""}.
                  </p>

                   <p className="text-2xl font-bold text-primary">39.000đ</p>
                   <p className="text-xs text-muted-foreground -mt-2">3 credits — dùng cho bất kỳ tính năng nào</p>

                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      if (!user) {
                        window.location.href = "/auth?redirect=" + encodeURIComponent(window.location.pathname);
                        return;
                      }
                      setShowPayment(true);
                    }}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Mua Credits
                  </Button>
                  <p className="text-xs text-muted-foreground">Thanh toán nhanh qua ngân hàng</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // ── STATE 4: FULL RESULT — paid user (active or exhausted) ──
    if (displayText && !isFreePreview) {
      return (
        <div id="analysis-result" className="space-y-6">
          <ChartInterpretationDisplay chart={chart!} />
          <Card className="p-6 bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Luận giải chi tiết bởi AI
            </h2>
            <div className="space-y-1">{renderAnalysisMarkdown(displayText)}</div>
            <AnalysisDisclaimer />
            <div className="mt-8 pt-4 border-t border-primary/20 space-y-3">
              <p className="text-xs text-muted-foreground">Luận giải bởi AI · Dựa trên lá số tử vi</p>
              {hasAccess && credits > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={async () => {
                    if (!user || !chartHash) return;
                    abortStreaming();
                    await (supabase.from("chart_analyses") as any)
                      .delete()
                      .eq("chart_hash", chartHash)
                      .eq("user_id", user.id);
                    setCachedAnalysis(null);
                    setAnalysisError(false);
                    loadAnalysis(false, true);
                  }}
                >
                   🔄 Luận giải lại ({credits} credits còn lại)
                </Button>
              ) : everPurchased && !hasAccess ? (
                <Button variant="gold" size="sm" className="w-full text-xs" onClick={() => setShowPayment(true)}>
                  Hết credits · Mua thêm
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      );
    }

    // ── STATE 5: LOCKED — no result yet ──
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
          <ChartInterpretationDisplay chart={chart!} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <Card className="max-w-sm w-full mx-4 p-6 text-center border-border bg-card shadow-xl">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">Luận giải chi tiết lá số</h3>

            {canUseFreeTrial ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  {personName ? `Luận giải chi tiết cho ${personName}.` : "AI phân tích chuyên sâu 12 cung."}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                  <Sparkles className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Miễn phí lần đầu</span>
                </div>
                <Button variant="gold" size="lg" className="w-full" onClick={handleInterpret}>
                  <Sparkles className="w-4 h-4 mr-2" /> Luận giải miễn phí
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Xem bản rút gọn miễn phí · Mua credits để xem đầy đủ</p>
              </>
            ) : hasAccess && remaining > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  {personName ? `Luận giải chi tiết cho ${personName}.` : "AI phân tích chuyên sâu 12 cung."}
                </p>
                <p className="text-xs text-primary mb-4">
                  Bạn còn {remaining}/{total} lần luận giải
                </p>
                <Button variant="gold" size="lg" className="w-full" onClick={handleInterpret}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Luận giải ngay (dùng 1 lượt)
                </Button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-primary mb-2">39.000đ</p>
                <p className="text-sm text-muted-foreground mb-5">
                  Gói 3 lần luận giải AI chuyên sâu 12 cung. Thanh toán 1 lần, dùng cho nhiều lá số.
                </p>
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full mb-3"
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/auth?redirect=" + encodeURIComponent(window.location.pathname);
                      return;
                    }
                    setShowPayment(true);
                  }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Mua gói luận giải
                </Button>
                <p className="text-xs text-muted-foreground">Thanh toán nhanh qua ngân hàng</p>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <h1 className="text-3xl font-bold text-center text-amber-400">
          {chart && personName ? `Lá số của ${personName}` : "Lập Lá Số Tử Vi"}
        </h1>
        {!chart && (
          <p className="text-center text-gray-400 text-sm">Nhập thông tin ngày sinh để xem lá số tử vi của bạn</p>
        )}

        {/* Status badge / exhausted banner */}
        {user && !accessLoading && (
          <>
            {hasAccess ? (
              <div className="flex justify-center">
                <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 px-4 py-1">
                  Bạn còn {remaining}/{total} lần luận giải
                </Badge>
              </div>
            ) : everPurchased && !hasAccess ? (
              <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-amber-300 text-sm">Đã hết lượt luận giải</p>
                      <p className="text-xs text-amber-200/60">
                        Mua thêm gói để tiếp tục · Lịch sử luận giải vẫn xem được
                      </p>
                    </div>
                  </div>
                  <Button variant="gold" size="sm" onClick={() => setShowPayment(true)} className="shrink-0">
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    Mua thêm
                  </Button>
                </div>
              </div>
            ) : canUseFreeTrial ? (
              <div className="flex justify-center">
                <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 px-4 py-1">
                  Bạn có 1 lần luận giải miễn phí
                </Badge>
              </div>
            ) : null}
          </>
        )}

        {/* History panel */}
        {renderHistory()}

        {/* Form nhập liệu */}
        <Card className="bg-slate-900/80 border-amber-600/30">
          <CardHeader>
            <CardTitle className="text-amber-300">Thông tin ngày sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personName" className="text-gray-300">
                  Họ và tên <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="personName"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A, Mẹ, Chồng..."
                  required
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Loại lịch</Label>
                <RadioGroup
                  value={calendarType}
                  onValueChange={(v) => setCalendarType(v as "solar" | "lunar")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solar" id="solar" />
                    <Label htmlFor="solar" className="text-gray-300 cursor-pointer">
                      Dương lịch
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lunar" id="lunar" />
                    <Label htmlFor="lunar" className="text-gray-300 cursor-pointer">
                      Âm lịch
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-300">
                    Ngày sinh
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-800 border-slate-600 text-white hover:bg-slate-700",
                          !birthDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày sinh"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={(date) => date && setBirthDate(date)}
                        captionLayout="dropdown-buttons"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthHour" className="text-gray-300">
                    Giờ sinh
                  </Label>
                  <Select value={birthHour} onValueChange={setBirthHour}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {LUNAR_HOURS.map((h) => (
                        <SelectItem key={h.value} value={h.value} className="text-white hover:bg-slate-700">
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Giới tính</Label>
                  <RadioGroup
                    value={gender}
                    onValueChange={(v) => setGender(v as "Nam" | "Nữ")}
                    className="flex gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Nam" id="nam" />
                      <Label htmlFor="nam" className="text-gray-300 cursor-pointer">
                        Nam
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Nữ" id="nu" />
                      <Label htmlFor="nu" className="text-gray-300 cursor-pointer">
                        Nữ
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

              <Button
                type="submit"
                className={cn(
                  "w-full font-bold transition-all",
                  isFormDirty
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed",
                )}
                disabled={isLoading || !isFormDirty}
              >
                {isLoading
                  ? "Đang tính toán..."
                  : !isFormDirty
                    ? "✓ Đã lập lá số — Sửa thông tin để lập mới"
                    : "Lập Lá Số"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Chart display + Analysis */}
        {chart && (
          <div className="space-y-6">
            <TuViChartIztro chart={chart} />

            {!user && (
              <AuthPromptCard
                variant="banner"
                title="Nhận 1 lần luận giải AI miễn phí!"
                description="Đăng ký tài khoản để AI phân tích chi tiết lá số của bạn"
              />
            )}

            {user && renderAnalysisSection()}

            {/* Debug info - only for admin */}
            {user?.email === "phuongnguyen2201@gmail.com" && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">📋 Thông tin chi tiết (để so sánh với tuvi.vn)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-400 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-amber-300 mb-1">Thông tin chung:</p>
                    <p>• Năm sinh: {chart.lunarYear}</p>
                    <p>
                      • Bản Mệnh: <span className="text-red-300 font-medium">{chart.napAm?.napAm || "—"}</span>
                    </p>
                    <p>
                      • Ngũ Hành Mệnh: <span className="text-red-300">{chart.napAm?.element || "—"}</span>
                    </p>
                    <p>
                      • Ngũ Hành Cục: <span className="text-cyan-300">{chart.cuc.name}</span>
                    </p>
                    <p>
                      • Quan hệ Mệnh-Cục:{" "}
                      <span
                        className={chart.cucMenhRelation?.relation === "tuong_khac" ? "text-red-400" : "text-green-400"}
                      >
                        {chart.cucMenhRelation?.description || "—"}
                      </span>
                    </p>
                    <p>
                      • Mệnh Chủ: <span className="text-purple-300">{chart.soulStar || "—"}</span>
                    </p>
                    <p>
                      • Thân Chủ: <span className="text-green-300">{chart.bodyStar || "—"}</span>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-300 mb-1">Tứ Hóa:</p>
                    <p>
                      • Hóa Lộc: <span className="text-green-400">{chart.tuHoa.hoaLoc.star || "—"}</span> (
                      {chart.tuHoa.hoaLoc.palace || "—"})
                    </p>
                    <p>
                      • Hóa Quyền: <span className="text-orange-400">{chart.tuHoa.hoaQuyen.star || "—"}</span> (
                      {chart.tuHoa.hoaQuyen.palace || "—"})
                    </p>
                    <p>
                      • Hóa Khoa: <span className="text-blue-400">{chart.tuHoa.hoaKhoa.star || "—"}</span> (
                      {chart.tuHoa.hoaKhoa.palace || "—"})
                    </p>
                    <p>
                      • Hóa Kỵ: <span className="text-red-400">{chart.tuHoa.hoaKy.star || "—"}</span> (
                      {chart.tuHoa.hoaKy.palace || "—"})
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-2">
                  <p className="font-semibold text-amber-300 mb-2">Vị trí các cung và chính tinh:</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {chart.palaces.map((palace) => (
                      <div
                        key={palace.earthlyBranch}
                        className={`p-2 rounded text-[10px] ${
                          palace.isSoulPalace
                            ? "bg-yellow-900/30 border border-yellow-500/50"
                            : palace.isBodyPalace
                              ? "bg-cyan-900/30 border border-cyan-500/50"
                              : "bg-slate-800/50"
                        }`}
                      >
                        <div className="font-bold text-amber-200">
                          {palace.name} ({palace.earthlyBranch})
                          {palace.isSoulPalace && <span className="ml-1 text-yellow-400">★Mệnh</span>}
                          {palace.isBodyPalace && <span className="ml-1 text-cyan-400">★Thân</span>}
                        </div>
                        <div className="text-purple-300">
                          {palace.majorStars.length > 0
                            ? palace.majorStars.map((s) => s.name).join(", ")
                            : "(vô chính diệu)"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        )}

        {/* Global payment modal */}
        <VietQRPaymentModal
          open={showPayment}
          onOpenChange={(open) => {
            setShowPayment(open);
          }}
          feature="luan_giai"
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </PageLayout>
  );
}
