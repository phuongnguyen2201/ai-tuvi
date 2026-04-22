import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, Settings, AlertTriangle } from "lucide-react";

const DeleteAccount = () => {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user && !isGuest;

  return (
    <PageLayout title="Xóa tài khoản" showBack={true}>
      <div className="space-y-6 pb-12">
        <section className="bg-surface-2 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Bạn có thể tự xóa tài khoản trực tiếp trong ứng dụng. Hành động này
                sẽ xóa vĩnh viễn toàn bộ dữ liệu của bạn: lá số đã lập, credits còn
                lại, lịch sử luận giải và thanh toán.
              </p>
              <p className="text-xs text-muted-foreground">
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Cách xóa tài khoản</h2>
          <ol className="text-sm text-foreground space-y-2 ml-5 list-decimal">
            <li>Đăng nhập vào tài khoản của bạn</li>
            <li>Mở mục <strong>Hồ sơ cá nhân</strong></li>
            <li>Cuộn xuống phần <strong>Vùng nguy hiểm</strong></li>
            <li>Nhấn <strong>Xóa tài khoản</strong> và xác nhận</li>
          </ol>
        </section>

        <section>
          {isLoggedIn ? (
            <Button
              variant="destructive"
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate("/profile")}
            >
              <Settings className="h-4 w-4" />
              Đi tới cài đặt tài khoản
            </Button>
          ) : (
            <Button
              variant="gold"
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập để xóa tài khoản
            </Button>
          )}
        </section>

        <section className="bg-surface-2 rounded-lg p-4">
          <p className="text-sm text-foreground">
            Nếu gặp khó khăn, liên hệ{" "}
            <a
              href="mailto:ai.tuvi.app@gmail.com"
              className="text-gold underline underline-offset-2"
            >
              ai.tuvi.app@gmail.com
            </a>
          </p>
        </section>
      </div>
    </PageLayout>
  );
};

export default DeleteAccount;
