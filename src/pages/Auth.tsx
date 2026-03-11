import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff, Sparkles, UserRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get('redirect') || '/profile';

  // Auto-redirect khi user đã đăng nhập (sau onAuthStateChange update)
  useEffect(() => {
    if (user && !authLoading) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, redirectTo, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");

    if (!isLogin && !fullName.trim()) {
      setNameError("Vui lòng nhập họ và tên");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Đăng nhập thành công!");
          // Không navigate ở đây - useEffect sẽ tự redirect khi user state update
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) {
          toast.error(error.message);
        } else {
          // Upsert profile with display_name
          if (data.user) {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email,
              display_name: fullName.trim(),
            } as any);
          }
          toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.", { duration: 10000 });
          setSignupEmail(email);
          setSignupSuccess(true);
          setEmail("");
          setPassword("");
          setFullName("");
        }
      }
    } catch (err: any) {
      console.error('[Auth] Error:', {
        message: err?.message, code: err?.code, details: err?.details, hint: err?.hint, stack: err?.stack,
      });
      toast.error(err?.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-deep/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {signupSuccess ? (
          <div className="bg-surface-2/80 backdrop-blur-xl rounded-2xl border-2 border-green-500/50 p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <h2 className="font-display text-2xl text-foreground">Đăng ký thành công!</h2>
              <p className="text-muted-foreground leading-relaxed">
                Chúng tôi đã gửi email xác nhận đến <span className="font-semibold text-foreground">{signupEmail}</span>. 
                Vui lòng kiểm tra hộp thư (và thư mục Spam) rồi nhấn vào link xác nhận để hoàn tất đăng ký.
              </p>
              <Button
                variant="gold"
                size="lg"
                className="mt-4"
                onClick={() => {
                  setSignupSuccess(false);
                  setIsLogin(true);
                }}
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </div>
        ) : (
        <div className="bg-surface-2/80 backdrop-blur-xl rounded-2xl border border-gold/20 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl text-foreground mb-2">
              {isLogin ? "Đăng Nhập" : "Đăng Ký"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin
                ? "Chào mừng trở lại với Tử Vi"
                : "Tạo tài khoản để lưu lịch sử xem tử vi"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  Họ và tên
                </Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Họ và tên của bạn"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setNameError(""); }}
                    className={`pl-10 bg-surface-3 border-gold/20 focus:border-gold ${nameError ? "border-destructive" : ""}`}
                    maxLength={100}
                  />
                </div>
                {nameError && (
                  <p className="text-destructive text-xs">{nameError}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-surface-3 border-gold/20 focus:border-gold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-surface-3 border-gold/20 focus:border-gold"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : isLogin ? "Đăng Nhập" : "Đăng Ký"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                onClick={() => { setIsLogin(!isLogin); setNameError(""); }}
                className="text-gold hover:text-gold/80 font-medium transition-colors"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              ← Quay lại trang chủ
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
