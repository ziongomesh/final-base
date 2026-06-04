import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { loadWatermarkLogo, drawLogoWatermarks } from '@/lib/watermark-utils';
import baseItau from '@/assets/base-itau.png';
import iphoneTimeFont from '@/assets/fonte1.otf';

export interface ItauFormData {
  horarioIphone: string;       // ex: 11:12
  descricao: string;           // ex: Itpac c*acordodebitos (bold com opacidade)
  aprovadaEm: string;          // ex: Aprovada 04 mar 2026 13:23
  categoria: string;           // ex: Categoria: outras despesas de educação
  valorTotal: string;          // ex: R$ 9.643,00 em 1x
  cartaoTipo: string;          // ex: Cartão virtual - compra online
  cartaoNome: string;          // ex: Itau Platinum Final 5676
}

export interface ItauPreviewRef {
  getCleanSnapshot: () => Promise<string | null>;
}

export const PAGE_W = 739;
export const PAGE_H = 1600;

const IPHONE_FONT = 'ItauIphoneTime';
const ARIAL = 'Helvetica, Arial, sans-serif';
const TEXT_COLOR = '#000000';

let fontsLoadedPromise: Promise<void> | null = null;
function ensureFonts(): Promise<void> {
  if (fontsLoadedPromise) return fontsLoadedPromise;
  fontsLoadedPromise = (async () => {
    try {
      const f = new FontFace(IPHONE_FONT, `url(${iphoneTimeFont})`);
      const loaded = await f.load();
      (document as any).fonts.add(loaded);
    } catch (e) {
      console.warn('Itau iPhone font failed to load', e);
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
  opts?: { bold?: boolean; opacity?: number; color?: string },
) {
  ctx.save();
  const weight = opts?.bold ? 'bold ' : '';
  ctx.font = `${weight}${size}px ${font}`;
  ctx.fillStyle = opts?.color ?? TEXT_COLOR;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  if (opts?.opacity != null) ctx.globalAlpha = opts.opacity;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawFormFields(ctx: CanvasRenderingContext2D, f: ItauFormData) {
  // horario iphone topo (fonte1.otf) - 32pt
  // Ancora pela borda DIREITA: dígitos mais largos deslocam para a esquerda
  if (f.horarioIphone.trim()) {
    const size = 32;
    ctx.save();
    ctx.font = `${size}px ${IPHONE_FONT}`;
    const refWidth = ctx.measureText('00:00').width;
    const actualWidth = ctx.measureText(f.horarioIphone).width;
    const refX = 61; // X base para "00:00"
    const rightEdge = refX + refWidth;
    const x = rightEdge - actualWidth;
    ctx.restore();
    drawText(ctx, f.horarioIphone, x, 36, size, IPHONE_FONT);
  }

  // bold fraco com opacidade 0.5 (Itpac c*acordodebitos) - 37.55pt
  if (f.descricao.trim()) {
    drawText(ctx, f.descricao, 45.26, 211.59, 37.55, ARIAL, { bold: true, color: '#000000' });
  }

  // Aprovada em - 21.68pt
  if (f.aprovadaEm.trim()) {
    drawText(ctx, f.aprovadaEm, 45.26, 275.31, 21.68, ARIAL);
  }

  // Categoria - 21.68pt
  if (f.categoria.trim()) {
    drawText(ctx, f.categoria, 45.76, 320.33, 21.68, ARIAL);
  }

  // Valor total - 25pt
  if (f.valorTotal.trim()) {
    drawText(ctx, f.valorTotal, 121.75, 468.83, 25, ARIAL);
  }

  // Cartão tipo - 22.03pt
  if (f.cartaoTipo.trim()) {
    drawText(ctx, f.cartaoTipo, 120.26, 598.33, 22.03, ARIAL);
  }

  // Cartão nome - 24.84pt
  if (f.cartaoNome.trim()) {
    drawText(ctx, f.cartaoNome, 122.08, 627.33, 24.84, ARIAL);
  }
}

export const ItauPreview = forwardRef<ItauPreviewRef, { formData: ItauFormData }>(
  function ItauPreview({ formData }, ref) {
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
      img.onerror = () => console.error('Erro ao carregar base Itaú');
      img.src = baseItau;
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
