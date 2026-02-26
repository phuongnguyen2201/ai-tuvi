import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, DollarSign, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";

const ADMIN_EMAILS = ["phuongnguyen2201@gmail.com"];

const FEATURE_LABELS: Record<string, string> = {
  van_han_week: "Vận hạn tuần",
  van_han_month: "Vận hạn tháng",
  van_han_year: "Vận hạn năm",
  boi_que: "Bói quẻ",
  boi_kieu: "Bói Kiều",
  premium_monthly: "Premium tháng",
  premium_yearly: "Premium năm",
  luan_giai: "Luận giải lá số",
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("vi-VN") + "đ";

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

const callAdmin = async (action: string, params: Record<string, any> = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
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
  const [pendingCount, setPendingCount] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [stats, pending, history] = await Promise.all([
        callAdmin("get_stats"),
        callAdmin("get_pending"),
        callAdmin("get_history"),
      ]);
      setPendingCount(stats.pendingCount);
      setMonthRevenue(stats.monthRevenue);
      setActiveUsers(stats.activeUsers);
      setPendingPayments(pending);
      setHistoryPayments(history);
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

    console.log('[Admin] Verifying payment:', {
      paymentId: payment.id,
      userId: payment.user_id,
      feature,
      hasNotes: !!payment.notes,
      notes: payment.notes,
      expiresAt,
    });

    try {
      const result = await callAdmin("verify", {
        paymentId: payment.id,
        userId: payment.user_id,
        feature,
        expiresAt,
        paymentRef: payment.id,
      });
      console.log('[Admin] Verify result:', result);
      toast({
        title: "✅ Đã kích hoạt",
        description: `Đã kích hoạt cho ${payment.display_name || payment.user_email || "user"}`,
      });
      fetchAll();
    } catch (err: any) {
      console.error('[Admin] Verify exception:', err);
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
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-display font-bold text-foreground">
            ⚙️ Admin Panel - Tử Vi App
          </h1>
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
              <p className="text-2xl font-bold text-foreground">
                {loadingStats ? "..." : pendingCount}
              </p>
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
              <p className="text-2xl font-bold text-foreground">
                {loadingStats ? "..." : activeUsers}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Chờ xác nhận 🔔</TabsTrigger>
            <TabsTrigger value="history">Lịch sử ✅</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
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
                    {pendingPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Không có giao dịch chờ xác nhận
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingPayments.map((p) => (
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
                          <TableCell className="text-xs whitespace-normal break-words">{p.transfer_content || "—"}</TableCell>
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
                                  <><CheckCircle className="h-3 w-3 mr-1" />Xác nhận</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                disabled={actionLoading === p.id}
                                onClick={() => handleReject(p)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />Từ chối
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
