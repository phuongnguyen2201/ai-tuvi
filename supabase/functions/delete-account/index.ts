import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Tables that store user data and have a user_id column.
const USER_TABLES = [
  "credit_transactions",
  "user_credits",
  "chart_analyses",
  "van_han_analyses",
  "van_han_packages",
  "kieu_analyses",
  "kieu_packages",
  "boi_que_analyses",
  "boi_que_packages",
  "luan_giai_packages",
  "compatibility_checks",
  "day_analyses",
  "tuvi_readings",
  "user_features",
  "payments",
  "api_rate_limits",
  "users",
  "profiles",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Authenticate caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // Confirmation guard
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    if (body?.confirmation !== "DELETE") {
      return json({ error: "Invalid confirmation" }, 400);
    }

    // Service-role client for cleanup
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const errors: Record<string, string> = {};
    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) {
        // profiles.id is the user_id (no user_id column) — try id fallback
        if (table === "profiles") {
          const { error: e2 } = await admin.from("profiles").delete().eq("id", userId);
          if (e2) errors[table] = e2.message;
        } else if (table === "users") {
          const { error: e2 } = await admin.from("users").delete().eq("id", userId);
          if (e2) errors[table] = e2.message;
        } else {
          errors[table] = error.message;
        }
      }
    }

    // Finally remove the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("[delete-account] auth delete failed", delErr);
      return json({ error: "Failed to delete auth user", details: delErr.message, tableErrors: errors }, 500);
    }

    return json({ success: true, tableErrors: errors });
  } catch (e) {
    console.error("[delete-account] error", e);
    return json({ error: (e as Error).message ?? "Unknown error" }, 500);
  }
});