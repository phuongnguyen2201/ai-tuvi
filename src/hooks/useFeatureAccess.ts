import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFeatureAccess(feature: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const checkingRef = useRef(false);

  const checkAccess = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      console.log("[useFeatureAccess] checkAccess called for feature:", feature);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("[useFeatureAccess] No user");
        setHasAccess(false);
        setCredits(0);
        setIsLoading(false);
        return;
      }

      // Check premium first (giữ nguyên)
      const { data: premium } = await supabase
        .from("user_features")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("feature", "premium")
        .maybeSingle();

      if (premium && (!premium.expires_at || new Date(premium.expires_at) > new Date())) {
        console.log("[useFeatureAccess] Premium access granted");
        setHasAccess(true);
        setCredits(999);
        setIsLoading(false);
        return;
      }

      // ── UNIFIED: Check user_credits ──
      const { data: creditData, error: creditErr } = await supabase
        .from("user_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .maybeSingle();

      if (creditErr) {
        console.error("[useFeatureAccess] user_credits query ERROR:", creditErr);
      }

      const remaining = creditData?.credits_remaining ?? 0;
      console.log("[useFeatureAccess] credit check:", {
        feature,
        credits_remaining: remaining,
      });

      setCredits(remaining);
      setHasAccess(remaining > 0);
      setIsLoading(false);
    } finally {
      checkingRef.current = false;
    }
  }, [feature]);

  useEffect(() => {
    checkAccess();

    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Listen for user_credits changes (1 channel thay vì 4)
      channelRef = supabase
        .channel("user-credits-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_credits",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("[useFeatureAccess] user_credits change detected:", payload);
            checkAccess();
          },
        )
        .subscribe();
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAccess();
      }
    };
    const handleFocus = () => checkAccess();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [feature, checkAccess]);

  return { hasAccess, isLoading, credits, refresh: checkAccess };
}
