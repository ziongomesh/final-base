import watermarkLogo from '@/assets/watermark-logo.png';

let cachedLogoImage: HTMLImageElement | null = null;
let loadingPromise: Promise<HTMLImageElement> | null = null;

export function loadWatermarkLogo(): Promise<HTMLImageElement> {
  if (cachedLogoImage) return Promise.resolve(cachedLogoImage);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedLogoImage = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = watermarkLogo;
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
  const size = options?.size || Math.round(canvasWidth * 0.18);
  const opacity = options?.opacity || 0.07;
  const angle = options?.angle || -Math.PI / 6;
  const spacingX = size * 2.5;
  const spacingY = size * 2;

  ctx.save();
  ctx.globalAlpha = opacity;

  for (let y = -size; y < canvasHeight + size * 2; y += spacingY) {
    for (let x = -size; x < canvasWidth + size * 2; x += spacingX) {
      ctx.save();
      const offsetX = (Math.floor(y / spacingY) % 2 === 0) ? 0 : spacingX * 0.5;
      ctx.translate(x + offsetX, y);
      ctx.rotate(angle);
      ctx.drawImage(logoImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  ctx.restore();
}
