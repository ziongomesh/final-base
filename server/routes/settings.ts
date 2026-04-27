import { Router } from "express";
import { query } from "../db";
import { requireSession, requireDono } from "../middleware/auth";
import { invalidateFreeModeCache } from "../utils/free-mode";

const router = Router();

// Get platform settings (public for authenticated users)
router.get("/", requireSession, async (_req, res) => {
  try {
    const rows = await query<any[]>("SELECT * FROM platform_settings WHERE id = 1");
    if (rows.length === 0) {
      return res.json({
        reseller_price: 90,
        reseller_credits: 5,
        credit_packages: [],
        recarga_em_dobro: false,
        free_mode: false,
      });
    }
    const row = rows[0];
    let packages = row.credit_packages;
    if (typeof packages === "string") {
      packages = JSON.parse(packages);
    }
    res.json({
      reseller_price: Number(row.reseller_price),
      reseller_credits: Number(row.reseller_credits),
      credit_packages: packages,
      recarga_em_dobro: !!row.recarga_em_dobro,
      free_mode: !!row.free_mode,
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Update platform settings (dono only)
router.put("/", requireSession, requireDono, async (req, res) => {
  try {
    const { reseller_price, reseller_credits, credit_packages } = req.body;

    if (reseller_price == null || reseller_credits == null || !credit_packages) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // Validate packages
    if (!Array.isArray(credit_packages) || credit_packages.length === 0) {
      return res.status(400).json({ error: "Pacotes inválidos" });
    }

    for (const pkg of credit_packages) {
      if (!pkg.credits || !pkg.unitPrice || !pkg.total) {
        return res.status(400).json({ error: "Pacote com dados incompletos" });
      }
    }

    await query(
      `INSERT INTO platform_settings (id, reseller_price, reseller_credits, credit_packages) 
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE reseller_price = ?, reseller_credits = ?, credit_packages = ?, updated_at = NOW()`,
      [
        reseller_price,
        reseller_credits,
        JSON.stringify(credit_packages),
        reseller_price,
        reseller_credits,
        JSON.stringify(credit_packages),
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Toggle recarga em dobro (dono only)
router.put("/recarga-dobro", requireSession, requireDono, async (req, res) => {
  try {
    const { enabled } = req.body;
    await query(
      `UPDATE platform_settings SET recarga_em_dobro = ? WHERE id = 1`,
      [enabled ? 1 : 0]
    );
    res.json({ success: true, recarga_em_dobro: !!enabled });
  } catch (error) {
    console.error("Erro ao atualizar recarga em dobro:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
