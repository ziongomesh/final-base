import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import rgVersoTemplate from '@/assets/templates/rg-verso-template.png';
import qrcodeSampleRg from '@/assets/templates/qrcode-sample-rg.png';

interface QrItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RgQrPositionTool() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [qr, setQr] = useState<QrItem>({ x: 20, y: 40, width: 160, height: 160 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saved, setSaved] = useState(false);

  // Measure the rendered image size
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setImgSize({ w: rect.width, h: rect.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragOffset({ x: e.clientX - rect.left - qr.x, y: e.clientY - rect.top - qr.y });
    setDragging(true);
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - qr.width));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - qr.height));
      setQr(prev => ({ ...prev, x: newX, y: newY }));
    }

    if (resizing) {
      const newW = Math.max(40, e.clientX - rect.left - qr.x);
      const newH = newW; // keep square
      setQr(prev => ({ ...prev, width: newW, height: newH }));
    }
  }, [dragging, resizing, dragOffset, qr.x, qr.y, qr.width]);

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  // Convert pixel position to percentage of image
  const toPercent = (px: number, total: number) => ((px / total) * 100).toFixed(2);

  // The original rg-verso template dimensions (from uploaded image ~1152x816)
  // We'll show percentages so you can apply to any resolution
  const handleSave = () => {
    setSaved(true);
    toast.success("Posição salva! Copie os valores.");
  };

  const handleReset = () => {
    setQr({ x: 20, y: 40, width: 160, height: 160 });
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">🔧 Teste 2 - QR Code no Verso do RG</h1>
        <p className="text-gray-400 mb-4">
          Arraste o QR code para encaixar no espaço branco. Use o canto inferior-direito para redimensionar.
        </p>

        <div className="flex gap-4 mb-4">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">✅ Salvar Posição</Button>
          <Button onClick={handleReset} variant="outline" className="text-white border-gray-600">🔄 Reset</Button>
        </div>

        {/* Info */}
        <div className="flex gap-4 mb-4 text-sm text-gray-300">
          <span>📍 Posição: <strong>{Math.round(qr.x)}px, {Math.round(qr.y)}px</strong></span>
          <span>📐 Tamanho: <strong>{Math.round(qr.width)}x{Math.round(qr.height)}px</strong></span>
          {imgSize.w > 0 && (
            <span>📊 %: <strong>{toPercent(qr.x, imgSize.w)}%, {toPercent(qr.y, imgSize.h)}%</strong> ({toPercent(qr.width, imgSize.w)}%)</span>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative mx-auto border-2 border-gray-600 select-none inline-block"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={rgVersoTemplate}
            alt="RG Verso"
            className="block max-w-full"
            draggable={false}
            onLoad={() => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setImgSize({ w: rect.width, h: rect.height });
              }
            }}
          />

          {/* QR Code overlay */}
          <div
            className="absolute cursor-move border-2 border-red-500"
            style={{
              left: `${qr.x}px`,
              top: `${qr.y}px`,
              width: `${qr.width}px`,
              height: `${qr.height}px`,
              zIndex: 10,
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={qrcodeSampleRg}
              alt="QR Code"
              className="w-full h-full object-fill pointer-events-none opacity-80"
              draggable={false}
            />
            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 cursor-se-resize"
              onMouseDown={handleResizeDown}
            />
          </div>
        </div>

        {/* Output */}
        {saved && imgSize.w > 0 && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-2 text-green-400">📋 Posição Final do QR no Verso:</h3>
            <pre className="bg-black p-4 rounded text-sm text-green-300 overflow-x-auto whitespace-pre-wrap">
{`// QR Code no RG Verso
// Posição em pixels (na imagem renderizada): x=${Math.round(qr.x)}, y=${Math.round(qr.y)}, size=${Math.round(qr.width)}
// Posição em % da imagem: x=${toPercent(qr.x, imgSize.w)}%, y=${toPercent(qr.y, imgSize.h)}%, size=${toPercent(qr.width, imgSize.w)}%

// Para usar no canvas (rg-generator.ts):
// Considerando template original (${Math.round(imgSize.w)}x${Math.round(imgSize.h)}px renderizado)
const qrX = ${Math.round(qr.x)};  // pixels from left
const qrY = ${Math.round(qr.y)};  // pixels from top
const qrSize = ${Math.round(qr.width)};  // pixels (square)

// Proporção relativa à imagem:
const qrXPercent = ${toPercent(qr.x, imgSize.w)};
const qrYPercent = ${toPercent(qr.y, imgSize.h)};
const qrSizePercent = ${toPercent(qr.width, imgSize.w)};`}
            </pre>
            <p className="text-gray-400 mt-2 text-sm">Cole esses valores aqui no chat que eu atualizo o gerador.</p>
          </div>
        )}
      </div>
    </div>
  );
}
