import watermarkPattern from '@/assets/watermark-pattern.png';

export default function WatermarkOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10" style={{ userSelect: 'none' }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${watermarkPattern})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.12,
        }}
      />
    </div>
  );
}
