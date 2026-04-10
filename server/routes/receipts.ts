import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// Upload receipt
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { admin_id, plan_id, plan_name, credits, amount, receipt_base64 } = req.body;

    if (!receipt_base64) {
      return res.status(400).json({ error: 'Comprovante é obrigatório' });
    }

    // Save receipt image to disk
    const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${admin_id}_${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    const imageBuffer = Buffer.from(receipt_base64, 'base64');
    fs.writeFileSync(filePath, imageBuffer);

    // Build public URL
    const domainUrl = process.env.DOMAIN_URL || `http://localhost:${process.env.PORT || 4011}`;
    const receiptUrl = `${domainUrl}/uploads/receipts/${fileName}`;

    // Insert record
    const [result] = await db.query(
      `INSERT INTO recharge_receipts (admin_id, plan_id, plan_name, credits, amount, receipt_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [admin_id, plan_id || null, plan_name || '', credits || 0, amount || 0, receiptUrl]
    );

    const insertId = (result as any).insertId;

    res.json({
      success: true,
      receipt: {
        id: insertId,
        admin_id,
        plan_name,
        credits,
        amount,
        receipt_url: receiptUrl,
        status: 'pending',
      }
    });
  } catch (err: any) {
    console.error('Error uploading receipt:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

export default router;
