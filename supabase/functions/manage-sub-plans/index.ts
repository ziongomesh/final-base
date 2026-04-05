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
    const { action, admin_id, session_token, plan } = body;

    console.log("manage-sub-plans called:", { action, admin_id });

    // Validate session
    const { data: valid, error: validError } = await supabase.rpc("is_valid_admin", {
      p_admin_id: admin_id,
      p_session_token: session_token,
    });

    console.log("Session validation:", { valid, validError });

    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // LIST plans for reseller (by creator_id) — any authenticated user can fetch
    if (action === "list_for_reseller") {
      const { creator_id } = body;
      if (!creator_id) {
        return new Response(
          JSON.stringify({ error: "creator_id obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data, error } = await supabase
        .from("sub_recharge_plans")
        .select("*")
        .eq("admin_id", creator_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ plans: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require sub rank
    const { data: rankData } = await supabase.rpc("get_admin_rank", { p_admin_id: admin_id });
    if (rankData !== "sub") {
      return new Response(
        JSON.stringify({ error: "Apenas Sub-Donos podem gerenciar planos" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // LIST plans
    if (action === "list") {
      const { data, error } = await supabase
        .from("sub_recharge_plans")
        .select("*")
        .eq("admin_id", admin_id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ plans: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE plan
    if (action === "create") {
      if (!plan?.name || !plan?.credits || !plan?.total) {
        return new Response(
          JSON.stringify({ error: "Dados do plano incompletos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("sub_recharge_plans")
        .insert({
          admin_id,
          name: plan.name,
          credits: plan.credits,
          base_credits: plan.base_credits || plan.credits,
          bonus: plan.bonus || 0,
          total: plan.total,
          badge: plan.badge || "",
          badge_color: plan.badge_color || "bg-blue-500",
          sort_order: plan.sort_order || 0,
          is_active: plan.is_active !== false,
          qr_code_image: plan.qr_code_image || "",
          pix_copy_paste: plan.pix_copy_paste || "",
          whatsapp_number: plan.whatsapp_number || "",
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ plan: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE plan
    if (action === "update") {
      if (!plan?.id) {
        return new Response(
          JSON.stringify({ error: "ID do plano obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("sub_recharge_plans")
        .update({
          name: plan.name,
          credits: plan.credits,
          base_credits: plan.base_credits,
          bonus: plan.bonus,
          total: plan.total,
          badge: plan.badge,
          badge_color: plan.badge_color,
          sort_order: plan.sort_order,
          is_active: plan.is_active,
          qr_code_image: plan.qr_code_image || "",
          pix_copy_paste: plan.pix_copy_paste || "",
          whatsapp_number: plan.whatsapp_number || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", plan.id)
        .eq("admin_id", admin_id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ plan: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE plan
    if (action === "delete") {
      const { plan_id } = body;
      if (!plan_id) {
        return new Response(
          JSON.stringify({ error: "plan_id obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("sub_recharge_plans")
        .delete()
        .eq("id", plan_id)
        .eq("admin_id", admin_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
