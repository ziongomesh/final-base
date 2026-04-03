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

    const { cpf, admin_id, session_token, service_type } = await req.json();

    // Validar sessão
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

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      return new Response(
        JSON.stringify({ exists: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check the relevant table based on service_type
    let exists = false;
    let creatorName = "";
    let creatorAdminId: number | null = null;
    let isOwn = false;
    let recordName = "";

    if (service_type === "rg") {
      const { data: existing } = await supabase
        .from("usuarios_rg")
        .select("id, nome, admin_id")
        .eq("cpf", cleanCpf)
        .maybeSingle();

      if (existing) {
        exists = true;
        recordName = existing.nome;
        creatorAdminId = existing.admin_id;
        isOwn = existing.admin_id === admin_id;
      }
    } else if (service_type === "cnh") {
      const { data: existing } = await supabase
        .from("usuarios")
        .select("id, nome, admin_id")
        .eq("cpf", cleanCpf)
        .maybeSingle();

      if (existing) {
        exists = true;
        recordName = existing.nome;
        creatorAdminId = existing.admin_id;
        isOwn = existing.admin_id === admin_id;
      }
    } else if (service_type === "nautica") {
      const { data: existing } = await supabase
        .from("chas")
        .select("id, nome, admin_id")
        .eq("cpf", cleanCpf)
        .maybeSingle();

      if (existing) {
        exists = true;
        recordName = existing.nome;
        creatorAdminId = existing.admin_id;
        isOwn = existing.admin_id === admin_id;
      }
    } else if (service_type === "estudante") {
      const { data: existing } = await supabase
        .from("carteira_estudante")
        .select("id, nome, admin_id")
        .eq("cpf", cleanCpf)
        .maybeSingle();

      if (existing) {
        exists = true;
        recordName = existing.nome;
        creatorAdminId = existing.admin_id;
        isOwn = existing.admin_id === admin_id;
      }
    }

    // Get creator name if exists
    if (exists && creatorAdminId) {
      const { data: creatorAdmin } = await supabase
        .from("admins")
        .select("nome")
        .eq("id", creatorAdminId)
        .single();
      if (creatorAdmin) creatorName = creatorAdmin.nome;
    }

    return new Response(
      JSON.stringify({
        exists,
        record_name: recordName,
        creator_name: creatorName,
        creator_admin_id: creatorAdminId,
        is_own: isOwn,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
