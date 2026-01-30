import { useLocation } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Share2, Eye } from "lucide-react";
import { toast } from "sonner";

// 12 cung tử vi
const palaces = [
  { name: "Mệnh", desc: "Bản thân, tính cách" },
  { name: "Phụ Mẫu", desc: "Cha mẹ, nguồn gốc" },
  { name: "Phúc Đức", desc: "Phước đức, tâm linh" },
  { name: "Điền Trạch", desc: "Nhà cửa, bất động sản" },
  { name: "Quan Lộc", desc: "Sự nghiệp, công danh" },
  { name: "Nô Bộc", desc: "Cấp dưới, nhân viên" },
  { name: "Thiên Di", desc: "Di chuyển, xuất ngoại" },
  { name: "Tật Ách", desc: "Sức khỏe, bệnh tật" },
  { name: "Tài Bạch", desc: "Tiền bạc, tài chính" },
  { name: "Tử Tức", desc: "Con cái, hậu duệ" },
  { name: "Phu Thê", desc: "Hôn nhân, phối ngẫu" },
  { name: "Huynh Đệ", desc: "Anh chị em, bạn bè" },
];

// Demo data for stars
const generateStars = () => {
  const mainStars = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"];
  const shuffled = [...mainStars].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const TuViResult = () => {
  const location = useLocation();
  const { date, hour, gender } = location.state || {};

  // Demo data
  const basicInfo = {
    menh: "Thủy Nhị Cục",
    than: "Cung Quan Lộc",
    nguHanh: "Kim",
    amDuong: gender === "male" ? "Dương" : "Âm",
  };

  const handleShare = () => {
    toast.success("Đã sao chép link chia sẻ!");
  };

  return (
    <PageLayout title="Lá Số Tử Vi">
      <div className="space-y-6">
        {/* Basic Info Card */}
        <div className={cn(
          "rounded-2xl p-5",
          "bg-gradient-to-br from-surface-3 to-surface-2",
          "border border-gold/20"
        )}>
          <h2 className="font-display text-lg text-gold mb-4">Thông Tin Cơ Bản</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Mệnh</p>
              <p className="font-medium text-foreground">{basicInfo.menh}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Thân</p>
              <p className="font-medium text-foreground">{basicInfo.than}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ngũ Hành</p>
              <p className="font-medium text-foreground">{basicInfo.nguHanh}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Âm Dương</p>
              <p className="font-medium text-foreground">{basicInfo.amDuong}</p>
            </div>
          </div>
        </div>

        {/* 12 Cung Grid */}
        <div>
          <h2 className="font-display text-lg text-gold mb-4">12 Cung Tử Vi</h2>
          <div className="grid grid-cols-3 gap-2">
            {palaces.map((palace, index) => {
              const stars = generateStars();
              return (
                <button
                  key={palace.name}
                  className={cn(
                    "relative p-3 rounded-xl text-left",
                    "bg-surface-3 border border-border",
                    "hover:border-gold/30 hover:bg-surface-4",
                    "transition-all duration-300",
                    "group"
                  )}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gold">{palace.name}</p>
                    <div className="space-y-0.5">
                      {stars.slice(0, 2).map((star, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground truncate">
                          {star}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3 h-3 text-gold" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info note */}
        <p className="text-xs text-center text-muted-foreground">
          Nhấn vào từng cung để xem chi tiết
        </p>

        {/* Share Button */}
        <Button
          variant="goldOutline"
          size="lg"
          className="w-full"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5 mr-2" />
          Chia Sẻ Lá Số
        </Button>
      </div>
    </PageLayout>
  );
};

export default TuViResult;
