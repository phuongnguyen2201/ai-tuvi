import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface VietQRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  onSuccess: () => void;
}

const VietQRPaymentModal = ({ open, onOpenChange, feature, onSuccess }: VietQRPaymentModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán QR</DialogTitle>
          <DialogDescription>
            Quét mã QR để thanh toán cho tính năng: {feature}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            QR payment integration coming soon...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VietQRPaymentModal;
