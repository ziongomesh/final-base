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
    const { cpf } = await req.json();
    if (!cpf) {
      return new Response(JSON.stringify({ error: "CPF não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: records, error } = await supabase
      .from("chas")
      .select("*")
      .eq("cpf", cleanCpf)
      .limit(1);

    if (error || !records?.length) {
      return new Response(JSON.stringify({ error: "Não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = records[0];

    // Format CPF
    const fmtCpf = cleanCpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );

    // Format date
    const fmtDate = (d: string | null) => {
      if (!d) return null;
      const s = String(d).substring(0, 10);
      if (s.includes("-")) {
        const [y, m, day] = s.split("-");
        return `${day}/${m}/${y}`;
      }
      return s;
    };

    // Generate hash
    const hashStr = (r.senha || "") + cleanCpf + (r.numero_inscricao || "");
    let hash = "";
    for (let i = 0; i < hashStr.length; i++) {
      hash += hashStr.charCodeAt(i).toString(16).toUpperCase();
    }
    hash = hash.substring(0, 40);

    const result = {
      nome: r.nome,
      cpf: fmtCpf,
      data_nascimento: fmtDate(r.data_nascimento),
      categoria: r.categoria,
      validade: r.validade,
      emissao: r.emissao,
      numero_inscricao: r.numero_inscricao,
      limite_navegacao: r.limite_navegacao,
      orgao_emissao: r.orgao_emissao,
      foto: r.foto,
      hash,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
