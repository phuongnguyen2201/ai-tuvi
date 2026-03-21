import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff, Sparkles, UserRound, CheckCircle2, Check } from "lucide-react";
import { toast } from "sonner";

type AuthView = "login" | "signup" | "forgot" | "signupSuccess" | "forgotSuccess" | "resetPassword" | "resetSuccess" | "alreadyRegistered";

const Auth = () => {
  const initialTab = new URLSearchParams(window.location.search).get('tab');
  const [view, setView] = useState<AuthView>(initialTab === 'register' ? 'signup' : 'login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [alreadyRegisteredEmail, setAlreadyRegisteredEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get('redirect') || '/profile';

  // Handle recovery redirect
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type') || searchParams.get('type');
    if (type === 'recovery') {
      setView("resetPassword");
    }
  }, []);

  useEffect(() => {
    if (user && !authLoading && view !== "resetPassword") {
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, redirectTo, navigate, view]);

  const validateEmail = (value: string) => {
    if (!value) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "" : "Email không hợp lệ";
  };

  const clearInlineErrors = () => {
    setPasswordError("");
    setConfirmPasswordError("");
    setEmailError("");
    setNameError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearInlineErrors();
    const eErr = validateEmail(email);
    if (eErr) { setEmailError(eErr); return; }
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(translateError(error.message), { duration: 10000 });
      } else {
        toast.success("Đăng nhập thành công!");
      }
    } catch (err: any) {
      toast.error(translateError(err?.message) || "Đã có lỗi xảy ra", { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearInlineErrors();
    if (!fullName.trim()) { setNameError("Vui lòng nhập họ và tên"); return; }
    const eErr = validateEmail(email);
    if (eErr) { setEmailError(eErr); return; }
    if (password.length < 6) { setPasswordError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    if (password !== confirmPassword) { setConfirmPasswordError("Mật khẩu không khớp"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setAlreadyRegisteredEmail(email);
          setView("alreadyRegistered");
        } else {
          toast.error(translateError(error.message), { duration: 10000 });
        }
      } else {
        // Check fake success: email already exists but Supabase returns no error
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setAlreadyRegisteredEmail(email);
          setView("alreadyRegistered");
        } else {
          if (data.user) {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email,
              display_name: fullName.trim(),
            } as any);
          }
          toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.", { duration: 10000 });
          setSignupEmail(email);
          setView("signupSuccess");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setFullName("");
        }
      }
    } catch (err: any) {
      toast.error(translateError(err?.message) || "Đã có lỗi xảy ra", { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearInlineErrors();
    if (!email.trim()) { setEmailError("Vui lòng nhập email hợp lệ"); return; }
    const eErr = validateEmail(email);
    if (eErr) { setEmailError("Vui lòng nhập email hợp lệ"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth?type=recovery',
      });
      if (error) {
        toast.error(translateError(error.message), { duration: 10000 });
      } else {
        setForgotEmail(email);
        setView("forgotSuccess");
        setEmail("");
      }
    } catch (err: any) {
      toast.error(translateError(err?.message) || "Đã có lỗi xảy ra", { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearInlineErrors();
    let hasError = false;
    if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      hasError = true;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      hasError = true;
    }
    if (hasError) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = translateError(error.message);
        // Show inline for known password errors
        if (error.message.toLowerCase().includes("different") || error.message.toLowerCase().includes("same")) {
          setPasswordError("Mật khẩu mới phải khác mật khẩu cũ");
        }
        toast.error(msg, { duration: 10000 });
      } else {
        setView("resetSuccess");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(translateError(err?.message) || "Đã có lỗi xảy ra", { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  const translateError = (msg: string): string => {
    if (!msg) return "Đã có lỗi xảy ra";
    const lower = msg.toLowerCase();
    if (lower.includes("different") || lower.includes("same as old")) return "Mật khẩu mới phải khác mật khẩu cũ";
    if (lower.includes("at least 6") || lower.includes("too short")) return "Mật khẩu phải có ít nhất 6 ký tự";
    if (lower.includes("don't match") || lower.includes("do not match")) return "Mật khẩu xác nhận không khớp";
    if (lower.includes("invalid email")) return "Email không hợp lệ";
    if (lower.includes("invalid login")) return "Email hoặc mật khẩu không đúng";
    if (lower.includes("already registered")) return "Email này đã được đăng ký";
    if (lower.includes("rate limit")) return "Quá nhiều yêu cầu, vui lòng thử lại sau";
    return msg;
  };

  const InlineError = ({ message }: { message: string }) => {
    if (!message) return null;
    return <p className="text-destructive text-xs mt-1">{message}</p>;
  };

  const renderSuccessCard = (icon: string, title: string, message: React.ReactNode, buttonText: string, onButton: () => void) => (
    <div className="bg-surface-2/80 backdrop-blur-xl rounded-2xl border-2 border-green-500/50 p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-4">
        {icon === "check" ? (
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        ) : (
          <span className="text-5xl">{icon}</span>
        )}
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        <p className="text-muted-foreground leading-relaxed">{message}</p>
        <Button variant="gold" size="lg" className="mt-4" onClick={onButton}>
          {buttonText}
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (view === "alreadyRegistered") {
      return (
        <div className="bg-surface-2/80 backdrop-blur-xl rounded-2xl border border-gold/20 p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <Mail className="w-12 h-12 text-gold mx-auto" />
            <h2 className="font-display text-2xl text-foreground">Email đã được đăng ký</h2>
            <p className="text-muted-foreground leading-relaxed">
              Email <span className="font-semibold text-foreground">{alreadyRegisteredEmail}</span> đã có tài khoản. Bạn có muốn đăng nhập không?
            </p>
            <div className="flex flex-col gap-2 w-full">
              <Button variant="gold" size="lg" className="w-full" onClick={() => { setEmail(alreadyRegisteredEmail); setView("login"); }}>
                Đăng nhập
              </Button>
              <Button variant="goldOutline" size="lg" className="w-full" onClick={() => { setEmail(""); setView("signup"); }}>
                Thử email khác
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (view === "signupSuccess") {
      return renderSuccessCard(
        "check",
        "Đăng ký thành công!",
        <>Chúng tôi đã gửi email xác nhận đến <span className="font-semibold text-foreground">{signupEmail}</span>. Vui lòng kiểm tra hộp thư (và thư mục Spam) rồi nhấn vào link xác nhận để hoàn tất đăng ký.</>,
        "Quay lại đăng nhập",
        () => setView("login")
      );
    }

    if (view === "forgotSuccess") {
      return renderSuccessCard(
        "📧",
        "Kiểm tra hộp thư của bạn",
        <>Nếu email <span className="font-semibold text-foreground">{forgotEmail}</span> đã được đăng ký, bạn sẽ nhận được link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả mục Spam).</>,
        "Quay lại đăng nhập",
        () => setView("login")
      );
    }

    if (view === "resetSuccess") {
      return renderSuccessCard(
        "check",
        "Đặt lại mật khẩu thành công!",
        "Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.",
        "Đăng nhập ngay",
        () => { setView("login"); navigate('/auth', { replace: true }); }
      );
    }

    if (view === "resetPassword") {
      return (
        <div className="bg-surface-2/80 backdrop-blur-xl rounded-2xl border border-gold/20 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl text-foreground mb-2">Đặt Mật Khẩu Mới</h1>
            <p className="text-muted-foreground text-sm">Nhập mật khẩu mới cho tài khoản của bạn</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground">Mật khẩu mới</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }} className={`pl-10 pr-10 bg-surface-3 border-gold/20 focus:border-gold ${passwordError ? "border-destructive" : ""}`} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <InlineError message={passwordError} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(""); }} className={`pl-10 pr-10 bg-surface-3 border-gold/20 focus:border-gold ${confirmPasswordError ? "border-destructive" : ""}`} required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <InlineError message={confirmPasswordError} />
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : "Đặt lại mật khẩu"}
            </Button>
          </form>
        </div>
      );
    }

    if (view === "forgot") {
      return (
        <div className="bg-surface-2/80 backdrop-blur-xl rounded-2xl border border-gold/20 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl text-foreground mb-2">Quên Mật Khẩu</h1>
            <p className="text-muted-foreground text-sm">Nhập email để nhận link đặt lại mật khẩu</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="forgotEmail" type="email" placeholder="your@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} className={`pl-10 bg-surface-3 border-gold/20 focus:border-gold ${emailError ? "border-destructive" : ""}`} required />
              </div>
              <InlineError message={emailError} />
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : "Gửi link đặt lại mật khẩu"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setView("login"); clearInlineErrors(); }} className="text-gold hover:text-gold/80 font-medium transition-colors text-sm">
              ← Quay lại đăng nhập
            </button>
          </div>
        </div>
      );
    }

    // Login / Signup form
    const isLogin = view === "login";
    return (
      <div className="bg-surface-2/80 backdrop-blur-xl rounded-2xl border border-gold/20 p-8 shadow-2xl">
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-surface-3 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setView("login"); clearInlineErrors(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-gold text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setView("signup"); clearInlineErrors(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-gold text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Đăng ký
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-foreground mb-2">
            {isLogin ? "Đăng Nhập" : "Đăng Ký"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Chào mừng trở lại với Tử Vi" : "Tạo tài khoản để lưu lịch sử xem tử vi"}
          </p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">Họ và tên</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="fullName" type="text" placeholder="Họ và tên của bạn" value={fullName} onChange={(e) => { setFullName(e.target.value); setNameError(""); }} className={`pl-10 bg-surface-3 border-gold/20 focus:border-gold ${nameError ? "border-destructive" : ""}`} maxLength={100} />
              </div>
              <InlineError message={nameError} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} className={`pl-10 bg-surface-3 border-gold/20 focus:border-gold ${emailError ? "border-destructive" : ""}`} required />
            </div>
            <InlineError message={emailError} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => {
                const val = e.target.value;
                setPassword(val);
                setPasswordError("");
                if (!isLogin && val.length > 0 && val.length < 6) {
                  setPasswordError("Mật khẩu cần ít nhất 6 ký tự");
                }
                if (!isLogin && confirmPassword.length > 0) {
                  setConfirmPasswordError(val !== confirmPassword ? "Mật khẩu không khớp" : "");
                }
              }} className={`pl-10 pr-10 bg-surface-3 border-gold/20 focus:border-gold ${passwordError ? "border-destructive" : ""}`} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <InlineError message={passwordError} />
            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => { setView("forgot"); clearInlineErrors(); setEmail(""); }} className="text-gold/70 hover:text-gold text-xs transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => {
                  const val = e.target.value;
                  setConfirmPassword(val);
                  setConfirmPasswordError(val.length > 0 && password !== val ? "Mật khẩu không khớp" : "");
                }} className={`pl-10 pr-10 bg-surface-3 border-gold/20 focus:border-gold ${confirmPasswordError ? "border-destructive" : ""} ${confirmPassword.length > 0 && password === confirmPassword ? "border-green-500" : ""}`} required />
                {confirmPassword.length > 0 && password === confirmPassword ? (
                  <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                ) : null}
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <InlineError message={confirmPasswordError} />
            </div>
          )}

          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading || (!isLogin && password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword)}>
            {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : isLogin ? "Đăng Nhập" : "Đăng Ký"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => navigate("/")} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-x-hidden overflow-y-auto flex items-start sm:items-center justify-center pb-[300px] sm:pb-0">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-deep/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md px-4 py-8 sm:py-0" onFocus={(e) => { if (e.target instanceof HTMLInputElement) handleInputFocus(e as any); }}>
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Auth;
