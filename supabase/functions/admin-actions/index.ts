import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// SEC-002 FIX #1: Restricted CORS (thay vì wildcard *)
// ============================================================
const ALLOWED_ORIGINS = [
  "https://ai-tuvi.lovable.app",
  "https://preview--ai-tuvi.lovable.app",
  // Thêm custom domain nếu có:
  // "https://tuvi.vn",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// ============================================================
// SEC-002 FIX #3: Audit log helper
// ============================================================
async function logAdminAction(
  adminClient: any,
  adminEmail: string,
  adminId: string | null,
  action: string,
  targetTable: string | null,
  targetId: string | null,
  details: any,
  req: Request,
) {
  try {
    await adminClient.from("admin_audit_log").insert({
      admin_user_id: adminId,
      admin_email: adminEmail,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown",
    });
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ============================================================
    // SEC-002 FIX #2: Server-side admin check via DATABASE
    // ============================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await anonClient.auth.getUser();

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin_users table (service_role bypasses RLS)
    const { data: adminRecord, error: adminErr } = await adminClient
      .from("admin_users")
      .select("id, email, role")
      .eq("email", user.email)
      .single();

    if (adminErr || !adminRecord) {
      console.warn(`Unauthorized admin attempt: ${user.email}`);
      await logAdminAction(
        adminClient,
        user.email ?? "unknown",
        null,
        "UNAUTHORIZED_ATTEMPT",
        null,
        null,
        { attempted_from: req.headers.get("origin") },
        req,
      );
      return new Response(JSON.stringify({ error: "Unauthorized — not an admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Link user_id nếu chưa có
    if (!adminRecord.user_id) {
      await adminClient.from("admin_users").update({ user_id: user.id }).eq("id", adminRecord.id);
    }

    // ============================================================
    // PARSE ACTION
    // ============================================================
    const { action, ...params } = await req.json();

    // ============================================================
    // GET STATS
    // ============================================================
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

      await logAdminAction(adminClient, user.email!, adminRecord.id, "get_stats", null, null, null, req);

      return new Response(
        JSON.stringify({
          pendingCount: pendingRes.count ?? 0,
          monthRevenue: revenue,
          activeUsers: uniqueUsers.size,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ============================================================
    // GET PENDING — includes expired payments from last 7 days
    // ============================================================
    if (action === "get_pending") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await adminClient
        .from("payments")
        .select("*")
        .in("status", ["pending", "expired"])
        .gte("created_at", sevenDaysAgo)
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

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "get_pending",
        "payments",
        null,
        { count: result.length },
        req,
      );

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // GET HISTORY
    // ============================================================
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
    // Now accepts both "pending" and "expired" payments
    // ══════════════════════════════════════════════════════════════
    if (action === "verify") {
      const { paymentId, userId, feature, expiresAt, paymentRef } = params;

      // 1) Mark payment as verified (accept pending OR expired)
      const { error: updateErr, count } = await adminClient
        .from("payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .in("status", ["pending", "expired"])
        .eq("id", paymentId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2) Create feature-specific package/record
      if (feature === "luan_giai") {
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
              payment_id: paymentId,
            })
            .select("id")
            .single();
          console.log("[verify] ✅ luan_giai_packages created:", insertedPkg?.id);
        }
      } else if (["van_han_week", "van_han_month", "van_han_year"].includes(feature)) {
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

      // Audit log
      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "verify",
        "payments",
        paymentId,
        { userId, feature, paymentId, wasExpired: true },
        req,
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // REJECT — now also works for expired payments
    // ============================================================
    if (action === "reject") {
      await adminClient
        .from("payments")
        .update({
          status: "rejected",
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .in("status", ["pending", "expired"])
        .eq("id", params.paymentId);

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "reject",
        "payments",
        params.paymentId,
        { paymentId: params.paymentId },
        req,
      );

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

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "confirm_luan_giai",
        "luan_giai_packages",
        packageId,
        { packageId },
        req,
      );

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

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "add_luan_giai_uses",
        "luan_giai_packages",
        packageId,
        { packageId, addUses: addUses ?? 3 },
        req,
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grant_luan_giai") {
      const { email, uses } = params;
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

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "grant_luan_giai",
        "luan_giai_packages",
        targetUser.id,
        { targetEmail: email, uses: uses ?? 3 },
        req,
      );

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
    const corsHeaders = getCorsHeaders(req);
    console.error("Admin action error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
