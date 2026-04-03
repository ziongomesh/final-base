import { PdfTextField } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, GripVertical, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayersPanelProps {
  fields: PdfTextField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LayersPanel({ fields, selectedId, onSelect, onToggleVisibility, onDelete }: LayersPanelProps) {
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">📑 Camadas ({fields.length})</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {fields.map((field) => (
            <div
              key={field.id}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted/50 transition-colors group',
                selectedId === field.id && 'bg-primary/10 border border-primary/30',
                !field.visible && 'opacity-50'
              )}
              onClick={() => onSelect(field.id)}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                {field.inputName && (
                  <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                    <Tag className="h-2.5 w-2.5" />
                    {field.inputName}
                  </span>
                )}
                <span className="truncate font-mono" title={field.text}>
                  {field.text || '(vazio)'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(field.id); }}
              >
                {field.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
