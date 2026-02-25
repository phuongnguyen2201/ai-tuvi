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
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
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
        adminClient.from("payments").select("amount").eq("status", "verified").gte("created_at", startOfMonth.toISOString()),
        adminClient.from("user_features").select("user_id"),
      ]);

      const revenue = (revenueRes.data ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
      const uniqueUsers = new Set((usersRes.data ?? []).map((r: any) => r.user_id));

      return new Response(JSON.stringify({
        pendingCount: pendingRes.count ?? 0,
        monthRevenue: revenue,
        activeUsers: uniqueUsers.size,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
        const { data: profiles } = await adminClient.from("profiles").select("id, display_name, email").in("id", userIds);
        (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
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
        const { data: profiles } = await adminClient.from("profiles").select("id, display_name, email").in("id", userIds);
        (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      const result = (data ?? []).map((p: any) => ({
        ...p,
        display_name: p.user_id ? profileMap[p.user_id]?.display_name : null,
        user_email: p.user_id ? profileMap[p.user_id]?.email : null,
      }));

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify") {
      const { paymentId, userId, feature, expiresAt, paymentRef } = params;

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

      // For luan_giai: parse metadata from payment notes, call Claude, save to chart_analyses
      if (feature === "luan_giai") {
        const { data: payment } = await adminClient.from("payments").select("notes").eq("id", paymentId).single();
        let metadata: any = null;
        try { metadata = payment?.notes ? JSON.parse(payment.notes) : null; } catch {}

        if (metadata?.chartHash) {
          // Call Claude via analyze-chart function
          const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-chart`;
          try {
            // Get chart data - we need to build it from the birth data
            const analyzeRes = await fetch(analyzeUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                chartHash: metadata.chartHash,
                birthDate: metadata.birthDate,
                birthHour: metadata.birthHour,
                gender: metadata.gender,
                calendarType: metadata.calendarType,
                analysisType: "full",
                userId,
                paymentId,
              }),
            });
            const analyzeData = await analyzeRes.json();
            
            if (analyzeData.success && analyzeData.analysis) {
              await adminClient.from("chart_analyses").insert({
                user_id: userId,
                payment_id: paymentId,
                chart_hash: metadata.chartHash,
                birth_data: {
                  birthDate: metadata.birthDate,
                  birthHour: metadata.birthHour,
                  gender: metadata.gender,
                  calendarType: metadata.calendarType,
                },
                chart_data: analyzeData.chartData || {},
                analysis_result: analyzeData.analysis,
                analysis_type: "full",
              });
            }
          } catch (e) {
            console.error("Error calling analyze-chart:", e);
            // Still proceed - admin can trigger analysis manually later
          }
        }

        // CRITICAL: Also insert into user_features so PaymentGate unlocks
        const { error: featureErr } = await adminClient.from("user_features").insert({
          user_id: userId,
          feature: "luan_giai",
          expires_at: null,
          payment_ref: paymentId,
        });
        if (featureErr) {
          console.error("Error inserting user_features for luan_giai:", featureErr);
        }
      } else {
        // For non-luan_giai features, add to user_features as before
        await adminClient.from("user_features").insert({
          user_id: userId,
          feature,
          expires_at: expiresAt,
          payment_ref: paymentRef,
        });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reject") {
      await adminClient.from("payments").update({ status: "rejected" }).eq("id", params.paymentId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
