// Gerador de CNH na Mesa (Canvas client-side)
import cnhMesaBase from '@/assets/templates/cnh-mesa-base.png';

export interface CnhMesaData {
  nome?: string;
}

const BASE_W = 1011;
const BASE_H = 1400;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateCnhMesa(
  canvas: HTMLCanvasElement,
  data: CnhMesaData,
  scale: number = 1
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  const s = scale;

  canvas.width = BASE_W * s;
  canvas.height = BASE_H * s;

  // Draw base template
  try {
    const baseImg = await loadImage(cnhMesaBase);
    ctx.drawImage(baseImg, 0, 0, BASE_W * s, BASE_H * s);
  } catch {
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, BASE_W * s, BASE_H * s);
  }

  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left';

  // NOME (Photoshop: X=674 Y=553, 40px)
  if (data.nome) {
    ctx.font = `${27 * s}px Arial, sans-serif`;
    ctx.fillText(data.nome.toUpperCase(), 456 * s, 470 * s);
  }
}

export { BASE_W, BASE_H };
