import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Mail } from "lucide-react";

const DeleteAccount = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendDeleteRequest = async (userEmail: string, userId?: string) => {
    setLoading(true);
    try {
      const subject = encodeURIComponent("Yêu cầu xóa tài khoản - AI Tử Vi");
      const body = encodeURIComponent(
        `Yêu cầu xóa tài khoản:\n\nEmail: ${userEmail}${userId ? `\nUser ID: ${userId}` : ""}\n\nVui lòng xóa toàn bộ dữ liệu liên quan đến tài khoản này.`
      );
      window.open(`mailto:ai.tuvi.app@gmail.com?subject=${subject}&body=${body}`, "_blank");

      toast({
        title: "Đã mở email",
        description: "Vui lòng gửi email để hoàn tất yêu cầu xóa tài khoản.",
      });

      if (user) {
        await signOut();
      }
    } catch {
      toast({
        title: "Có lỗi xảy ra",
        description: "Vui lòng thử lại hoặc gửi email trực tiếp tới ai.tuvi.app@gmail.com",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    sendDeleteRequest(email.trim());
  };

  return (
    <PageLayout title="Yêu Cầu Xóa Tài Khoản" showBack={true}>
      <div className="space-y-8 pb-12">
        {/* Mô tả */}
        <section>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Khi bạn yêu cầu xóa tài khoản, chúng tôi sẽ xóa toàn bộ dữ liệu cá nhân bao gồm:
            </p>
            <ul className="text-sm text-foreground space-y-2 ml-4">
              <li className="list-disc">Email đăng ký</li>
              <li className="list-disc">Lịch sử lá số tử vi</li>
              <li className="list-disc">Lịch sử thanh toán</li>
              <li className="list-disc">Các gói dịch vụ đã mua</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Quá trình xóa sẽ được xử lý trong vòng 7 ngày làm việc.
            </p>
          </div>
        </section>

        {/* Action */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {user ? "Xóa tài khoản" : "Gửi yêu cầu xóa"}
          </h2>

          {user ? (
            <div className="bg-surface-2 rounded-lg p-4 space-y-4">
              <p className="text-sm text-foreground">
                Bạn đang đăng nhập với email: <strong>{user.email}</strong>
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2" disabled={loading}>
                    <Trash2 className="h-4 w-4" />
                    Xóa tài khoản của tôi
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể hoàn tác. Toàn bộ dữ liệu cá nhân của bạn sẽ bị xóa
                      vĩnh viễn, bao gồm lá số, lịch sử thanh toán và gói dịch vụ.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => sendDeleteRequest(user.email!, user.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Xác nhận xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="bg-surface-2 rounded-lg p-4 space-y-4">
              <p className="text-sm text-foreground">
                Nhập email bạn đã đăng ký để gửi yêu cầu xóa tài khoản.
              </p>
              <form onSubmit={handleGuestSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" variant="destructive" className="gap-2" disabled={loading || !email.trim()}>
                  <Mail className="h-4 w-4" />
                  Gửi yêu cầu xóa
                </Button>
              </form>
            </div>
          )}
        </section>

        {/* Liên hệ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Liên Hệ</h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-2">
            <p className="text-sm text-foreground">
              Nếu bạn cần hỗ trợ thêm:
            </p>
            <div className="space-y-2 ml-4">
              <p className="text-sm text-foreground">
                <strong>Email:</strong> ai.tuvi.app@gmail.com
              </p>
              <p className="text-sm text-foreground">
                <strong>Zalo:</strong> 0702127233
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-border pt-6 mt-8">
          <p className="text-xs text-muted-foreground text-center">
            © 2024-2026 Tử Vi Việt Nam. Mọi quyền được bảo lưu.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default DeleteAccount;
