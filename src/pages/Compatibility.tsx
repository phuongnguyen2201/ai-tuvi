import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { ZodiacPicker, zodiacSigns } from "@/components/ZodiacPicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { calculateCompatibility, ZodiacChi, CompatibilityResult } from "@/lib/tuvi/compatibility";

// Map compatibility level to color
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

const Compatibility = () => {
  const [zodiac1, setZodiac1] = useState<string | null>(null);
  const [zodiac2, setZodiac2] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const handleCheck = () => {
    if (zodiac1 && zodiac2) {
      setResult(calculateCompatibility(zodiac1 as ZodiacChi, zodiac2 as ZodiacChi));
    }
  };

  const handleShare = () => {
    toast.success("Đã sao chép kết quả!");
  };

  const getZodiacEmoji = (name: string) => {
    return zodiacSigns.find(z => z.name === name)?.emoji || "";
  };

  return (
    <PageLayout title="Xem Tuổi Hợp">
      <div className="space-y-6">
        {/* Introduction */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Chọn 2 con giáp để xem độ hợp tuổi
          </p>
        </div>

        {/* Zodiac Picker 1 */}
        <ZodiacPicker
          label="Tuổi người thứ nhất"
          value={zodiac1}
          onChange={setZodiac1}
        />

        {/* Divider with heart */}
        <div className="flex items-center justify-center py-2">
          <div className="w-12 h-12 rounded-full bg-surface-3 border border-gold/30 flex items-center justify-center">
            <Heart className="w-6 h-6 text-gold" />
          </div>
        </div>

        {/* Zodiac Picker 2 */}
        <ZodiacPicker
          label="Tuổi người thứ hai"
          value={zodiac2}
          onChange={setZodiac2}
        />

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
          <div className={cn(
            "rounded-2xl p-6 animate-scale-in",
            "bg-gradient-to-br from-surface-3 to-surface-2",
            "border border-gold/20"
          )}>
            {/* Zodiac pair display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <span className="text-4xl">{getZodiacEmoji(zodiac1)}</span>
                <p className="text-sm text-gold mt-1">{zodiac1}</p>
              </div>
              <div className="text-2xl text-gold">💕</div>
              <div className="text-center">
                <span className="text-4xl">{getZodiacEmoji(zodiac2)}</span>
                <p className="text-sm text-gold mt-1">{zodiac2}</p>
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
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
              {result.explanation}
            </p>

            {/* Share Button */}
            <Button
              variant="goldOutline"
              className="w-full"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Chia Sẻ Kết Quả
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Compatibility;
