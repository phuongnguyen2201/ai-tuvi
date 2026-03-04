import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["phuongnguyen2201@gmail.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin
    const authHeader = req.headers.get("Authorization")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await anonClient.auth.getUser();
    if (authErr || !user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { action, ...params } = await req.json();

    if (action === "get_stats") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [pendingRes, revenueRes, usersRes] = await Promise.all([
        adminClient.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        adminClient
          .from("payments")
          .select("amount")
          .eq("status", "verified")
          .gte("created_at", startOfMonth.toISOString()),
        adminClient.from("user_features").select("user_id"),
      ]);

      const revenue = (revenueRes.data ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
      const uniqueUsers = new Set((usersRes.data ?? []).map((r: any) => r.user_id));

      return new Response(
        JSON.stringify({
          pendingCount: pendingRes.count ?? 0,
          monthRevenue: revenue,
          activeUsers: uniqueUsers.size,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "get_pending") {
      const { data } = await adminClient
        .from("payments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const userIds = [...new Set((data ?? []).map((p: any) => p.user_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds);
        (profiles ?? []).forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      const result = (data ?? []).map((p: any) => ({
        ...p,
        display_name: p.user_id ? profileMap[p.user_id]?.display_name : null,
        user_email: p.user_id ? profileMap[p.user_id]?.email : null,
      }));

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get_history") {
      const { data } = await adminClient
        .from("payments")
        .select("*")
        .in("status", ["verified", "rejected"])
        .order("created_at", { ascending: false })
        .limit(50);

      const userIds = [...new Set((data ?? []).map((p: any) => p.user_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds);
        (profiles ?? []).forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      const result = (data ?? []).map((p: any) => ({
        ...p,
        display_name: p.user_id ? profileMap[p.user_id]?.display_name : null,
        user_email: p.user_id ? profileMap[p.user_id]?.email : null,
      }));

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ══════════════════════════════════════════════════════════════
    // VERIFY — Admin confirms a payment → create feature packages
    // ══════════════════════════════════════════════════════════════
    if (action === "verify") {
      const { paymentId, userId, feature, expiresAt, paymentRef } = params;

      // 1) Mark payment as verified
      const { error: updateErr } = await adminClient
        .from("payments")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", paymentId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2) Create feature-specific package/record
      if (feature === "luan_giai") {
        // ──────────────────────────────────────────────────────────
        // LUẬN GIẢI: luan_giai_packages (existing logic)
        // ──────────────────────────────────────────────────────────
        const { data: pendingPkgs } = await adminClient
          .from("luan_giai_packages")
          .select("id")
          .eq("user_id", userId)
          .eq("payment_status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);

        if (pendingPkgs && pendingPkgs.length > 0) {
          await adminClient
            .from("luan_giai_packages")
            .update({ payment_status: "confirmed", confirmed_at: new Date().toISOString() })
            .eq("id", pendingPkgs[0].id);
          console.log("[verify] ✅ luan_giai_packages confirmed:", pendingPkgs[0].id);
        } else {
          const { data: insertedPkg } = await adminClient
            .from("luan_giai_packages")
            .insert({
              user_id: userId,
              total_uses: 3,
              remaining_uses: 3,
              amount: 39000,
              payment_status: "confirmed",
              confirmed_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          console.log("[verify] ✅ luan_giai_packages created:", insertedPkg?.id);
        }
      } else if (["van_han_week", "van_han_month", "van_han_year"].includes(feature)) {
        // ──────────────────────────────────────────────────────────
        // VẬN HẠN: van_han_packages (3 uses each)
        // ──────────────────────────────────────────────────────────
        const usesMap: Record<string, number> = { van_han_week: 3, van_han_month: 3, van_han_year: 3 };
        const timeFrameMap: Record<string, string> = {
          van_han_week: "week",
          van_han_month: "month",
          van_han_year: "year",
        };
        const { data: insertedPkg, error: pkgErr } = await adminClient
          .from("van_han_packages")
          .insert({
            user_id: userId,
            payment_id: paymentId,
            time_frame: timeFrameMap[feature],
            uses_total: usesMap[feature],
            uses_remaining: usesMap[feature],
          })
          .select("id")
          .single();
        if (pkgErr) {
          console.error("[verify] van_han_packages insert error:", pkgErr);
        } else {
          console.log(
            "[verify] ✅ van_han_packages created:",
            insertedPkg?.id,
            "time_frame:",
            timeFrameMap[feature],
            "uses:",
            usesMap[feature],
          );
        }
      } else if (feature === "boi_kieu") {
        // ──────────────────────────────────────────────────────────
        // BÓI KIỀU: kieu_packages (3 uses)
        // ──────────────────────────────────────────────────────────
        const uses = 3;
        const { data: insertedPkg, error: kieuPkgErr } = await adminClient
          .from("kieu_packages")
          .insert({
            user_id: userId,
            payment_id: paymentId,
            uses_total: uses,
            uses_remaining: uses,
          })
          .select("id")
          .single();
        if (kieuPkgErr) {
          console.error("[verify] kieu_packages insert error:", kieuPkgErr);
        } else {
          console.log("[verify] ✅ kieu_packages created:", insertedPkg?.id, "uses:", uses);
        }
      } else if (feature === "boi_que") {
        // ──────────────────────────────────────────────────────────
        // BÓI QUẺ: boi_que_packages (3 uses)
        // ──────────────────────────────────────────────────────────
        const uses = 3;
        const { data: insertedPkg, error: quePkgErr } = await adminClient
          .from("boi_que_packages")
          .insert({
            user_id: userId,
            payment_id: paymentId,
            uses_total: uses,
            uses_remaining: uses,
          })
          .select("id")
          .single();
        if (quePkgErr) {
          console.error("[verify] boi_que_packages insert error:", quePkgErr);
        } else {
          console.log("[verify] ✅ boi_que_packages created:", insertedPkg?.id, "uses:", uses);
        }
      } else {
        // ──────────────────────────────────────────────────────────
        // OTHER FEATURES: user_features (fallback, existing logic)
        // ──────────────────────────────────────────────────────────
        const { error: featErr } = await adminClient.from("user_features").insert({
          user_id: userId,
          feature,
          expires_at: expiresAt,
          payment_ref: paymentRef,
        });
        if (featErr) {
          console.error("[verify] user_features insert error:", featErr);
        } else {
          console.log("[verify] ✅ user_features created for feature:", feature);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await adminClient.from("payments").update({ status: "rejected" }).eq("id", params.paymentId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== LUAN GIAI PACKAGES MANAGEMENT ====================

    if (action === "get_luan_giai_packages") {
      const { data } = await adminClient
        .from("luan_giai_packages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      const userIds = [...new Set((data ?? []).map((p: any) => p.user_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds);
        (profiles ?? []).forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      const result = (data ?? []).map((p: any) => ({
        ...p,
        display_name: profileMap[p.user_id]?.display_name ?? null,
        user_email: profileMap[p.user_id]?.email ?? null,
      }));

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "confirm_luan_giai") {
      const { packageId } = params;
      const { error } = await adminClient
        .from("luan_giai_packages")
        .update({ payment_status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", packageId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "add_luan_giai_uses") {
      const { packageId, addUses } = params;
      const { data: pkg } = await adminClient
        .from("luan_giai_packages")
        .select("remaining_uses, total_uses")
        .eq("id", packageId)
        .single();

      if (!pkg) {
        return new Response(JSON.stringify({ error: "Package not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient
        .from("luan_giai_packages")
        .update({
          remaining_uses: pkg.remaining_uses + (addUses ?? 3),
          total_uses: pkg.total_uses + (addUses ?? 3),
        })
        .eq("id", packageId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grant_luan_giai") {
      const { email, uses } = params;
      // Find user by email
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, email, display_name")
        .eq("email", email)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ error: "Không tìm thấy user với email: " + email }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const targetUser = profiles[0];
      const { error } = await adminClient.from("luan_giai_packages").insert({
        user_id: targetUser.id,
        total_uses: uses ?? 3,
        remaining_uses: uses ?? 3,
        amount: 0,
        payment_status: "confirmed",
        confirmed_at: new Date().toISOString(),
        payment_method: "admin_grant",
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, user: targetUser }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search_users") {
      const { query } = params;
      const { data } = await adminClient
        .from("profiles")
        .select("id, email, display_name")
        .ilike("email", `%${query}%`)
        .limit(10);

      return new Response(JSON.stringify(data ?? []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
