import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import baseBradesco from '@/assets/base-bradesco.png';

export interface BradescoFormData {
  numeroControle: string;
  dataHora: string;
  valor: string;
  nomePagador: string;
  cpfPagador: string;
  instituicaoPagador: string;
  debitarDa: string;
  nomeRecebedor: string;
  cpfRecebedor: string;
  instituicaoRecebedor: string;
  chavePix: string;
  transacaoCelular: string;
  autenticacao: string;
}

export interface BradescoPreviewRef {
  getCleanSnapshot: () => Promise<string | null>;
}

const IMG_W = 2180;
const IMG_H = 3208;
const DPI = 300;
const px = (n: number) => n * (72 / DPI);

const PAGE_W = px(IMG_W);
const PAGE_H = px(IMG_H);
const FONT_SIZE = Math.round(px(90) * 0.52);
const SIZE_AUTH = px(44);
const TEXT_COLOR = '#1a1a1a';
const MAX_W = px(1900);

interface FieldDef {
  key: keyof BradescoFormData;
  x: number;
  y: number;
  size: number;
  bold?: boolean;
  label?: string;
  labelBold?: boolean;
  prefix?: string;
}

const FIELDS: FieldDef[] = [
  { key: 'dataHora',             x: px(78),  y: px(435),  size: FONT_SIZE, label: 'Data e Hora:',        labelBold: true },
  { key: 'numeroControle',      x: px(79),  y: px(510),  size: FONT_SIZE, label: 'Número de Controle:', labelBold: true },
  { key: 'nomePagador',         x: px(79),  y: px(715),  size: FONT_SIZE, label: 'Nome:',               labelBold: true },
  { key: 'cpfPagador',          x: px(78),  y: px(791),  size: FONT_SIZE, label: 'CPF:',                labelBold: true },
  { key: 'instituicaoPagador',  x: px(79),  y: px(869),  size: FONT_SIZE, label: 'Instituição:',        labelBold: true },
  { key: 'valor',               x: px(78),  y: px(1071), size: FONT_SIZE, label: 'Valor:',              labelBold: true, prefix: 'R$ ' },
  { key: 'debitarDa',           x: px(79),  y: px(1227), size: FONT_SIZE, label: 'Debitar da:',         labelBold: true },
  { key: 'nomeRecebedor',       x: px(78),  y: px(1431), size: FONT_SIZE, label: 'Nome:',               labelBold: true },
  { key: 'cpfRecebedor',        x: px(78),  y: px(1507), size: FONT_SIZE, label: 'CPF:',                labelBold: true },
  { key: 'instituicaoRecebedor',x: px(79),  y: px(1585), size: FONT_SIZE, label: 'Instituição:',        labelBold: true },
  { key: 'chavePix',            x: px(79),  y: px(1663), size: FONT_SIZE, label: 'Chave:',              labelBold: true },
  { key: 'transacaoCelular',    x: px(80),  y: px(1766), size: FONT_SIZE, bold: false },
];

interface SectionTitle {
  text: string;
  x: number;
  y: number;
}

const SECTION_TITLES: SectionTitle[] = [
  { text: 'Dados de quem pagou',    x: px(78), y: px(639)  },
  { text: 'Dados da Transação',     x: px(79), y: px(995)  },
  { text: 'Dados de quem recebeu',  x: px(79), y: px(1355) },
];

function drawFormFields(ctx: CanvasRenderingContext2D, formData: BradescoFormData) {
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Section titles
  for (const title of SECTION_TITLES) {
    ctx.font = `bold ${FONT_SIZE}px Arial, sans-serif`;
    ctx.fillText(title.text, title.x, title.y);
  }

  // Fields with label bold + value regular
  for (const field of FIELDS) {
    let value = formData[field.key] || '';
    if (!value.trim()) continue;

    if (field.prefix && !value.trim().startsWith(field.prefix.trim())) {
      value = field.prefix + value;
    }

    if (field.label) {
      const labelText = field.label;
      ctx.font = `bold ${field.size}px Arial, sans-serif`;
      ctx.fillText(labelText, field.x, field.y);
      const lw = ctx.measureText(labelText).width + 4;
      ctx.font = `${field.size}px Arial, sans-serif`;
      ctx.fillText(value, field.x + lw, field.y);
    } else {
      ctx.font = `${field.bold ? 'bold ' : ''}${field.size}px Arial, sans-serif`;
      ctx.fillText(value, field.x, field.y);
    }
  }

  // Autenticação - special: centered, multi-line, semi-transparent, monospace
  const auth = formData.autenticacao || '';
  if (auth.trim()) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `${SIZE_AUTH}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    const authX = px(22);
    const authW = px(2141);
    const centerX = authX + authW / 2;
    const lines = auth.split('\n');
    let yPos = px(1966);
    const lineH = SIZE_AUTH * 1.4;
    for (const line of lines) {
      ctx.fillText(line, centerX, yPos);
      yPos += lineH;
    }
    ctx.restore();
  }
}

function drawWatermarks(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 60px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = 'AMOSTRA                    AMOSTRA                    AMOSTRA                    AMOSTRA                    AMOSTRA';
  const spacingY = 120;

  for (let y = 0; y < PAGE_H; y += spacingY) {
    ctx.fillText(text, PAGE_W / 2, y);
  }
  ctx.restore();
}

export const BradescoPreview = forwardRef<BradescoPreviewRef, { formData: BradescoFormData }>(
  function BradescoPreview({ formData }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [ready, setReady] = useState(false);
    const rafRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      getCleanSnapshot: async () => {
        if (!bgImage) return null;
        const offscreen = document.createElement('canvas');
        offscreen.width = PAGE_W;
        offscreen.height = PAGE_H;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return null;
        ctx.clearRect(0, 0, PAGE_W, PAGE_H);
        ctx.drawImage(bgImage, 0, 0, PAGE_W, PAGE_H);
        drawFormFields(ctx, formData);
        try {
          const dataUrl = offscreen.toDataURL('image/png');
          offscreen.width = 0;
          offscreen.height = 0;
          return dataUrl;
        } catch {
          return null;
        }
      },
    }), [bgImage, formData]);

    useEffect(() => {
      let cancelled = false;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { if (!cancelled) { setBgImage(img); setReady(true); } };
      img.onerror = () => console.error('Erro ao carregar base Bradesco');
      img.src = baseBradesco;
      return () => { cancelled = true; };
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
        drawFormFields(ctx, formData);
        drawWatermarks(ctx);
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
