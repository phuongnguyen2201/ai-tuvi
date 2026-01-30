import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, RefreshCw, BookOpen, Share2 } from "lucide-react";
import { toast } from "sonner";

// Các câu Kiều nổi tiếng
const kieuVerses = [
  {
    verse: "Trăm năm trong cõi người ta\nChữ tài chữ mệnh khéo là ghét nhau",
    meaning: "Tài năng và số mệnh thường xung khắc, người có tài thường gặp nhiều trắc trở. Bạn cần kiên nhẫn vượt qua khó khăn.",
    fortune: "good",
  },
  {
    verse: "Thiện căn ở tại lòng ta\nChữ tâm kia mới bằng ba chữ tài",
    meaning: "Lòng tốt quan trọng hơn tài năng. Hãy giữ tâm thiện lành, mọi việc sẽ hanh thông.",
    fortune: "excellent",
  },
  {
    verse: "Chữ tâm kia mới bằng ba chữ tài\nCó tài mà cậy chi tài",
    meaning: "Đừng kiêu ngạo về tài năng của mình. Khiêm tốn sẽ giúp bạn tiến xa hơn.",
    fortune: "neutral",
  },
  {
    verse: "Đã mang lấy nghiệp vào thân\nCũng đừng trách lẫn trời gần trời xa",
    meaning: "Hãy chấp nhận và đối mặt với thử thách. Đừng đổ lỗi cho hoàn cảnh.",
    fortune: "challenging",
  },
  {
    verse: "Sen tàn cúc lại nở hoa\nSầu dài ngày ngắn đông đà sang xuân",
    meaning: "Sau khó khăn sẽ là thuận lợi. Hãy kiên nhẫn chờ đợi thời cơ.",
    fortune: "good",
  },
  {
    verse: "Hoa xuân phơi phới nhờ trời\nNgười đời ai cũng thương người có duyên",
    meaning: "Vận may đang đến với bạn. Hãy tận dụng cơ hội này.",
    fortune: "excellent",
  },
  {
    verse: "Bể dâu đâu biết nông sâu\nNghìn trùng biết có ngàn sau hay chăng",
    meaning: "Tương lai khó đoán, hãy cẩn thận trong quyết định.",
    fortune: "neutral",
  },
  {
    verse: "Người buồn cảnh có vui đâu bao giờ\nHoa cười ngọc thốt đâu ngờ",
    meaning: "Tâm trạng ảnh hưởng đến mọi thứ. Hãy giữ tinh thần lạc quan.",
    fortune: "challenging",
  },
];

const fortuneStyles = {
  excellent: {
    bg: "from-gold/20 to-gold/5",
    border: "border-gold/50",
    badge: "bg-gold text-background",
    badgeText: "Đại Cát",
  },
  good: {
    bg: "from-green-500/20 to-green-500/5",
    border: "border-green-500/50",
    badge: "bg-green-500 text-background",
    badgeText: "Cát",
  },
  neutral: {
    bg: "from-purple-deep/20 to-purple-deep/5",
    border: "border-purple-deep/50",
    badge: "bg-purple-deep text-foreground",
    badgeText: "Bình",
  },
  challenging: {
    bg: "from-destructive/20 to-destructive/5",
    border: "border-destructive/50",
    badge: "bg-destructive text-foreground",
    badgeText: "Hung",
  },
};

const BoiKieu = () => {
  const [result, setResult] = useState<typeof kieuVerses[0] | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleGieoQue = () => {
    setIsShaking(true);
    setResult(null);
    
    // Shake animation duration
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * kieuVerses.length);
      setResult(kieuVerses[randomIndex]);
      setIsShaking(false);
    }, 1500);
  };

  const handleShare = () => {
    toast.success("Đã sao chép quẻ Kiều!");
  };

  const style = result ? fortuneStyles[result.fortune as keyof typeof fortuneStyles] : null;

  return (
    <PageLayout title="Bói Kiều">
      <div className="space-y-6">
        {/* Introduction */}
        <div className={cn(
          "text-center p-6 rounded-2xl",
          "bg-gradient-to-br from-surface-3 to-surface-2",
          "border border-border"
        )}>
          <BookOpen className="w-12 h-12 text-gold mx-auto mb-4" />
          <h2 className="font-display text-xl text-foreground mb-2">
            Truyện Kiều - Nguyễn Du
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bói Kiều là hình thức bói toán truyền thống Việt Nam, sử dụng các câu thơ trong Truyện Kiều để dự đoán vận mệnh.
          </p>
        </div>

        {/* Shake Button */}
        <div className="flex justify-center py-8">
          <button
            onClick={handleGieoQue}
            disabled={isShaking}
            className={cn(
              "relative w-32 h-32 rounded-full",
              "bg-gradient-to-br from-gold to-gold/70",
              "flex items-center justify-center",
              "shadow-[0_0_40px_hsl(43,74%,53%,0.3)]",
              "hover:shadow-[0_0_60px_hsl(43,74%,53%,0.5)]",
              "transition-all duration-300",
              "hover:scale-105 active:scale-95",
              isShaking && "animate-[shake_0.5s_ease-in-out_infinite]"
            )}
          >
            <div className="text-center">
              {isShaking ? (
                <RefreshCw className="w-10 h-10 text-background animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-10 h-10 text-background mx-auto" />
                  <span className="text-sm font-semibold text-background mt-1 block">
                    Gieo Quẻ
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Result Card */}
        {result && style && (
          <div className={cn(
            "rounded-2xl p-6 animate-scale-in",
            "bg-gradient-to-br",
            style.bg,
            "border",
            style.border
          )}>
            {/* Fortune Badge */}
            <div className="flex justify-center mb-4">
              <span className={cn(
                "px-4 py-1 rounded-full text-sm font-medium",
                style.badge
              )}>
                {style.badgeText}
              </span>
            </div>

            {/* Verse */}
            <div className="text-center mb-6">
              <blockquote className="font-display text-lg text-foreground leading-relaxed whitespace-pre-line italic">
                "{result.verse}"
              </blockquote>
            </div>

            {/* Meaning */}
            <div className={cn(
              "p-4 rounded-xl",
              "bg-surface-2/50"
            )}>
              <p className="text-sm text-gold font-medium mb-2">
                Ý nghĩa:
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.meaning}
              </p>
            </div>

            {/* Share Button */}
            <Button
              variant="goldOutline"
              className="w-full mt-4"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Chia Sẻ Quẻ Kiều
            </Button>
          </div>
        )}

        {/* Hint */}
        {!result && !isShaking && (
          <p className="text-center text-sm text-muted-foreground">
            Tập trung vào câu hỏi trong tâm, rồi nhấn "Gieo Quẻ"
          </p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
      `}</style>
    </PageLayout>
  );
};

export default BoiKieu;
