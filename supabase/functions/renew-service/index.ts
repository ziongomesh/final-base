import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const { admin_id, session_token, record_id, service_type } = await req.json();

    if (!admin_id || !session_token || !record_id || !service_type) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate session
    const { data: validSession } = await supabase.rpc("is_valid_admin", {
      p_admin_id: admin_id,
      p_session_token: session_token,
    });

    if (!validSession) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check credits
    const { data: adminData } = await supabase
      .from("admins")
      .select("creditos")
      .eq("id", admin_id)
      .single();

    if (!adminData || adminData.creditos < 1) {
      return new Response(
        JSON.stringify({ error: "Créditos insuficientes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const table = service_type === "cnh" ? "usuarios" : "usuarios_rg";

    // Get current record
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select("id, admin_id, data_expiracao")
      .eq("id", record_id)
      .eq("admin_id", admin_id)
      .single();

    if (fetchError || !record) {
      return new Response(
        JSON.stringify({ error: "Registro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate new expiration: from current expiration or now, +45 days
    const currentExp = record.data_expiracao ? new Date(record.data_expiracao) : new Date();
    const base = currentExp > new Date() ? currentExp : new Date();
    const newExpiration = new Date(base.getTime() + 45 * 24 * 60 * 60 * 1000);

    // Update expiration
    const { error: updateError } = await supabase
      .from(table)
      .update({ data_expiracao: newExpiration.toISOString() })
      .eq("id", record_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar expiração", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct 1 credit
    const { error: creditError } = await supabase
      .from("admins")
      .update({ creditos: adminData.creditos - 1 })
      .eq("id", admin_id);

    if (creditError) {
      console.error("Erro ao deduzir crédito:", creditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        newExpiration: newExpiration.toISOString(),
        creditsRemaining: adminData.creditos - 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
