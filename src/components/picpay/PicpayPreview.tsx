import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import basePicpay from '@/assets/base-picpay.png';

export interface PicpayFormData {
  valor: string;
  paraNome: string;
  paraCpf: string;
  paraInstituicao: string;
  deNome: string;
  deCpf: string;
  deInstituicao: string;
  transactionId: string;
  chavePix: string;
  dadosBancarios: string;
  dataHora: string;
}

export interface PicpayPreviewRef {
  getSnapshot: () => Promise<string | null>;
}

// Field positions mapped to the base image (natural pixel coords)
// These are approximate and will need calibration
interface FieldDef {
  key: keyof PicpayFormData;
  x: number;
  y: number;
  size: number;
  color?: string;
  bold?: boolean;
  maxWidth?: number;
}

const FIELDS: FieldDef[] = [
  // Valor
  { key: 'valor', x: 60, y: 200, size: 28, bold: true },
  // Para - nome
  { key: 'paraNome', x: 60, y: 290, size: 16 },
  // Para - CPF
  { key: 'paraCpf', x: 60, y: 315, size: 14, color: '#666666' },
  // Para - Instituição
  { key: 'paraInstituicao', x: 60, y: 340, size: 14, color: '#666666' },
  // De - nome
  { key: 'deNome', x: 60, y: 480, size: 16 },
  // De - CPF
  { key: 'deCpf', x: 60, y: 505, size: 14, color: '#666666' },
  // De - Instituição
  { key: 'deInstituicao', x: 60, y: 530, size: 14, color: '#666666' },
  // ID da transação
  { key: 'transactionId', x: 60, y: 650, size: 14, color: '#666666' },
  // Chave Pix do recebedor
  { key: 'chavePix', x: 60, y: 740, size: 14, color: '#666666' },
  // Dados bancários do recebedor
  { key: 'dadosBancarios', x: 60, y: 830, size: 14, color: '#666666', maxWidth: 400 },
  // Data/hora (small, at top or near ID)
  { key: 'dataHora', x: 60, y: 870, size: 14, color: '#666666' },
];

interface PicpayPreviewProps {
  formData: PicpayFormData;
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
        for (const f of FIELDS) {
          const value = formData[f.key] || '';
          if (!value.trim()) continue;

          ctx.fillStyle = f.color || '#1a1a1a';
          ctx.font = `${f.bold ? 'bold ' : ''}${f.size}px -apple-system, "Segoe UI", Roboto, sans-serif`;
          ctx.textBaseline = 'alphabetic';

          if (f.maxWidth) {
            // Wrap text
            const words = value.split(' ');
            let line = '';
            let yOffset = 0;
            for (const word of words) {
              const testLine = line ? `${line} ${word}` : word;
              if (ctx.measureText(testLine).width > f.maxWidth && line) {
                ctx.fillText(line, f.x, f.y + yOffset);
                line = word;
                yOffset += f.size + 4;
              } else {
                line = testLine;
              }
            }
            if (line) ctx.fillText(line, f.x, f.y + yOffset);
          } else {
            ctx.fillText(value, f.x, f.y);
          }
        }

        // Watermark
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 60px sans-serif';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'center';
        ctx.fillText('DATA SISTEMAS', 0, -60);
        ctx.fillText('DATA SISTEMAS', 0, 60);
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
