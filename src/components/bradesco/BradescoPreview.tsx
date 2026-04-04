import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import baseBradesco from '@/assets/base-bradesco.png';

export interface BradescoFormData {
  dataHora: string;
  valor: string;
  nomePagador: string;
  cpfPagador: string;
  agenciaConta: string;
  nomeRecebedor: string;
  cpfRecebedor: string;
  instituicaoRecebedor: string;
  chavePix: string;
  idTransacao: string;
  autenticacao: string;
}

export interface BradescoPreviewRef {
  getCleanSnapshot: () => Promise<string | null>;
}

const IMG_W = 1304;
const IMG_H = 1920;
const DPI = 96;
const PDF_SCALE = 72 / DPI;
const pdfPx = (value: number) => value * PDF_SCALE;

const PAGE_W = Math.round(pdfPx(IMG_W));
const PAGE_H = Math.round(pdfPx(IMG_H));
const FONT_SIZE = Math.round(pdfPx(42));
const TEXT_COLOR = '#333333';

interface FieldDef {
  key: keyof BradescoFormData;
  x: number;
  y: number;
  size: number;
  bold?: boolean;
  maxWidth?: number;
  lineHeight?: number;
  maxLines?: number;
}

// Field positions mapped to the Bradesco base image
const FIELDS: FieldDef[] = [
  // Dados de quem pagou - Nome
  { key: 'nomePagador', x: pdfPx(56), y: pdfPx(395), size: FONT_SIZE, bold: false },
  // Dados de quem pagou - CPF
  { key: 'cpfPagador', x: pdfPx(56), y: pdfPx(435), size: FONT_SIZE - 2, bold: false },
  // Dados de quem pagou - Ag/CC
  { key: 'agenciaConta', x: pdfPx(56), y: pdfPx(475), size: FONT_SIZE - 2, bold: false },
  // Dados da Transação - Valor
  { key: 'valor', x: pdfPx(56), y: pdfPx(590), size: FONT_SIZE + 4, bold: true },
  // Dados da Transação - Data
  { key: 'dataHora', x: pdfPx(56), y: pdfPx(635), size: FONT_SIZE - 2, bold: false },
  // Dados da Transação - ID
  { key: 'idTransacao', x: pdfPx(56), y: pdfPx(675), size: FONT_SIZE - 4, bold: false },
  // Dados de quem recebeu - Nome
  { key: 'nomeRecebedor', x: pdfPx(56), y: pdfPx(790), size: FONT_SIZE, bold: false, maxWidth: pdfPx(600), lineHeight: pdfPx(48), maxLines: 2 },
  // Dados de quem recebeu - CPF
  { key: 'cpfRecebedor', x: pdfPx(56), y: pdfPx(830), size: FONT_SIZE - 2, bold: false },
  // Dados de quem recebeu - Instituição
  { key: 'instituicaoRecebedor', x: pdfPx(56), y: pdfPx(870), size: FONT_SIZE - 2, bold: false },
  // Dados de quem recebeu - Chave Pix
  { key: 'chavePix', x: pdfPx(56), y: pdfPx(910), size: FONT_SIZE - 2, bold: false },
  // Autenticação
  { key: 'autenticacao', x: pdfPx(56), y: pdfPx(1090), size: FONT_SIZE - 2, bold: false },
];

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
  if (line) ctx.fillText(line, x, y + yOffset);
}

function drawFormFields(ctx: CanvasRenderingContext2D, formData: BradescoFormData) {
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
      drawWrappedText(ctx, value, field.x, field.y, field.maxWidth, field.lineHeight || field.size * 1.2, field.maxLines || 2);
    } else {
      ctx.fillText(value, field.x, field.y);
    }
  }
}

function drawWatermarks(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 90px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = 'DATA SISTEMAS';
  const spacingX = 350;
  const spacingY = 250;

  for (let y = -200; y < PAGE_H + 200; y += spacingY) {
    for (let x = -200; x < PAGE_W + 200; x += spacingX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
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
