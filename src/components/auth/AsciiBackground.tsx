import { useEffect, useRef } from 'react';

// Ambient floating chars for background
const ASCII_CHARS = '01{}[]()<>#!/$%&@?;:=+-*^~|\\/"\'';
const CODE_SNIPPETS = [
  'function()', 'return', 'const', 'import', 'async', 'await',
  'sudo', 'chmod', 'ssh', 'root', 'exec', 'kill',
  '0x00', '0xFF', '127.0.0.1', '::1', 'tcp/ip',
  '<script>', 'SELECT *', 'DROP TABLE',
  'md5(', 'sha256', 'base64', 'encrypt',
  'GET /', 'POST /', 'HTTP/1.1', '403', '404',
];

interface FloatingChar {
  x: number;
  y: number;
  char: string;
  opacity: number;
  speed: number;
  size: number;
  life: number;
  maxLife: number;
}

export function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let floatingChars: FloatingChar[] = [];
    let time = 0;

    // Mouse/keyboard reactive offset
    let mouseX = 0;
    let mouseY = 0;
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let currentOffsetX = 0;
    let currentOffsetY = 0;
    let shakeIntensity = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetOffsetX = ((e.clientX - cx) / cx) * 18;
      targetOffsetY = ((e.clientY - cy) / cy) * 12;
    };

    const onKeyDown = () => {
      shakeIntensity = 8;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initFloating();
    };

    const initFloating = () => {
      floatingChars = [];
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      for (let i = 0; i < count; i++) {
        floatingChars.push(createFloating());
      }
    };

    const createFloating = (): FloatingChar => {
      const isSnippet = Math.random() < 0.12;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        char: isSnippet
          ? CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
          : ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)],
        opacity: 0.01 + Math.random() * 0.06,
        speed: 0.1 + Math.random() * 0.4,
        size: 10 + Math.random() * 4,
        life: Math.random() * 300,
        maxLife: 250 + Math.random() * 400,
      };
    };

    const draw = () => {
      time++;

      // Smoothly interpolate reactive offset
      currentOffsetX += (targetOffsetX - currentOffsetX) * 0.08;
      currentOffsetY += (targetOffsetY - currentOffsetY) * 0.08;

      // Decay shake from keyboard
      if (shakeIntensity > 0.1) {
        shakeIntensity *= 0.9;
      } else {
        shakeIntensity = 0;
      }
      const shakeX = shakeIntensity * (Math.random() - 0.5) * 2;
      const shakeY = shakeIntensity * (Math.random() - 0.5) * 2;

      const reactX = currentOffsetX + shakeX;
      const reactY = currentOffsetY + shakeY;

      // Clear with slight trail
      ctx.fillStyle = 'rgb(8, 10, 14)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw floating background chars
      for (let i = 0; i < floatingChars.length; i++) {
        const c = floatingChars[i];
        c.life++;
        c.y += c.speed * 0.2;
        c.x += Math.sin(c.life * 0.008) * 0.1;

        const fadeIn = Math.min(c.life / 60, 1);
        const fadeOut = c.life > c.maxLife * 0.8 ? Math.max(0, 1 - (c.life - c.maxLife * 0.8) / (c.maxLife * 0.2)) : 1;
        const alpha = c.opacity * fadeIn * fadeOut;

        ctx.fillStyle = `rgba(80, 140, 160, ${alpha})`;
        ctx.font = `${c.size}px "Courier New", monospace`;
        ctx.fillText(c.char, c.x + reactX * 0.3, c.y + reactY * 0.3);

        if (c.life > c.maxLife || c.y > canvas.height + 20) {
          floatingChars[i] = createFloating();
          floatingChars[i].y = -20;
          floatingChars[i].life = 0;
        }
      }



      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}
