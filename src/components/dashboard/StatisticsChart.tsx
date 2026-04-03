import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Estatísticas</h2>
        <div className="flex gap-3">
          {(['days', 'weeks', 'months'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                period === p
                  ? 'bg-[#5ba8d4]/15 text-[#5ba8d4] font-semibold border border-[#5ba8d4]/30'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {p === 'days' ? 'Dias' : p === 'weeks' ? 'Semanas' : 'Meses'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-[#5ba8d4]/10 bg-[#0c1420] p-5">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gradFeito" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ba8d4" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#5ba8d4" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5ba8d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1420',
                  border: '1px solid rgba(91,168,212,0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="meta"
                stroke="#e8a838"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="transparent"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="feito"
                stroke="#5ba8d4"
                strokeWidth={2}
                fill="url(#gradFeito)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#5ba8d4]" />
            <span className="text-[11px] text-white/40">Produção</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-[#e8a838]" />
            <span className="text-[11px] text-white/40">Meta</span>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly */}
        <div className="rounded-2xl border border-[#5ba8d4]/10 bg-[#0c1420] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Meta Semanal</span>
            <span className="text-xs text-[#5ba8d4]">{docStats.week}/{weekGoal}</span>
          </div>
          <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${weekProgress}%`,
                background: 'linear-gradient(90deg, #5ba8d4, #7bc4f0)',
              }}
            />
          </div>
          <p className="text-[10px] text-white/25 mt-2">
            {weekProgress >= 100 ? '✅ Meta atingida!' : `Faltam ${weekGoal - docStats.week} para completar`}
          </p>
        </div>

        {/* Monthly */}
        <div className="rounded-2xl border border-[#5ba8d4]/10 bg-[#0c1420] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Meta Mensal</span>
            <span className="text-xs text-[#e8a838]">{docStats.month}/{monthGoal}</span>
          </div>
          <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${monthProgress}%`,
                background: 'linear-gradient(90deg, #e8a838, #f0d078)',
              }}
            />
          </div>
          <p className="text-[10px] text-white/25 mt-2">
            {monthProgress >= 100 ? '✅ Meta atingida!' : `Faltam ${monthGoal - docStats.month} para completar`}
          </p>
        </div>
      </div>

      {/* Daily stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#5ba8d4]/10 bg-[#0c1420] p-4 text-center">
          <p className="text-2xl font-bold text-[#5ba8d4]">{docStats.today}</p>
          <p className="text-[10px] text-white/30 mt-1">Hoje</p>
        </div>
        <div className="rounded-2xl border border-[#5ba8d4]/10 bg-[#0c1420] p-4 text-center">
          <p className="text-2xl font-bold text-white">{docStats.week}</p>
          <p className="text-[10px] text-white/30 mt-1">Esta semana</p>
        </div>
        <div className="rounded-2xl border border-[#5ba8d4]/10 bg-[#0c1420] p-4 text-center">
          <p className="text-2xl font-bold text-[#e8a838]">{docStats.month}</p>
          <p className="text-[10px] text-white/30 mt-1">Este mês</p>
        </div>
      </div>
    </div>
  );
}
