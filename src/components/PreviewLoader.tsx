import { FileImage, Loader2, Sparkles } from "lucide-react";

interface PreviewLoaderProps {
  label?: string;
}

/**
 * Elaborate preview loader — skeleton document with shimmer + animated badge.
 * Replaces the generic "Carregando preview..." spinner across all modules.
 */
export function PreviewLoader({ label = "Renderizando documento" }: PreviewLoaderProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0a0f16] via-[#0d1320] to-[#0a0f16]">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(201 55% 59%) 1px, transparent 1px), linear-gradient(90deg, hsl(201 55% 59%) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full blur-[120px] opacity-30 animate-pulse"
        style={{ background: "hsl(201 55% 59%)" }}
      />

      {/* Skeleton document */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-md border border-[#5ba8d4]/15 bg-gradient-to-b from-[#101826] to-[#0b111c] shadow-2xl overflow-hidden">
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, hsl(201 55% 59% / 0.08) 50%, transparent 100%)",
            }}
          />

          {/* Fake header */}
          <div className="p-3 border-b border-[#5ba8d4]/10 flex items-center gap-2">
            <FileImage className="h-3.5 w-3.5 text-[#5ba8d4]/60" />
            <div className="h-2 w-20 rounded bg-[#5ba8d4]/15 animate-pulse" />
            <div className="ml-auto h-2 w-8 rounded bg-[#5ba8d4]/10" />
          </div>

          {/* Fake content lines */}
          <div className="p-3 space-y-2.5">
            <div className="h-2 w-3/4 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-white/[0.05] animate-pulse" style={{ animationDelay: "120ms" }} />
            <div className="h-2 w-2/3 rounded bg-white/[0.06] animate-pulse" style={{ animationDelay: "240ms" }} />
            <div className="h-12 w-full rounded bg-white/[0.04] animate-pulse" style={{ animationDelay: "360ms" }} />
            <div className="h-2 w-5/6 rounded bg-white/[0.05] animate-pulse" style={{ animationDelay: "480ms" }} />
            <div className="h-2 w-1/3 rounded bg-white/[0.06] animate-pulse" style={{ animationDelay: "600ms" }} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-10 rounded bg-white/[0.04] animate-pulse" style={{ animationDelay: "720ms" }} />
              <div className="h-10 rounded bg-white/[0.04] animate-pulse" style={{ animationDelay: "840ms" }} />
            </div>
            <div className="h-2 w-2/3 rounded bg-white/[0.05] animate-pulse" style={{ animationDelay: "960ms" }} />
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0f16]/80 backdrop-blur-sm border border-[#5ba8d4]/20 shadow-lg">
        <Loader2 className="h-3 w-3 text-[#5ba8d4] animate-spin" />
        <span className="text-[10px] font-medium text-white/80 tracking-wide">{label}</span>
        <Sparkles className="h-3 w-3 text-[#5ba8d4]/70" />
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default PreviewLoader;
