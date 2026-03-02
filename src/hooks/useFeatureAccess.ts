import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAN_HAN_FEATURES = ["van_han_week", "van_han_month", "van_han_year"];
const TIME_FRAME_MAP: Record<string, string> = {
  van_han_week: "week",
  van_han_month: "month",
  van_han_year: "year",
};

export function useFeatureAccess(feature: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
        return;
      }

      // Check premium first
      const { data: premium } = await supabase
        .from("user_features")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("feature", "premium")
        .maybeSingle();

      if (premium && (!premium.expires_at || new Date(premium.expires_at) > new Date())) {
        console.log("[useFeatureAccess] Premium access granted");
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // ── van_han_packages ──
      if (VAN_HAN_FEATURES.includes(feature)) {
        // FIX: Use .limit(1).order() instead of .maybeSingle()
        // maybeSingle() throws error if multiple rows match (user bought multiple packages)
        // That error was silently swallowed, causing hasPkg = false
        const { data: pkgs, error: pkgErr } = await supabase
          .from("van_han_packages")
          .select("id, uses_remaining")
          .eq("user_id", user.id)
          .eq("time_frame", TIME_FRAME_MAP[feature])
          .gt("uses_remaining", 0)
          .order("created_at", { ascending: false })
          .limit(1);

        if (pkgErr) {
          console.error("[useFeatureAccess] van_han query ERROR:", pkgErr);
        }

        const pkg = pkgs && pkgs.length > 0 ? pkgs[0] : null;
        console.log("[useFeatureAccess] van_han pkg check:", {
          feature,
          hasPkg: !!pkg,
          remaining: pkg?.uses_remaining ?? 0,
          queryError: pkgErr?.message ?? null,
        });
        setHasAccess(!!pkg);
        setIsLoading(false);
        return;
      }

      // ── boi_que_packages ──
      if (feature === "boi_que") {
        const { data: pkgs, error: pkgErr } = await supabase
          .from("boi_que_packages")
          .select("id, uses_remaining")
          .eq("user_id", user.id)
          .gt("uses_remaining", 0)
          .order("created_at", { ascending: false })
          .limit(1);

        if (pkgErr) {
          console.error("[useFeatureAccess] boi_que query ERROR:", pkgErr);
        }

        const pkg = pkgs && pkgs.length > 0 ? pkgs[0] : null;
        console.log("[useFeatureAccess] boi_que pkg check:", {
          feature,
          hasPkg: !!pkg,
          remaining: pkg?.uses_remaining ?? 0,
          queryError: pkgErr?.message ?? null,
        });
        setHasAccess(!!pkg);
        setIsLoading(false);
        return;
      }

      // ── kieu_packages ──
      if (feature === "boi_kieu") {
        const { data: pkgs, error: pkgErr } = await supabase
          .from("kieu_packages")
          .select("id, uses_remaining")
          .eq("user_id", user.id)
          .gt("uses_remaining", 0)
          .order("created_at", { ascending: false })
          .limit(1);

        if (pkgErr) {
          console.error("[useFeatureAccess] kieu query ERROR:", pkgErr);
        }

        const pkg = pkgs && pkgs.length > 0 ? pkgs[0] : null;
        console.log("[useFeatureAccess] kieu pkg check:", {
          feature,
          hasPkg: !!pkg,
          remaining: pkg?.uses_remaining ?? 0,
          queryError: pkgErr?.message ?? null,
        });
        setHasAccess(!!pkg);
        setIsLoading(false);
        return;
      }

      // ── luan_giai_packages ──
      if (feature === "luan_giai") {
        const { data: pkgs, error: pkgErr } = await supabase
          .from("luan_giai_packages")
          .select("id, remaining_uses")
          .eq("user_id", user.id)
          .eq("payment_status", "confirmed")
          .gt("remaining_uses", 0)
          .order("created_at", { ascending: false })
          .limit(1);

        if (pkgErr) {
          console.error("[useFeatureAccess] luan_giai query ERROR:", pkgErr);
        }

        const pkg = pkgs && pkgs.length > 0 ? pkgs[0] : null;
        console.log("[useFeatureAccess] luan_giai pkg check:", {
          feature,
          hasPkg: !!pkg,
          remaining: pkg?.remaining_uses ?? 0,
          queryError: pkgErr?.message ?? null,
        });
        setHasAccess(!!pkg);
        setIsLoading(false);
        return;
      }

      // ── user_features (fallback) ──
      const { data, error: featErr } = await supabase
        .from("user_features")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("feature", feature)
        .maybeSingle();

      if (featErr) {
        console.error("[useFeatureAccess] user_features query ERROR:", featErr);
      }

      const isValid = data && (!data.expires_at || new Date(data.expires_at) > new Date());
      console.log("[useFeatureAccess] user_features check:", {
        feature,
        hasData: !!data,
        isValid,
        queryError: featErr?.message ?? null,
      });
      setHasAccess(!!isValid);
      setIsLoading(false);
    } finally {
      checkingRef.current = false;
    }
  }, [feature]);

  useEffect(() => {
    checkAccess();

    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    const extraChannels: ReturnType<typeof supabase.channel>[] = [];

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Listen for user_features changes
      channelRef = supabase
        .channel("user-features-" + user.id + "-" + feature)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_features",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("[useFeatureAccess] user_features change detected:", payload);
            checkAccess();
          },
        )
        .subscribe();

      // Listen for van_han_packages changes (INSERT + UPDATE)
      if (VAN_HAN_FEATURES.includes(feature)) {
        const vhChannel = supabase
          .channel("van-han-pkg-" + user.id + "-" + feature)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "van_han_packages",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("[useFeatureAccess] van_han_packages change detected:", payload);
              checkAccess();
            },
          )
          .subscribe((status) => {
            console.log("[useFeatureAccess] van_han realtime status:", status);
          });
        extraChannels.push(vhChannel);
      }

      // Listen for boi_que_packages changes
      if (feature === "boi_que") {
        const bqChannel = supabase
          .channel("boi-que-pkg-" + user.id)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "boi_que_packages",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("[useFeatureAccess] boi_que_packages change detected:", payload);
              checkAccess();
            },
          )
          .subscribe();
        extraChannels.push(bqChannel);
      }

      // Listen for kieu_packages changes
      if (feature === "boi_kieu") {
        const kieuChannel = supabase
          .channel("kieu-pkg-" + user.id)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "kieu_packages",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("[useFeatureAccess] kieu_packages change detected:", payload);
              checkAccess();
            },
          )
          .subscribe();
        extraChannels.push(kieuChannel);
      }

      // Listen for luan_giai_packages changes
      if (feature === "luan_giai") {
        const lgChannel = supabase
          .channel("luan-giai-pkg-" + user.id)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "luan_giai_packages",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("[useFeatureAccess] luan_giai_packages change detected:", payload);
              checkAccess();
            },
          )
          .subscribe();
        extraChannels.push(lgChannel);
      }
    });

    // Re-check on window focus (user returns from another tab/admin panel)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[useFeatureAccess] Page became visible, re-checking:", feature);
        checkAccess();
      }
    };

    const handleFocus = () => {
      console.log("[useFeatureAccess] Window focused, re-checking:", feature);
      checkAccess();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
      extraChannels.forEach((ch) => supabase.removeChannel(ch));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [feature, checkAccess]);

  return { hasAccess, isLoading, refresh: checkAccess };
}
