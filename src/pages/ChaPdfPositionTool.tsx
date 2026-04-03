import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import matrizcha from '@/assets/templates/matrizcha.png';
import matrizcha2 from '@/assets/templates/matrizcha2.png';
import qrcodeSample from '@/assets/templates/qrcode-sample.png';

// Items to position on the PDF base
interface OverlayItem {
  id: string;
  label: string;
  x: number; // % from left
  y: number; // % from top
  width: number; // % of container
  height: number; // % of container
  color: string;
  imageSrc?: string;
}

const INITIAL_ITEMS: OverlayItem[] = [
  { id: 'matrizFrente', label: 'Matriz Frente', x: 3, y: 5, width: 42, height: 35, color: '#22c55e', imageSrc: matrizcha },
  { id: 'matrizVerso', label: 'Matriz Verso', x: 3, y: 42, width: 42, height: 25, color: '#3b82f6', imageSrc: matrizcha2 },
  { id: 'qrcode', label: 'QR Code', x: 52, y: 5, width: 20, height: 17, color: '#ef4444', imageSrc: qrcodeSample },
];

export default function ChaPdfPositionTool() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [items, setItems] = useState<OverlayItem[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const startRef = useRef({ mx: 0, my: 0, ix: 0, iy: 0, iw: 0, ih: 0 });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setContainerSize({ w: r.width, h: r.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setSelected(id);
    setDragging(id);
    const item = items.find(i => i.id === id)!;
    startRef.current = { mx: e.clientX, my: e.clientY, ix: item.x, iy: item.y, iw: item.width, ih: item.height };
  }, [items]);

  const handleResizeDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(id);
    setResizing(id);
    const item = items.find(i => i.id === id)!;
    startRef.current = { mx: e.clientX, my: e.clientY, ix: item.x, iy: item.y, iw: item.width, ih: item.height };
  }, [items]);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      const { w, h } = containerSize;
      if (!w || !h) return;
      const dx = ((e.clientX - startRef.current.mx) / w) * 100;
      const dy = ((e.clientY - startRef.current.my) / h) * 100;

      if (dragging) {
        const newX = Math.max(0, Math.min(100 - 5, startRef.current.ix + dx));
        const newY = Math.max(0, Math.min(100 - 5, startRef.current.iy + dy));
        setItems(prev => prev.map(i => i.id === dragging ? { ...i, x: newX, y: newY } : i));
      } else if (resizing) {
        const newW = Math.max(5, startRef.current.iw + dx);
        const newH = Math.max(5, startRef.current.ih + dy);
        setItems(prev => prev.map(i => i.id === resizing ? { ...i, width: newW, height: newH } : i));
      }
    };
    const handleUp = () => { setDragging(null); setResizing(null); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, resizing, containerSize]);

  const selectedItem = items.find(i => i.id === selected);

  const generateCode = () => {
    const lines: string[] = ['// === Coordenadas CHA PDF (em %) ==='];
    items.forEach(item => {
      lines.push(`// ${item.label}`);
      lines.push(`const ${item.id} = { x: ${item.x.toFixed(1)}, y: ${item.y.toFixed(1)}, w: ${item.width.toFixed(1)}, h: ${item.height.toFixed(1)} };`);
    });
    return lines.join('\n');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode()).then(() => toast.success('Código copiado!'));
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-foreground">📄 Calibrar CHA PDF - Posicionar Matrizes e QR</h1>
        <p className="text-sm text-muted-foreground">
          Arraste e redimensione as áreas para encaixar as matrizes (frente/verso) e o QR Code no PDF base.
        </p>

        {selectedItem && (
          <div className="bg-muted/50 rounded-lg p-3 border text-sm space-y-1">
            <p className="font-semibold" style={{ color: selectedItem.color }}>{selectedItem.label}</p>
            <p className="font-mono text-xs">
              x: <span className="text-primary">{selectedItem.x.toFixed(1)}%</span>
              {' | '}y: <span className="text-primary">{selectedItem.y.toFixed(1)}%</span>
              {' | '}w: <span className="text-primary">{selectedItem.width.toFixed(1)}%</span>
              {' | '}h: <span className="text-primary">{selectedItem.height.toFixed(1)}%</span>
            </p>
          </div>
        )}

        {/* PDF Base with overlays */}
        <div
          ref={containerRef}
          className="relative border rounded-lg overflow-hidden bg-white mx-auto"
          style={{ maxWidth: 700, aspectRatio: '595/842' }}
        >
          <img
            src="/images/cha-pdf-base.png"
            alt="CHA PDF Base"
            className="w-full h-full object-contain"
            draggable={false}
          />
          {containerSize.w > 0 && items.map(item => {
            const left = (item.x / 100) * containerSize.w;
            const top = (item.y / 100) * containerSize.h;
            const w = (item.width / 100) * containerSize.w;
            const h = (item.height / 100) * containerSize.h;
            const isSelected = selected === item.id;

            return (
              <div
                key={item.id}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
                className="absolute cursor-move select-none flex items-center justify-center"
                style={{
                  left, top, width: w, height: h,
                  border: `2px ${isSelected ? 'solid' : 'dashed'} ${item.color}`,
                  background: `${item.color}22`,
                  zIndex: dragging === item.id || resizing === item.id ? 50 : 10,
                }}
              >
                {item.imageSrc ? (
                  <img src={item.imageSrc} alt={item.label} className="w-full h-full object-contain opacity-85" draggable={false} />
                ) : (
                  <span className="text-xs font-bold px-1 py-0.5 rounded" style={{ background: item.color, color: '#fff' }}>
                    {item.label}
                  </span>
                )}
                {/* Label on top */}
                <span className="absolute top-0 left-0 text-[10px] font-bold px-1 py-0.5" style={{ background: item.color, color: '#fff', lineHeight: 1 }}>
                  {item.label}
                </span>
                {/* Resize handle */}
                <div
                  onMouseDown={(e) => handleResizeDown(e, item.id)}
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                  style={{ background: item.color, borderRadius: '2px 0 0 0' }}
                />
              </div>
            );
          })}
        </div>

        {/* Items list */}
        <div className="grid grid-cols-3 gap-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`text-left p-2 rounded border transition-colors text-sm ${
                selected === item.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
              }`}
            >
              <p className="font-semibold" style={{ color: item.color }}>{item.label}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {item.x.toFixed(1)}%, {item.y.toFixed(1)}% | {item.width.toFixed(1)}×{item.height.toFixed(1)}
              </p>
            </button>
          ))}
        </div>

        {/* Generated code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Código gerado</p>
            <Button size="sm" onClick={copyCode}>Copiar Código</Button>
          </div>
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto border">
            {generateCode()}
          </pre>
        </div>
      </div>
    </div>
  );
}
