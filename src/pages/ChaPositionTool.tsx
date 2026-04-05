import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import chaSampleFoto from '@/assets/templates/cha-sample-foto.png';
import matrizcha from '@/assets/templates/matrizcha.png';
import matrizcha2 from '@/assets/templates/matrizcha2.png';

interface TextField {
  id: string;
  label: string;
  x: number;
  y: number;
  text: string;
  font: string;
  bold: boolean;
  group?: string; // fields with same group sync X
  w?: number; // width % (for foto)
  h?: number; // height % (for foto)
  isFoto?: boolean;
}

// Groups: 'left' fields sync X, 'right' fields sync X
const FRONT_FIELDS: TextField[] = [
  { id: 'nome', label: 'Nome', x: 3.5, y: 43, text: 'FELIPE DA SILVA LIMA', font: '14px', bold: true, group: 'left' },
  { id: 'dataNasc', label: 'Data Nasc.', x: 3.5, y: 54.5, text: '02/02/2000', font: '12px', bold: false, group: 'left' },
  { id: 'cpf', label: 'CPF', x: 28, y: 54.5, text: '231.231.213-21', font: '12px', bold: false, group: 'right' },
  { id: 'categoria', label: 'Categoria', x: 3.5, y: 64.5, text: 'ARRAIS AMADOR', font: '11px', bold: true, group: 'left' },
  { id: 'categoriaEn', label: 'Cat. Inglês', x: 3.5, y: 68.5, text: 'AMATEUR SKIPPER', font: '9px', bold: false, group: 'left' },
  { id: 'validade', label: 'Validade', x: 3.5, y: 81.5, text: '03/02/2027', font: '12px', bold: false, group: 'left' },
  { id: 'inscricao', label: 'Nº Inscrição', x: 28, y: 81.5, text: '23121241', font: '12px', bold: false, group: 'right' },
  { id: 'foto', label: 'Foto', x: 64, y: 32, text: '', font: '14px', bold: false, isFoto: true, w: 32.5, h: 56 },
];

const BACK_FIELDS: TextField[] = [
  { id: 'limite', label: 'Limite Nav.', x: 3.5, y: 16, text: 'NAVEGAÇÃO INTERIOR', font: '11px', bold: true, group: 'bleft' },
  { id: 'limiteEn', label: 'Limite Inglês', x: 3.5, y: 24, text: 'INLAND NAVIGATION', font: '10px', bold: false, group: 'bleft' },
  { id: 'requisitos', label: 'Requisitos', x: 3.5, y: 46, text: 'REQUISITO EXEMPLO', font: '12px', bold: false, group: 'bleft' },
  { id: 'orgao', label: 'Órgão Emissão', x: 3.5, y: 63.5, text: 'MARINHA DO BRASIL', font: '12px', bold: true, group: 'bleft' },
  { id: 'dataEmissao', label: 'Data Emissão', x: 55, y: 63.5, text: '25/01/2026', font: '12px', bold: false, group: 'bright' },
];

function FieldOverlay({
  field, containerW, containerH, onDrag, onResize, selected, onSelect,
}: {
  field: TextField; containerW: number; containerH: number;
  onDrag: (id: string, x: number, y: number) => void;
  onResize?: (id: string, w: number, h: number) => void;
  selected: boolean; onSelect: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef({ mx: 0, my: 0, fx: 0, fy: 0, fw: 0, fh: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();
    setDragging(true);
    startRef.current = { mx: e.clientX, my: e.clientY, fx: field.x, fy: field.y, fw: field.w || 0, fh: field.h || 0 };
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setResizing(true);
    startRef.current = { mx: e.clientX, my: e.clientY, fx: field.x, fy: field.y, fw: field.w || 30, fh: field.h || 50 };
  };

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      if (resizing && onResize) {
        const dw = ((e.clientX - startRef.current.mx) / containerW) * 100;
        const dh = ((e.clientY - startRef.current.my) / containerH) * 100;
        onResize(field.id, Math.max(5, startRef.current.fw + dw), Math.max(5, startRef.current.fh + dh));
      } else if (dragging) {
        const dx = ((e.clientX - startRef.current.mx) / containerW) * 100;
        const dy = ((e.clientY - startRef.current.my) / containerH) * 100;
        onDrag(field.id, startRef.current.fx + dx, startRef.current.fy + dy);
      }
    };
    const handleUp = () => { setDragging(false); setResizing(false); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, resizing, containerW, containerH, field.id, onDrag, onResize]);

  const px = (field.x / 100) * containerW;
  const py = (field.y / 100) * containerH;

  if (field.isFoto) {
    const fw = ((field.w || 30) / 100) * containerW;
    const fh = ((field.h || 50) / 100) * containerH;
    return (
      <div
        onMouseDown={handleMouseDown}
        className="absolute cursor-move select-none overflow-hidden"
        style={{
          left: px, top: py, width: fw, height: fh,
          border: selected ? '2px dashed #ef4444' : '2px dashed rgba(100,100,100,0.4)',
          zIndex: dragging || resizing ? 50 : 10,
        }}
      >
        <img src={chaSampleFoto} alt="Foto" className="w-full h-full object-cover" draggable={false} />
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          style={{ background: 'rgba(239,68,68,0.7)', borderRadius: '2px 0 0 0' }}
        />
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute cursor-move select-none whitespace-nowrap"
      style={{
        left: px, top: py,
        font: `${field.bold ? 'bold ' : ''}${field.font} Arial, sans-serif`,
        color: '#1a1a1a',
        border: selected ? '1px dashed #ef4444' : '1px dashed transparent',
        background: selected ? 'rgba(239,68,68,0.08)' : 'transparent',
        padding: '1px 3px',
        zIndex: dragging ? 50 : 10,
      }}
    >
      {field.text}
    </div>
  );
}

function MatrixPanel({
  title, bgSrc, fields, onUpdateField, onResizeField, selectedId, onSelect,
}: {
  title: string; bgSrc: string; fields: TextField[];
  onUpdateField: (id: string, x: number, y: number) => void;
  onResizeField?: (id: string, w: number, h: number) => void;
  selectedId: string | null; onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setSize({ w: r.width, h: r.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div>
      <p className="text-sm font-semibold mb-1">{title}</p>
      <div ref={containerRef} className="relative border rounded-lg overflow-hidden" style={{ aspectRatio: '700/440' }}>
        <img src={bgSrc} alt={title} className="w-full h-full object-fill" draggable={false} />
        {size.w > 0 && fields.map((f) => (
          <FieldOverlay
            key={f.id} field={f} containerW={size.w} containerH={size.h}
            onDrag={onUpdateField} onResize={onResizeField} selected={selectedId === f.id} onSelect={() => onSelect(f.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChaPositionTool() {
  const [frontFields, setFrontFields] = useState(FRONT_FIELDS);
  const [backFields, setBackFields] = useState(BACK_FIELDS);
  const [selected, setSelected] = useState<string | null>(null);

  // Sync X for fields in the same group
  const updateWithSync = useCallback((fields: TextField[], setFields: React.Dispatch<React.SetStateAction<TextField[]>>, id: string, x: number, y: number) => {
    setFields((prev) => {
      const target = prev.find((f) => f.id === id);
      if (!target) return prev;
      const group = target.group;
      return prev.map((f) => {
        if (f.id === id) return { ...f, x, y };
        if (group && f.group === group) return { ...f, x }; // sync X only
        return f;
      });
    });
  }, []);

  const updateFront = useCallback((id: string, x: number, y: number) => {
    updateWithSync(frontFields, setFrontFields, id, x, y);
  }, [updateWithSync, frontFields]);

  const updateBack = useCallback((id: string, x: number, y: number) => {
    updateWithSync(backFields, setBackFields, id, x, y);
  }, [updateWithSync, backFields]);

  const resizeFront = useCallback((id: string, w: number, h: number) => {
    setFrontFields((prev) => prev.map((f) => (f.id === id ? { ...f, w, h } : f)));
  }, []);

  const generateCode = () => {
    const lines: string[] = ['// === FRENTE ==='];
    frontFields.forEach((f) => {
      if (f.isFoto) {
        lines.push(`// Foto: x=${f.x.toFixed(1)}%, y=${f.y.toFixed(1)}%, w=${(f.w||30).toFixed(1)}%, h=${(f.h||50).toFixed(1)}%`);
        lines.push(`const fotoX = w * ${(f.x / 100).toFixed(3)};`);
        lines.push(`const fotoY = h * ${(f.y / 100).toFixed(3)};`);
        lines.push(`const fotoW = w * ${((f.w||30) / 100).toFixed(3)};`);
        lines.push(`const fotoH = h * ${((f.h||50) / 100).toFixed(3)};`);
      } else {
        lines.push(`// ${f.label}: x=${f.x.toFixed(1)}%, y=${f.y.toFixed(1)}%`);
        lines.push(`ctx.fillText(data.${f.id}, w * ${(f.x / 100).toFixed(3)}, h * ${(f.y / 100).toFixed(3)});`);
      }
    });
    lines.push('');
    lines.push('// === VERSO ===');
    backFields.forEach((f) => {
      lines.push(`// ${f.label}: x=${f.x.toFixed(1)}%, y=${f.y.toFixed(1)}%`);
      lines.push(`ctx.fillText(data.${f.id}, w * ${(f.x / 100).toFixed(3)}, h * ${(f.y / 100).toFixed(3)});`);
    });
    return lines.join('\n');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode()).then(() => toast.success('Código copiado!'));
  };

  const allFields = [...frontFields, ...backFields];
  const selectedField = allFields.find((f) => f.id === selected);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-foreground">🧭 Calibrar CHA - Posição dos Campos</h1>
        <p className="text-sm text-muted-foreground">
          Arraste os textos para calibrar. Campos do mesmo grupo (esquerda/direita) mantêm o X alinhado automaticamente.
        </p>

        {selectedField && (
          <div className="bg-muted/50 rounded-lg p-3 border text-sm space-y-1">
            <p className="font-semibold">{selectedField.label} {selectedField.group && <span className="text-xs text-muted-foreground">(grupo: {selectedField.group})</span>}</p>
            <p className="font-mono text-xs">
              x: <span className="text-primary">{selectedField.x.toFixed(1)}%</span> → w * {(selectedField.x / 100).toFixed(3)}
              {' | '}
              y: <span className="text-primary">{selectedField.y.toFixed(1)}%</span> → h * {(selectedField.y / 100).toFixed(3)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MatrixPanel
            title="Frente (matrizcha.png)"
            bgSrc={matrizcha}
            fields={frontFields}
            onUpdateField={updateFront}
            onResizeField={resizeFront}
            selectedId={selected}
            onSelect={setSelected}
          />
          <MatrixPanel
            title="Verso (matrizcha2.png)"
            bgSrc={matrizcha2}
            fields={backFields}
            onUpdateField={updateBack}
            selectedId={selected}
            onSelect={setSelected}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Código gerado</p>
            <Button size="sm" onClick={copyCode}>Copiar Código</Button>
          </div>
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto border">
            {generateCode()}
          </pre>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {allFields.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelected(f.id)}
              className={`text-left p-2 rounded border transition-colors ${
                selected === f.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
              }`}
            >
              <p className="font-semibold">{f.label} {f.group && <span className="text-muted-foreground">({f.group})</span>}</p>
              <p className="font-mono text-muted-foreground">{f.x.toFixed(1)}%, {f.y.toFixed(1)}%</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
