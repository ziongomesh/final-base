import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { loadWatermarkLogo, drawLogoWatermarks } from '@/lib/watermark-utils';
import baseInter from '@/assets/base-inter.png';
import interBold from '@/assets/inter-bold.ttf';
import interRegular from '@/assets/inter-regular.ttf';

export interface InterFormData {
  valorPrincipal: string;
  dataHora: string;
  descricao: string;
  valorOriginal: string;
  desconto: string;
  juros: string;
  multa: string;
  valorTotal: string;
  dataVencimento: string;
  dataPagamento: string;
  codigoBarras1: string;
  codigoBarras2: string;
  beneficiario: string;
  cpfRecebedor: string;
  instituicaoRecebedor: string;
  nomePagador: string;
  instituicaoPagador: string;
  agencia: string;
  conta: string;
}

export interface InterPreviewRef {
  getCleanSnapshot: () => Promise<string | null>;
}

export const PAGE_W = 736;
export const PAGE_H = 1909;

const BOLD = 'InterBold';
const REGULAR = 'InterRegular';
const TEXT_COLOR = '#1a1a1a';

let fontsLoadedPromise: Promise<void> | null = null;
function ensureFonts(): Promise<void> {
  if (fontsLoadedPromise) return fontsLoadedPromise;
  fontsLoadedPromise = (async () => {
    try {
      const bold = new FontFace(BOLD, `url(${interBold})`);
      const reg = new FontFace(REGULAR, `url(${interRegular})`);
      const [b, r] = await Promise.all([bold.load(), reg.load()]);
      (document as any).fonts.add(b);
      (document as any).fonts.add(r);
    } catch (e) {
      console.warn('Inter fonts failed to load', e);
    }
  })();
  return fontsLoadedPromise;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  font: string,
  opts?: { width?: number; align?: 'left' | 'right' | 'center' },
) {
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = 'top';
  const align = opts?.align ?? 'left';
  if (opts?.width && align === 'right') {
    ctx.textAlign = 'right';
    ctx.fillText(text, x + opts.width, y);
  } else if (opts?.width && align === 'center') {
    ctx.textAlign = 'center';
    ctx.fillText(text, x + opts.width / 2, y);
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
  }
}

function drawFormFields(ctx: CanvasRenderingContext2D, f: InterFormData) {
  // Título
  drawText(ctx, 'Pagamento realizado', 187, 191, 35.46, BOLD);

  // Valor principal
  if (f.valorPrincipal.trim()) {
    const v = f.valorPrincipal.trim().startsWith('R$') ? f.valorPrincipal : `R$ ${f.valorPrincipal}`;
    drawText(ctx, v, 280, 245, 35.46, BOLD, { width: 205, align: 'right' });
  }

  // Data principal (regular)
  if (f.dataHora.trim()) {
    drawText(ctx, f.dataHora, 230.25, 297.47, 21.47, REGULAR);
  }

  // Descrição
  if (f.descricao.trim()) {
    drawText(ctx, f.descricao, 280, 988, 21.47, BOLD, { width: 405, align: 'right' });
  }

  // Sobre transação
  const right = (val: string, y: number) => {
    if (!val.trim()) return;
    const v = val.trim().startsWith('R$') ? val : `R$ ${val}`;
    drawText(ctx, v, 284, y, 21.47, BOLD, { width: 405, align: 'right' });
  };
  right(f.valorOriginal, 437);
  right(f.desconto || 'R$ 0,00', 498);
  right(f.juros || 'R$ 0,00', 561);
  right(f.multa || 'R$ 0,00', 623);
  right(f.valorTotal, 685);

  if (f.dataVencimento.trim()) {
    drawText(ctx, f.dataVencimento, 284, 747, 21.47, BOLD, { width: 405, align: 'right' });
  }
  if (f.dataPagamento.trim()) {
    drawText(ctx, f.dataPagamento, 284, 804, 21.47, BOLD, { width: 405, align: 'right' });
  }

  // Código de barras (duas linhas)
  if (f.codigoBarras1.trim()) drawText(ctx, f.codigoBarras1, 46, 904, 21.47, BOLD);
  if (f.codigoBarras2.trim()) drawText(ctx, f.codigoBarras2, 46, 930, 21.47, BOLD);

  // Quem recebeu
  if (f.beneficiario.trim()) drawText(ctx, f.beneficiario, 46, 1276, 21.26, BOLD);
  if (f.cpfRecebedor.trim()) drawText(ctx, f.cpfRecebedor, 280, 1334, 21.26, BOLD, { width: 405, align: 'right' });
  if (f.instituicaoRecebedor.trim()) drawText(ctx, f.instituicaoRecebedor, 280, 1395, 21.26, BOLD, { width: 405, align: 'right' });

  // Quem pagou
  if (f.nomePagador.trim()) drawText(ctx, f.nomePagador, 284, 1653, 21.26, BOLD, { width: 405, align: 'right' });
  if (f.instituicaoPagador.trim()) drawText(ctx, f.instituicaoPagador, 284, 1713, 21.26, BOLD, { width: 405, align: 'right' });
  if (f.agencia.trim()) drawText(ctx, f.agencia, 284, 1775, 21.26, BOLD, { width: 405, align: 'right' });
  if (f.conta.trim()) drawText(ctx, f.conta, 284, 1839, 21.26, BOLD, { width: 405, align: 'right' });
}

export const InterPreview = forwardRef<InterPreviewRef, { formData: InterFormData }>(
  function InterPreview({ formData }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
    const [ready, setReady] = useState(false);
    const rafRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      getCleanSnapshot: async () => {
        if (!bgImage) return null;
        await ensureFonts();
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
      ensureFonts();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { if (!cancelled) setBgImage(img); };
      img.onerror = () => console.error('Erro ao carregar base Inter');
      img.src = baseInter;
      loadWatermarkLogo().then(logo => { if (!cancelled) setLogoImage(logo); });
      return () => { cancelled = true; };
    }, []);

    useEffect(() => {
      if (bgImage && logoImage) setReady(true);
    }, [bgImage, logoImage]);

    useEffect(() => {
      if (!ready || !bgImage) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(async () => {
        await ensureFonts();
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = PAGE_W;
        canvas.height = PAGE_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, PAGE_W, PAGE_H);
        ctx.drawImage(bgImage, 0, 0, PAGE_W, PAGE_H);
        drawFormFields(ctx, formData);
        if (logoImage) drawLogoWatermarks(ctx, PAGE_W, PAGE_H, logoImage);
      });
      return () => cancelAnimationFrame(rafRef.current);
    }, [formData, ready, bgImage, logoImage]);

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
