import { useEffect, useState, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Package,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

const ADMIN_EMAILS = ["phuongnguyen2201@gmail.com"];

const FEATURE_LABELS: Record<string, string> = {
  van_han_week: "Vận hạn tuần",
  van_han_month: "Vận hạn tháng",
  van_han_year: "Vận hạn năm",
  boi_que: "Bói quẻ",
  boi_kieu: "Bói Kiều",
  luan_giai: "Luận Giải Lá Số",
  premium_monthly: "Premium tháng",
  premium_yearly: "Premium năm",
};

const CREDIT_PRESETS = [
  { value: 3, label: "3 credits (39.000đ)" },
  { value: 5, label: "5 credits (59.000đ)" },
  { value: 10, label: "10 credits (99.000đ)" },
];

const formatCurrency = (amount: number) => amount.toLocaleString("vi-VN") + "đ";

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "vừa xong";
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

interface PaymentRow {
  id: string;
  user_id: string | null;
  amount: number;
  plan: string;
  status: string | null;
  feature_unlocked: string | null;
  transfer_content: string | null;
  notes: string | null;
  created_at: string | null;
  verified_at: string | null;
  display_name?: string | null;
  user_email?: string | null;
}

interface CreditInfo {
  id: string;
  user_id: string;
  credits_remaining: number;
  credits_total: number;
  updated_at: string | null;
  created_at: string | null;
  display_name?: string | null;
  user_email?: string | null;
}

const callAdmin = async (action: string, params: Record<string, any> = {}) => {
  const res = await supabase.functions.invoke("admin-actions", {
    body: { action, ...params },
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
};

// Filter helper: match email or display_name
function matchesSearch(
  item: { user_email?: string | null; display_name?: string | null; transfer_content?: string | null },
  term: string,
): boolean {
  if (!term) return true;
  const lower = term.toLowerCase();
  return (
    (item.user_email ?? "").toLowerCase().includes(lower) ||
    (item.display_name ?? "").toLowerCase().includes(lower) ||
    (item.transfer_content ?? "").toLowerCase().includes(lower)
  );
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [pendingPayments, setPendingPayments] = useState<PaymentRow[]>([]);
  const [historyPayments, setHistoryPayments] = useState<PaymentRow[]>([]);
  const [creditInfos, setCreditInfos] = useState<CreditInfo[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Grant package state
  const [grantEmail, setGrantEmail] = useState("");
  const [grantCredits, setGrantCredits] = useState(3);
  const [grantLoading, setGrantLoading] = useState(false);

  // Reset user state
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [stats, pending, history, credits] = await Promise.all([
        callAdmin("get_stats"),
        callAdmin("get_pending"),
        callAdmin("get_history"),
        callAdmin("get_credits"),
      ]);
      setPendingCount(stats.pendingCount);
      setMonthRevenue(stats.monthRevenue);
      setActiveUsers(stats.activeUsers);
      setPendingPayments(pending);
      setHistoryPayments(history);
      setCreditInfos(credits);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setLoadingStats(false);
  }, [toast]);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return;
    fetchAll();
  }, [user, fetchAll]);

  // Filtered data
  const filteredPending = useMemo(
    () => pendingPayments.filter((p) => matchesSearch(p, searchTerm)),
    [pendingPayments, searchTerm],
  );
  const filteredHistory = useMemo(
    () => historyPayments.filter((p) => matchesSearch(p, searchTerm)),
    [historyPayments, searchTerm],
  );
  const filteredCredits = useMemo(
    () => creditInfos.filter((p) => matchesSearch(p, searchTerm)),
    [creditInfos, searchTerm],
  );

  const activePending = filteredPending.filter((p) => p.status === "pending");
  const expiredRecoverable = filteredPending.filter((p) => p.status === "expired");

  const handleVerify = async (payment: PaymentRow) => {
    if (!payment.user_id) return;
    setActionLoading(payment.id);

    const feature = payment.feature_unlocked ?? payment.plan;
    let expiresAt: string | null = null;
    if (feature === "premium_monthly") {
      expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (feature === "premium_yearly") {
      expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
    }

    try {
      await callAdmin("verify", {
        paymentId: payment.id,
        userId: payment.user_id,
        feature,
        expiresAt,
        paymentRef: payment.id,
      });
      toast({
        title: "✅ Đã kích hoạt",
        description: `Đã kích hoạt cho ${payment.display_name || payment.user_email || "user"}`,
      });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleReject = async (payment: PaymentRow) => {
    setActionLoading(payment.id);
    try {
      await callAdmin("reject", { paymentId: payment.id });
      toast({ title: "Đã từ chối giao dịch" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleConfirmLuanGiai = async (pkg: LuanGiaiPackage) => {
    setActionLoading(pkg.id);
    try {
      await callAdmin("confirm_luan_giai", { packageId: pkg.id });
      toast({ title: "✅ Đã xác nhận gói Luận Giải" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleGrantCredits = async () => {
    if (!grantEmail.trim()) return;
    setGrantLoading(true);
    try {
      const result = await callAdmin("grant_credits", {
        email: grantEmail.trim(),
        credits: grantCredits,
      });
      toast({
        title: "✅ Đã cấp credits",
        description: `Cấp ${grantCredits} credits cho ${result.user?.display_name || grantEmail}`,
      });
      setGrantEmail("");
      setGrantCredits(3);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setGrantLoading(false);
  };

  const handleResetUser = async () => {
    if (!resetEmail.trim()) return;
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setResetLoading(true);
    try {
      const result = await callAdmin("reset_user", { email: resetEmail.trim() });
      toast({
        title: "✅ Đã reset user",
        description: `Reset ${result.deleted?.total || 0} records cho ${resetEmail}. User trở về trạng thái mới.`,
      });
      setResetEmail("");
      setResetConfirm(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setResetLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-display font-bold text-foreground">⚙️ Admin Panel - Tử Vi App</h1>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-surface-2 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" /> Chờ xác nhận
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{loadingStats ? "..." : pendingCount}</p>
              {pendingPayments.filter((p) => p.status === "expired").length > 0 && (
                <p className="text-xs text-amber-400 mt-1">
                  + {pendingPayments.filter((p) => p.status === "expired").length} expired cần xử lý
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-surface-2 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Doanh thu tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loadingStats ? "..." : formatCurrency(monthRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-surface-2 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Users có access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{loadingStats ? "..." : activeUsers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email, tên user hoặc nội dung CK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 bg-surface-2 border-border"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {searchTerm && (
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Đang lọc: {activePending.length} chờ xác nhận · {expiredRecoverable.length} expired ·{" "}
              {filteredCredits.length} users · {filteredHistory.length} lịch sử
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="pending">
              Chờ xác nhận 🔔
              {expiredRecoverable.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  +{expiredRecoverable.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="luan_giai">Credits 💰</TabsTrigger>
            <TabsTrigger value="tools">Công cụ 🔧</TabsTrigger>
            <TabsTrigger value="history">Lịch sử ✅</TabsTrigger>
          </TabsList>

          {/* =================== PENDING PAYMENTS =================== */}
          <TabsContent value="pending">
            {expiredRecoverable.length > 0 && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
                <p className="text-sm font-semibold text-amber-300 mb-2">
                  ⏰ Giao dịch hết hạn — có thể user đã CK nhưng webhook không nhận được
                </p>
                <p className="text-xs text-amber-200/60 mb-3">
                  Kiểm tra sao kê ngân hàng rồi xác nhận thủ công nếu đã nhận tiền.
                </p>
                <ScrollArea className="w-full">
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Họ tên</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tính năng</TableHead>
                          <TableHead>Số tiền</TableHead>
                          <TableHead>Nội dung CK</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiredRecoverable.map((p) => (
                          <TableRow key={p.id} className="hover:bg-amber-950/30">
                            <TableCell className="text-xs">
                              <div>{formatTime(p.created_at)}</div>
                              <span className="text-amber-400 text-[10px]">Expired {timeAgo(p.created_at)}</span>
                            </TableCell>
                            <TableCell className="text-sm">{p.display_name || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.user_email || "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {FEATURE_LABELS[p.feature_unlocked ?? p.plan] ?? p.plan}
                                </Badge>
                                <Badge variant="destructive" className="text-[10px]">
                                  ⏰ Hết hạn
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="text-xs whitespace-normal break-words">
                              {p.transfer_content || "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs bg-amber-600 hover:bg-amber-500"
                                  disabled={actionLoading === p.id}
                                  onClick={() => handleVerify(p)}
                                >
                                  {actionLoading === p.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Xác nhận
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  disabled={actionLoading === p.id}
                                  onClick={() => handleReject(p)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Bỏ qua
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </div>
            )}

            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tính năng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Nội dung CK</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePending.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {searchTerm
                            ? `Không tìm thấy giao dịch pending cho "${searchTerm}"`
                            : "Không có giao dịch chờ xác nhận"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      activePending.map((p) => (
                        <TableRow key={p.id} className="hover:bg-accent/50">
                          <TableCell className="text-xs">{formatTime(p.created_at)}</TableCell>
                          <TableCell className="text-sm">{p.display_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.user_email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {FEATURE_LABELS[p.feature_unlocked ?? p.plan] ?? p.plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                          <TableCell className="text-xs whitespace-normal break-words">
                            {p.transfer_content || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs"
                                disabled={actionLoading === p.id}
                                onClick={() => handleVerify(p)}
                              >
                                {actionLoading === p.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Xác nhận
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                disabled={actionLoading === p.id}
                                onClick={() => handleReject(p)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Từ chối
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* =================== LUAN GIAI PACKAGES =================== */}
          <TabsContent value="luan_giai">
            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày mua</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Đã dùng / Tổng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {searchTerm ? `Không tìm thấy gói cho "${searchTerm}"` : "Chưa có gói Luận Giải nào"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPackages.map((pkg) => {
                        const used = pkg.total_uses - pkg.remaining_uses;
                        const isPending = pkg.payment_status === "pending";
                        const isExhausted = pkg.remaining_uses === 0;
                        return (
                          <TableRow key={pkg.id} className="hover:bg-accent/50">
                            <TableCell className="text-xs">{formatTime(pkg.created_at)}</TableCell>
                            <TableCell className="text-sm">{pkg.display_name || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{pkg.user_email || "—"}</TableCell>
                            <TableCell>
                              {isPending ? (
                                <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500">
                                  ⏳ Chờ xác nhận
                                </Badge>
                              ) : isExhausted ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-muted-foreground border-muted-foreground/30"
                                >
                                  Đã dùng hết
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  ✅ Đang active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <span className={isExhausted ? "text-muted-foreground" : ""}>
                                {used}/{pkg.total_uses}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatCurrency(pkg.amount)}
                              {pkg.payment_method === "admin_grant" && (
                                <span className="ml-1 text-muted-foreground">(miễn phí)</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isPending && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs"
                                  disabled={actionLoading === pkg.id}
                                  onClick={() => handleConfirmLuanGiai(pkg)}
                                >
                                  {actionLoading === pkg.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Xác nhận
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* =================== TOOLS =================== */}
          <TabsContent value="tools">
            <div className="space-y-4">
              {/* Grant package */}
              <Card className="bg-surface-2 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" /> Cấp gói cho user
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Email người dùng"
                        value={grantEmail}
                        onChange={(e) => setGrantEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Select value={grantFeature} onValueChange={setGrantFeature}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                          <SelectValue placeholder="Chọn tính năng" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRANTABLE_FEATURES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={grantUses}
                        onChange={(e) => setGrantUses(parseInt(e.target.value) || 3)}
                        className="w-20"
                        placeholder="Lượt"
                      />
                    </div>
                    <Button
                      onClick={handleGrantPackage}
                      disabled={grantLoading || !grantEmail.trim()}
                      className="w-full sm:w-auto"
                    >
                      {grantLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" /> Cấp gói
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reset user */}
              <Card className="bg-surface-2 border-destructive/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <RotateCcw className="h-4 w-4" /> Reset user (cho test)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Xóa toàn bộ analyses, packages, payments, user_features — user trở về trạng thái mới hoàn toàn.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Email user cần reset"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setResetConfirm(false);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant={resetConfirm ? "destructive" : "outline"}
                      onClick={handleResetUser}
                      disabled={resetLoading || !resetEmail.trim()}
                      className="whitespace-nowrap"
                    >
                      {resetLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : resetConfirm ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" /> Xác nhận RESET
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" /> Reset
                        </>
                      )}
                    </Button>
                  </div>
                  {resetConfirm && (
                    <p className="text-xs text-destructive mt-2 font-medium">
                      ⚠️ Thao tác không thể hoàn tác! Nhấn "Xác nhận RESET" lần nữa để thực hiện.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* =================== HISTORY =================== */}
          <TabsContent value="history">
            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tính năng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Xác nhận lúc</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {searchTerm ? `Không tìm thấy lịch sử cho "${searchTerm}"` : "Chưa có lịch sử"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((p) => (
                        <TableRow key={p.id} className="hover:bg-accent/50">
                          <TableCell className="text-xs">{formatTime(p.created_at)}</TableCell>
                          <TableCell className="text-sm">{p.display_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.user_email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {FEATURE_LABELS[p.feature_unlocked ?? p.plan] ?? p.plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                          <TableCell>
                            {p.status === "verified" ? (
                              <Badge variant="secondary" className="text-xs">
                                ✅ Đã kích hoạt
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                ❌ Đã từ chối
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{formatTime(p.verified_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
