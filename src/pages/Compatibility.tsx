import { useState, useMemo, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { ZodiacPicker, zodiacSigns } from "@/components/ZodiacPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Heart, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  calculateCompatibility,
  ZodiacChi,
  CompatibilityResult,
  Gender,
  getZodiacFromYear,
  getZodiacInfo,
  findBestMatches,
  findWorstMatches,
} from "@/lib/tuvi/compatibility";

type InputMode = "zodiac" | "year";

const getLevelColor = (level: string): string => {
  switch (level) {
    case "Đại Hợp": return "text-green-400";
    case "Hợp": return "text-gold";
    case "Bình Thường": return "text-muted-foreground";
    case "Kỵ": return "text-orange-400";
    case "Đại Kỵ": return "text-destructive";
    default: return "text-muted-foreground";
  }
};

const GenderPicker = ({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (g: Gender) => void;
}) => (
  <div className="flex gap-1">
    {(["Nam", "Nữ"] as Gender[]).map((g) => (
      <button
        key={g}
        type="button"
        onClick={() => onChange(g)}
        className={cn(
          "px-3 py-1 rounded-lg text-xs font-medium transition-all",
          value === g
            ? "bg-gold/20 text-gold border border-gold/40"
            : "bg-surface-3 text-muted-foreground border border-border hover:border-gold/30"
        )}
      >
        {g === "Nam" ? "👨 Nam" : "👩 Nữ"}
      </button>
    ))}
  </div>
);

const Compatibility = () => {
  const [mode, setMode] = useState<InputMode>("zodiac");
  const [selectedZodiac1, setSelectedZodiac1] = useState<string | null>(null);
  const [selectedZodiac2, setSelectedZodiac2] = useState<string | null>(null);
  const [year1, setYear1] = useState("");
  const [year2, setYear2] = useState("");
  const [gender1, setGender1] = useState<Gender>("Nam");
  const [gender2, setGender2] = useState<Gender>("Nữ");
  const [result, setResult] = useState<CompatibilityResult | null>(null);


  const zodiac1 = useMemo(() => {
    if (mode === "year" && year1) {
      const y = parseInt(year1);
      if (y >= 1900 && y <= 2100) return getZodiacFromYear(y);
    }
    return selectedZodiac1 as ZodiacChi | null;
  }, [mode, year1, selectedZodiac1]);

  const zodiac2 = useMemo(() => {
    if (mode === "year" && year2) {
      const y = parseInt(year2);
      if (y >= 1900 && y <= 2100) return getZodiacFromYear(y);
    }
    return selectedZodiac2 as ZodiacChi | null;
  }, [mode, year2, selectedZodiac2]);

  useEffect(() => {
    setResult(null);
  }, [zodiac1, zodiac2, gender1, gender2]);

  const handleCheck = () => {
    if (zodiac1 && zodiac2) {
      setResult(calculateCompatibility(zodiac1, zodiac2, gender1, gender2));
    }
  };

  const handleShare = () => {
    toast.success("Đã sao chép kết quả!");
  };

  const getZodiacEmoji = (name: string) => {
    return zodiacSigns.find((z) => z.name === name)?.emoji || getZodiacInfo(name as ZodiacChi)?.emoji || "";
  };

  const bestMatches1 = useMemo(() => zodiac1 ? findBestMatches(zodiac1) : [], [zodiac1]);
  const worstMatches1 = useMemo(() => zodiac1 ? findWorstMatches(zodiac1) : [], [zodiac1]);
  const bestMatches2 = useMemo(() => zodiac2 ? findBestMatches(zodiac2) : [], [zodiac2]);
  const worstMatches2 = useMemo(() => zodiac2 ? findWorstMatches(zodiac2) : [], [zodiac2]);

  return (
    <PageLayout title="Xem Tuổi Hợp">
      <div className="space-y-6">
        {/* Introduction */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Chọn 2 con giáp để xem độ hợp tuổi
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => setMode("zodiac")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              mode === "zodiac"
                ? "bg-gold/20 text-gold border border-gold/40"
                : "bg-surface-3 text-muted-foreground border border-border hover:border-gold/30"
            )}
          >
            🐉 Chọn con giáp
          </button>
          <button
            type="button"
            onClick={() => setMode("year")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              mode === "year"
                ? "bg-gold/20 text-gold border border-gold/40"
                : "bg-surface-3 text-muted-foreground border border-border hover:border-gold/30"
            )}
          >
            📅 Nhập năm sinh
          </button>
        </div>

        {/* Person 1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Người thứ nhất</label>
            <GenderPicker value={gender1} onChange={setGender1} />
          </div>
          {mode === "zodiac" ? (
            <ZodiacPicker value={selectedZodiac1} onChange={setSelectedZodiac1} />
          ) : (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Nhập năm sinh (VD: 1990)"
                value={year1}
                onChange={(e) => setYear1(e.target.value)}
                min={1900}
                max={2100}
                className="bg-surface-3 border-border"
              />
              {zodiac1 && mode === "year" && year1 && (
                <p className="text-sm text-gold flex items-center gap-1">
                  {year1} → {zodiac1} {getZodiacEmoji(zodiac1)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Divider with heart */}
        <div className="flex items-center justify-center py-2">
          <div className="w-12 h-12 rounded-full bg-surface-3 border border-gold/30 flex items-center justify-center">
            <Heart className="w-6 h-6 text-gold" />
          </div>
        </div>

        {/* Person 2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Người thứ hai</label>
            <GenderPicker value={gender2} onChange={setGender2} />
          </div>
          {mode === "zodiac" ? (
            <ZodiacPicker value={selectedZodiac2} onChange={setSelectedZodiac2} />
          ) : (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Nhập năm sinh (VD: 1995)"
                value={year2}
                onChange={(e) => setYear2(e.target.value)}
                min={1900}
                max={2100}
                className="bg-surface-3 border-border"
              />
              {zodiac2 && mode === "year" && year2 && (
                <p className="text-sm text-gold flex items-center gap-1">
                  {year2} → {zodiac2} {getZodiacEmoji(zodiac2)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Check Button */}
        <Button
          variant="gold"
          size="xl"
          className="w-full"
          disabled={!zodiac1 || !zodiac2}
          onClick={handleCheck}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Xem Kết Quả
        </Button>

        {/* Result Card */}
        {result && zodiac1 && zodiac2 && (
          <div
            className={cn(
              "rounded-2xl p-6 animate-scale-in",
              "bg-gradient-to-br from-surface-3 to-surface-2",
              "border border-gold/20"
            )}
          >
            {/* Zodiac pair display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <span className="text-4xl">{getZodiacEmoji(zodiac1)}</span>
                <p className="text-sm text-gold mt-1">{zodiac1}</p>
                <p className="text-xs text-muted-foreground">{gender1}</p>
              </div>
              <div className="text-2xl text-gold">💕</div>
              <div className="text-center">
                <span className="text-4xl">{getZodiacEmoji(zodiac2)}</span>
                <p className="text-sm text-gold mt-1">{zodiac2}</p>
                <p className="text-xs text-muted-foreground">{gender2}</p>
              </div>
            </div>

            {/* Score */}
            <div className="text-center mb-4">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-2">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    className="text-surface-4"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                  <circle
                    className="text-gold"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                    strokeDasharray={`${result.score * 2.51} 251`}
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-gold">
                  {result.score}%
                </span>
              </div>
              <p className={cn("text-xl font-display font-semibold", getLevelColor(result.level))}>
                {result.level}
              </p>
            </div>

            {/* Explanation */}
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
              {result.explanation}
            </p>

            {/* Chi tiết phân tích */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase">
                Chi tiết phân tích
              </p>

              {result.details.isLucHop && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <span>✅</span>
                  <span>Lục Hợp - Cặp đôi thiên định</span>
                </div>
              )}
              {result.details.isTamHop && (
                <div className="flex items-center gap-2 text-sm text-gold">
                  <span>✨</span>
                  <span>Tam Hợp - Tương trợ lẫn nhau</span>
                </div>
              )}
              {result.details.isTuongXung && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <span>⚔️</span>
                  <span>Lục Xung - Dễ xung đột mâu thuẫn</span>
                </div>
              )}
              {result.details.isTuongHai && (
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <span>⚠️</span>
                  <span>Lục Hại - Gây hại cho nhau</span>
                </div>
              )}
              {result.details.isTuongHinh && (
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <span>🔺</span>
                  <span>Tam Hình - Dễ gây bất hòa</span>
                </div>
              )}
              {result.details.isTuongPha && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <span>💥</span>
                  <span>Lục Phá - Gây cản trở nhau</span>
                </div>
              )}

              {!result.details.isLucHop &&
                !result.details.isTamHop &&
                !result.details.isTuongXung &&
                !result.details.isTuongHai &&
                !result.details.isTuongHinh &&
                !result.details.isTuongPha && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>➖</span>
                    <span>Không có quan hệ đặc biệt - phụ thuộc vào nỗ lực</span>
                  </div>
                )}

              {/* Lời khuyên */}
              <div className="mt-3 p-3 rounded-lg bg-surface-3/50 border border-gold/10">
                <p className="text-xs text-gold font-medium mb-1">💡 Lời khuyên</p>
                <p className="text-xs text-muted-foreground">{result.advice}</p>
              </div>
            </div>

            {/* Share Button */}
            <Button variant="goldOutline" className="w-full mt-4" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Chia Sẻ Kết Quả
            </Button>
          </div>
        )}

        {/* Best/Worst Matches */}
        {(zodiac1 || zodiac2) && (
          <div className="space-y-4">
            {[
              { zodiac: zodiac1, best: bestMatches1, worst: worstMatches1 },
              { zodiac: zodiac2, best: bestMatches2, worst: worstMatches2 },
            ]
              .filter((item) => item.zodiac)
              .map((item) => (
                <div
                  key={item.zodiac}
                  className="rounded-2xl p-4 bg-surface-3/50 border border-border"
                >
                  <p className="text-sm font-medium text-foreground mb-3">
                    {getZodiacEmoji(item.zodiac!)} {item.zodiac}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-green-400 font-medium mb-2">✅ Hợp nhất</p>
                      {item.best.map((m) => (
                        <div key={m.chi} className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <span>{getZodiacEmoji(m.chi)}</span>
                          <span>{m.chi}</span>
                          <span className={cn("ml-auto", getLevelColor(m.level))}>{m.score}%</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-destructive font-medium mb-2">⚠️ Kỵ nhất</p>
                      {item.worst.map((m) => (
                        <div key={m.chi} className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <span>{getZodiacEmoji(m.chi)}</span>
                          <span>{m.chi}</span>
                          <span className={cn("ml-auto", getLevelColor(m.level))}>{m.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Compatibility;
