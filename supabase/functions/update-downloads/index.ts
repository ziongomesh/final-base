import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { admin_id, session_token, cnh_iphone, cnh_apk, govbr_iphone, govbr_apk, abafe_apk, abafe_iphone } = await req.json();

    // Validar sessão
    const { data: valid } = await supabase.rpc("is_valid_admin", {
      p_admin_id: admin_id,
      p_session_token: session_token,
    });

    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é dono
    const { data: adminData } = await supabase
      .from("admins")
      .select("rank")
      .eq("id", admin_id)
      .maybeSingle();

    if (adminData?.rank !== "dono") {
      return new Response(
        JSON.stringify({ error: "Sem permissão" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("downloads")
      .update({
        cnh_iphone: cnh_iphone || "",
        cnh_apk: cnh_apk || "",
        govbr_iphone: govbr_iphone || "",
        govbr_apk: govbr_apk || "",
        abafe_apk: abafe_apk || "",
        abafe_iphone: abafe_iphone || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
