import { useRef, useState, useEffect, useCallback } from 'react';
import { PdfTextField } from './types';

interface PdfCanvasProps {
  pageCanvas: HTMLCanvasElement | null;
  bgCanvas: HTMLCanvasElement | null;
  fields: PdfTextField[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateField: (id: string, updates: Partial<PdfTextField>) => void;
  pageIndex: number;
}

export function PdfCanvas({ pageCanvas, bgCanvas, fields, selectedId, onSelect, onUpdateField, pageIndex }: PdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [inputPos, setInputPos] = useState({ x: 0, y: 0, w: 0, fontSize: 14 });

  const pageFields = fields.filter(f => f.pageIndex === pageIndex);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pageCanvas) return;

    const ctx = canvas.getContext('2d')!;
    // Draw full original page
    ctx.drawImage(pageCanvas, 0, 0);

    // For edited fields: restore bg from bgCanvas, then draw new text
    for (const field of pageFields) {
      if (!field.visible) continue;
      const wasEdited = field.text !== field.originalText;
      if (!wasEdited) continue;

      // Restore background (without text) for this area
      if (bgCanvas) {
        const sx = Math.max(0, Math.floor(field.x));
        const sy = Math.max(0, Math.floor(field.y));
        const sw = Math.ceil(field.width);
        const sh = Math.ceil(field.height);
        // Draw white rectangle (minimal area, no overflow)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sx, sy, sw, sh);
      }

      // Draw the new text with FreeMonoBold at exact baseline position
      if (field.text.trim()) {
        ctx.fillStyle = field.color || '#000000';
        ctx.font = `bold ${field.fontSize}px "FreeMono", "Courier New", monospace`;
        ctx.textBaseline = 'alphabetic';
        // field.y is the top of the text box, so baseline ≈ y + fontSize * 0.85
        ctx.fillText(field.text, field.x, field.y + field.fontSize * 0.85);
      }
    }
  }, [pageCanvas, bgCanvas, pageFields]);

  // Redraw whenever fields change
  useEffect(() => {
    if (!canvasRef.current || !pageCanvas) return;
    canvasRef.current.width = pageCanvas.width;
    canvasRef.current.height = pageCanvas.height;
    redrawCanvas();
  }, [pageCanvas, redrawCanvas]);

  // Handle click on canvas to find which field was clicked
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editing) return; // don't interrupt current edit
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked field (reverse order for z-index priority)
    for (let i = pageFields.length - 1; i >= 0; i--) {
      const f = pageFields[i];
      if (!f.visible) continue;
      if (clickX >= f.x - 2 && clickX <= f.x + f.width + 4 &&
          clickY >= f.y - 2 && clickY <= f.y + f.height + 4) {
        // Found! Show input at this position
        const displayX = f.x / scaleX + rect.left - (canvas.parentElement?.getBoundingClientRect().left || 0);
        const displayY = f.y / scaleY + rect.top - (canvas.parentElement?.getBoundingClientRect().top || 0);
        const displayW = f.width / scaleX;

        setEditing(f.id);
        onSelect(f.id);
        setInputPos({ x: displayX, y: displayY, w: displayW, fontSize: f.fontSize / scaleX });
        return;
      }
    }

    // Clicked empty area
    onSelect(null);
  }, [editing, pageFields, onSelect]);

  // When editing starts, focus input
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleBlur = useCallback(() => {
    if (!editing || !inputRef.current) return;
    const newText = inputRef.current.value;
    onUpdateField(editing, { text: newText });
    setEditing(null);
    // redraw will happen via useEffect when fields update
  }, [editing, onUpdateField]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  }, []);

  if (!pageCanvas) return null;

  const editingField = editing ? fields.find(f => f.id === editing) : null;

  return (
    <div className="relative border border-border shadow-lg inline-block">
      <canvas
        ref={canvasRef}
        className="block cursor-text"
        style={{ width: pageCanvas.width, height: pageCanvas.height }}
        onClick={handleCanvasClick}
      />
      {editing && editingField && (
        <input
          ref={inputRef}
          defaultValue={editingField.text}
          className="absolute bg-white border-2 border-primary px-1 outline-none text-black z-50"
          style={{
            left: inputPos.x,
            top: inputPos.y,
            minWidth: inputPos.w + 20,
            fontSize: inputPos.fontSize,
            lineHeight: 1.2,
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
