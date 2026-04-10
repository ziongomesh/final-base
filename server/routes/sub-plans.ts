import { Router } from 'express';
import { query } from '../db';
import { requireSession, requireDonoOrSub } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// Upload QR code image
router.post('/upload-qrcode', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const { image_base64 } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: 'Imagem é obrigatória' });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'qrcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const adminId = (req as any).adminId;
    const fileName = `qr_${adminId}_${Date.now()}.png`;
    const filePath = path.join(uploadsDir, fileName);
    const imageBuffer = Buffer.from(image_base64, 'base64');
    fs.writeFileSync(filePath, imageBuffer);

    const domainUrl = process.env.DOMAIN_URL || `http://localhost:${process.env.PORT || 4011}`;
    const imageUrl = `${domainUrl}/uploads/qrcodes/${fileName}`;

    res.json({ url: imageUrl });
  } catch (err: any) {
    console.error('Error uploading qrcode:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// LIST plans for the authenticated admin (sub/dono only)
router.get('/list', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const adminId = (req as any).adminId;
    const plans = await query<any[]>(
      'SELECT * FROM sub_recharge_plans WHERE admin_id = ? ORDER BY sort_order ASC',
      [adminId]
    );
    res.json({ plans });
  } catch (err: any) {
    console.error('Error listing sub plans:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// LIST plans for a reseller (by creator_id) — any authenticated user
router.post('/list-for-reseller', requireSession, async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id) {
      return res.status(400).json({ error: 'creator_id obrigatório' });
    }
    const plans = await query<any[]>(
      'SELECT * FROM sub_recharge_plans WHERE admin_id = ? AND is_active = 1 ORDER BY sort_order ASC',
      [creator_id]
    );
    res.json({ plans });
  } catch (err: any) {
    console.error('Error listing reseller plans:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// CREATE plan
router.post('/create', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const adminId = (req as any).adminId;
    const { plan } = req.body;
    if (!plan?.name || !plan?.credits || !plan?.total) {
      return res.status(400).json({ error: 'Dados do plano incompletos' });
    }

    const result = await query<any>(
      `INSERT INTO sub_recharge_plans 
       (admin_id, name, credits, base_credits, bonus, total, badge, badge_color, sort_order, is_active, qr_code_image, pix_copy_paste, whatsapp_number, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        adminId,
        plan.name,
        plan.credits,
        plan.base_credits || plan.credits,
        plan.bonus || 0,
        plan.total,
        plan.badge || '',
        plan.badge_color || 'bg-blue-500',
        plan.sort_order || 0,
        plan.is_active !== false ? 1 : 0,
        plan.qr_code_image || '',
        plan.pix_copy_paste || '',
        plan.whatsapp_number || '',
      ]
    );

    res.json({ plan: { ...plan, id: (result as any).insertId, admin_id: adminId } });
  } catch (err: any) {
    console.error('Error creating sub plan:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// UPDATE plan
router.put('/update', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const adminId = (req as any).adminId;
    const { plan } = req.body;
    if (!plan?.id) {
      return res.status(400).json({ error: 'ID do plano obrigatório' });
    }

    await query(
      `UPDATE sub_recharge_plans SET
        name = ?, credits = ?, base_credits = ?, bonus = ?, total = ?,
        badge = ?, badge_color = ?, sort_order = ?, is_active = ?,
        qr_code_image = ?, pix_copy_paste = ?, whatsapp_number = ?, updated_at = NOW()
       WHERE id = ? AND admin_id = ?`,
      [
        plan.name, plan.credits, plan.base_credits, plan.bonus, plan.total,
        plan.badge, plan.badge_color, plan.sort_order, plan.is_active ? 1 : 0,
        plan.qr_code_image || '', plan.pix_copy_paste || '', plan.whatsapp_number || '',
        plan.id, adminId,
      ]
    );

    res.json({ plan });
  } catch (err: any) {
    console.error('Error updating sub plan:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// DELETE plan
router.delete('/delete/:planId', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const adminId = (req as any).adminId;
    const planId = req.params.planId;

    await query(
      'DELETE FROM sub_recharge_plans WHERE id = ? AND admin_id = ?',
      [planId, adminId]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting sub plan:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

export default router;
