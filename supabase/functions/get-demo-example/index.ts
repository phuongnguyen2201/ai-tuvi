// Public edge function — returns one demo_examples row by feature.
// No auth required: used to show demo content to guests / users with 0 credits.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_FEATURES = new Set([
  "luan_giai",
  "boi_kieu",
  "boi_que",
  "van_han_week",
  "van_han_month",
  "van_han_year",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let feature = "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      feature = String(body?.feature || "");
    } else {
      const url = new URL(req.url);
      feature = url.searchParams.get("feature") || "";
    }

    if (!ALLOWED_FEATURES.has(feature)) {
      return new Response(
        JSON.stringify({ error: "invalid_feature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("demo_examples")
      .select("feature, demo_person_name, demo_birth_date, demo_birth_hour, demo_gender, demo_output")
      .eq("feature", feature)
      .maybeSingle();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[get-demo-example] error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});