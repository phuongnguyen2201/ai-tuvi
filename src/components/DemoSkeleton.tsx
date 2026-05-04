import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DemoSkeletonProps {
  /** Optional title shown in the loading card. */
  title?: string;
  /** Number of skeleton paragraph lines. */
  lines?: number;
}

/**
 * Placeholder shown while a demo example is being fetched, so users
 * don't see an empty gap between clicking the CTA and the sample output.
 */
export function DemoSkeleton({
  title = "Đang tải ví dụ mẫu...",
  lines = 8,
}: DemoSkeletonProps) {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Đang tải ví dụ mẫu"
    >
      {/* Banner skeleton */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-orange-950/20 p-4 flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-lg animate-pulse">
          🔍
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4 bg-amber-500/20" />
          <Skeleton className="h-3 w-1/2 bg-amber-500/15" />
        </div>
      </div>

      {/* Result card skeleton */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-display text-lg text-primary">{title}</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-3"
              style={{
                width: `${70 + ((i * 13) % 30)}%`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DemoSkeleton;