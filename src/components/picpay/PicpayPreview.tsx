import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import basePicpay from '@/assets/base-picpay.png';

export interface PicpayFormData {
  dataHora: string;
  valor: string;
  nomeRemetente: string;
  cpfPara: string;
  bancoRecebedor: string;
  nomeRecebedor: string;
  cpfDe: string;
  bancoRemetente: string;
  idTransacao: string;
  chavePix: string;
  agencia: string;
}

export interface PicpayPreviewRef {
  getSnapshot: () => Promise<string | null>;
}

// Photoshop base dimensions
const IMG_W = 2151;
const IMG_H = 3268;

// Replicate script: px(n) = n * (72/96) but for canvas we use raw pixels
// Canvas will be set to 2151x3268, image drawn to fill it
// Font size from script: Math.round(px(90) * 0.52) = Math.round(67.5 * 0.52) = 35
const FONT_SIZE = 35;

interface FieldDef {
  key: keyof PicpayFormData;
  x: number;
  y: number;
  size: number;
  font: string;
  w?: number;
  h?: number;
  bold?: boolean;
  maxWidth?: number;
  lineHeight?: number;
}

const FIELDS: FieldDef[] = [
  // CAMPO 1 — Data/hora: X 148, Y 431, Regular
  { key: 'dataHora', x: 148, y: 431, size: FONT_SIZE, font: 'Helvetica' },
  // CAMPO 2 — Valor: X 148, Y 664, Bold
  { key: 'valor', x: 148, y: 664, size: FONT_SIZE, font: 'Helvetica', bold: true },
  // CAMPO 3 — Nome remetente (De): X 143, Y 900, Bold, wrap
  { key: 'nomeRemetente', x: 143, y: 900, size: FONT_SIZE, font: 'Helvetica', bold: true, maxWidth: 493, lineHeight: 42 },
  // CAMPO 4 — CPF Para: X 147, Y 1113, Regular
  { key: 'cpfPara', x: 147, y: 1113, size: FONT_SIZE, font: 'Helvetica' },
  // CAMPO 5 — Banco recebedor: X 148, Y 1194, Regular
  { key: 'bancoRecebedor', x: 148, y: 1194, size: FONT_SIZE, font: 'Helvetica' },
  // CAMPO 6 — Nome recebedor (Para): X 148, Y 1426, Bold, wrap
  { key: 'nomeRecebedor', x: 148, y: 1426, size: FONT_SIZE, font: 'Helvetica', bold: true, maxWidth: 697, lineHeight: 42 },
  // CAMPO 7 — CPF De: X 147, Y 1578, Regular
  { key: 'cpfDe', x: 147, y: 1578, size: FONT_SIZE, font: 'Helvetica' },
  // CAMPO 8 — Banco remetente: X 148, Y 1661, Regular
  { key: 'bancoRemetente', x: 148, y: 1661, size: FONT_SIZE, font: 'Helvetica' },
  // CAMPO 9 — ID transação: X 147, Y 1903, Regular
  { key: 'idTransacao', x: 147, y: 1903, size: FONT_SIZE, font: 'Helvetica' },
  // CAMPO 10 — Chave Pix: X 149, Y 2267, Regular
  { key: 'chavePix', x: 149, y: 2267, size: FONT_SIZE, font: 'Helvetica' },
  // CAMPO 11 — Agência: X 147, Y 2567, Regular
  { key: 'agencia', x: 147, y: 2567, size: FONT_SIZE, font: 'Helvetica' },
];

interface PicpayPreviewProps {
  formData: PicpayFormData;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  let line = '';
  let yOffset = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + yOffset);
      line = word;
      yOffset += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + yOffset);
    yOffset += lineHeight;
  }
  return yOffset;
}

export const PicpayPreview = forwardRef<PicpayPreviewRef, PicpayPreviewProps>(
  function PicpayPreview({ formData }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [ready, setReady] = useState(false);
    const rafRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      getSnapshot: async () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        try {
          return canvas.toDataURL('image/png');
        } catch {
          return null;
        }
      },
    }), []);

    useEffect(() => {
      let cancelled = false;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        setBgImage(img);
        setReady(true);
      };
      img.onerror = () => console.error('Erro ao carregar base PicPay');
      img.src = basePicpay;
      return () => { cancelled = true; };
    }, []);

    useEffect(() => {
      if (!ready || !bgImage) return;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to Photoshop dimensions (2151x3268)
        canvas.width = IMG_W;
        canvas.height = IMG_H;

        // Draw base image scaled to fill the canvas
        ctx.drawImage(bgImage, 0, 0, IMG_W, IMG_H);

        const COR = '#1a1a1a';

        // Draw all fields exactly like the script
        for (const f of FIELDS) {
          let value = formData[f.key] || '';
          if (!value.trim()) continue;
          if (f.key === 'valor') value = `R$ ${value}`;

          ctx.fillStyle = COR;
          ctx.font = `${f.bold ? 'bold ' : ''}${f.size}px Arial, Helvetica, sans-serif`;
          ctx.textBaseline = 'top';

          if (f.maxWidth) {
            drawWrappedText(ctx, value, f.x, f.y, f.maxWidth, f.lineHeight || (f.size + 6));
          } else {
            ctx.fillText(value, f.x, f.y);
          }
        }

        // Watermark
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 100px Arial, sans-serif';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DATA SISTEMAS', 0, -100);
        ctx.fillText('DATA SISTEMAS', 0, 100);
        ctx.restore();
      });

      return () => cancelAnimationFrame(rafRef.current);
    }, [formData, ready, bgImage]);

    return (
      <div className="rounded-lg border border-border overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-auto pointer-events-none select-none"
          style={{ display: 'block' }}
        />
        {!ready && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Carregando preview...
          </div>
        )}
      </div>
    );
  }
);
