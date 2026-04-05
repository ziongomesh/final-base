import { Logo } from '@/components/Logo';
import { ExternalLink } from 'lucide-react';

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default function DashboardFooter() {
  return (
    <footer className="py-10 px-6 border-t border-white/[0.04]">
      <div className="flex flex-col items-center gap-5 max-w-xl mx-auto">
        {/* Social icon */}
        <div className="flex items-center gap-4">
          <a href="#" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors">
            <TelegramIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Logo */}
        <Logo className="h-6 w-auto opacity-30" />

        {/* Copyright */}
        <p className="text-xs text-white/25 text-center">
          © 2024 – 2026 // <span className="text-white/40 font-semibold">DataSistemas</span>.
          <br />
          Todos os direitos reservados.
        </p>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a href="#" className="text-[10px] font-semibold tracking-wider text-white/30 hover:text-white/50 uppercase transition-colors flex items-center gap-1">
            Status <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <a href="#" className="text-[10px] font-semibold tracking-wider text-white/30 hover:text-white/50 uppercase transition-colors">
            Terms
          </a>
          <a href="#" className="text-[10px] font-semibold tracking-wider text-white/30 hover:text-white/50 uppercase transition-colors">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
