import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import basePicpay from '@/assets/base-picpay.png';

export interface PicpayFormData {
  paraNome: string;
  deNome: string;
  valor: string;
  contaRecebedor: string;
}

export interface PicpayPreviewRef {
  getSnapshot: () => Promise<string | null>;
}

// Field definitions with Photoshop coordinates (base image 1263x1920)
// Word-wrap fields have maxWidth set
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

// All fields use Arial Bold ~16pt mapped to canvas pixels
// The base image is 1263x1920, coordinates are raw pixel positions
// contaRecebedor is drawn dynamically after paraNome
const FIELDS: FieldDef[] = [
  // Para - nome (word-wrap) - Arial Bold 16.07pt
  { key: 'paraNome', x: 143, y: 560, size: 33, bold: true, color: '#1a1a1a', maxWidth: 360, lineHeight: 40 },

  // De - nome (word-wrap) - Arial Bold 16.07pt
  { key: 'deNome', x: 148, y: 880, size: 33, bold: true, color: '#1a1a1a', maxWidth: 480, lineHeight: 40 },

  // Valor - X:148, Y:430 - Arial Bold 16.07pt
  { key: 'valor', x: 148, y: 430, size: 33, bold: true, color: '#1a1a1a' },
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

    // Load base image
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

    // Redraw on form changes
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

        // Draw background
        ctx.drawImage(bgImage, 0, 0);

        // Draw fields
        let paraNomeEndY = 560; // default
        for (const f of FIELDS) {
          let value = formData[f.key] || '';
          if (!value.trim()) continue;
          // Prefix valor with "R$ "
          if (f.key === 'valor') value = `R$ ${value}`;

          ctx.fillStyle = f.color || '#1a1a1a';
          ctx.font = `${f.bold ? 'bold ' : ''}${f.size}px Arial, "Helvetica Neue", Helvetica, sans-serif`;
          ctx.textBaseline = 'alphabetic';

          if (f.maxWidth) {
            const height = drawWrappedText(ctx, value, f.x, f.y, f.maxWidth, f.lineHeight || (f.size + 6));
            if (f.key === 'paraNome') {
              paraNomeEndY = f.y + height;
            }
          } else {
            ctx.fillText(value, f.x, f.y);
          }
        }

        // Draw contaRecebedor dynamically below paraNome
        const contaValue = formData.contaRecebedor || '';
        if (contaValue.trim()) {
          const contaY = paraNomeEndY + 15;
          ctx.fillStyle = '#1a1a1a';
          ctx.font = '27px Arial, "Helvetica Neue", Helvetica, sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(contaValue, 148, contaY);
        }

        // Watermark
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 80px Arial, sans-serif';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'center';
        ctx.fillText('DATA SISTEMAS', 0, -80);
        ctx.fillText('DATA SISTEMAS', 0, 80);
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
