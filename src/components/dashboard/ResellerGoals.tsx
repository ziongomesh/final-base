import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Flame, Settings2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ResellerGoalsProps {
  adminId: number;
  totalDocumentsToday: number;
  totalDocumentsWeek: number;
  totalDocumentsMonth: number;
}

interface Goals {
  daily: number;
  weekly: number;
  monthly: number;
}

const DEFAULT_GOALS: Goals = { daily: 3, weekly: 10, monthly: 30 };

export default function ResellerGoals({ adminId, totalDocumentsToday, totalDocumentsWeek, totalDocumentsMonth }: ResellerGoalsProps) {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [editing, setEditing] = useState(false);
  const [editGoals, setEditGoals] = useState<Goals>(DEFAULT_GOALS);

  useEffect(() => {
    const stored = localStorage.getItem(`reseller_goals_${adminId}`);
    if (stored) {
      try {
        setGoals(JSON.parse(stored));
      } catch {}
    }
  }, [adminId]);

  const handleSave = () => {
    if (editGoals.daily < 1 || editGoals.weekly < 1 || editGoals.monthly < 1) {
      toast.error('Metas devem ser no mínimo 1');
      return;
    }
    setGoals(editGoals);
    localStorage.setItem(`reseller_goals_${adminId}`, JSON.stringify(editGoals));
    setEditing(false);
    toast.success('Metas atualizadas!');
  };

  const getProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const getStatusColor = (current: number, target: number) => {
    const pct = getProgress(current, target);
    if (pct >= 100) return 'text-green-500';
    if (pct >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressBarColor = (current: number, target: number) => {
    const pct = getProgress(current, target);
    if (pct >= 100) return '[&>div]:bg-green-500';
    if (pct >= 60) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
  };

  const goalItems = [
    { label: 'Diária', current: totalDocumentsToday, target: goals.daily, icon: Flame, key: 'daily' as const },
    { label: 'Semanal', current: totalDocumentsWeek, target: goals.weekly, icon: Target, key: 'weekly' as const },
    { label: 'Mensal', current: totalDocumentsMonth, target: goals.monthly, icon: Trophy, key: 'monthly' as const },
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas de Serviços
          </div>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => { setEditGoals(goals); setEditing(true); }} className="h-8 gap-1">
              <Settings2 className="h-3.5 w-3.5" /> Alterar
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-8 w-8 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={handleSave} className="h-8 gap-1">
                <Check className="h-3.5 w-3.5" /> Salvar
              </Button>
            </div>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Acompanhe suas metas de produção (todos os módulos)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {goalItems.map((item) => {
          const Icon = item.icon;
          const pct = getProgress(item.current, item.target);
          const completed = pct >= 100;

          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${getStatusColor(item.current, item.target)}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {completed && (
                    <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 border-0">
                      ✅ Batida!
                    </Badge>
                  )}
                </div>
                {editing ? (
                  <Input
                    type="number"
                    min={1}
                    value={editGoals[item.key]}
                    onChange={(e) => setEditGoals({ ...editGoals, [item.key]: parseInt(e.target.value) || 1 })}
                    className="w-20 h-7 text-xs text-right"
                  />
                ) : (
                  <span className={`text-sm font-bold ${getStatusColor(item.current, item.target)}`}>
                    {item.current}/{item.target}
                  </span>
                )}
              </div>
              <Progress value={pct} className={`h-2 ${getProgressBarColor(item.current, item.target)}`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
