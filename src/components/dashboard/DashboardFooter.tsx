import { Logo } from '@/components/Logo';

export default function DashboardFooter() {
  return (
    <footer className="py-8 px-6 border-t border-white/[0.04]">
      <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
        <Logo className="h-6 w-auto opacity-40" />
        <p className="text-xs text-white/25 text-center">
          © 2024 – 2026 // <span className="text-white/40">Base</span>. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-[10px] font-semibold tracking-wider text-white/30 hover:text-white/50 uppercase transition-colors">
            Status
          </a>
          <a href="#" className="text-[10px] font-semibold tracking-wider text-white/30 hover:text-white/50 uppercase transition-colors">
            Termos
          </a>
          <a href="#" className="text-[10px] font-semibold tracking-wider text-white/30 hover:text-white/50 uppercase transition-colors">
            Suporte
          </a>
        </div>
      </div>
    </footer>
  );
}
