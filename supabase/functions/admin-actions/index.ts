import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS
// ============================================================
const ALLOWED_ORIGINS = [
  "https://ai-tuvi.lovable.app",
  "https://preview--ai-tuvi.lovable.app",
  "https://tuviapp.vn",
  "https://www.tuviapp.vn",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
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
// Audit log helper
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

// ============================================================
// UNIFIED CREDITS: Map payment amount → credits
// ============================================================
function getCreditsForAmount(amount: number): number {
  if (amount >= 99000) return 10;
  if (amount >= 59000) return 5;
  if (amount >= 39000) return 3;
  return 3; // fallback
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
    // Auth check
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

    // Check admin_users table
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
        adminClient.from("user_credits").select("user_id"),
      ]);

      const revenue = (revenueRes.data ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
      const uniqueUsers = new Set((usersRes.data ?? []).map((r: any) => r.user_id));

      await logAdminAction(adminClient, user.email!, adminRecord.id, "get_stats", null, null, null, req);

      return new Response(
        JSON.stringify({ pendingCount: pendingRes.count ?? 0, monthRevenue: revenue, activeUsers: uniqueUsers.size }),
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
    // VERIFY — UNIFIED CREDITS: add credits instead of per-feature packages
    // ══════════════════════════════════════════════════════════════
    if (action === "verify") {
      const { paymentId, userId, feature, expiresAt, paymentRef } = params;

      // Get payment amount to determine credits
      const { data: paymentData } = await adminClient.from("payments").select("amount").eq("id", paymentId).single();

      const { error: updateErr } = await adminClient
        .from("payments")
        .update({ status: "verified", verified_at: new Date().toISOString(), verified_by: user.id })
        .in("status", ["pending", "expired"])
        .eq("id", paymentId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Premium features still use user_features table
      if (feature === "premium_monthly" || feature === "premium_yearly") {
        const { error: featErr } = await adminClient
          .from("user_features")
          .insert({ user_id: userId, feature: "premium", expires_at: expiresAt, payment_ref: paymentRef });
        if (featErr) console.error("[verify] user_features error:", featErr);
        else console.log("[verify] ✅ premium feature created");
      } else {
        // All other features: add credits via RPC
        const credits = getCreditsForAmount(paymentData?.amount ?? 39000);
        const { data: result, error: creditErr } = await adminClient.rpc("add_credits", {
          p_user_id: userId,
          p_amount: credits,
          p_source: "vietqr",
          p_metadata: JSON.stringify({
            payment_id: paymentId,
            feature: feature,
            verified_by: user.email,
            admin_verify: true,
          }),
        });

        if (creditErr) {
          console.error("[verify] add_credits error:", creditErr);
        } else {
          console.log(`[verify] ✅ Added ${credits} credits for user ${userId}`);
        }
      }

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "verify",
        "payments",
        paymentId,
        { userId, feature, paymentId },
        req,
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // REJECT — works for pending and expired
    // ============================================================
    if (action === "reject") {
      await adminClient
        .from("payments")
        .update({ status: "rejected", verified_at: new Date().toISOString(), verified_by: user.id })
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

    // ============================================================
    // GET CREDIT INFO — replaces get_luan_giai_packages
    // ============================================================
    if (action === "get_credits") {
      const { data } = await adminClient
        .from("user_credits")
        .select("*")
        .order("updated_at", { ascending: false })
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

    // Keep legacy endpoint for backward compatibility
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

    // ============================================================
    // CONFIRM LUAN GIAI (legacy — keep for old pending packages)
    // ============================================================
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

    // ══════════════════════════════════════════════════════════════
    // GRANT CREDITS — replaces grant_package (unified)
    // ══════════════════════════════════════════════════════════════
    if (action === "grant_credits") {
      const { email, credits } = params;
      const numCredits = credits ?? 3;

      // Find user
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

      const { data: result, error: creditErr } = await adminClient.rpc("add_credits", {
        p_user_id: targetUser.id,
        p_amount: numCredits,
        p_source: "admin",
        p_metadata: JSON.stringify({
          granted_by: user.email,
          reason: "admin_grant",
          granted_at: new Date().toISOString(),
        }),
      });

      if (creditErr) {
        return new Response(JSON.stringify({ error: creditErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "grant_credits",
        "user_credits",
        targetUser.id,
        { targetEmail: email, credits: numCredits },
        req,
      );

      return new Response(JSON.stringify({ success: true, user: targetUser, credits: numCredits }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Keep legacy grant_package for backward compat
    if (action === "grant_package") {
      const { email, feature, uses } = params;
      const numCredits = uses ?? 3;

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

      // Redirect to unified credits
      const { error: creditErr } = await adminClient.rpc("add_credits", {
        p_user_id: targetUser.id,
        p_amount: numCredits,
        p_source: "admin",
        p_metadata: JSON.stringify({
          granted_by: user.email,
          legacy_feature: feature,
          reason: "admin_grant_legacy",
        }),
      });

      if (creditErr) {
        return new Response(JSON.stringify({ error: creditErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "grant_credits",
        "user_credits",
        targetUser.id,
        { targetEmail: email, feature, credits: numCredits },
        req,
      );

      return new Response(JSON.stringify({ success: true, user: targetUser }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ══════════════════════════════════════════════════════════════
    // RESET USER — includes user_credits + credit_transactions
    // ══════════════════════════════════════════════════════════════
    if (action === "reset_user") {
      const { email } = params;

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
      const uid = targetUser.id;

      const deleted: Record<string, number> = {};

      // 1. Nullify FK: chart_analyses.payment_id → payments
      await adminClient.from("chart_analyses").update({ payment_id: null }).eq("user_id", uid);

      // 2. Analyses
      for (const table of ["van_han_analyses", "kieu_analyses", "boi_que_analyses", "chart_analyses"]) {
        const { count } = await adminClient.from(table).delete({ count: "exact" }).eq("user_id", uid);
        deleted[table] = count ?? 0;
      }

      // 3. Legacy packages (keep for cleanup)
      for (const table of ["van_han_packages", "kieu_packages", "boi_que_packages", "luan_giai_packages"]) {
        const { count } = await adminClient.from(table).delete({ count: "exact" }).eq("user_id", uid);
        deleted[table] = count ?? 0;
      }

      // 4. UNIFIED CREDITS
      const { count: creditTxCount } = await adminClient
        .from("credit_transactions")
        .delete({ count: "exact" })
        .eq("user_id", uid);
      deleted["credit_transactions"] = creditTxCount ?? 0;

      const { count: creditCount } = await adminClient
        .from("user_credits")
        .delete({ count: "exact" })
        .eq("user_id", uid);
      deleted["user_credits"] = creditCount ?? 0;

      // 5. User features
      const { count: featCount } = await adminClient
        .from("user_features")
        .delete({ count: "exact" })
        .eq("user_id", uid);
      deleted["user_features"] = featCount ?? 0;

      // 6. Payments last
      const { count: payCount } = await adminClient.from("payments").delete({ count: "exact" }).eq("user_id", uid);
      deleted["payments"] = payCount ?? 0;

      const total = Object.values(deleted).reduce((a, b) => a + b, 0);

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "reset_user",
        "profiles",
        uid,
        { targetEmail: email, deleted, total },
        req,
      );

      return new Response(JSON.stringify({ success: true, user: targetUser, deleted: { ...deleted, total } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // SEARCH USERS
    // ============================================================
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
