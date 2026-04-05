import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

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
    const {
      admin_id, session_token, cpf, nomeCompleto, nomeSocial,
      dataNascimento, naturalidade, genero, nacionalidade, validade,
      uf, dataEmissao, local, orgaoExpedidor, pai, mae,
      rgFrenteBase64, rgVersoBase64, fotoBase64, assinaturaBase64,
      pdfPageBase64,
    } = body;

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

    // Verificar créditos
    const { data: adminData } = await supabase
      .from("admins")
      .select("creditos")
      .eq("id", admin_id)
      .single();

    if (!adminData || adminData.creditos <= 0) {
      return new Response(
        JSON.stringify({ error: "Créditos insuficientes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar CPF duplicado
    const cleanCpf = cpf.replace(/\D/g, "");
    const { data: existingRg } = await supabase
      .from("usuarios_rg")
      .select("id, nome, admin_id")
      .eq("cpf", cleanCpf)
      .maybeSingle();

    if (existingRg) {
      // Buscar nome do admin que criou
      let creatorName = "Desconhecido";
      const { data: creatorAdmin } = await supabase
        .from("admins")
        .select("nome")
        .eq("id", existingRg.admin_id)
        .single();
      if (creatorAdmin) creatorName = creatorAdmin.nome;

      return new Response(
        JSON.stringify({
          error: "CPF já cadastrado",
          details: {
            existingRg,
            creator_admin_id: existingRg.admin_id,
            creator_name: creatorName,
            is_own: existingRg.admin_id === admin_id,
          },
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Senha = últimos 6 dígitos do CPF
    const senha = cleanCpf.slice(-6);

    // Upload helper
    const uploadFile = async (base64: string, filename: string): Promise<string | null> => {
      if (!base64) return null;
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
      const { error } = await supabase.storage.from("uploads").upload(filename, bytes, {
        contentType: "image/png", upsert: true,
      });
      if (error) { console.error(`Upload error ${filename}:`, error); return null; }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filename);
      return urlData?.publicUrl || null;
    };

    const [frenteUrl, versoUrl, fotoUrl] = await Promise.all([
      uploadFile(rgFrenteBase64, `rg_${cleanCpf}_frente.png`),
      uploadFile(rgVersoBase64, `rg_${cleanCpf}_verso.png`),
      uploadFile(fotoBase64, `rg_${cleanCpf}_foto.png`),
    ]);

    let assinaturaUploadUrl: string | null = null;
    if (assinaturaBase64) {
      assinaturaUploadUrl = await uploadFile(assinaturaBase64, `rg_${cleanCpf}_assinatura.png`);
    }

    // Insert
    const { data: insertedRg, error: insertError } = await supabase
      .from("usuarios_rg")
      .insert({
        admin_id,
        cpf: cleanCpf,
        nome: nomeCompleto,
        nome_social: nomeSocial || null,
        senha,
        data_nascimento: dataNascimento,
        naturalidade,
        genero,
        nacionalidade: nacionalidade || 'BRA',
        validade,
        uf,
        data_emissao: dataEmissao,
        local_emissao: local,
        orgao_expedidor: orgaoExpedidor,
        pai: pai || null,
        mae: mae || null,
        foto_url: fotoUrl,
        rg_frente_url: frenteUrl,
        rg_verso_url: versoUrl,
        assinatura_url: assinaturaUploadUrl,
      })
      .select("id, data_expiracao")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar RG", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rgId = insertedRg.id;

    // Generate PDF from single full-page image (client-rendered)
    let pdfUrl: string | null = null;
    let qrcodeUrl: string | null = null;
    try {
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      // Generate and save QR code
      try {
        const qrData = `https://qrcode-certificadodigital-vio.info/qr/index.php?cpf=${cleanCpf}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;
        const qrResponse = await fetch(qrApiUrl);
        if (qrResponse.ok) {
          const qrBytes = new Uint8Array(await qrResponse.arrayBuffer());
          const qrPath = `rg_${cleanCpf}_qrcode.png`;
          await supabase.storage.from("uploads").upload(qrPath, qrBytes, {
            contentType: "image/png", upsert: true,
          });
          const { data: qrUrlData } = supabase.storage.from("uploads").getPublicUrl(qrPath);
          qrcodeUrl = qrUrlData?.publicUrl || null;
        }
      } catch (qrErr) {
        console.error("QR code error:", qrErr);
      }

      // Create PDF with single full-page image (no text, no vectors)
      if (pdfPageBase64) {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const cleanB64 = pdfPageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imgBytes = Uint8Array.from(atob(cleanB64), (c) => c.charCodeAt(0));
        const fullPageImg = await pdfDoc.embedPng(imgBytes);
        page.drawImage(fullPageImg, { x: 0, y: 0, width: pageWidth, height: pageHeight });

        const pdfBytes = await pdfDoc.save();
        const pdfPath = `RG_DIGITAL_${cleanCpf}.pdf`;
        const { error: pdfError } = await supabase.storage.from("uploads").upload(pdfPath, pdfBytes, {
          contentType: "application/pdf", upsert: true,
        });
        if (!pdfError) {
          const { data: pdfUrlData } = supabase.storage.from("uploads").getPublicUrl(pdfPath);
          pdfUrl = pdfUrlData?.publicUrl || null;
        }
      }
    } catch (pdfErr) {
      console.error("PDF generation error:", pdfErr);
    }

    // Update with QR and PDF URLs
    await supabase.from("usuarios_rg").update({ qrcode_url: qrcodeUrl, pdf_url: pdfUrl }).eq("id", rgId);

    // Debit 1 credit
    await supabase.from("admins").update({ creditos: adminData.creditos - 1 }).eq("id", admin_id);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      from_admin_id: admin_id, to_admin_id: admin_id, amount: 1, transaction_type: "rg_creation",
    });

    return new Response(
      JSON.stringify({
        success: true, id: rgId, senha, pdf: pdfUrl,
        dataExpiracao: insertedRg.data_expiracao,
        images: { frente: frenteUrl, verso: versoUrl },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
