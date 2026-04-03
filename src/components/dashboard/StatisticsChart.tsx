import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  adminId: number;
  docStats: { today: number; week: number; month: number };
}

interface ServiceData {
  name: string;
  value: number;
  color: string;
}

const SERVICE_COLORS = [
  'hsl(340 75% 55%)',   // pink
  'hsl(280 65% 55%)',   // purple
  'hsl(201 55% 59%)',   // blue
  'hsl(40 75% 55%)',    // gold
  'hsl(160 60% 45%)',   // green
  'hsl(210 20% 35%)',   // grey
];

export default function StatisticsChart({ adminId, docStats }: Props) {
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);

  useEffect(() => {
    async function fetchServiceCounts() {
      try {
        const [cnh, rg, crlv, hapvida, cha, estudante] = await Promise.all([
          supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('admin_id', adminId),
          supabase.from('usuarios_rg').select('id', { count: 'exact', head: true }).eq('admin_id', adminId),
          supabase.from('usuarios_crlv').select('id', { count: 'exact', head: true }).eq('admin_id', adminId),
          supabase.from('hapvida_atestados').select('id', { count: 'exact', head: true }).eq('admin_id', adminId),
          supabase.from('chas').select('id', { count: 'exact', head: true }).eq('admin_id', adminId),
          supabase.from('carteira_estudante').select('id', { count: 'exact', head: true }).eq('admin_id', adminId),
        ]);

        const raw = [
          { name: 'CNH Digital', value: cnh.count || 0, color: SERVICE_COLORS[0] },
          { name: 'RG / CIN', value: rg.count || 0, color: SERVICE_COLORS[1] },
          { name: 'CRLV', value: crlv.count || 0, color: SERVICE_COLORS[2] },
          { name: 'Hapvida', value: hapvida.count || 0, color: SERVICE_COLORS[3] },
          { name: 'Náutica', value: cha.count || 0, color: SERVICE_COLORS[4] },
          { name: 'Estudante', value: estudante.count || 0, color: SERVICE_COLORS[5] },
        ].sort((a, b) => b.value - a.value);

        // If all zero, show placeholder
        const total = raw.reduce((s, r) => s + r.value, 0);
        if (total === 0) {
          setServiceData([
            { name: 'CNH Digital', value: 45, color: SERVICE_COLORS[0] },
            { name: 'RG / CIN', value: 30, color: SERVICE_COLORS[1] },
            { name: 'CRLV', value: 25, color: SERVICE_COLORS[2] },
          ]);
        } else {
          setServiceData(raw.filter(r => r.value > 0));
        }
      } catch {
        setServiceData([
          { name: 'CNH Digital', value: 45, color: SERVICE_COLORS[0] },
          { name: 'RG / CIN', value: 30, color: SERVICE_COLORS[1] },
          { name: 'CRLV', value: 25, color: SERVICE_COLORS[2] },
        ]);
      }
    }
    fetchServiceCounts();
  }, [adminId]);

  const total = serviceData.reduce((s, d) => s + d.value, 0);

  const weekGoal = 50;
  const monthGoal = 200;
  const weekProgress = Math.min((docStats.week / weekGoal) * 100, 100);
  const monthProgress = Math.min((docStats.month / monthGoal) * 100, 100);

  const cardStyle = {
    background: 'hsl(215 30% 10%)',
    border: '1px solid hsl(210 40% 16%)',
    borderRadius: '16px',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" style={{ color: 'hsl(201 55% 59%)' }} />
        <h2 className="text-base font-bold text-white">Estatísticas</h2>
      </div>

      {/* Donut chart + service breakdown */}
      <div className="p-5" style={cardStyle}>
        <div className="flex items-center gap-8">
          {/* Donut */}
          <div className="relative w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  stroke="hsl(215 30% 10%)"
                  strokeWidth={3}
                  startAngle={90}
                  endAngle={-270}
                >
                  {serviceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{total}</span>
              <span className="text-[10px]" style={{ color: 'hsl(210 20% 40%)' }}>Total</span>
            </div>
          </div>

          {/* Legend / breakdown */}
          <div className="flex-1 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-4">Serviços Mais Feitos</h3>
            {serviceData.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ background: item.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/70 truncate">{item.name}</span>
                      <span className="text-sm font-bold text-white ml-2">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Meta Semanal</span>
            <span className="text-xs" style={{ color: 'hsl(201 55% 59%)' }}>{docStats.week}/{weekGoal}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(210 30% 14%)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${weekProgress}%`,
                background: 'linear-gradient(90deg, hsl(201 55% 59%), hsl(201 65% 70%))',
              }}
            />
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'hsl(210 20% 30%)' }}>
            {weekProgress >= 100 ? 'Meta atingida!' : `Faltam ${weekGoal - docStats.week} para completar`}
          </p>
        </div>

        <div className="p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Meta Mensal</span>
            <span className="text-xs" style={{ color: 'hsl(40 75% 55%)' }}>{docStats.month}/{monthGoal}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(210 30% 14%)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${monthProgress}%`,
                background: 'linear-gradient(90deg, hsl(40 75% 55%), hsl(45 80% 65%))',
              }}
            />
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'hsl(210 20% 30%)' }}>
            {monthProgress >= 100 ? 'Meta atingida!' : `Faltam ${monthGoal - docStats.month} para completar`}
          </p>
        </div>
      </div>

      {/* Daily stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: docStats.today, label: 'Hoje', color: 'hsl(201 55% 59%)' },
          { value: docStats.week, label: 'Esta semana', color: 'hsl(210 20% 80%)' },
          { value: docStats.month, label: 'Este mês', color: 'hsl(40 75% 55%)' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 text-center" style={cardStyle}>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] mt-1" style={{ color: 'hsl(210 20% 35%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
