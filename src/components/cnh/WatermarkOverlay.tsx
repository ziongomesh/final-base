export default function WatermarkOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10" style={{ userSelect: 'none' }}>
      {/* Multiple rows of diagonal watermark text */}
      {Array.from({ length: 8 }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="absolute whitespace-nowrap"
          style={{
            top: `${rowIdx * 13}%`,
            left: '-10%',
            width: '140%',
            transform: 'rotate(-25deg)',
            transformOrigin: 'center center',
          }}
        >
          <span
            className="text-[11px] sm:text-sm font-bold tracking-[0.3em] uppercase"
            style={{
              color: 'rgba(180, 180, 180, 0.35)',
              textShadow: '0 0 2px rgba(150,150,150,0.15)',
              letterSpacing: '0.25em',
            }}
          >
            DATA SISTEMAS &nbsp;&nbsp; DATA SISTEMAS &nbsp;&nbsp; DATA SISTEMAS &nbsp;&nbsp; DATA SISTEMAS &nbsp;&nbsp; DATA SISTEMAS &nbsp;&nbsp; DATA SISTEMAS
          </span>
        </div>
      ))}
    </div>
  );
}
