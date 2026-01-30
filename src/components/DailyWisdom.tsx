import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const wisdoms = [
  { quote: "Thiên thời địa lợi nhân hòa", meaning: "Thuận theo trời đất, hòa với người" },
  { quote: "Nhân định thắng thiên", meaning: "Ý chí con người có thể thắng số phận" },
  { quote: "Phúc họa vô môn, duy nhân tự triệu", meaning: "Phúc họa tự mình gây ra" },
  { quote: "Tri mệnh bất ưu", meaning: "Hiểu mệnh trời, không lo âu" },
  { quote: "Đức năng thắng số", meaning: "Đức độ có thể thay đổi số mệnh" },
];

const DailyWisdom = () => {
  // Simple daily rotation based on date
  const today = new Date();
  const dayIndex = today.getDate() % wisdoms.length;
  const wisdom = wisdoms[dayIndex];

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6",
      "bg-gradient-to-br from-surface-3/80 to-surface-2/80",
      "border border-gold/20",
      "backdrop-blur-sm"
    )}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gold/5 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-deep/10 rounded-full blur-3xl" />
      
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-gold" />
        </div>
        
        <div className="flex-1">
          <p className="text-xs text-gold/80 uppercase tracking-wider mb-2 font-medium">
            Lời Khuyên Hôm Nay
          </p>
          <blockquote className="font-display text-xl text-foreground mb-2 italic">
            "{wisdom.quote}"
          </blockquote>
          <p className="text-sm text-muted-foreground">
            {wisdom.meaning}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyWisdom;
