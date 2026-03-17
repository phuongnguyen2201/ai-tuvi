import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn } from "lucide-react";

interface AuthPromptCardProps {
  variant?: "gate" | "banner";
  title?: string;
  description?: string;
}

const AuthPromptCard = ({
  variant = "gate",
  title = "Đăng nhập để tiếp tục",
  description = "Đăng ký tài khoản miễn phí để nhận 1 lần luận giải miễn phí!",
}: AuthPromptCardProps) => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  if (variant === "banner") {
    return (
      <div className="rounded-2xl p-5 bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          <h3 className="font-display text-lg text-gold font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="gold"
            size="lg"
            className="flex-1"
            onClick={() => navigate(`/auth?tab=register&redirect=${encodeURIComponent(currentPath)}`)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Đăng ký miễn phí
          </Button>
          <Button
            variant="goldOutline"
            size="lg"
            className="flex-1"
            onClick={() => navigate(`/auth?tab=login&redirect=${encodeURIComponent(currentPath)}`)}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Đã có tài khoản? Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-surface-3 to-surface-2 border border-gold/30 text-center space-y-4">
      <div className="text-4xl">🔮</div>
      <h3 className="font-display text-xl text-foreground font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      <div className="flex flex-col gap-2 max-w-sm mx-auto">
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={() => navigate(`/auth?tab=register&redirect=${encodeURIComponent(currentPath)}`)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Đăng ký miễn phí
        </Button>
        <Button
          variant="goldOutline"
          size="lg"
          className="w-full"
          onClick={() => navigate(`/auth?tab=login&redirect=${encodeURIComponent(currentPath)}`)}
        >
          <LogIn className="w-4 h-4 mr-2" />
          Đã có tài khoản? Đăng nhập
        </Button>
      </div>
    </div>
  );
};

export default AuthPromptCard;
