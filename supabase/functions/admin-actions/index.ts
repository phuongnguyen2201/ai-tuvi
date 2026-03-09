import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS
// ============================================================
const ALLOWED_ORIGINS = ["https://ai-tuvi.lovable.app", "https://preview--ai-tuvi.lovable.app"];

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
        adminClient.from("user_features").select("user_id"),
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
    // VERIFY — accepts both "pending" and "expired" payments
    // ══════════════════════════════════════════════════════════════
    if (action === "verify") {
      const { paymentId, userId, feature, expiresAt, paymentRef } = params;

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

      // Create feature-specific package
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
        if (pkgErr) console.error("[verify] van_han_packages error:", pkgErr);
        else console.log("[verify] ✅ van_han_packages created:", insertedPkg?.id);
      } else if (feature === "boi_kieu") {
        const { data: insertedPkg, error: pkgErr } = await adminClient
          .from("kieu_packages")
          .insert({ user_id: userId, payment_id: paymentId, uses_total: 3, uses_remaining: 3 })
          .select("id")
          .single();
        if (pkgErr) console.error("[verify] kieu_packages error:", pkgErr);
        else console.log("[verify] ✅ kieu_packages created:", insertedPkg?.id);
      } else if (feature === "boi_que") {
        const { data: insertedPkg, error: pkgErr } = await adminClient
          .from("boi_que_packages")
          .insert({ user_id: userId, payment_id: paymentId, uses_total: 3, uses_remaining: 3 })
          .select("id")
          .single();
        if (pkgErr) console.error("[verify] boi_que_packages error:", pkgErr);
        else console.log("[verify] ✅ boi_que_packages created:", insertedPkg?.id);
      } else {
        const { error: featErr } = await adminClient
          .from("user_features")
          .insert({ user_id: userId, feature, expires_at: expiresAt, payment_ref: paymentRef });
        if (featErr) console.error("[verify] user_features error:", featErr);
        else console.log("[verify] ✅ user_features created for:", feature);
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
    // GET LUAN GIAI PACKAGES
    // ============================================================
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
    // CONFIRM LUAN GIAI
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
    // GRANT PACKAGE — cấp gói bất kỳ cho user (6 features)
    // ══════════════════════════════════════════════════════════════
    if (action === "grant_package") {
      const { email, feature, uses } = params;
      const numUses = uses ?? 3;

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

      let insertError: any = null;

      if (feature === "luan_giai") {
        const { error } = await adminClient.from("luan_giai_packages").insert({
          user_id: targetUser.id,
          total_uses: numUses,
          remaining_uses: numUses,
          amount: 0,
          payment_status: "confirmed",
          confirmed_at: new Date().toISOString(),
          payment_method: "admin_grant",
        });
        insertError = error;
      } else if (feature === "boi_kieu") {
        const { error } = await adminClient.from("kieu_packages").insert({
          user_id: targetUser.id,
          uses_total: numUses,
          uses_remaining: numUses,
        });
        insertError = error;
      } else if (feature === "boi_que") {
        const { error } = await adminClient.from("boi_que_packages").insert({
          user_id: targetUser.id,
          uses_total: numUses,
          uses_remaining: numUses,
        });
        insertError = error;
      } else if (["van_han_week", "van_han_month", "van_han_year"].includes(feature)) {
        const timeFrameMap: Record<string, string> = {
          van_han_week: "week",
          van_han_month: "month",
          van_han_year: "year",
        };
        const { error } = await adminClient.from("van_han_packages").insert({
          user_id: targetUser.id,
          time_frame: timeFrameMap[feature],
          uses_total: numUses,
          uses_remaining: numUses,
        });
        insertError = error;
      } else {
        return new Response(JSON.stringify({ error: "Unknown feature: " + feature }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await logAdminAction(
        adminClient,
        user.email!,
        adminRecord.id,
        "grant_package",
        feature,
        targetUser.id,
        { targetEmail: email, feature, uses: numUses },
        req,
      );

      return new Response(JSON.stringify({ success: true, user: targetUser }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ══════════════════════════════════════════════════════════════
    // RESET USER — xóa toàn bộ data, user trở về trạng thái mới
    // ══════════════════════════════════════════════════════════════
    if (action === "reset_user") {
      const { email } = params;

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
      const uid = targetUser.id;

      const deleted: Record<string, number> = {};

      // 1. Analyses (FK references packages)
      const tables1 = ["van_han_analyses", "kieu_analyses", "boi_que_analyses", "chart_analyses"];
      for (const table of tables1) {
        const { count } = await adminClient.from(table).delete({ count: "exact" }).eq("user_id", uid);
        deleted[table] = count ?? 0;
      }

      // 2. Nullify payment_id FK in chart_analyses (already deleted above, but safety)
      await adminClient
        .rpc("exec_sql", {
          query: `UPDATE chart_analyses SET payment_id = NULL WHERE payment_id IN (SELECT id FROM payments WHERE user_id = '${uid}')`,
        })
        .catch(() => {
          // If rpc not available, skip — chart_analyses already deleted
        });

      // 3. Packages
      const tables2 = ["van_han_packages", "kieu_packages", "boi_que_packages", "luan_giai_packages"];
      for (const table of tables2) {
        const { count } = await adminClient.from(table).delete({ count: "exact" }).eq("user_id", uid);
        deleted[table] = count ?? 0;
      }

      // 4. User features
      const { count: featCount } = await adminClient
        .from("user_features")
        .delete({ count: "exact" })
        .eq("user_id", uid);
      deleted["user_features"] = featCount ?? 0;

      // 5. Payments (last — other tables may FK to it)
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
