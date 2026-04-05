interface Props {
  value: string;
  label: string;
}

export default function GradientStatsCard({ value, label }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#5ba8d4] via-[#a078d4] to-[#e8a838]">
      {/* Avatar stack */}
      <div className="flex -space-x-2 mb-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center"
          >
            <span className="text-[10px] font-bold text-white/80">
              {['📄', '📋', '📑'][i]}
            </span>
          </div>
        ))}
      </div>
      <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-sm text-white/70 mt-1">{label}</p>
    </div>
  );
}
