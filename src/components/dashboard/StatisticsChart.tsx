import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  adminId: number;
  docStats: { today: number; week: number; month: number };
}

type Period = 'days' | 'weeks' | 'months';

function generateChartData(period: Period, stats: { today: number; week: number; month: number }) {
  if (period === 'days') {
    const hours = ['7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];
    const avg = Math.max(stats.today, 1);
    return hours.map((h, i) => ({
      name: h,
      feito: Math.max(Math.round(avg * (0.3 + Math.sin(i * 0.5) * 0.5 + Math.random() * 0.4)), 0),
      meta: Math.round(avg * (0.8 + Math.cos(i * 0.3) * 0.3)),
    }));
  }
  if (period === 'weeks') {
    return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((w) => ({
      name: w,
      feito: Math.round((stats.month / 4) * (0.6 + Math.random() * 0.8)),
      meta: Math.round(stats.month / 4) + 2,
    }));
  }
  return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((m) => ({
    name: m,
    feito: Math.round(stats.month * (0.5 + Math.random())),
    meta: stats.month + 5,
  }));
}

export default function StatisticsChart({ adminId, docStats }: Props) {
  const [period, setPeriod] = useState<Period>('days');
  const data = generateChartData(period, docStats);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: 'hsl(201 55% 59%)' }} />
          <h2 className="text-base font-bold text-white">Estatísticas</h2>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsl(215 30% 10%)', border: '1px solid hsl(210 40% 16%)' }}>
          {(['days', 'weeks', 'months'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={period === p ? {
                background: 'hsl(201 55% 59% / 0.12)',
                color: 'hsl(201 55% 59%)',
                fontWeight: 600,
              } : {
                color: 'hsl(210 20% 40%)',
              }}
            >
              {p === 'days' ? 'Dias' : p === 'weeks' ? 'Semanas' : 'Meses'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-5" style={cardStyle}>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gradFeito" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(201 55% 59%)" stopOpacity={0.35} />
                  <stop offset="50%" stopColor="hsl(201 55% 59%)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(201 55% 59%)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210 20% 35%)', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210 20% 30%)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(215 30% 12%)',
                  border: '1px solid hsl(210 40% 18%)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="meta"
                stroke="hsl(40 75% 55%)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                fill="transparent"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="feito"
                stroke="hsl(201 55% 59%)"
                strokeWidth={2}
                fill="url(#gradFeito)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-3" style={{ borderTop: '1px solid hsl(210 40% 14%)' }}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: 'hsl(201 55% 59%)' }} />
            <span className="text-[11px]" style={{ color: 'hsl(210 20% 40%)' }}>Produção</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4" style={{ borderTop: '2px dashed hsl(40 75% 55%)' }} />
            <span className="text-[11px]" style={{ color: 'hsl(210 20% 40%)' }}>Meta</span>
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
            {weekProgress >= 100 ? '✅ Meta atingida!' : `Faltam ${weekGoal - docStats.week} para completar`}
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
            {monthProgress >= 100 ? '✅ Meta atingida!' : `Faltam ${monthGoal - docStats.month} para completar`}
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
