import { Router } from "express";
import { query } from "../db";
import { requireSession, requireDono } from "../middleware/auth";

const router = Router();

// Weekly goal tiers: { target recharges, bonus credits }
const WEEKLY_GOAL_TIERS = [
  { target: 2, bonus: 1, label: 'Bronze' },
  { target: 4, bonus: 3, label: 'Prata' },
  { target: 6, bonus: 5, label: 'Ouro' },
];

// Helper: verifica se recarga em dobro está ativa
async function isDoubleRechargeActive(): Promise<boolean> {
  try {
    const rows = await query<any[]>("SELECT recarga_em_dobro FROM platform_settings WHERE id = 1");
    return !!rows[0]?.recarga_em_dobro;
  } catch { return false; }
}

// Helper: check and claim weekly goal bonuses after a recharge
async function checkAndClaimWeeklyGoals(adminId: number): Promise<number> {
  try {
    const adminRows = await query<any[]>("SELECT `rank` FROM admins WHERE id = ?", [adminId]);
    if (adminRows[0]?.rank !== 'revendedor') return 0;

    // Get start of current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekKey = `${startOfWeek.getFullYear()}-W${Math.ceil((startOfWeek.getTime() - new Date(startOfWeek.getFullYear(), 0, 1).getTime()) / 604800000)}`;

    // Count PAID recharges this week
    const recharges = await query<any[]>(
      "SELECT COUNT(*) as cnt FROM pix_payments WHERE admin_id = ? AND status = 'PAID' AND paid_at >= ?",
      [adminId, startOfWeek.toISOString().slice(0, 19).replace('T', ' ')]
    );
    const rechargeCount = recharges[0]?.cnt || 0;

    let totalBonus = 0;

    for (const tier of WEEKLY_GOAL_TIERS) {
      if (rechargeCount >= tier.target) {
        // Check if already claimed
        const claimed = await query<any[]>(
          "SELECT id FROM weekly_goal_claims WHERE admin_id = ? AND week_key = ? AND tier_target = ?",
          [adminId, weekKey, tier.target]
        );
        if (claimed.length === 0) {
          // Claim it
          await query(
            "INSERT INTO weekly_goal_claims (admin_id, week_key, tier_target, bonus_credits) VALUES (?, ?, ?, ?)",
            [adminId, weekKey, tier.target, tier.bonus]
          );
          await query("UPDATE admins SET creditos = creditos + ? WHERE id = ?", [tier.bonus, adminId]);
          await query(
            "INSERT INTO credit_transactions (to_admin_id, amount, transaction_type) VALUES (?, ?, ?)",
            [adminId, tier.bonus, "weekly_goal_bonus"]
          );
          totalBonus += tier.bonus;
          console.log(`[WEEKLY GOAL] ✅ Admin ${adminId} bateu meta ${tier.label} (${tier.target} recargas) - +${tier.bonus} créditos bônus`);
        }
      }
    }
    return totalBonus;
  } catch (err: any) {
    console.error("[WEEKLY GOAL] Erro:", err.message);
    return 0;
  }
}

// Helper: adiciona créditos ao admin correto (creditos_transf para master, creditos para outros)
async function addCreditsToAdmin(adminId: number, credits: number) {
  const admins = await query<any[]>("SELECT `rank` FROM admins WHERE id = ?", [adminId]);
  const rank = admins[0]?.rank;
  if (rank === "master") {
    await query("UPDATE admins SET creditos_transf = creditos_transf + ?, creditos = creditos + ? WHERE id = ?", [credits, credits, adminId]);
  } else {
    await query("UPDATE admins SET creditos = creditos + ? WHERE id = ?", [credits, adminId]);
  }
}

// Default price tiers (fallback if DB not configured)
const DEFAULT_PRICE_TIERS = [
  { credits: 5, unitPrice: 14.0, total: 70 },
  { credits: 10, unitPrice: 14.0, total: 140 },
  { credits: 25, unitPrice: 13.5, total: 337.5 },
  { credits: 50, unitPrice: 13.0, total: 650 },
  { credits: 75, unitPrice: 12.5, total: 937.5 },
  { credits: 100, unitPrice: 12.0, total: 1200 },
  { credits: 150, unitPrice: 11.5, total: 1725 },
  { credits: 200, unitPrice: 11.0, total: 2200 },
  { credits: 250, unitPrice: 10.5, total: 2625 },
  { credits: 300, unitPrice: 10.2, total: 3060 },
  { credits: 400, unitPrice: 9.8, total: 3920 },
  { credits: 500, unitPrice: 9.65, total: 4825 },
  { credits: 1000, unitPrice: 9.0, total: 9000 },
];

// Reseller packages (for resellers under admin_id 3)
const RESELLER_PACKAGES = [
  { credits: 3, total: 50 },
  { credits: 6, total: 100 },
  { credits: 13, total: 200 },
  { credits: 25, total: 320 },
];
const RESELLER_UNIT_PRICE = 20; // R$20 per credit for unit purchases

let DEFAULT_RESELLER_PRICE = 90;
let DEFAULT_RESELLER_CREDITS = 5;

// Load settings from DB
async function getSettings() {
  try {
    const rows = await query<any[]>("SELECT * FROM platform_settings WHERE id = 1");
    if (rows.length > 0) {
      const row = rows[0];
      let packages = row.credit_packages;
      if (typeof packages === "string") packages = JSON.parse(packages);
      return {
        priceTiers: packages as typeof DEFAULT_PRICE_TIERS,
        resellerPrice: Number(row.reseller_price) || DEFAULT_RESELLER_PRICE,
        resellerCredits: Number(row.reseller_credits) || DEFAULT_RESELLER_CREDITS,
      };
    }
  } catch (e) {
    console.error("Erro ao carregar configurações:", e);
  }
  return {
    priceTiers: DEFAULT_PRICE_TIERS,
    resellerPrice: DEFAULT_RESELLER_PRICE,
    resellerCredits: DEFAULT_RESELLER_CREDITS,
  };
}

function calculatePriceFromTiers(quantity: number, tiers: typeof DEFAULT_PRICE_TIERS): { unitPrice: number; total: number } | null {
  const tier = tiers.find((t) => t.credits === quantity);
  if (!tier) return null;
  return { unitPrice: tier.unitPrice, total: tier.total };
}

function calculateResellerPrice(credits: number): { unitPrice: number; total: number } | null {
  // Check if it's a known package
  const pkg = RESELLER_PACKAGES.find((p) => p.credits === credits);
  if (pkg) {
    return { unitPrice: Math.round((pkg.total / pkg.credits) * 100) / 100, total: pkg.total };
  }
  // Otherwise use unit price (R$20 per credit)
  if (credits >= 1) {
    const total = credits * RESELLER_UNIT_PRICE;
    return { unitPrice: RESELLER_UNIT_PRICE, total };
  }
  return null;
}

// Criar pagamento PIX (requer sessão)
router.post("/create-pix", requireSession, async (req, res) => {
  try {
    const { credits, adminId, adminName } = req.body;

    // Verificar que é o próprio admin
    if ((req as any).adminId !== adminId) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    if (!credits || !adminId || !adminName || typeof credits !== "number" || typeof adminId !== "number" || typeof adminName !== "string") {
      return res.status(400).json({ error: "Dados incompletos ou inválidos" });
    }

    const admins = await query<any[]>("SELECT id, nome, `rank`, criado_por FROM admins WHERE id = ?", [adminId]);
    if (admins.length === 0) {
      return res.status(400).json({ error: "Admin não encontrado" });
    }

    const adminRow = admins[0];
    const isResellerFromAdmin3 = adminRow.rank === "revendedor" && adminRow.criado_por === 3;

    let pricing: { unitPrice: number; total: number } | null;
    let isOfficialPackage = false;

    if (isResellerFromAdmin3) {
      // Reseller pricing - só é pacote se for um dos RESELLER_PACKAGES (não unitário avulso)
      pricing = calculateResellerPrice(credits);
      isOfficialPackage = !!RESELLER_PACKAGES.find((p) => p.credits === credits);
    } else if (adminRow.rank === "master" || adminRow.rank === "dono" || adminRow.rank === "sub") {
      // Master/dono pricing from platform_settings - sempre pacote oficial
      const settings = await getSettings();
      pricing = calculatePriceFromTiers(credits, settings.priceTiers);
      isOfficialPackage = !!pricing;
    } else {
      return res.status(403).json({ error: "Sem permissão para recarregar" });
    }

    if (!pricing) {
      return res.status(400).json({ error: "Pacote de créditos inválido" });
    }

    const { total: amount } = pricing;

    const baseName = adminName.replace(/[<>\"'&]/g, "").trim().substring(0, 50);
    const sanitizedAdminName = isOfficialPackage ? `PKG:${baseName}` : baseName;
    const publicKey = process.env.VIZZIONPAY_PUBLIC_KEY;
    const privateKey = process.env.VIZZIONPAY_PRIVATE_KEY;
    const domainUrl = process.env.DOMAIN_URL || "";
    const isLocal = !domainUrl || domainUrl.includes("localhost") || domainUrl.includes("127.0.0.1");

    // MODO LOCAL: Simular PIX SOMENTE quando NÃO tem chaves VizzionPay
    if (!publicKey || !privateKey) {
      console.log("[CREATE PIX] Modo local/mock ativado - simulando PIX");
      const mockTransactionId = `MOCK_${adminId}_${Date.now()}`;

      await query(
        "INSERT INTO pix_payments (admin_id, admin_name, credits, amount, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?)",
        [adminId, sanitizedAdminName, credits, Math.round(amount * 100) / 100, mockTransactionId, "PENDING"],
      );

      // Confirmar automaticamente após 5 segundos
      setTimeout(async () => {
        try {
          const pending = await query<any[]>("SELECT * FROM pix_payments WHERE transaction_id = ? AND status = 'PENDING'", [mockTransactionId]);
          if (pending.length > 0) {
            // Check double recharge: somente revendedor + pacote oficial
            const adminRows = await query<any[]>("SELECT `rank` FROM admins WHERE id = ?", [adminId]);
            const isReseller = adminRows[0]?.rank === 'revendedor';
            const doubleActive = isReseller && isOfficialPackage ? await isDoubleRechargeActive() : false;
            const finalCredits = doubleActive ? credits * 2 : credits;

            await query("UPDATE pix_payments SET status = 'PAID', paid_at = NOW() WHERE transaction_id = ?", [mockTransactionId]);
            await addCreditsToAdmin(adminId, finalCredits);

            await query(
              "INSERT INTO credit_transactions (to_admin_id, amount, unit_price, total_price, transaction_type) VALUES (?, ?, ?, ?, ?)",
              [adminId, finalCredits, pricing.unitPrice, pricing.total, "recharge"],
            );
            console.log(`[MOCK] ✅ Pagamento ${mockTransactionId} confirmado - ${finalCredits} créditos${doubleActive ? ' (DOBRO!)' : ''} adicionados ao admin ${adminId}`);
            // Check weekly goals
            await checkAndClaimWeeklyGoals(adminId);
          }
        } catch (err: any) {
          console.error("[MOCK] Erro na confirmação automática:", err.message);
        }
      }, 5000);

      const pixCode = `00020126580014BR.GOV.BCB.PIX0136mock-pix-${mockTransactionId}5204000053039865802BR5925DATA SISTEMAS6009SAO PAULO62070503***6304ABCD`;

      return res.json({
        transactionId: mockTransactionId,
        qrCode: pixCode,
        qrCodeBase64: null,
        copyPaste: pixCode,
        amount: amount,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
      });
    }

    // MODO PRODUÇÃO: VizzionPay real
    const identifier = `ADMIN_${adminId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const pixRequest: any = {
      identifier: identifier,
      amount: Math.round(amount * 100) / 100,
      client: {
        name: sanitizedAdminName,
        email: `admin${adminId}@sistema.com`,
        phone: "(83) 99999-9999",
        document: "05916691378",
      },
    };

    // NÃO enviar callbackUrl - webhook fixo configurado no painel da VizzionPay
    // (Limite de 20 webhooks da VizzionPay já atingido)

    if (amount > 10) {
      const amountSplit = Math.round(amount * 0.05 * 100) / 100;
      pixRequest.splits = [{ producerId: "cmd80ujse00klosducwe52nkw", amount: amountSplit }];
    }

    const vizzionResponse = await fetch("https://app.vizzionpay.com.br/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": publicKey!,
        "x-secret-key": privateKey!,
      },
      body: JSON.stringify(pixRequest),
    });

    if (!vizzionResponse.ok) {
      const errorData = await vizzionResponse.text();
      console.error(`[CREATE PIX] VizzionPay error ${vizzionResponse.status}:`, errorData);
      throw new Error(`VizzionPay error: ${vizzionResponse.status} - ${errorData}`);
    }

    const pixData = await vizzionResponse.json();
    console.log(`[CREATE PIX] Resposta VizzionPay:`, JSON.stringify(pixData, null, 2));

    if (!pixData.transactionId || typeof pixData.transactionId !== "string") {
      throw new Error("Invalid VizzionPay response - sem transactionId");
    }

    try {
      await query(
        "INSERT INTO pix_payments (admin_id, admin_name, credits, amount, transaction_id, client_identifier, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [adminId, sanitizedAdminName, credits, Math.round(amount * 100) / 100, pixData.transactionId, identifier, "PENDING"],
      );
      console.log(`[CREATE PIX] ✅ INSERT no MySQL OK - transactionId: ${pixData.transactionId}, admin: ${adminId}, credits: ${credits}, amount: ${amount}`);
    } catch (dbError: any) {
      console.error(`[CREATE PIX] ❌ ERRO ao inserir no MySQL:`, dbError.message);
      throw new Error(`Erro ao salvar pagamento no banco: ${dbError.message}`);
    }

    // Em localhost o webhook não chega, então o polling no endpoint /status vai consultar a VizzionPay diretamente
    if (isLocal) {
      console.log(`[LOCAL] Webhook não funciona em localhost - o frontend vai usar polling via /status para verificar pagamento`);
    }

    res.json({
      transactionId: pixData.transactionId,
      qrCode: pixData.pix?.code || pixData.qrCode || pixData.copyPaste,
      qrCodeBase64: pixData.pix?.base64 || pixData.qrCodeBase64,
      copyPaste: pixData.pix?.code || pixData.copyPaste || pixData.qrCode,
      amount: amount,
      dueDate: pixData.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "PENDING",
    });
  } catch (error: any) {
    console.error("Erro ao criar pagamento PIX:", error);
    res.status(500).json({ error: "Erro ao criar pagamento PIX", details: error.message });
  }
});

// Verificar status do pagamento (requer sessão)
// Se PENDING e tem chaves VizzionPay, consulta a VizzionPay diretamente (Direct Polling)
router.get("/status/:transactionId", requireSession, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payments = await query<any[]>("SELECT * FROM pix_payments WHERE transaction_id = ?", [transactionId]);

    if (payments.length === 0) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    const payment = payments[0];

    // Verificar permissão
    if ((req as any).adminId !== payment.admin_id && (req as any).adminRank !== 'dono') {
      return res.status(403).json({ error: "Sem permissão" });
    }

    if (typeof payment.admin_name === "string" && payment.admin_name.startsWith("RESELLER:")) {
      return res.status(400).json({ error: "Use /payments/reseller-status para este pagamento" });
    }

    // Se já está PAID, retornar direto
    if (payment.status === 'PAID') {
      return res.json(payment);
    }

    // Se PENDING, apenas retornar status atual - o webhook da VizzionPay vai atualizar quando pago
    if (payment.status === 'PENDING') {
      console.log(`[POLLING] Pagamento ${transactionId} ainda PENDING - aguardando webhook da VizzionPay...`);
    }

    return res.json(payment);
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// REMOVIDO: test-vizzion (endpoint de debug inseguro)
// REMOVIDO: confirm-manual (endpoint de teste sem autenticação)

// Histórico de pagamentos (requer sessão)
router.get("/history/:adminId", requireSession, async (req, res) => {
  try {
    const { adminId } = req.params;

    // Só pode ver seus próprios pagamentos
    if ((req as any).adminId !== parseInt(adminId) && (req as any).adminRank !== 'dono') {
      return res.status(403).json({ error: "Sem permissão" });
    }

    const payments = await query<any[]>(
      "SELECT id, amount, credits, status, created_at, paid_at FROM pix_payments WHERE admin_id = ? ORDER BY created_at DESC LIMIT 10",
      [adminId],
    );

    res.json(payments);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Confirmação manual para testes locais (só funciona com localhost)
router.post("/confirm-local/:transactionId", requireSession, async (req, res) => {
  try {
    const domain = process.env.DOMAIN_URL || "";
    if (!domain.includes("localhost")) {
      return res.status(403).json({ error: "Endpoint disponível apenas em ambiente local" });
    }

    const { transactionId } = req.params;
    const payments = await query<any[]>("SELECT * FROM pix_payments WHERE transaction_id = ? AND status = 'PENDING'", [transactionId]);

    if (payments.length === 0) {
      return res.status(404).json({ error: "Pagamento pendente não encontrado" });
    }

    const payment = payments[0];

    // Se for pagamento de revendedor
    if (typeof payment.admin_name === "string" && payment.admin_name.startsWith("RESELLER:")) {
      const jsonStr = payment.admin_name.substring("RESELLER:".length);
      let resellerData: any;
      try {
        resellerData = JSON.parse(jsonStr);
      } catch {
        // Fallback para formato antigo com split
        const parts = payment.admin_name.split(":");
        resellerData = { nome: parts[1], email: parts[2], key: parts[3] };
      }

      const { nome, email, key } = resellerData;
      const masterId = payment.admin_id;

      if (nome && email && key) {
        const settings = await getSettings();

        const result = await query<any>(
          "INSERT INTO admins (nome, email, `key`, `rank`, criado_por, creditos) VALUES (?, ?, ?, ?, ?, ?)",
          [nome, email, key, "revendedor", masterId, settings.resellerCredits],
        );

        try {
          await query(
            "INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, total_price, transaction_type) VALUES (?, ?, ?, ?, ?)",
            [masterId, result.insertId, settings.resellerCredits, settings.resellerPrice, "reseller_creation"],
          );
        } catch (txError: any) {
          console.error("[CONFIRM-LOCAL] Erro ao registrar transação:", txError.message);
        }

        await query("UPDATE pix_payments SET status = 'PAID', paid_at = NOW(), admin_name = ? WHERE transaction_id = ?", [
          `Revendedor criado: ${nome}`, transactionId,
        ]);

        return res.json({ status: "PAID", message: "Revendedor criado com sucesso (confirmação local)" });
      }
    }

    // Pagamento normal de créditos
    await query("UPDATE pix_payments SET status = 'PAID', paid_at = NOW() WHERE transaction_id = ?", [transactionId]);

    // Check double recharge: somente revendedor + pacote oficial (admin_name começa com "PKG:")
    const adminRows = await query<any[]>("SELECT `rank` FROM admins WHERE id = ?", [payment.admin_id]);
    const isReseller = adminRows[0]?.rank === 'revendedor';
    const isPackage = typeof payment.admin_name === 'string' && payment.admin_name.startsWith('PKG:');
    const doubleActive = isReseller && isPackage ? await isDoubleRechargeActive() : false;
    const finalCredits = doubleActive ? payment.credits * 2 : payment.credits;

    const unitPrice = finalCredits > 0 ? (payment.amount / finalCredits) : payment.amount;
    await addCreditsToAdmin(payment.admin_id, finalCredits);
    await query(
      "INSERT INTO credit_transactions (to_admin_id, amount, unit_price, total_price, transaction_type) VALUES (?, ?, ?, ?, ?)",
      [payment.admin_id, finalCredits, unitPrice, payment.amount, "recharge"],
    );

    // Check weekly goals
    await checkAndClaimWeeklyGoals(payment.admin_id);

    res.json({ status: "PAID", message: `${finalCredits} créditos adicionados${doubleActive ? ' (recarga em dobro!)' : ''} (confirmação local)` });
  } catch (error: any) {
    console.error("[CONFIRM-LOCAL] Erro:", error);
    res.status(500).json({ error: "Erro ao confirmar pagamento", details: error.message });
  }
});

// Teste de acessibilidade do webhook (GET para verificar se a URL está acessível)
router.get("/webhook", (_req, res) => {
  console.log("[WEBHOOK-TEST] GET /webhook chamado - webhook acessível!");
  res.json({ status: "ok", message: "Webhook endpoint is reachable", timestamp: new Date().toISOString() });
});

router.get("/webhook-reseller", (_req, res) => {
  console.log("[WEBHOOK-TEST] GET /webhook-reseller chamado - webhook acessível!");
  res.json({ status: "ok", message: "Reseller webhook endpoint is reachable", timestamp: new Date().toISOString() });
});

// Webhook de pagamento VizzionPay (público - chamado pela VizzionPay)
router.post("/webhook", async (req, res) => {
  try {
    console.log("=== PIX WEBHOOK RECEIVED ===");
    console.log("[WEBHOOK] Headers:", JSON.stringify(req.headers, null, 2));
    console.log("[WEBHOOK] Body:", JSON.stringify(req.body, null, 2));
    const body = req.body || {};
    const transactionId = body.transactionId || body.transaction?.id;
    const status = body.status || body.transaction?.status;
    const event = body.event;
    console.log(`[WEBHOOK] Parsed: transactionId=${transactionId}, status=${status}, event=${event}`);

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId ausente" });
    }

    const isPaid = event === "TRANSACTION_PAID" || status === "PAID" || status === "COMPLETED";

    if (isPaid) {
      const payments = await query<any[]>("SELECT * FROM pix_payments WHERE transaction_id = ? AND status = ?", [transactionId, "PENDING"]);

      if (payments.length > 0) {
        const payment = payments[0];

        await query("UPDATE pix_payments SET status = ?, paid_at = NOW() WHERE transaction_id = ?", ["PAID", transactionId]);

        // Check double recharge for revendedores
        const adminRows = await query<any[]>("SELECT `rank` FROM admins WHERE id = ?", [payment.admin_id]);
        const isReseller = adminRows[0]?.rank === 'revendedor';
        const doubleActive = isReseller ? await isDoubleRechargeActive() : false;
        const finalCredits = doubleActive ? payment.credits * 2 : payment.credits;

        const unitPrice = finalCredits > 0 ? (payment.amount / finalCredits) : payment.amount;
        await addCreditsToAdmin(payment.admin_id, finalCredits);
        await query(
          "INSERT INTO credit_transactions (to_admin_id, amount, unit_price, total_price, transaction_type) VALUES (?, ?, ?, ?, ?)",
          [payment.admin_id, finalCredits, unitPrice, payment.amount, "recharge"],
        );
        console.log(`[WEBHOOK] ✅ ${finalCredits} créditos${doubleActive ? ' (DOBRO!)' : ''} adicionados ao admin ${payment.admin_id}`);
        // Check weekly goals
        await checkAndClaimWeeklyGoals(payment.admin_id);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Obter tabela de preços (requer sessão)
router.get("/price-tiers", requireSession, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings.priceTiers);
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    res.json(DEFAULT_PRICE_TIERS);
  }
});

// Weekly goal claims for current week (requer sessão)
router.get("/weekly-goals/:adminId", requireSession, async (req, res) => {
  try {
    const adminId = parseInt(req.params.adminId);
    if ((req as any).adminId !== adminId && (req as any).adminRank !== 'dono') {
      return res.status(403).json({ error: "Sem permissão" });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekKey = `${startOfWeek.getFullYear()}-W${Math.ceil((startOfWeek.getTime() - new Date(startOfWeek.getFullYear(), 0, 1).getTime()) / 604800000)}`;

    const claims = await query<any[]>(
      "SELECT tier_target, bonus_credits, claimed_at FROM weekly_goal_claims WHERE admin_id = ? AND week_key = ?",
      [adminId, weekKey]
    );

    const recharges = await query<any[]>(
      "SELECT COUNT(*) as cnt FROM pix_payments WHERE admin_id = ? AND status = 'PAID' AND paid_at >= ?",
      [adminId, startOfWeek.toISOString().slice(0, 19).replace('T', ' ')]
    );

    res.json({
      weekRecharges: recharges[0]?.cnt || 0,
      claimedTiers: claims.map((c: any) => c.tier_target),
      tiers: WEEKLY_GOAL_TIERS,
    });
  } catch (error) {
    console.error("Erro ao buscar metas semanais:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});


router.get("/goal/:year/:month", requireSession, async (req, res) => {
  try {
    const { year, month } = req.params;
    const goals = await query<any[]>("SELECT * FROM monthly_goals WHERE year = ? AND month = ?", [year, month]);
    res.json(goals[0] || { target_revenue: 0 });
  } catch (error) {
    console.error("Erro ao buscar meta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Atualizar meta mensal (requer sessão + dono)
router.post("/goal", requireSession, requireDono, async (req, res) => {
  try {
    const { year, month, targetRevenue } = req.body;
    await query(
      `INSERT INTO monthly_goals (year, month, target_revenue) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE target_revenue = ?, updated_at = NOW()`,
      [year, month, targetRevenue, targetRevenue],
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Métricas de pagamentos (requer sessão + dono)
router.get("/metrics", requireSession, requireDono, async (_req, res) => {
  try {
    const allPayments = await query<any[]>("SELECT id FROM pix_payments");
    const totalOperations = allPayments.length;

    const paidPayments = await query<any[]>("SELECT amount, credits FROM pix_payments WHERE status = ?", ["PAID"]);
    const totalPaidDeposits = paidPayments.length;
    const totalPaidValue = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const avgTicket = totalPaidDeposits > 0 ? totalPaidValue / totalPaidDeposits : 0;

    res.json({ totalOperations, totalPaidDeposits, totalPaidValue, avgTicket });
  } catch (error) {
    console.error("Erro ao buscar métricas de pagamentos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Criar PIX para novo revendedor (requer sessão + master)
router.post("/create-reseller-pix", requireSession, async (req, res) => {
  try {
    const { resellerData } = req.body;
    const masterId = (req as any).adminId;
    const masterName = req.body.masterName;

    if ((req as any).adminRank !== 'master') {
      return res.status(403).json({ error: "Apenas masters podem criar revendedores" });
    }

    if (!resellerData) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const { nome, email, key } = resellerData;
    if (!nome || !email || !key) {
      return res.status(400).json({ error: "Dados do revendedor incompletos" });
    }

    const existing = await query<any[]>("SELECT id FROM admins WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    const publicKey = process.env.VIZZIONPAY_PUBLIC_KEY;
    const privateKey = process.env.VIZZIONPAY_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      return res.status(500).json({ error: "Chaves da VizzionPay não configuradas" });
    }

    const sanitizedName = (masterName || '').replace(/[<>\"'&]/g, "").trim().substring(0, 50);
    const identifier = `RESELLER_${masterId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const settings = await getSettings();
    const resellerPrice = settings.resellerPrice;
    const resellerCredits = settings.resellerCredits;

    const pixRequest: any = {
      identifier: identifier,
      amount: resellerPrice,
      client: {
        name: sanitizedName,
        email: `admin${masterId}@sistema.com`,
        phone: "(83) 99999-9999",
        document: "05916691378",
      },
    };

    // NÃO enviar callbackUrl - webhook fixo configurado no painel da VizzionPay
    // (Limite de 20 webhooks da VizzionPay já atingido)

    // Só adicionar split se o valor for maior que R$10 (evita erro de split > valor total)
    if (resellerPrice > 10) {
      const amountSplit = Math.round(resellerPrice * 0.05 * 100) / 100;
      pixRequest.splits = [{ producerId: "cmd80ujse00klosducwe52nkw", amount: amountSplit }];
    }

    const vizzionResponse = await fetch("https://app.vizzionpay.com.br/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": publicKey,
        "x-secret-key": privateKey,
      },
      body: JSON.stringify(pixRequest),
    });

    if (!vizzionResponse.ok) {
      const errorData = await vizzionResponse.text();
      console.error(`[RESELLER PIX] VizzionPay error ${vizzionResponse.status}:`, errorData);
      throw new Error(`VizzionPay error: ${vizzionResponse.status} - ${errorData}`);
    }

    const pixData = await vizzionResponse.json();

    if (!pixData.transactionId) {
      throw new Error("Invalid VizzionPay response");
    }

    const resellerMeta = JSON.stringify({ nome, email, key, masterId });
    await query(
      `INSERT INTO pix_payments (admin_id, admin_name, credits, amount, transaction_id, client_identifier, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [masterId, `RESELLER:${resellerMeta}`, resellerCredits, resellerPrice, pixData.transactionId, identifier, "PENDING"],
    );

    res.json({
      transactionId: pixData.transactionId,
      qrCode: pixData.pix?.code || pixData.qrCode || pixData.copyPaste,
      qrCodeBase64: pixData.pix?.base64 || pixData.qrCodeBase64,
      copyPaste: pixData.pix?.code || pixData.copyPaste || pixData.qrCode,
      amount: resellerPrice,
      credits: resellerCredits,
      dueDate: pixData.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "PENDING",
    });
  } catch (error: any) {
    console.error("Erro ao criar PIX para revendedor:", error);
    res.status(500).json({ error: "Erro ao criar pagamento PIX", details: error.message });
  }
});

// Webhook revendedor (público - chamado pela VizzionPay)
router.post("/webhook-reseller", async (req, res) => {
  try {
    console.log("=== RESELLER PIX WEBHOOK ===");
    console.log("[RESELLER WEBHOOK] Headers:", JSON.stringify(req.headers, null, 2));
    console.log("[RESELLER WEBHOOK] Body:", JSON.stringify(req.body, null, 2));
    const body = req.body || {};
    const transactionId = body.transactionId || body.transaction?.id;
    const status = body.status || body.transaction?.status;
    const event = body.event;
    console.log(`[RESELLER WEBHOOK] Parsed: transactionId=${transactionId}, status=${status}, event=${event}`);

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId ausente" });
    }

    const isPaid = event === "TRANSACTION_PAID" || status === "PAID" || status === "COMPLETED";

    if (isPaid) {
      const payments = await query<any[]>(
        `SELECT * FROM pix_payments WHERE transaction_id = ? AND admin_name LIKE 'RESELLER:%' AND status = 'PENDING'`,
        [transactionId],
      );

      if (payments.length > 0) {
        const payment = payments[0];
        const jsonStr = payment.admin_name.substring("RESELLER:".length);
        let resellerData: any;
        try {
          resellerData = JSON.parse(jsonStr);
        } catch {
          // Fallback para formato antigo com split
          const parts = payment.admin_name.split(":");
          resellerData = { nome: parts[1], email: parts[2], key: parts[3] };
        }

        const { nome, email, key } = resellerData;
        const masterId = payment.admin_id;

        if (nome && email && key) {
          const settings = await getSettings();

          const result = await query<any>(
            "INSERT INTO admins (nome, email, `key`, `rank`, criado_por, creditos) VALUES (?, ?, ?, ?, ?, ?)",
            [nome, email, key, "revendedor", masterId, settings.resellerCredits],
          );

          try {
            await query(
              `INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, total_price, transaction_type) VALUES (?, ?, ?, ?, ?)`,
              [masterId, result.insertId, settings.resellerCredits, settings.resellerPrice, "reseller_creation"],
            );
          } catch (txError: any) {
            console.error("[WEBHOOK] Erro ao registrar transação:", txError.message);
          }

          await query("UPDATE pix_payments SET status = ?, paid_at = NOW(), admin_name = ? WHERE transaction_id = ?", [
            "PAID", `Revendedor criado: ${nome}`, transactionId,
          ]);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook reseller:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Verificar status do PIX de revendedor (requer sessão)
// Se PENDING, consulta VizzionPay diretamente para confirmar automaticamente
router.get("/reseller-status/:transactionId", requireSession, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payments = await query<any[]>("SELECT * FROM pix_payments WHERE transaction_id = ?", [transactionId]);

    if (payments.length === 0) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    const payment = payments[0];

    // Verificar permissão
    if ((req as any).adminId !== payment.admin_id && (req as any).adminRank !== 'dono') {
      return res.status(403).json({ error: "Sem permissão" });
    }

    if (payment.status === "PAID") {
      return res.json({ status: "PAID", message: "Revendedor criado com sucesso!" });
    }

    // Se PENDING, apenas retornar status atual - o webhook da VizzionPay vai atualizar quando pago
    if (payment.status === "PENDING") {
      console.log(`[RESELLER POLLING] Pagamento ${transactionId} ainda PENDING - aguardando webhook da VizzionPay...`);
    }

    res.json({ status: payment.status });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
