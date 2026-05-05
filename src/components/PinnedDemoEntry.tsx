import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinnedDemoEntryProps {
  isViewing: boolean;
  loading?: boolean;
  onClick: () => void;
  /** Optional override label, defaults to standard demo person */
  label?: string;
  subtitle?: string;
}

/**
 * A pinned "Ví dụ mẫu" entry shown at the top of every AI feature history list
 * for logged-in users. Clicking it loads the demo example.
 */
export function PinnedDemoEntry({
  isViewing,
  loading = false,
  onClick,
  label = "Ví dụ mẫu (Nguyễn Văn A)",
  subtitle = "01/01/1990, giờ Dần, Nam",
}: PinnedDemoEntryProps) {
  return (
    <div
      onClick={loading ? undefined : onClick}
      className={cn(
        "rounded-xl p-3 border cursor-pointer transition-colors",
        "border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-orange-950/20",
        "hover:border-amber-400/70",
        isViewing && "ring-2 ring-amber-400/50",
        loading && "opacity-60 cursor-wait",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Pin className="w-4 h-4 text-amber-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">
              MẪU
            </span>
            <p className="text-sm font-medium text-amber-100 truncate">{label}</p>
          </div>
          <p className="text-xs text-amber-200/70 truncate">{subtitle}</p>
        </div>
        {isViewing && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-100 font-medium">
            Đang xem
          </span>
        )}
      </div>
    </div>
  );
}

export default PinnedDemoEntry;