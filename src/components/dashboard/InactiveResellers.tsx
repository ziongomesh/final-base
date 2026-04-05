import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, UserX } from 'lucide-react';

interface Reseller {
  id: number;
  nome: string;
  last_active?: string | null;
  created_at?: string;
}

interface InactiveResellersProps {
  resellers: Reseller[];
}

function getDaysInactive(lastActive: string | null | undefined, createdAt?: string): number {
  const refDate = lastActive || createdAt;
  if (!refDate) return 0;
  const diff = Date.now() - new Date(refDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function InactiveResellers({ resellers }: InactiveResellersProps) {
  // Filter resellers inactive for 7+ days
  const inactive = resellers
    .map(r => ({
      ...r,
      daysInactive: getDaysInactive(r.last_active, r.created_at),
    }))
    .filter(r => r.daysInactive >= 7)
    .sort((a, b) => b.daysInactive - a.daysInactive);

  if (inactive.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Revendedores Inativos
          <Badge variant="destructive" className="text-[10px] ml-auto">
            {inactive.length} alerta{inactive.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Revendedores sem movimentação há 7+ dias</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {inactive.map((r) => (
          <div
            key={r.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              r.daysInactive >= 30
                ? 'bg-red-500/10 border-red-500/30'
                : r.daysInactive >= 14
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserX className={`h-4 w-4 ${
                r.daysInactive >= 30 ? 'text-red-500' :
                r.daysInactive >= 14 ? 'text-amber-500' : 'text-yellow-500'
              }`} />
              <span className="font-medium text-sm">{r.nome}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className={`text-xs font-bold ${
                r.daysInactive >= 30 ? 'text-red-500' :
                r.daysInactive >= 14 ? 'text-amber-500' : 'text-yellow-500'
              }`}>
                {r.daysInactive} dias
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
