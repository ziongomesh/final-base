import { Router } from 'express';
import { pool } from '../db/index';

const router = Router();

// GET /api/verify-crlv?cpf=00000000000
router.get('/', async (req, res) => {
  try {
    const { cpf } = req.query;

    if (!cpf) {
      return res.status(400).json({ error: 'CPF/CNPJ não informado' });
    }

    const cleanCpf = String(cpf).replace(/\D/g, '');

    if (cleanCpf.length < 11) {
      return res.status(400).json({ error: 'CPF/CNPJ inválido' });
    }

    const [rows]: any = await pool.query(
      `SELECT * FROM usuarios_crlv WHERE REPLACE(REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '-', ''), '/', ''), ' ', '') = ? ORDER BY created_at DESC LIMIT 1`,
      [cleanCpf]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'CRLV não encontrado' });
    }

    const r = rows[0];
    res.json({
      cod_seg_cla: r.cod_seg_cla || '',
      numero_crv: r.numero_crv || '',
      uf: r.local_emissao ? (r.local_emissao.split(' ').pop() || '') : '',
      renavam: r.renavam || '',
      exercicio: r.exercicio || '',
      nome_proprietario: r.nome_proprietario || '',
      cpf_cnpj: r.cpf_cnpj || '',
      placa: r.placa || '',
      chassi: r.chassi || '',
      especie_tipo: r.especie_tipo || '',
      carroceria: r.carroceria || '',
      combustivel: r.combustivel || '',
      ano_fab: r.ano_fab || '',
      ano_mod: r.ano_mod || '',
      marca_modelo: r.marca_modelo || '',
      lotacao: r.lotacao || '',
      potencia_cil: r.potencia_cil || '',
      capacidade: r.capacidade || '',
      peso_bruto: r.peso_bruto || '',
      cmt: r.cmt || '',
      eixos: r.eixos || '',
      categoria: r.categoria || '',
      cor: r.cor || '',
      motor: r.motor || '',
      local_emissao: r.local_emissao || '',
      data_emissao: r.data_emissao || '',
      observacoes: r.observacoes || '',
    });
  } catch (error) {
    console.error('Erro ao verificar CRLV:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
