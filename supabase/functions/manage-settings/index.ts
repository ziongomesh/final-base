import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { admin_id, session_token, action, data } = body;

    // Validate session
    const { data: valid } = await supabase.rpc("is_valid_admin", {
      p_admin_id: admin_id,
      p_session_token: session_token,
    });
    if (!valid) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only dono can manage settings
    const { data: rank } = await supabase.rpc("get_admin_rank", {
      p_admin_id: admin_id,
    });
    if (rank !== "dono") {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get") {
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .single();

      return new Response(JSON.stringify(settings || {}), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_recarga_dobro") {
      const { error } = await supabase
        .from("platform_settings")
        .update({
          recarga_em_dobro: !!data?.enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data?.reseller_price !== undefined) updates.reseller_price = data.reseller_price;
      if (data?.reseller_credits !== undefined) updates.reseller_credits = data.reseller_credits;
      if (data?.credit_packages !== undefined) updates.credit_packages = data.credit_packages;

      const { error } = await supabase
        .from("platform_settings")
        .update(updates)
        .eq("id", 1);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
