import Logo from "@/components/Logo";
import MenuCard from "@/components/MenuCard";
import DailyWisdom from "@/components/DailyWisdom";
import { ScrollText, Heart, Calendar, BookOpen, Image, Sparkles, Layers } from "lucide-react";

const Index = () => {
  const menuItems = [
    {
      title: "Lập Lá Số",
      description: "Xem lá số tử vi 12 cung theo ngày sinh",
      icon: ScrollText,
      to: "/lap-la-so",
    },
    {
      title: "Xem Tuổi Hợp",
      description: "Kiểm tra độ hợp tuổi trong tình yêu, công việc",
      icon: Heart,
      to: "/tuoi-hop",
    },
    {
      title: "Xem Ngày",
      description: "Xem ngày tốt xấu, hoàng đạo hắc đạo",
      icon: Calendar,
      to: "/xem-ngay",
    },
    {
      title: "Vận Hạn Năm",
      description: "Dự đoán vận mệnh chi tiết theo từng tháng",
      icon: Sparkles,
      to: "/van-han",
    },
    {
      title: "Bói Kiều",
      description: "Gieo quẻ theo truyện Kiều của Nguyễn Du",
      icon: BookOpen,
      to: "/boi-kieu",
    },
    {
      title: "Bói Quẻ Dịch",
      description: "Gieo quẻ Kinh Dịch 64 quẻ",
      icon: Layers,
      to: "/boi-que",
    },
    {
      title: "NFT Của Tôi",
      description: "Xem bộ sưu tập NFT lá số đã đúc",
      icon: Image,
      to: "/my-nfts",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-deep/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="container max-w-lg mx-auto px-4 py-8 flex flex-col flex-1">
          {/* Logo Section */}
          <div className="flex-shrink-0 pt-8 pb-12 flex justify-center">
            <Logo size="lg" />
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {menuItems.map((item, index) => (
              <MenuCard key={item.to} {...item} delay={index * 100} />
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Daily Wisdom */}
          <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
            <DailyWisdom />
          </div>

          {/* Footer */}
          <footer className="py-6 text-center">
            <p className="text-xs text-muted-foreground">© 2024 Tử Vi Việt Nam</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
