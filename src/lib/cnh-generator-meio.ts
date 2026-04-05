// Gerador de CNH Meio (Canvas client-side)
import { loadTemplate } from './template-loader';

interface CnhMeioData {
  obs?: string;
  localEmissao?: string;
  espelho?: string;
  estadoExtenso?: string;
  categoria?: string;
  dataValidade?: string;
  codigo_seguranca?: string;
  renach?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadFonts(): Promise<void> {
  try {
    try {
      const asulFontUrl = (await import('../assets/Asul.ttf')).default;
      const asulBold = new FontFace('Asul', `url(${asulFontUrl})`, { weight: '700' });
      const loaded = await asulBold.load();
      document.fonts.add(loaded);
    } catch { /* fallback */ }

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

    await document.fonts.ready;
  } catch { /* silencioso */ }
}

function formatDateToBrazilian(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

async function drawTemplate(ctx: CanvasRenderingContext2D, s: number = 1): Promise<void> {
  try {
    const bitmap = await loadTemplate('limpa2.png');
    ctx.drawImage(bitmap, 0, 0, 1011 * s, 740 * s);
  } catch {
    ctx.fillStyle = '#373435';
    ctx.fillRect(0, 0, 1011 * s, 740 * s);
  }
}

function drawTexts(ctx: CanvasRenderingContext2D, data: CnhMeioData): void {
  const font = 'Asul, Arial, sans-serif';
  const dataFormatada = formatDateToBrazilian(data.dataValidade || '');
  const categoria = data.categoria;

  ctx.fillStyle = '#373435';
  ctx.font = `bold 14px ${font}`;

  // Categorias - posições baseadas no template original
  const catPositions: Record<string, Array<{ x: number; y: number }>> = {
    'A':  [{ x: 410, y: 105 }],
    'B':  [{ x: 410, y: 172 }],
    'AB': [{ x: 410, y: 105 }, { x: 410, y: 172 }],
    'AC': [{ x: 410, y: 105 }, { x: 410, y: 172 }, { x: 410, y: 240 }],
    'C':  [{ x: 410, y: 172 }, { x: 410, y: 240 }],
    'AD': [{ x: 410, y: 105 }, { x: 410, y: 172 }, { x: 410, y: 240 }, { x: 819, y: 72 }],
    'D':  [{ x: 410, y: 172 }, { x: 410, y: 240 }, { x: 819, y: 72 }],
    'AE': [{ x: 410, y: 105 }, { x: 410, y: 172 }, { x: 410, y: 240 }, { x: 819, y: 72 }, { x: 819, y: 240 }],
    'E':  [{ x: 410, y: 172 }, { x: 410, y: 240 }, { x: 819, y: 72 }, { x: 819, y: 240 }],
  };

  const positions = catPositions[categoria || ''] || [];
  positions.forEach(pos => ctx.fillText(dataFormatada, pos.x, pos.y));

  // Observações
  ctx.fillStyle = '#373435';
  ctx.font = `bold 15px ${font}`;
  ctx.fillText(data.obs || '', 185, 340);

  // Local de emissão
  ctx.font = `bold 16px ${font}`;
  ctx.fillText(data.localEmissao || '', 190, 575);

  // Espelho (rotacionado) - Courier Prime Bold
  ctx.save();
  ctx.translate(130, 690);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '39px "CourierNewBold", "OCR-B", monospace';
  ctx.fillStyle = '#373435';
  ctx.fillText(data.espelho || '', 0, 0);
  ctx.restore();

  // Código de segurança e RENACH — auto-fit para não ultrapassar a área
  const maxWidth = 180;
  ctx.fillStyle = '#373435';

  const drawFittedText = (text: string, x: number, y: number) => {
    if (!text) return;
    let fontSize = 13;
    ctx.font = `bold ${fontSize}px ${font}`;
    while (ctx.measureText(text).width > maxWidth && fontSize > 7) {
      fontSize -= 0.5;
      ctx.font = `bold ${fontSize}px ${font}`;
    }
    ctx.fillText(text, x, y);
  };

  drawFittedText(data.codigo_seguranca || '', 787, 555);
  drawFittedText(data.renach || '', 787, 588);

  // Estado por extenso
  ctx.font = `bold 40px ${font}`;
  ctx.fillText(data.estadoExtenso || '', 346, 675);
}

export async function generateCNHMeio(canvas: HTMLCanvasElement, data: CnhMeioData): Promise<void> {
  await loadFonts();

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = 1011;
  canvas.height = 740;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  await drawTemplate(ctx);
  drawTexts(ctx, data);
}

export type { CnhMeioData };
