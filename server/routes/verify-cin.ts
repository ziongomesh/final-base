import { Router } from 'express';
import { pool } from '../db/index';

const router = Router();

// GET /api/verify-cin?cpf=00000000000
router.get('/', async (req, res) => {
  try {
    const { cpf } = req.query;

    if (!cpf) {
      return res.status(400).json({ error: 'CPF não informado' });
    }

    const cleanCpf = String(cpf).replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    const [rows]: any = await pool.query(
      `SELECT * FROM rgs WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ? LIMIT 1`,
      [cleanCpf]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'RG/CIN não encontrado' });
    }

    const r = rows[0];
    res.json({
      nome: r.nome_completo || r.nome || '',
      nome_social: r.nome_social || '',
      cpf: r.cpf,
      genero: r.genero || '',
      data_nascimento: r.data_nascimento || '',
      nacionalidade: r.nacionalidade || '',
      naturalidade: r.naturalidade || '',
      validade: r.validade || '',
      mae: r.mae || '',
      pai: r.pai || '',
      orgao_expedidor: r.orgao_expedidor || '',
      local_emissao: r.local || r.local_emissao || '',
      data_emissao: r.data_emissao || '',
      foto_url: r.foto || r.foto_url || null,
    });
  } catch (error) {
    console.error('Erro ao verificar CIN:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
