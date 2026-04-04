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

// Original Photoshop coordinates are for 2151x3268
// Current base image is 1263x1920, so we scale by 1263/2151
const SCALE = 1263 / 2151;
const s = (n: number) => Math.round(n * SCALE);

interface FieldDef {
  key: keyof PicpayFormData;
  x: number;
  y: number;
  size: number;
  color?: string;
  bold?: boolean;
  maxWidth?: number;
  lineHeight?: number;
}

// Font size in script: Math.round(px(90) * 0.52) = Math.round(90*0.75*0.52) = 35 at 2151 scale
// Scaled: 35 * 0.587 ≈ 21
const FONT_SIZE = s(35);
const FONT_SIZE_SMALL = s(24); // for dataHora (11.54pt)

const FIELDS: FieldDef[] = [
  // 1. Data/Hora - X:148, Y:431 - Regular
  { key: 'dataHora', x: s(148), y: s(431), size: FONT_SIZE_SMALL, color: '#1a1a1a' },
  // 2. Valor - X:148, Y:664 - Bold
  { key: 'valor', x: s(148), y: s(664), size: FONT_SIZE, bold: true, color: '#1a1a1a' },
  // 3. Nome Remetente (De) - X:143, Y:900 - Bold, wrap
  { key: 'nomeRemetente', x: s(143), y: s(900), size: FONT_SIZE, bold: true, color: '#1a1a1a', maxWidth: s(493), lineHeight: s(42) },
  // 4. CPF Para - X:147, Y:1113 - Regular
  { key: 'cpfPara', x: s(147), y: s(1113), size: FONT_SIZE, color: '#1a1a1a' },
  // 5. Banco Recebedor - X:148, Y:1194 - Regular
  { key: 'bancoRecebedor', x: s(148), y: s(1194), size: FONT_SIZE, color: '#1a1a1a' },
  // 6. Nome Recebedor (Para) - X:148, Y:1426 - Bold, wrap
  { key: 'nomeRecebedor', x: s(148), y: s(1426), size: FONT_SIZE, bold: true, color: '#1a1a1a', maxWidth: s(697), lineHeight: s(42) },
  // 7. CPF De (remetente) - X:147, Y:1578 - Regular
  { key: 'cpfDe', x: s(147), y: s(1578), size: FONT_SIZE, color: '#1a1a1a' },
  // 8. Banco Remetente - X:148, Y:1661 - Regular
  { key: 'bancoRemetente', x: s(148), y: s(1661), size: FONT_SIZE, color: '#1a1a1a' },
  // 9. ID Transação - X:147, Y:1903 - Regular
  { key: 'idTransacao', x: s(147), y: s(1903), size: FONT_SIZE, color: '#1a1a1a' },
  // 10. Chave Pix - X:149, Y:2267 - Regular
  { key: 'chavePix', x: s(149), y: s(2267), size: FONT_SIZE, color: '#1a1a1a' },
  // 11. Agência - X:147, Y:2567 - Regular
  { key: 'agencia', x: s(147), y: s(2567), size: FONT_SIZE, color: '#1a1a1a' },
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

        canvas.width = bgImage.naturalWidth;
        canvas.height = bgImage.naturalHeight;

        ctx.drawImage(bgImage, 0, 0);

        for (const f of FIELDS) {
          let value = formData[f.key] || '';
          if (!value.trim()) continue;
          if (f.key === 'valor') value = `R$ ${value}`;

          ctx.fillStyle = f.color || '#1a1a1a';
          ctx.font = `${f.bold ? 'bold ' : ''}${f.size}px Arial, "Helvetica Neue", Helvetica, sans-serif`;
          ctx.textBaseline = 'alphabetic';

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
        ctx.font = 'bold 50px Arial, sans-serif';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'center';
        ctx.fillText('DATA SISTEMAS', 0, -50);
        ctx.fillText('DATA SISTEMAS', 0, 50);
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
