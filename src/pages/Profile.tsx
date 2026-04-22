import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Edit3, Check, X, LogOut, Star, Clock, Crown, ShieldCheck, Package, ScrollText, Eye, Sparkles, AlertTriangle, Mail, Trash2 } from "lucide-react";
import VietQRPaymentModal from "@/components/VietQRPaymentModal";
import { signInWithGoogle } from "@/lib/auth/socialAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FEATURE_NAMES: Record<string, string> = {
  premium: "Premium toàn diện",
  credits_3: "3 Credits",
  credits_5: "5 Credits",
  credits_10: "10 Credits",
  van_han_week: "3 Credits",
  van_han_month: "3 Credits",
  van_han_year: "3 Credits",
  boi_que: "3 Credits",
  boi_kieu: "3 Credits",
  luan_giai: "3 Credits",
};

interface UserFeature {
  id: string;
  feature: string;
  expires_at: string | null;
  unlocked_at: string;
}

interface Payment {
  id: string;
  amount: number;
  plan: string;
  status: string | null;
  feature_unlocked: string | null;
  created_at: string | null;
}

interface TuViReading {
  id: string;
  birth_date: string;
  birth_hour: number;
  gender: string;
  status: string | null;
  created_at: string | null;
  chart_data: any;
  interpretation: any;
}


const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
};

const formatJoinDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  return `Tháng ${months[d.getMonth()]}, ${d.getFullYear()}`;
};

const formatMoney = (amount: number) => {
  return amount.toLocaleString("vi-VN") + "đ";
};

const LUNAR_HOURS: Record<number, string> = {
  0: 'Tý', 1: 'Sửu', 2: 'Dần', 3: 'Mão', 4: 'Thìn', 5: 'Tỵ',
  6: 'Ngọ', 7: 'Mùi', 8: 'Thân', 9: 'Dậu', 10: 'Tuất', 11: 'Hợi',
};

const Profile = () => {
  const { user, loading, initializing, displayName, signOut, isGuest } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [features, setFeatures] = useState<UserFeature[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [readings, setReadings] = useState<TuViReading[]>([]);
  const [credits, setCredits] = useState<{ remaining: number; total: number } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user && !isGuest) {
      fetchAll();
    }
  }, [user, isGuest]);

  const fetchAll = async () => {
    if (!user) return;
    const [profileRes, featuresRes, paymentsRes, readingsRes, lgPkgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_features").select("*").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("tuvi_readings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      (supabase as any).from("user_credits").select("credits_remaining, credits_total").eq("user_id", user.id).maybeSingle(),
    ]);
    setProfileData(profileRes.data);
    setFeatures(featuresRes.data || []);
    setPayments(paymentsRes.data || []);
    setReadings(readingsRes.data || []);
    setCredits(lgPkgRes.data ? { remaining: lgPkgRes.data.credits_remaining, total: lgPkgRes.data.credits_total } : null);
  };

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    setSavingName(true);
    const { error } = await (supabase
      .from("profiles") as any)
      .update({ display_name: newName.trim() })
      .eq("id", user.id);
    if (error) {
      toast.error("Không thể cập nhật tên");
    } else {
      toast.success("Đã cập nhật tên thành công!");
      setEditingName(false);
      fetchAll();
      window.location.reload();
    }
    setSavingName(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XOA") return;
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirmation: "DELETE" },
      });
      if (error || (data as any)?.error) {
        const msg = (error as any)?.message || (data as any)?.error || "Không thể xóa tài khoản";
        toast.error(msg);
        setDeletingAccount(false);
        return;
      }
      await supabase.auth.signOut();
      toast.success("Đã xóa tài khoản thành công");
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Không thể xóa tài khoản");
      setDeletingAccount(false);
    }
  };

  if (loading || initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Sparkles className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/profile" replace />;
  }

  // ── GUEST VIEW ──
  if (isGuest) {
    const handleGoogle = async () => {
      setGoogleLoading(true);
      try {
        await signInWithGoogle();
      } catch (err: any) {
        toast.error(err?.message || "Đăng nhập Google thất bại");
        setGoogleLoading(false);
      }
    };
    return (
      <PageLayout title="Hồ sơ cá nhân">
        <div className="space-y-6">
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-200">Bạn đang dùng ở chế độ Khách</p>
              <p className="text-sm text-yellow-100/80 mt-1">
                Dữ liệu sẽ mất khi đóng app hoặc đổi thiết bị. Đăng ký ngay để lưu lại lá số và nhận phân tích AI.
              </p>
            </div>
          </div>

          <Card className="border-gold/20 bg-surface-2/80 backdrop-blur">
            <CardContent className="pt-6 space-y-3">
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={handleGoogle}
                disabled={googleLoading}
              >
                <Sparkles className="w-5 h-5" />
                Đăng ký với Google
              </Button>
              <Button
                variant="goldOutline"
                size="lg"
                className="w-full"
                onClick={() => navigate("/auth")}
                disabled={googleLoading}
              >
                <Mail className="w-4 h-4" />
                Đăng ký bằng email
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Thoát chế độ Khách
          </Button>
        </div>
      </PageLayout>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const premiumFeature = features.find((f) => f.feature === "premium");
  const otherFeatures = features.filter((f) => f.feature !== "premium");

  return (
    <PageLayout title="Hồ sơ cá nhân">
      <div className="space-y-6">
        {/* PHẦN 1: Thông tin cá nhân */}
        <Card className="border-gold/20 bg-surface-2/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-purple-deep to-gold text-background text-xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-9 bg-surface-3 border-gold/20"
                      placeholder="Nhập tên mới"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={savingName} className="shrink-0 text-green-500 hover:text-green-400">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingName(false)} className="shrink-0 text-muted-foreground">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground truncate">{displayName}</h2>
                    <button
                      onClick={() => { setNewName(displayName); setEditingName(true); }}
                      className="text-muted-foreground hover:text-gold transition-colors shrink-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tham gia: {formatJoinDate(profileData?.created_at || user.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banner pending */}
        {pendingPayments.length > 0 && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
            <p className="text-yellow-200 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              Bạn có {pendingPayments.length} giao dịch đang chờ xác nhận. Thường mất 5-30 phút trong giờ hành chính.
            </p>
          </div>
        )}

        {/* PHẦN 2: Credits */}
        <Card className="border-gold/20 bg-surface-2/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {credits && credits.total > 0 ? (
              <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-purple-deep/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-gold fill-gold" />
                    <span className="font-semibold text-foreground">Credits còn lại</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{credits.remaining}</span>
                </div>
                <div className="w-full bg-surface-3 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-primary to-gold h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((credits.remaining / Math.max(credits.total, 1)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Đã sử dụng {credits.total - credits.remaining}/{credits.total} credits
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mỗi lần dùng Bói Kiều, Bói Quẻ, Vận Hạn hoặc Luận Giải = 1 credit
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Bạn chưa có credits. Mua credits để sử dụng các tính năng trả phí!
                </p>
                <Button variant="gold" size="sm" onClick={() => setShowPayment(true)}>
                  Mua Credits
                </Button>
              </div>
            )}

            {premiumFeature && (
              <div className="rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 to-purple-deep/10 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5 text-gold" />
                  <span className="font-semibold text-gold">PREMIUM</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {premiumFeature.expires_at
                    ? `Hết hạn: ${formatDate(premiumFeature.expires_at)}`
                    : "Không giới hạn thời gian"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PHẦN 2.5: Lá số đã lập */}
        {readings.length > 0 && (
          <Card className="border-gold/20 bg-surface-2/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-gold" />
                Lá số đã lập ({readings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readings.map((r) => {
                const isInterpreted = r.status === 'interpreted' || !!r.interpretation;
                const hourLabel = LUNAR_HOURS[r.birth_hour] || `Giờ ${r.birth_hour}`;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-3/50 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {formatDate(r.birth_date)} · {hourLabel} · {r.gender}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Lập: {formatDate(r.created_at)}
                        </p>
                        <Badge
                          variant="outline"
                          className={isInterpreted
                            ? "border-green-500/50 text-green-400 bg-green-500/10 text-[10px]"
                            : "border-muted-foreground/30 text-muted-foreground text-[10px]"
                          }
                        >
                          {isInterpreted ? "Đã luận giải" : "Chưa luận giải"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="goldOutline"
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('date', r.birth_date);
                        params.set('hour', String(r.birth_hour));
                        params.set('gender', r.gender);
                        params.set('calendar', 'solar');
                        navigate(`/lap-la-so?${params.toString()}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Lịch sử thanh toán */}
        {payments.length > 0 && (
          <Card className="border-gold/20 bg-surface-2/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Lịch sử thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {FEATURE_NAMES[p.feature_unlocked || p.plan] || p.plan}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium text-foreground">{formatMoney(p.amount)}</span>
                      <Badge
                        variant="outline"
                        className={
                          p.status === "verified"
                            ? "border-green-500/50 text-green-400 bg-green-500/10"
                            : p.status === "rejected"
                            ? "border-red-500/50 text-red-400 bg-red-500/10"
                            : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                        }
                      >
                        {p.status === "verified" ? "Đã kích hoạt" : p.status === "rejected" ? "Từ chối" : "Chờ xác nhận"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Đăng xuất */}
        <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>

      <VietQRPaymentModal
        open={showPayment}
        onOpenChange={setShowPayment}
        feature="luan_giai"
        onSuccess={() => {
          setShowPayment(false);
          fetchAll();
        }}
      />
    </PageLayout>
  );
};

export default Profile;
