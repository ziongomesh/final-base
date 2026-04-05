import watermarkLogo from '@/assets/watermark-logo.png';

export default function WatermarkOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10" style={{ userSelect: 'none' }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${watermarkLogo})`,
          backgroundSize: '80px 80px',
          backgroundRepeat: 'repeat',
          opacity: 0.07,
          transform: 'rotate(-25deg) scale(1.5)',
          transformOrigin: 'center center',
          filter: 'grayscale(100%)',
        }}
      />
    </div>
  );
}
