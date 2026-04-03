import { useMemo } from 'react';
import logoImage from '@/assets/logo-new.png';

export function LoadingScreen() {
  const startRotation = useMemo(() => Math.floor(Math.random() * 360), []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(220,25%,6%)]">
      <div className="relative flex items-center justify-center">
        {/* Glow effect behind logo */}
        <div className="absolute w-24 h-24 rounded-full bg-primary/15 blur-2xl" />

        {/* Spinning arc */}
        <svg
          className="absolute w-28 h-28 animate-spin"
          style={{
            animationDuration: '1.6s',
            transform: `rotate(${startRotation}deg)`,
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#arcGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="180 280"
          />
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(200, 80%, 65%)" />
              <stop offset="100%" stopColor="hsl(200, 80%, 65%)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Logo */}
        <img
          src={logoImage}
          alt="Data Sistemas"
          className="h-14 w-14 relative z-10 brightness-0 invert"
        />
      </div>
    </div>
  );
}
