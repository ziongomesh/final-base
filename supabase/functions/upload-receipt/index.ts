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

    const body = await req.json();
    const { admin_id, session_token, plan_id, plan_name, credits, amount, receipt_base64 } = body;

    // Validate session
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

    // Upload receipt image to storage
    const fileName = `receipts/${admin_id}_${Date.now()}.jpg`;
    const imageData = Uint8Array.from(atob(receipt_base64), c => c.charCodeAt(0));
    
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, imageData, { contentType: "image/jpeg", upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    const receiptUrl = urlData.publicUrl;

    // Insert receipt record
    const { data: receipt, error: insertError } = await supabase
      .from("recharge_receipts")
      .insert({
        admin_id,
        plan_id: plan_id || null,
        plan_name: plan_name || "",
        credits: credits || 0,
        amount: amount || 0,
        receipt_url: receiptUrl,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, receipt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
