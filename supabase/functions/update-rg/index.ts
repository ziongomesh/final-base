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
      admin_id, session_token, rg_id,
      nomeCompleto, nomeSocial, dataNascimento, naturalidade, genero,
      nacionalidade, validade, uf, dataEmissao, local, orgaoExpedidor,
      pai, mae, changedMatrices,
      rgFrenteBase64, rgVersoBase64, fotoBase64, assinaturaBase64,
      pdfPageBase64,
    } = body;

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

    const { data: existing, error: fetchErr } = await supabase
      .from("usuarios_rg")
      .select("*")
      .eq("id", rg_id)
      .single();

    if (fetchErr || !existing) {
      return new Response(
        JSON.stringify({ error: "Registro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanCpf = existing.cpf;
    const changed: string[] = changedMatrices || [];

    const uploadFile = async (base64: string, filename: string): Promise<string | null> => {
      if (!base64) return null;
      const clean = base64.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
      const { error } = await supabase.storage.from("uploads").upload(filename, bytes, {
        contentType: "image/png", upsert: true,
      });
      if (error) { console.error(`Upload error ${filename}:`, error); return null; }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filename);
      return urlData?.publicUrl || null;
    };

    let frenteUrl = existing.rg_frente_url;
    let versoUrl = existing.rg_verso_url;
    let fotoUrl = existing.foto_url;

    if (changed.includes("frente") && rgFrenteBase64) {
      frenteUrl = await uploadFile(rgFrenteBase64, `rg_${cleanCpf}_frente.png`);
    }
    if (changed.includes("verso") && rgVersoBase64) {
      versoUrl = await uploadFile(rgVersoBase64, `rg_${cleanCpf}_verso.png`);
    }
    if (fotoBase64) {
      fotoUrl = await uploadFile(fotoBase64, `rg_${cleanCpf}_foto.png`);
    }
    let assinaturaUploadUrl = existing.assinatura_url;
    if (assinaturaBase64) {
      assinaturaUploadUrl = await uploadFile(assinaturaBase64, `rg_${cleanCpf}_assinatura.png`);
    }

    // Regenerate PDF from single full-page image
    const senha = cleanCpf.slice(-6);
    let pdfUrl = existing.pdf_url;
    let qrcodeUrl = existing.qrcode_url;

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
          await supabase.storage.from("uploads").upload(qrPath, qrBytes, { contentType: "image/png", upsert: true });
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
      console.error("PDF update error:", pdfErr);
    }

    // Update database
    const { error: updateErr } = await supabase
      .from("usuarios_rg")
      .update({
        nome: nomeCompleto,
        nome_social: nomeSocial || null,
        data_nascimento: dataNascimento,
        naturalidade,
        genero,
        nacionalidade: nacionalidade || "BRA",
        validade,
        uf,
        data_emissao: dataEmissao,
        local_emissao: local,
        orgao_expedidor: orgaoExpedidor,
        pai: pai || null,
        mae: mae || null,
        rg_frente_url: frenteUrl,
        rg_verso_url: versoUrl,
        foto_url: fotoUrl,
        assinatura_url: assinaturaUploadUrl,
        qrcode_url: qrcodeUrl,
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rg_id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar", details: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdf: pdfUrl,
        changedMatrices: changed,
        images: { frente: frenteUrl, verso: versoUrl },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
