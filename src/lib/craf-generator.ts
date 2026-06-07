// CRAF image generator (canvas-based)
// Reference image base is ~1700x2480; we scale all python coords to actual template size.

export interface CrafData {
  nome: string;
  cpf: string;
  rg: string;
  sfpcVinculacao: string;
  amparoLegal: string;
  registro: string;
  tipo: string;
  marca: string;
  calibre: string;
  nSerie: string;
  nSigma: string;
  dataExpedicao: string;
  gacEmissora: string;
  cidadeUf: string;
  validade: string;
}

const REF_W = 1700;
const REF_H = 2480;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateCrafImage(
  canvas: HTMLCanvasElement,
  data: CrafData,
  qrCodeDataUrl?: string,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Sem contexto canvas');

  const template = await loadImage('/templates/craf-base.png');
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  const sx = canvas.width / REF_W;
  const sy = canvas.height / REF_H;

  const drawText = (txt: string, x: number, y: number, size: number) => {
    if (!txt) return;
    ctx.font = `${Math.round(size * sy)}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(txt, x * sx, y * sy);
  };

  // From the python script (coords on ref image ~1700x2480)
  drawText(data.tipo, 1310, 2053, 18);
  drawText(data.registro, 1297, 1960, 21);
  drawText(data.nSerie, 1309, 2210, 18);
  drawText(data.nSigma, 1545, 2210, 18);
  drawText(data.calibre, 1309, 2128, 18);
  drawText(data.marca, 1550, 2053, 18);
  drawText(data.dataExpedicao, 1306, 2279, 20);
  drawText(data.gacEmissora, 1293, 2423, 18);
  drawText(data.cidadeUf, 1294, 2465, 18);
  drawText(data.amparoLegal, 711, 1465, 18);
  drawText(data.sfpcVinculacao, 1356, 1363, 18);
  drawText(data.rg, 1018, 1363, 18);
  drawText(data.cpf, 712, 1363, 18);
  drawText(data.nome, 712, 1245, 20);
  drawText(data.validade, 706, 1136, 21);

  if (qrCodeDataUrl) {
    try {
      const qr = await loadImage(qrCodeDataUrl);
      // python: pos_qr_x=691, pos_qr_y=1929; default size ~250 in ref
      const qrSize = 260 * sx;
      ctx.drawImage(qr, 691 * sx, 1929 * sy, qrSize, qrSize);
    } catch (e) { console.warn('QR draw failed', e); }
  }
}

export function canvasToBase64(canvas: HTMLCanvasElement, type: 'png' | 'jpeg' = 'png', quality = 0.92): string {
  return canvas.toDataURL(`image/${type}`, quality);
}
