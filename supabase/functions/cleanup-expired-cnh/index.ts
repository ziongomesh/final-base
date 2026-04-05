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

    // Buscar CNHs expiradas
    const { data: expired, error: fetchErr } = await supabase
      .from("usuarios")
      .select("id, cpf")
      .lt("data_expiracao", new Date().toISOString());

    if (fetchErr) {
      console.error("Fetch error:", fetchErr);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar expirados", details: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!expired || expired.length === 0) {
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: "Nenhuma CNH expirada" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let deletedCount = 0;

    for (const usuario of expired) {
      const cpf = usuario.cpf;

      // Apagar arquivos do storage (raiz do bucket uploads)
      const filesToDelete = [
        `${cpf}img1.png`,
        `${cpf}img2.png`,
        `${cpf}img3.png`,
        `${cpf}foto.png`,
        `${cpf}qrimg5.png`,
        `CNH_DIGITAL_${cpf}.pdf`,
      ];

      const { error: storageErr } = await supabase.storage
        .from("uploads")
        .remove(filesToDelete);

      if (storageErr) {
        console.error(`Storage delete error for CPF ${cpf}:`, storageErr);
      }

      // Apagar registro do banco
      const { error: deleteErr } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", usuario.id);

      if (deleteErr) {
        console.error(`DB delete error for ID ${usuario.id}:`, deleteErr);
      } else {
        deletedCount++;
      }
    }

    console.log(`Cleanup: ${deletedCount}/${expired.length} CNHs expiradas removidas`);

    return new Response(
      JSON.stringify({ success: true, deleted: deletedCount, total: expired.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Cleanup error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
