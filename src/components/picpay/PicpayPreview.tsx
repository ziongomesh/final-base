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

const IMG_W = 2151;
const IMG_H = 3268;
const DPI = 96;
const PDF_SCALE = 72 / DPI;
const pdfPx = (value: number) => value * PDF_SCALE;

// Mesmo tamanho lógico do PDF gerado pelo script
const PAGE_W = Math.round(pdfPx(IMG_W));
const PAGE_H = Math.round(pdfPx(IMG_H));
const FONT_SIZE = Math.round(pdfPx(90) * 0.52);
const TEXT_COLOR = '#1a1a1a';

interface FieldDef {
  key: keyof PicpayFormData;
  x: number;
  y: number;
  size: number;
  bold?: boolean;
  maxWidth?: number;
  lineHeight?: number;
  maxLines?: number;
}

const FIELDS: FieldDef[] = [
  { key: 'dataHora', x: pdfPx(148), y: pdfPx(431), size: FONT_SIZE },
  { key: 'valor', x: pdfPx(148), y: pdfPx(664), size: FONT_SIZE + 10, bold: true },
  { key: 'nomeRemetente', x: pdfPx(143), y: pdfPx(900), size: FONT_SIZE + 10, bold: true, maxWidth: pdfPx(697), lineHeight: pdfPx(42), maxLines: 2 },
  { key: 'cpfPara', x: pdfPx(147), y: pdfPx(1113), size: FONT_SIZE, bold: true },
  { key: 'bancoRecebedor', x: pdfPx(148), y: pdfPx(1194), size: FONT_SIZE },
  { key: 'nomeRecebedor', x: pdfPx(148), y: pdfPx(1426), size: FONT_SIZE + 7, bold: true, maxWidth: pdfPx(697), lineHeight: pdfPx(42), maxLines: 2 },
  { key: 'cpfDe', x: pdfPx(147), y: pdfPx(1578), size: FONT_SIZE, bold: true },
  { key: 'bancoRemetente', x: pdfPx(148), y: pdfPx(1661), size: FONT_SIZE },
  { key: 'idTransacao', x: pdfPx(147), y: pdfPx(1903), size: FONT_SIZE },
  { key: 'chavePix', x: pdfPx(149), y: pdfPx(2267), size: FONT_SIZE },
  { key: 'agencia', x: pdfPx(147), y: pdfPx(2567), size: FONT_SIZE },
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
  maxLines = 2,
): void {
  const words = text.split(' ');
  let line = '';
  let yOffset = 0;
  let lineCount = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;

    if (ctx.measureText(testLine).width > maxWidth && line) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line, x, y + yOffset);
        return;
      }
      ctx.fillText(line, x, y + yOffset);
      line = word;
      yOffset += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, y + yOffset);
  }
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

      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      if (!ready || !bgImage) return;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = PAGE_W;
        canvas.height = PAGE_H;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, PAGE_W, PAGE_H);
        ctx.drawImage(bgImage, 0, 0, PAGE_W, PAGE_H);
        ctx.fillStyle = TEXT_COLOR;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        for (const field of FIELDS) {
          let value = formData[field.key] || '';
          if (!value.trim()) continue;
          if (field.key === 'valor' && !value.trim().startsWith('R$')) {
            value = `R$ ${value}`;
          }

          ctx.font = `${field.bold ? 'bold ' : ''}${field.size}px Arial, "Helvetica Neue", Helvetica, sans-serif`;

          if (field.maxWidth) {
            drawWrappedText(
              ctx,
              value,
              field.x,
              field.y,
              field.maxWidth,
              field.lineHeight || field.size * 1.2,
              field.maxLines || 2,
            );
          } else {
            ctx.fillText(value, field.x, field.y);
          }
        }

        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 75px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(PAGE_W / 2, PAGE_H / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText('DATA SISTEMAS', 0, -75);
        ctx.fillText('DATA SISTEMAS', 0, 75);
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
