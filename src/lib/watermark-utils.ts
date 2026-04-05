import watermarkPattern from '@/assets/watermark-pattern.png';

let cachedPatternImage: HTMLImageElement | null = null;
let loadingPromise: Promise<HTMLImageElement> | null = null;
let lastSrc: string = '';

export function loadWatermarkLogo(): Promise<HTMLImageElement> {
  if (cachedPatternImage) return Promise.resolve(cachedPatternImage);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedPatternImage = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = watermarkPattern;
  });

  return loadingPromise;
}

export function drawLogoWatermarks(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  logoImg: HTMLImageElement,
  options?: { size?: number; opacity?: number; angle?: number }
) {
  const opacity = options?.opacity || 0.12;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(logoImg, 0, 0, canvasWidth, canvasHeight);
  ctx.restore();
}
