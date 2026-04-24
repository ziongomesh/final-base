import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Flame, Gift, Trophy, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface RechargeWeeklyGoalProps {
  adminId: number;
}

const GOAL_TIERS = [
  { target: 2, label: 'Bronze', reward: '+1 crédito bônus', icon: Target, color: 'text-amber-600', bg: 'bg-amber-500/15', badge: 'bg-amber-500' },
  { target: 4, label: 'Prata', reward: '+3 créditos bônus', icon: Flame, color: 'text-blue-500', bg: 'bg-blue-500/15', badge: 'bg-blue-500' },
  { target: 6, label: 'Ouro', reward: '+5 créditos bônus', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/15', badge: 'bg-yellow-500' },
];

export default function RechargeWeeklyGoal({ adminId }: RechargeWeeklyGoalProps) {
  const [weekRecharges, setWeekRecharges] = useState(0);
  const [claimedTiers, setClaimedTiers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCredits } = useAuth();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await (api as any).payments.getWeeklyGoals(adminId);
        const claimed = data?.claimedTiers || [];
        setWeekRecharges(data?.weekRecharges || 0);
        setClaimedTiers(claimed);
        // Se há bônus já creditados, força refresh do saldo para refletir na UI
        if (claimed.length > 0) {
          refreshCredits().catch(() => {});
        }
      } catch (err) {
        console.error('Erro ao buscar metas semanais:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, [adminId]);

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-4 flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const currentGoal = GOAL_TIERS.find(g => weekRecharges < g.target) || GOAL_TIERS[GOAL_TIERS.length - 1];
  const allCompleted = weekRecharges >= GOAL_TIERS[GOAL_TIERS.length - 1].target;
  const progress = Math.min(100, (weekRecharges / currentGoal.target) * 100);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/15">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Meta Semanal</p>
              <p className="text-[11px] text-muted-foreground">Recarregue mais e ganhe bônus grátis!</p>
            </div>
          </div>
          {allCompleted && (
            <Badge className="bg-yellow-500 text-white text-[10px] gap-1">
              <Trophy className="h-3 w-3" /> Completo!
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {weekRecharges} recargas esta semana
            </span>
            <span className="font-medium text-foreground">
              {allCompleted ? '🎉 Todas as metas batidas!' : `Próxima: ${currentGoal.target} recargas`}
            </span>
          </div>
          <Progress value={progress} className="h-2.5 [&>div]:bg-primary" />
        </div>

        {/* Goals milestones */}
        <div className="grid grid-cols-3 gap-2">
          {GOAL_TIERS.map((goal) => {
            const GoalIcon = goal.icon;
            const reached = weekRecharges >= goal.target;
            const claimed = claimedTiers.includes(goal.target);
            return (
              <div
                key={goal.target}
                className={`rounded-lg p-2 text-center border transition-all ${
                  reached
                    ? `${goal.bg} border-transparent`
                    : 'bg-muted/30 border-border/50 opacity-60'
                }`}
              >
                <GoalIcon className={`h-4 w-4 mx-auto mb-1 ${reached ? goal.color : 'text-muted-foreground'}`} />
                <p className={`text-[10px] font-bold ${reached ? goal.color : 'text-muted-foreground'}`}>
                  {goal.label}
                </p>
                <p className="text-[9px] text-muted-foreground">{goal.target} recargas</p>
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  <Gift className={`h-2.5 w-2.5 ${reached ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className={`text-[9px] font-medium ${reached ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {goal.reward}
                  </span>
                </div>
                {claimed && (
                  <Badge className="mt-1 bg-green-500 text-white text-[8px] px-1 py-0">✓ Creditado</Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
