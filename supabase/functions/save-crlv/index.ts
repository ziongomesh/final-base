import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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
    const {
      admin_id, session_token,
      renavam, placa, exercicio, numero_crv, seguranca_crv, cod_seg_cla,
      marca_modelo, ano_fab, ano_mod, cor, combustivel, especie_tipo,
      categoria, cat_obs, carroceria,
      chassi, placa_ant, potencia_cil, capacidade, lotacao, peso_bruto,
      motor, cmt, eixos,
      nome_proprietario, cpf_cnpj, local: localEmissao, data: dataEmissao,
      observacoes, uf,
      qrcode_base64,
      preview_image_base64,
      // Insurance/DPVAT fields
      data_quitacao, cat_tarif, repasse_fns, repasse_denatran,
      custo_bilhete, custo_efetivo, valor_iof, valor_total,
    } = body;

    // Validate session
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

    // Check credits
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

    // Generate password from CPF
    const cleanCpf = cpf_cnpj.replace(/\D/g, "");
    const senha = cleanCpf.slice(-6);

    // Fetch the CRLV PNG template from storage
    const templateUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/uploads/templates/crlv-template-base.png`;
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Template CRLV PNG não encontrado no storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templatePngBytes = new Uint8Array(await templateResponse.arrayBuffer());

    // Create a new PDF and embed the PNG as background
    const pdfDoc = await PDFDocument.create();
    const bgImage = await pdfDoc.embedPng(templatePngBytes);

    // A4 page size in points (595.28 x 841.89)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Draw background image scaled to fill the page
    page.drawImage(bgImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    // Embed fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);
    const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // Helper: draw text using coordinates matching the preview canvas (PDF points, top-left origin)
    // The preview uses textBaseline='top', so ty is the TOP of the text.
    // pdf-lib uses bottom-left origin, so we convert: pdfY = pageHeight - ty - fontSize
    // Preview uses textBaseline='alphabetic', so ty is the baseline from top.
    // pdf-lib also uses baseline, so: pdfY = pageHeight - ty
    const drawField = (text: string, tx: number, ty: number, size = 10, font = courierBold) => {
      if (!text || !text.trim()) return;
      const val = text.toUpperCase();
      page.drawText(val, {
        x: tx,
        y: pageHeight - ty,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // ========== ALL FIELDS — coordinates match CrlvPositionTool FIELDS exactly ==========
    
    // UF (uses helvetica, smaller size like OpenSans in preview)
    if (uf) {
      drawField(`DETRAN-   ${uf}`, 31.20, 54.22, 4.42, helvetica);
    }

    // Left column
    drawField(renavam, 31.20, 102.21, 10, courierBold);
    drawField(placa, 30.95, 128.58, 10, courierBold);
    drawField(exercicio, 102.93, 128.58, 10, courierBold);
    drawField(ano_fab, 31.20, 154.75, 10, courierBold);
    drawField(ano_mod, 102.93, 154.75, 10, courierBold);
    drawField(numero_crv, 31.20, 181.14, 10, courierBold);
    drawField(cod_seg_cla, 31.67, 258.97, 10, courierBold);
    drawField(cat_obs || "***", 162.67, 259.21, 10, courierBold);
    drawField(marca_modelo, 30.95, 293.43, 10, courierBold);
    drawField(especie_tipo, 30.47, 329.66, 10, courierBold);
    drawField(placa_ant || "*******/**", 31.20, 364.00, 10, courierBold);
    drawField(chassi, 131.01, 364.46, 10, courierBold);
    drawField(cor, 30.47, 400.19, 10, courierBold);
    drawField(combustivel, 101.97, 399.47, 10, courierBold);

    // Right column
    drawField(categoria, 315.76, 73.67, 10, courierBold);
    drawField(capacidade || "*.*", 510.08, 88.78, 10, courierBold);
    drawField(potencia_cil, 316.01, 114.22, 10, courierBold);
    drawField(peso_bruto, 510.08, 114.70, 10, courierBold);
    drawField(motor, 317.00, 140.86, 10, courierBold);
    drawField(cmt, 453.79, 140.62, 10, courierBold);
    drawField(eixos, 504.80, 140.62, 10, courierBold);
    drawField(lotacao, 538.63, 140.86, 10, courierBold);
    drawField(carroceria, 316.01, 166.27, 10, courierBold);
    drawField(nome_proprietario, 314.82, 192.18, 10, courierBold);
    drawField(cpf_cnpj, 463.39, 223.38, 10, courierBold);
    drawField(localEmissao, 316.49, 259.40, 10, courierBold);
    drawField(dataEmissao, 510.08, 258.20, 10, courierBold);

    // Insurance / DPVAT fields
    drawField(data_quitacao || "*", 389.63, 323.51, 10, courierBold);
    drawField(cat_tarif || "*", 316.73, 323.51, 10, courierBold);
    drawField(repasse_fns || "*", 316.73, 360.46, 10, courierBold);
    drawField(custo_bilhete || "*", 424.18, 360.46, 10, courierBold);
    drawField(custo_efetivo || "*", 494.72, 360.46, 10, courierBold);
    drawField(repasse_denatran || "*", 316.73, 401.25, 10, courierBold);
    drawField(valor_iof || "*", 424.18, 401.25, 10, courierBold);
    drawField(valor_total || "*", 494.72, 401.25, 10, courierBold);

    // ========== OBSERVAÇÕES ==========
    if (observacoes) {
      drawField(observacoes, 26.87, 442.18, 10, courierBold);
    }

    // ========== "Documento emitido por..." line ==========
    const hashCode = cleanCpf.length >= 9
      ? `${cleanCpf.slice(0,3)}${cleanCpf.slice(3,5)}f${cleanCpf.slice(5,8)}`
      : "000000000";
    const now = new Date();
    const brDate = dataEmissao || now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const brTime = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const docText = `Documento emitido por DETRAN ${uf || "SP"} (${hashCode}) em ${brDate} às ${brTime}.`;
    drawField(docText, 31.43, 413.00, 4.42, helvetica);

    // ========== QR CODE ==========
    let qrcodeUrl: string | null = null;
    try {
      let qrBytes: Uint8Array;

      if (qrcode_base64 && qrcode_base64.length > 100) {
        const clean = qrcode_base64.replace(/^data:image\/\w+;base64,/, "");
        qrBytes = Uint8Array.from(atob(clean), (c: string) => c.charCodeAt(0));
      } else {
        const qrData = `https://qrcode-certificadodigital-vio.info/crlv?ren=${encodeURIComponent(renavam)}&pl=${encodeURIComponent(placa)}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;
        const qrResponse = await fetch(qrApiUrl);
        if (!qrResponse.ok) throw new Error("QR generation failed");
        qrBytes = new Uint8Array(await qrResponse.arrayBuffer());
      }

      const qrImg = await pdfDoc.embedPng(qrBytes);
      // QR position matching preview: x=167.23, y=92.85, size=97.4 (in PDF points)
      page.drawImage(qrImg, {
        x: 167.23,
        y: pageHeight - 92.85 - 97.4,
        width: 97.4,
        height: 97.4,
      });

      // Upload QR image
      const qrPath = `crlv_${cleanCpf}_qr.png`;
      await supabase.storage.from("uploads").upload(qrPath, qrBytes, {
        contentType: "image/png",
        upsert: true,
      });
      const { data: qrUrlData } = supabase.storage.from("uploads").getPublicUrl(qrPath);
      qrcodeUrl = qrUrlData?.publicUrl || null;
    } catch (qrErr) {
      console.error("QR code error:", qrErr);
    }

    if (preview_image_base64 && /^data:image\/(png|jpeg|jpg);base64,/.test(preview_image_base64)) {
      try {
        const cleanPreview = preview_image_base64.replace(/^data:image\/\w+;base64,/, "");
        const previewBytes = Uint8Array.from(atob(cleanPreview), (c: string) => c.charCodeAt(0));
        const previewImg = await pdfDoc.embedPng(previewBytes);
        page.drawImage(previewImg, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } catch (previewErr) {
        console.error("Preview image overlay error:", previewErr);
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const cleanPlaca = (placa || '').replace(/[^A-Za-z0-9]/g, '');
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const pdfPath = `CRLV_${cleanPlaca}_${suffix}.pdf`;

    const { error: pdfError } = await supabase.storage
      .from("uploads")
      .upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    let pdfUrl: string | null = null;
    if (!pdfError) {
      const { data: pdfUrlData } = supabase.storage.from("uploads").getPublicUrl(pdfPath);
      pdfUrl = pdfUrlData?.publicUrl || null;
    }

    // Insert record
    const { data: inserted, error: insertError } = await supabase
      .from("usuarios_crlv")
      .insert({
        admin_id,
        renavam, placa, exercicio, numero_crv, seguranca_crv, cod_seg_cla,
        marca_modelo, ano_fab, ano_mod, cor, combustivel, especie_tipo,
        categoria, cat_obs, carroceria,
        chassi, placa_ant, potencia_cil, capacidade, lotacao, peso_bruto,
        motor, cmt, eixos,
        nome_proprietario, cpf_cnpj,
        local_emissao: localEmissao,
        data_emissao: dataEmissao,
        observacoes,
        qrcode_url: qrcodeUrl,
        pdf_url: pdfUrl,
        senha,
      })
      .select("id, data_expiracao")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar CRLV", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credit
    await supabase
      .from("admins")
      .update({ creditos: adminData.creditos - 1 })
      .eq("id", admin_id);

    // Record transaction
    await supabase.from("credit_transactions").insert({
      from_admin_id: admin_id,
      to_admin_id: admin_id,
      amount: 1,
      transaction_type: "crlv_creation",
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: inserted.id,
        senha,
        pdf: pdfUrl,
        dataExpiracao: inserted.data_expiracao,
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
