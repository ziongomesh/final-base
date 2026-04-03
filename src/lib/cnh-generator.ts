// Gerador de CNH Frente (Canvas client-side)
import { loadTemplate } from './template-loader';

interface CnhData {
  nome?: string;
  dataNascimento?: string;
  hab?: string;
  dataEmissao?: string;
  dataValidade?: string;
  docIdentidade?: string;
  cpf?: string;
  numeroRegistro?: string;
  categoria?: string;
  pai?: string;
  mae?: string;
  espelho?: string;
  codigo_seguranca?: string;
  renach?: string;
  foto?: File | string;
  assinatura?: File | string;
  sexo?: string;
  nacionalidade?: string;
  cnhDefinitiva?: string;
}

const CNH_CONFIG = {
  width: 1011,
  height: 740,
  fields: {
    nome: { x: 190, y: 230, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    nascimento: { x: 470, y: 290, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    primeiraHab: { x: 830, y: 230, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    data_emissao: { x: 470, y: 350, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    data_validade: { x: 650, y: 350, font: 'bold 20px Asul, Arial, sans-serif', color: 'red' },
    rg: { x: 470, y: 410, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    cpf: { x: 470, y: 470, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    registro: { x: 680, y: 470, font: 'bold 20px Asul, Arial, sans-serif', color: 'red' },
    categoria: { x: 870, y: 470, font: 'bold 20px Asul, Arial, sans-serif', color: 'red' },
    nacionalidade: { x: 470, y: 530, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    filiacaoPai: { x: 470, y: 590, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
    filiacaoMae: { x: 470, y: 650, font: 'bold 20px Asul, Arial, sans-serif', color: '#373435' },
  },
  images: {
    foto: { x: 184, y: 275, width: 250, height: 345 },
    assinatura: { x: 188, y: 630, width: 243, height: 64 },
  },
};

function getNacionalidadePorGenero(nacionalidade: string = 'brasileiro', sexo: string = 'M'): string {
  if (!nacionalidade) return 'BRASILEIRO(A)';
  const isFeminino = sexo === 'F';
  if (nacionalidade.toLowerCase() === 'brasileiro') {
    return isFeminino ? 'BRASILEIRA' : 'BRASILEIRO';
  } else if (nacionalidade.toLowerCase() === 'estrangeiro') {
    return isFeminino ? 'ESTRANGEIRA' : 'ESTRANGEIRO';
  }
  return 'BRASILEIRO(A)';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadFonts(): Promise<void> {
  try {
    try {
      const asulFontUrl = (await import('../assets/Asul.ttf')).default;
      const asulRegular = new FontFace('Asul', `url(${asulFontUrl})`, { weight: '400' });
      const asulBold = new FontFace('Asul', `url(${asulFontUrl})`, { weight: '700' });
      const [loadedR, loadedB] = await Promise.all([asulRegular.load(), asulBold.load()]);
      document.fonts.add(loadedR);
      document.fonts.add(loadedB);
    } catch {
      // Asul não disponível localmente
    }

    try {
      const ocrBFontUrl = (await import('../assets/OCR-B.otf')).default;
      const ocrBFont = new FontFace('OCR-B', `url(${ocrBFontUrl})`);
      const loaded = await ocrBFont.load();
      document.fonts.add(loaded);
    } catch { /* fallback */ }

    try {
      const courierNewBoldUrl = (await import('../assets/CourierNewBold.ttf')).default;
      const courierNewBold = new FontFace('CourierNewBold', `url(${courierNewBoldUrl})`);
      const loaded = await courierNewBold.load();
      document.fonts.add(loaded);
    } catch { /* fallback */ }

    if (!document.querySelector('link[href*="Asul"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Asul:wght@400;700&family=Courier+Prime:wght@700&display=swap';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    await document.fonts.ready;
  } catch {
    // Silenciosamente usa fallback
  }
}

function formatDateToBrazilian(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

async function drawTemplate(ctx: CanvasRenderingContext2D, cnhDefinitiva: string = 'sim'): Promise<void> {
  try {
    const templateName = cnhDefinitiva === 'sim' ? 'limpa1.png' : 'limpa-1.png';
    const bitmap = await loadTemplate(templateName);
    ctx.drawImage(bitmap, 0, 0, CNH_CONFIG.width, CNH_CONFIG.height);
  } catch {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CNH_CONFIG.width, CNH_CONFIG.height);
  }
}

async function drawTexts(ctx: CanvasRenderingContext2D, data: CnhData): Promise<void> {
  ctx.textAlign = 'left';

  const formattedCpf = (data.cpf || '').replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const displayData = {
    nome: data.nome || '',
    nascimento: data.dataNascimento || '',
    primeiraHab: formatDateToBrazilian(data.hab || ''),
    data_emissao: formatDateToBrazilian(data.dataEmissao || ''),
    data_validade: formatDateToBrazilian(data.dataValidade || ''),
    rg: data.docIdentidade || '',
    cpf: formattedCpf,
    registro: data.numeroRegistro || '',
    categoria: data.categoria || '',
    nacionalidade: getNacionalidadePorGenero(data.nacionalidade, data.sexo),
    filiacaoPai: data.pai || '',
    filiacaoMae: data.mae || '',
  };

  await document.fonts.ready;

  Object.entries(CNH_CONFIG.fields).forEach(([field, config]) => {
    ctx.font = config.font;
    ctx.fillStyle = config.color || '#373435';
    const text = displayData[field as keyof typeof displayData] || '';
    ctx.fillText(text, config.x, config.y);
  });
}

async function drawImages(ctx: CanvasRenderingContext2D, data: CnhData): Promise<void> {
  if (data.foto) {
    try {
      let fotoDataUrl: string;
      if (data.foto instanceof File) {
        fotoDataUrl = await readFileAsDataURL(data.foto);
      } else {
        fotoDataUrl = data.foto.startsWith('data:') ? data.foto : `/${data.foto}`;
      }
      const fotoImg = await loadImage(fotoDataUrl);
      const { x, y, width, height } = CNH_CONFIG.images.foto;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, width, y + height);
      ctx.clip();
      ctx.drawImage(fotoImg, x, y, width, height);
      ctx.restore();
    } catch {
      // Silencioso
    }
  }

  if (data.assinatura) {
    try {
      let assDataUrl: string;
      if (data.assinatura instanceof File) {
        assDataUrl = await readFileAsDataURL(data.assinatura);
      } else {
        assDataUrl = data.assinatura.startsWith('data:') ? data.assinatura : `/${data.assinatura}`;
      }
      const assImg = await loadImage(assDataUrl);
      const { x, y, width, height } = CNH_CONFIG.images.assinatura;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      ctx.drawImage(assImg, x, y, width, height);
      ctx.restore();
    } catch {
      // Silencioso
    }
  }
}

function drawEspelho(ctx: CanvasRenderingContext2D, text?: string): void {
  if (!text) return;
  ctx.save();
  ctx.translate(130, 690);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '39px "CourierNewBold", "OCR-B", monospace';
  ctx.fillStyle = '#373435';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export async function generateCNH(
  canvas: HTMLCanvasElement,
  data: CnhData,
  cnhDefinitiva: string = 'sim'
): Promise<void> {
  await loadFonts();
  canvas.width = CNH_CONFIG.width;
  canvas.height = CNH_CONFIG.height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  await drawTemplate(ctx, cnhDefinitiva);
  await drawTexts(ctx, data);
  await drawImages(ctx, data);
  drawEspelho(ctx, data.espelho);
}

/**
 * Gera a página A4 completa do PDF da CNH no cliente.
 * Coloca base.png + 3 matrizes nas posições exatas.
 * Retorna base64 (data URL PNG) para envio ao backend que converte em PDF.
 */
export async function generateCNHPdfPage(
  cnhFrenteBase64: string,
  cnhMeioBase64: string,
  cnhVersoBase64: string
): Promise<string> {
  // A4 a 300dpi para alta qualidade
  const A4_W = 2480;
  const A4_H = 3508;
  const GAP = 18; // 9px equivalente a 300dpi

  const canvas = document.createElement('canvas');
  canvas.width = A4_W;
  canvas.height = A4_H;
  const ctx = canvas.getContext('2d')!;

  // Fundo branco
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, A4_W, A4_H);

  // Carregar base.png como fundo do A4
  try {
    const baseBitmap = await loadTemplate('base.png');
    ctx.drawImage(baseBitmap, 0, 0, A4_W, A4_H);
  } catch {
    console.warn('base.png não carregado, usando fundo branco');
  }

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Aspect ratio original dos templates (1011x740)
  const TEMPLATE_RATIO = 1011 / 740;

  // Calcular dimensões preservando aspect ratio
  // Baseado na altura disponível para caber 3 matrizes + 2 gaps
  const marginY = Math.round(A4_H * 0.038);
  const availableH = A4_H - 2 * marginY;
  const matrizH = Math.round((availableH - 2 * GAP) / 3);
  const matrizW = Math.round(matrizH * TEMPLATE_RATIO);

  // Centralizar horizontalmente
  const matrizX = Math.round((A4_W - matrizW) / 2);

  // Posições Y
  const frenteY = marginY;
  const meioY = marginY + matrizH + GAP;
  const versoY = marginY + 2 * (matrizH + GAP);

  const drawMatrix = async (b64: string, x: number, y: number, w: number, h: number) => {
    if (!b64 || b64.length < 100) return;
    try {
      const img = await loadImg(b64);
      ctx.drawImage(img, x, y, w, h);
    } catch (e) {
      console.warn('Erro ao desenhar matriz no PDF:', e);
    }
  };

  await Promise.all([
    drawMatrix(cnhFrenteBase64, matrizX, frenteY, matrizW, matrizH),
    drawMatrix(cnhMeioBase64,   matrizX, meioY,   matrizW, matrizH),
    drawMatrix(cnhVersoBase64,  matrizX, versoY,  matrizW, matrizH),
  ]);

  return canvas.toDataURL('image/png');
}

export type { CnhData };
