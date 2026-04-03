import { Router } from 'express';

const router = Router();

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token não fornecido' });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('[TURNSTILE] TURNSTILE_SECRET_KEY não configurada no .env');
      return res.status(500).json({ success: false, error: 'Configuração inválida' });
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      }
    );

    const result = await verifyResponse.json();

    if (result.success) {
      return res.json({ success: true });
    } else {
      console.error('[TURNSTILE] Verificação falhou:', result);
      return res.status(400).json({ success: false, error: 'Verificação falhou' });
    }
  } catch (error) {
    console.error('[TURNSTILE] Erro:', error);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

export default router;
