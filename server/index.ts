import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { pool } from './db';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admins';
import creditRoutes from './routes/credits';
import paymentRoutes from './routes/payments';
import cnhRoutes from './routes/cnh';
import rgRoutes from './routes/rg';
import checkCpfRoutes from './routes/check-cpf.ts';
import estudanteRoutes from './routes/estudante.ts';
import downloadsRoutes from './routes/downloads.ts';
import cnhNauticaRoutes from './routes/cnh-nautica.ts';
import crlvRoutes from './routes/crlv.ts';
import ownerRoutes from './routes/owner.ts';
import verifyChaRoutes from './routes/verify-cha.ts';
import verifyCnhRoutes from './routes/verify-cnh.ts';
import verifyCinRoutes from './routes/verify-cin.ts';
import verifyCrlvRoutes from './routes/verify-crlv.ts';
import noticiasRoutes from './routes/noticias.ts';
import galleryRoutes from './routes/gallery.ts';
import templateRoutes from './routes/templates.ts';
import settingsRoutes from './routes/settings.ts';
import turnstileRoutes from './routes/turnstile.ts';
import hapvidaRoutes from './routes/hapvida.ts';
import verifyHapvidaRoutes from './routes/verify-hapvida.ts';
import alertRoutes from './routes/alerts.ts';
import suggestionsRoutes from './routes/suggestions.ts';
import receiptsRoutes from './routes/receipts.ts';
import maintenanceRoutes from './routes/maintenance.ts';
import subPlansRoutes from './routes/sub-plans.ts';

// Carrega variáveis de ambiente (prioridade: .env.local > .env)
const envFiles = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env.local'),
  path.resolve(process.cwd(), '..', '.env'),
];

let envLoaded = false;
for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath, override: true });
    console.log(`[ENV] Carregando variaveis de: ${envPath}`);
    envLoaded = true;
    // NÃO dar break - carrega todos os arquivos encontrados (o último sobrescreve)
    // Mas queremos prioridade do .env.local, então break no primeiro encontrado
    break;
  }
}
if (!envLoaded) {
  config();
  console.log('[!] Nenhum arquivo .env encontrado, usando variaveis do sistema');
}

// Log das chaves VizzionPay para debug
console.log(`[ENV] VIZZIONPAY_PUBLIC_KEY: ${process.env.VIZZIONPAY_PUBLIC_KEY ? '✅ configurada (' + process.env.VIZZIONPAY_PUBLIC_KEY.substring(0, 10) + '...)' : '❌ NÃO ENCONTRADA'}`);
console.log(`[ENV] VIZZIONPAY_PRIVATE_KEY: ${process.env.VIZZIONPAY_PRIVATE_KEY ? '✅ configurada' : '❌ NÃO ENCONTRADA'}`);
console.log(`[ENV] DOMAIN_URL: ${process.env.DOMAIN_URL || '❌ NÃO ENCONTRADA'}`);

const app = express();
const PORT = process.env.PORT || 4000;

// Banner do sistema
console.log('\n');
console.log('+==============================================================+');
console.log('|                    DATA SISTEMAS - BACKEND                   |');
console.log('+==============================================================+');
console.log('|  Sistema de Gerenciamento de Creditos                        |');
console.log('+==============================================================+');
console.log('\n');

// Função para testar conexão com MySQL
async function testDatabaseConnection() {
  console.log('[DB] CONFIGURACAO DO BANCO DE DADOS');
  console.log('------------------------------------------------------------');
  console.log(`   Tipo: MySQL / MariaDB`);
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Porta: ${process.env.DB_PORT || '3306'}`);
  console.log(`   Banco: ${process.env.DB_NAME || 'teste'}`);
  console.log(`   Usuario: ${process.env.DB_USER || 'ventura'}`);
  console.log('------------------------------------------------------------');
  
  try {
    const connection = await pool.getConnection();
    
    // Testar query simples
    const [rows] = await connection.execute('SELECT 1 as test');
    
    // Verificar tabela admins
    const [admins] = await connection.execute('SELECT COUNT(*) as total FROM admins');
    const totalAdmins = (admins as any[])[0]?.total || 0;
    
    // Verificar se tem dono cadastrado
    const [donos] = await connection.execute("SELECT COUNT(*) as total FROM admins WHERE `rank` = 'dono'");
    const totalDonos = (donos as any[])[0]?.total || 0;
    
    connection.release();
    
    console.log('\n[OK] CONEXAO COM MYSQL: SUCESSO');
    console.log('------------------------------------------------------------');
    console.log(`   Total de admins cadastrados: ${totalAdmins}`);
    console.log(`   Donos do sistema: ${totalDonos}`);
    
    if (totalDonos === 0) {
      console.log('\n[!] ATENCAO: Nenhum usuario "dono" encontrado!');
      console.log('   Execute o SQL em docs/database.sql para criar o admin padrao.');
    }
    
    console.log('------------------------------------------------------------');
    return true;
  } catch (error: any) {
    console.log('\n[X] CONEXAO COM MYSQL: FALHOU');
    console.log('------------------------------------------------------------');
    console.log(`   Erro: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n[i] SOLUCAO: O MySQL nao esta rodando ou a porta esta errada.');
      console.log('   - Inicie o MySQL/XAMPP/MariaDB');
      console.log('   - Verifique a porta no .env.local');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n[i] SOLUCAO: Usuario ou senha incorretos.');
      console.log('   - Verifique DB_USER e DB_PASSWORD no .env.local');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n[i] SOLUCAO: Banco de dados nao existe.');
      console.log(`   - Crie o banco "${process.env.DB_NAME}" no MySQL`);
      console.log('   - Execute o SQL em docs/database.sql');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n[i] SOLUCAO: Tabela nao encontrada.');
      console.log('   - Execute o SQL em docs/database.sql');
    }
    
    console.log('------------------------------------------------------------');
    return false;
  }
}

// Serve static uploads BEFORE global CORS (so ANY origin can access images)
const uploadsPath = process.env.UPLOADS_PATH || path.resolve(process.cwd(), '..', 'public', 'uploads');
console.log('[UPLOADS] Servindo uploads de:', uploadsPath);
console.log('[UPLOADS] Diretório existe?', fs.existsSync(uploadsPath));

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}, express.static(uploadsPath, { fallthrough: false }), (err: any, req: any, res: any, next: any) => {
  console.error(`[UPLOADS] Erro ao servir ${req.path}:`, err.message);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(404).json({ error: 'Arquivo não encontrado', path: req.path });
});

// CORS (dev-friendly): aceita múltiplas origens locais e produção
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    'https://abafe-certificado.info',
    'https://qrcode-certificadodigital-vio.info',
    'https://qrcode-certificado-vio.info',
    'http://qrcode-certificado-vio.info',
    'https://condutor-cnhdigital-vio-web.info',
    'https://cidadaodigital.info',
    'http://consulta-rgdigital-vio.info',
    'https://qrcode-certificado-vio.info',
    'http://127.0.0.1:8080',
    // VPS IPs - adicione mais se necessário
    'http://localhost:8080',
    'http://localhost:5173',
    'https://webhap.hapvida-validacao.info',
    'https://hapvida-validacao.info',
    'https://abafe-digital.info',
    'https://painel.datasistemas.online',
    'http://painel.datasistemas.online',
    'https://certificado-marinha-vio.info',
    'http://certificado-marinha-vio.info',
  ].filter(Boolean) as string[]
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests sem Origin (ex: curl/postman) devem ser permitidos
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) return callback(null, true);

      return callback(
        new Error(
          `CORS bloqueado: origem ${origin} não permitida. Configure CLIENT_URL ou use localhost:5173/8080.`
        )
      );
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cnh', cnhRoutes);
app.use('/api/rg', rgRoutes);
app.use('/api/check-cpf', checkCpfRoutes);
app.use('/api/estudante', estudanteRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/cnh-nautica', cnhNauticaRoutes);
app.use('/api/crlv', crlvRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/verify-cha', verifyChaRoutes);
app.use('/api/verify-cnh', verifyCnhRoutes);
app.use('/api/verify-cin', verifyCinRoutes);
app.use('/api/verify-crlv', verifyCrlvRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/turnstile', turnstileRoutes);
app.use('/api/hapvida', hapvidaRoutes);
app.use('/api/verify-hapvida', verifyHapvidaRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/sub-plans', subPlansRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    res.json({ 
      status: 'ok', 
      database: 'mysql',
      connected: true,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.json({ 
      status: 'error', 
      database: 'mysql',
      connected: false,
      timestamp: new Date().toISOString() 
    });
  }
}
);

// Iniciar servidor
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log('\n[>>] SERVIDOR INICIADO');
    console.log('------------------------------------------------------------');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   DOMAIN_URL: ${process.env.DOMAIN_URL || '(NÃO CONFIGURADA!)'}`);
    console.log(`   Webhook URL: ${process.env.DOMAIN_URL || 'http://localhost:' + PORT}/api/payments/webhook`);
    console.log(`   CORS (origens permitidas): ${Array.from(allowedOrigins).join(', ') || 'nenhuma'}`);
    console.log('------------------------------------------------------------');
    
    if (dbConnected) {
      console.log('\n[OK] Sistema pronto para uso!');
    } else {
      console.log('\n[!] Sistema iniciado, mas sem conexao com banco de dados.');
      console.log('   Corrija as configuracoes e reinicie o servidor.');
    }
    
    console.log('\n[i] Pressione Ctrl+C para parar o servidor.\n');
  });
}

startServer();
