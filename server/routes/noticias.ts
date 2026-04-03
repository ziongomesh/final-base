import { Router } from 'express';
import { query } from '../db';
import { requireSession, requireDonoOrSub } from '../middleware/auth';

const router = Router();

// Listar todas as notícias (requer sessão)
router.get('/', requireSession, async (_req, res) => {
  try {
    const noticias = await query<any[]>(
      'SELECT id, titulo, informacao, data_post FROM noticias ORDER BY data_post DESC'
    );
    res.json(noticias);
  } catch (error) {
    console.error('Erro ao listar notícias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar notícia (requer sessão + dono ou sub)
router.post('/', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const { titulo, informacao } = req.body;
    if (!titulo || !informacao) {
      return res.status(400).json({ error: 'Título e informação são obrigatórios' });
    }

    const result = await query<any>(
      'INSERT INTO noticias (titulo, informacao) VALUES (?, ?)',
      [titulo, informacao]
    );

    res.json({ id: result.insertId, titulo, informacao });
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar notícia (requer sessão + dono ou sub)
router.put('/:id', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const { titulo, informacao } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (titulo) { updates.push('titulo = ?'); values.push(titulo); }
    if (informacao) { updates.push('informacao = ?'); values.push(informacao); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(req.params.id);
    await query(`UPDATE noticias SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar notícia (requer sessão + dono ou sub)
router.delete('/:id', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    await query('DELETE FROM noticias WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar notícia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
