import { query } from '../db';
import fs from 'fs';
import path from 'path';

/**
 * Tabelas com data de expiração e seus respectivos campos.
 * Cada item: { table, column } onde column = nome da coluna timestamp de expiração.
 * Também inclui colunas opcionais com caminhos de arquivo a remover do disco.
 */
const EXPIRING_TABLES: Array<{
  table: string;
  column: string;
  fileColumns?: string[];
}> = [
  { table: 'usuarios', column: 'data_expiracao', fileColumns: ['pdf_url', 'qrcode_url', 'foto_url', 'cnh_frente_url', 'cnh_meio_url', 'cnh_verso_url'] },
  { table: 'usuarios_rg', column: 'data_expiracao', fileColumns: ['pdf_url', 'qrcode_url', 'foto_url', 'rg_frente_url', 'rg_verso_url', 'assinatura_url'] },
  { table: 'usuarios_crlv', column: 'data_expiracao', fileColumns: ['pdf_url', 'qrcode_url'] },
  { table: 'chas', column: 'expires_at', fileColumns: ['foto', 'qrcode'] },
  { table: 'carteira_estudante', column: 'data_expiracao', fileColumns: ['perfil_imagem', 'qrcode'] },
  { table: 'hapvida_atestados', column: 'data_expiracao', fileColumns: ['pdf_url'] },
];

const UPLOADS_PATH = process.env.UPLOADS_PATH || path.resolve(process.cwd(), '..', 'public', 'uploads');

function tryDeleteFile(urlOrPath: string | null | undefined) {
  if (!urlOrPath) return;
  try {
    // Aceita "/uploads/foo.png" ou apenas "foo.png"
    const rel = urlOrPath.replace(/^\/?uploads\/?/, '');
    if (!rel || rel.startsWith('http')) return;
    const full = path.join(UPLOADS_PATH, rel);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    /* ignora erros individuais */
  }
}

export interface CleanupResult {
  table: string;
  deleted: number;
  filesDeleted: number;
  error?: string;
}

export async function cleanupExpiredRecords(): Promise<CleanupResult[]> {
  const results: CleanupResult[] = [];

  for (const cfg of EXPIRING_TABLES) {
    try {
      // Verifica se a tabela existe (evita erro se schema antigo)
      const tableCheck = await query<any[]>(
        `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
        [cfg.table]
      );
      if (!tableCheck[0]?.c) {
        results.push({ table: cfg.table, deleted: 0, filesDeleted: 0, error: 'tabela não existe' });
        continue;
      }

      // Busca registros vencidos para apagar arquivos
      const cols = ['id', cfg.column, ...(cfg.fileColumns || [])].join(', ');
      const expired = await query<any[]>(
        `SELECT ${cols} FROM \`${cfg.table}\` WHERE \`${cfg.column}\` IS NOT NULL AND \`${cfg.column}\` < NOW()`
      );

      let filesDeleted = 0;
      for (const row of expired) {
        for (const fc of cfg.fileColumns || []) {
          if (row[fc]) {
            tryDeleteFile(row[fc]);
            filesDeleted++;
          }
        }
      }

      // Apaga registros vencidos
      const result = await query<any>(
        `DELETE FROM \`${cfg.table}\` WHERE \`${cfg.column}\` IS NOT NULL AND \`${cfg.column}\` < NOW()`
      );
      const deleted = (result as any)?.affectedRows || expired.length;

      results.push({ table: cfg.table, deleted, filesDeleted });
      if (deleted > 0) {
        console.log(`[CLEANUP] ${cfg.table}: ${deleted} registros vencidos removidos (${filesDeleted} arquivos)`);
      }
    } catch (err: any) {
      console.error(`[CLEANUP] Erro em ${cfg.table}:`, err.message);
      results.push({ table: cfg.table, deleted: 0, filesDeleted: 0, error: err.message });
    }
  }

  return results;
}
