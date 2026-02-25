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
import { Edit3, Check, X, LogOut, Star, Clock, Crown, ShieldCheck, Package, ScrollText, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FEATURE_NAMES: Record<string, string> = {
  premium: "Premium toàn diện",
  van_han_week: "Luận giải vận hạn tuần",
  van_han_month: "Luận giải vận hạn tháng",
  van_han_year: "Luận giải vận hạn năm",
  boi_que: "Bói quẻ không giới hạn",
  boi_kieu: "Bói Kiều không giới hạn",
  luan_giai: "Luận giải lá số chi tiết",
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

interface ChartAnalysis {
  id: string;
  chart_hash: string;
  birth_data: any;
  analysis_result: string | null;
  analysis_type: string | null;
  created_at: string;
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

const Profile = () => {
  const { user, loading, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [features, setFeatures] = useState<UserFeature[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [chartAnalyses, setChartAnalyses] = useState<ChartAnalysis[]>([]);
  

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    const [profileRes, featuresRes, paymentsRes, analysesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_features").select("*").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      (supabase.from("chart_analyses") as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfileData(profileRes.data);
    setFeatures(featuresRes.data || []);
    setPayments(paymentsRes.data || []);
    setChartAnalyses(analysesRes.data || []);
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
      // Refresh auth context profile
      window.location.reload();
    }
    setSavingName(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <PageLayout title="Hồ sơ">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/profile" replace />;
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
            <p className="text-yellow-200">
              🕐 Bạn có {pendingPayments.length} giao dịch đang chờ xác nhận. Thường mất 5-30 phút trong giờ hành chính.
            </p>
          </div>
        )}

        {/* PHẦN 2: Trạng thái thuê bao */}
        <Card className="border-gold/20 bg-surface-2/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" />
              Trạng thái thuê bao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {premiumFeature && (
              <div className="rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 to-purple-deep/10 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-gold fill-gold" />
                  <span className="font-semibold text-gold">PREMIUM</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {premiumFeature.expires_at
                    ? `Hết hạn: ${formatDate(premiumFeature.expires_at)}`
                    : "Không giới hạn thời gian"}
                </p>
              </div>
            )}

            {otherFeatures.map((f) => (
              <div key={f.id} className="rounded-xl border border-border bg-surface-3/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-foreground text-sm">
                    {FEATURE_NAMES[f.feature] || f.feature}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Đã mua: {formatDate(f.unlocked_at)}
                  {f.expires_at
                    ? ` · Hết hạn: ${formatDate(f.expires_at)}`
                    : " · Không giới hạn thời gian"}
                </p>
              </div>
            ))}

            {features.length === 0 && (
              <div className="text-center py-6">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Bạn chưa có gói nào. Khám phá các tính năng premium!
                </p>
                <Button variant="gold" size="sm" onClick={() => navigate("/van-han")}>
                  Xem các gói
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PHẦN 2.5: Lá số đã luận giải */}
        {chartAnalyses.length > 0 && (
          <Card className="border-gold/20 bg-surface-2/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-gold" />
                Lá số đã luận giải
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {chartAnalyses.map((a) => {
                const bd = a.birth_data || {};
                const birthDateStr = bd.solarDate || bd.birthDate || '';
                const genderStr = bd.gender || '';
                const label = bd.name
                  ? `${bd.name} - ${birthDateStr}${genderStr ? ` - ${genderStr}` : ''}`
                  : `Ngày sinh: ${birthDateStr || a.chart_hash}`;
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-3/50 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        Luận giải: {formatDate(a.created_at)} · {a.analysis_type === 'full' ? 'Toàn diện' : a.analysis_type}
                      </p>
                    </div>
                    <Button
                      variant="goldOutline"
                      size="sm"
                      onClick={() => {
                        const bd = a.birth_data || {};
                        const params = new URLSearchParams();
                        const dateVal = bd.solarDate || bd.birthDate;
                        if (dateVal) params.set('date', dateVal);
                        if (bd.hour !== undefined || bd.birthHour !== undefined) params.set('hour', String(bd.hour ?? bd.birthHour));
                        if (bd.gender) params.set('gender', bd.gender);
                        if (bd.isLunar) params.set('calendar', 'lunar');
                        else params.set('calendar', 'solar');
                        if (bd.name || bd.personName) params.set('name', bd.name || bd.personName);
                        navigate(`/lap-la-so?${params.toString()}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem lại
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}




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
                        {p.status === "verified" ? "✅ Đã kích hoạt" : p.status === "rejected" ? "❌ Từ chối" : "🕐 Chờ xác nhận"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PHẦN 4: Đăng xuất */}
        <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </PageLayout>
  );
};

export default Profile;
