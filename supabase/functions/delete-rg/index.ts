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

    const { admin_id, session_token, rg_id } = await req.json();

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

    const { data: rg, error: fetchErr } = await supabase
      .from("usuarios_rg")
      .select("id, cpf, admin_id")
      .eq("id", rg_id)
      .maybeSingle();

    if (fetchErr || !rg) {
      return new Response(
        JSON.stringify({ error: "Registro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminData } = await supabase
      .from("admins")
      .select("rank")
      .eq("id", admin_id)
      .maybeSingle();

    if (adminData?.rank !== "dono" && rg.admin_id !== admin_id) {
      return new Response(
        JSON.stringify({ error: "Sem permissão" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cpf = rg.cpf;

    // Delete storage files
    const filesToDelete = [
      `rg_${cpf}_frente.png`,
      `rg_${cpf}_verso.png`,
      `rg_${cpf}_foto.png`,
      `rg_${cpf}_assinatura.png`,
      `rg_${cpf}_qrcode.png`,
      `RG_DIGITAL_${cpf}.pdf`,
    ];

    await supabase.storage.from("uploads").remove(filesToDelete);

    const { error: deleteErr } = await supabase
      .from("usuarios_rg")
      .delete()
      .eq("id", rg_id);

    if (deleteErr) {
      return new Response(
        JSON.stringify({ error: "Erro ao excluir", details: deleteErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete RG error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
