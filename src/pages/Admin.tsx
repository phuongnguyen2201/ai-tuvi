import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, DollarSign, Users, CheckCircle, XCircle, Loader2, Plus, Search, Package } from "lucide-react";

const ADMIN_EMAILS = ["phuongnguyen2201@gmail.com"];

const FEATURE_LABELS: Record<string, string> = {
  van_han_week: "Vận hạn tuần",
  van_han_month: "Vận hạn tháng",
  van_han_year: "Vận hạn năm",
  boi_que: "Bói quẻ",
  boi_kieu: "Bói Kiều",
  premium_monthly: "Premium tháng",
  premium_yearly: "Premium năm",
  luan_giai: "Gói Luận Giải (3 lần - 39,000đ)",
};

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

// Helper: time ago for expired payments
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

interface LuanGiaiPackage {
  id: string;
  user_id: string;
  total_uses: number;
  remaining_uses: number;
  amount: number;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string | null;
  confirmed_at: string | null;
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

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [pendingPayments, setPendingPayments] = useState<PaymentRow[]>([]);
  const [historyPayments, setHistoryPayments] = useState<PaymentRow[]>([]);
  const [luanGiaiPackages, setLuanGiaiPackages] = useState<LuanGiaiPackage[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Grant package state
  const [grantEmail, setGrantEmail] = useState("");
  const [grantUses, setGrantUses] = useState(3);
  const [grantLoading, setGrantLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [stats, pending, history, lgPkgs] = await Promise.all([
        callAdmin("get_stats"),
        callAdmin("get_pending"),
        callAdmin("get_history"),
        callAdmin("get_luan_giai_packages"),
      ]);
      setPendingCount(stats.pendingCount);
      setMonthRevenue(stats.monthRevenue);
      setActiveUsers(stats.activeUsers);
      setPendingPayments(pending);
      setHistoryPayments(history);
      setLuanGiaiPackages(lgPkgs);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setLoadingStats(false);
  }, [toast]);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return;
    fetchAll();
  }, [user, fetchAll]);

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

  const handleAddUses = async (pkg: LuanGiaiPackage) => {
    setActionLoading(pkg.id);
    try {
      await callAdmin("add_luan_giai_uses", { packageId: pkg.id, addUses: 3 });
      toast({ title: "✅ Đã thêm 3 lượt luận giải" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleGrantPackage = async () => {
    if (!grantEmail.trim()) return;
    setGrantLoading(true);
    try {
      const result = await callAdmin("grant_luan_giai", { email: grantEmail.trim(), uses: grantUses });
      toast({
        title: "✅ Đã cấp gói Luận Giải",
        description: `Cấp ${grantUses} lượt cho ${result.user?.display_name || grantEmail}`,
      });
      setGrantEmail("");
      setGrantUses(3);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
    setGrantLoading(false);
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

  // Split pending into active pending vs expired (for UI grouping)
  const activePending = pendingPayments.filter((p) => p.status === "pending");
  const expiredRecoverable = pendingPayments.filter((p) => p.status === "expired");

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
              {expiredRecoverable.length > 0 && (
                <p className="text-xs text-amber-400 mt-1">+ {expiredRecoverable.length} expired cần xử lý</p>
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
            <TabsTrigger value="luan_giai">Gói Luận Giải 📦</TabsTrigger>
            <TabsTrigger value="history">Lịch sử ✅</TabsTrigger>
          </TabsList>

          {/* =================== PENDING PAYMENTS =================== */}
          <TabsContent value="pending">
            {/* Expired recoverable section */}
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

            {/* Active pending payments */}
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
                          Không có giao dịch chờ xác nhận
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
            {/* Grant package card */}
            <Card className="bg-surface-2 border-border mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Cấp gói Luận Giải
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Email người dùng"
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={grantUses}
                    onChange={(e) => setGrantUses(parseInt(e.target.value) || 3)}
                    className="w-24"
                    placeholder="Số lượt"
                  />
                  <Button
                    onClick={handleGrantPackage}
                    disabled={grantLoading || !grantEmail.trim()}
                    className="whitespace-nowrap"
                  >
                    {grantLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-1" /> Cấp gói
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Packages table */}
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
                    {luanGiaiPackages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Chưa có gói Luận Giải nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      luanGiaiPackages.map((pkg) => {
                        const used = pkg.total_uses - pkg.remaining_uses;
                        const isPending = pkg.payment_status === "pending";
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
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  ✅ Đã xác nhận
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {used}/{pkg.total_uses}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatCurrency(pkg.amount)}
                              {pkg.payment_method === "admin_grant" && (
                                <span className="ml-1 text-muted-foreground">(miễn phí)</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
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
                                {!isPending && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    disabled={actionLoading === pkg.id}
                                    onClick={() => handleAddUses(pkg)}
                                  >
                                    {actionLoading === pkg.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Plus className="h-3 w-3 mr-1" />
                                        Thêm 3 lượt
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
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
                    {historyPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Chưa có lịch sử
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyPayments.map((p) => (
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
