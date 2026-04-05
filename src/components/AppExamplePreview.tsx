import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface AppExamplePreviewProps {
  appName: string;
  exampleImage: string;
}

export default function AppExamplePreview({ appName, exampleImage }: AppExamplePreviewProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/30"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Exemplo: {appName}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <img
          src={exampleImage}
          alt={`Exemplo ${appName}`}
          className="w-full object-contain"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}
