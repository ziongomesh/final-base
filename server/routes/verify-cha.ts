import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// GET /api/verify-cha?cpf=12345678900
router.get('/', async (req, res) => {
  try {
    const cpfRaw = (req.query.cpf as string) || '';
    const cleanCpf = cpfRaw.replace(/\D/g, '');

    if (!cleanCpf) {
      return res.status(400).json({ error: 'CPF não fornecido' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM chas WHERE cpf = ? LIMIT 1',
      [cleanCpf]
    );

    const records = rows as any[];
    if (!records.length) {
      return res.status(404).json({ error: 'Não encontrado' });
    }

    const r = records[0];

    // Format CPF
    const fmtCpf = cleanCpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4'
    );

    // Format date
    const fmtDate = (d: string | null) => {
      if (!d) return null;
      const s = String(d).substring(0, 10);
      if (s.includes('-')) {
        const [y, m, day] = s.split('-');
        return `${day}/${m}/${y}`;
      }
      return s;
    };

    // Generate hash
    const hashStr = (r.senha || '') + cleanCpf + (r.numero_inscricao || '');
    let hash = '';
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

    return res.json(result);
  } catch (error: any) {
    console.error('[VERIFY-CHA] Erro:', error.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
