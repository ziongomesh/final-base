import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { admin_id, session_token, usuario_id } = await req.json();

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

    // Buscar registro
    const { data: usuario, error: fetchErr } = await supabase
      .from("usuarios")
      .select("id, cpf, admin_id")
      .eq("id", usuario_id)
      .maybeSingle();

    if (fetchErr || !usuario) {
      return new Response(
        JSON.stringify({ error: "Registro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar permissão (dono ou criador)
    const { data: adminData } = await supabase
      .from("admins")
      .select("rank")
      .eq("id", admin_id)
      .maybeSingle();

    if (adminData?.rank !== "dono" && usuario.admin_id !== admin_id) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para excluir este registro" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cpf = usuario.cpf;

    // Apagar arquivos do storage
    const filesToDelete = [
      `${cpf}img1.png`,
      `${cpf}img2.png`,
      `${cpf}img3.png`,
      `${cpf}foto.png`,
      `${cpf}qrimg5.png`,
      `CNH_DIGITAL_${cpf}.pdf`,
    ];

    await supabase.storage.from("uploads").remove(filesToDelete);

    // Apagar registro do banco
    const { error: deleteErr } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", usuario_id);

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
    console.error("Delete error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
