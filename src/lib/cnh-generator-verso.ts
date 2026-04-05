// Gerador de CNH Verso (Canvas client-side)
import { loadTemplate } from './template-loader';

interface CnhVersoData {
  matrizFinal?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadFont(): Promise<void> {
  try {
    const ocrBFontUrl = (await import('../assets/OCR-B.otf')).default;
    const font = new FontFace('OCR-B', `url(${ocrBFontUrl})`);
    const loaded = await font.load();
    document.fonts.add(loaded);
  } catch { /* silent */ }
  try {
    const courierNewBoldUrl = (await import('../assets/CourierNewBold.ttf')).default;
    const font = new FontFace('CourierNewBold', `url(${courierNewBoldUrl})`);
    const loaded = await font.load();
    document.fonts.add(loaded);
  } catch { /* silent */ }
  await document.fonts.ready;
}

async function drawTemplate(ctx: CanvasRenderingContext2D, s: number = 1): Promise<void> {
  try {
    const bitmap = await loadTemplate('limpa3.png');
    ctx.drawImage(bitmap, 0, 0, 1011 * s, 740 * s);
  } catch {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 1011 * s, 740 * s);
  }
}

function drawMrzText(ctx: CanvasRenderingContext2D, data: CnhVersoData, s: number = 1): void {
  ctx.font = `${23 * s}px "OCR-B", "CourierNewBold", monospace`;
  ctx.fillStyle = '#373435';
  ctx.textAlign = 'left';

  ctx.fillText('I<BRA069082717<432<<<<<<<<<', 200.49 * s, 446.02 * s);
  ctx.fillText('9405253M1206157BRA<<<<<<<<4', 200.49 * s, 493.26 * s);

  const mrzText = data.matrizFinal || 'NOME<<COMPLETO<<<<<<<<<<<<';
  ctx.fillText(mrzText, 201.49 * s, 538.84 * s);
}

export async function generateCNHVerso(
  canvas: HTMLCanvasElement,
  data: CnhVersoData,
  scale: number = 1
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  const s = scale;

  canvas.width = 1011 * s;
  canvas.height = 740 * s;

  await loadFont();
  await drawTemplate(ctx, s);
  drawMrzText(ctx, data, s);
}

export type { CnhVersoData };
