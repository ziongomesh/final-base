import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface Props {
  adminId: number;
  docStats: { today: number; week: number; month: number };
}

type Period = 'days' | 'weeks' | 'months';

// Generate mock chart data based on real stats
function generateChartData(period: Period, stats: { today: number; week: number; month: number }) {
  if (period === 'days') {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const today = new Date().getDay();
    const avg = Math.max(Math.round(stats.week / 7), 1);
    return days.map((d, i) => ({
      name: d,
      feito: i <= today ? Math.max(Math.round(avg * (0.5 + Math.random())), 0) : 0,
      meta: avg + Math.round(Math.random() * 2),
    }));
  }
  if (period === 'weeks') {
    return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((w, i) => ({
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

const dayLabels = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 7 + i);
  return {
    num: String(d.getDate()).padStart(2, '0'),
    day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
    isToday: i === 7,
  };
});

export default function StatisticsChart({ adminId, docStats }: Props) {
  const [period, setPeriod] = useState<Period>('days');
  const [selectedDay, setSelectedDay] = useState(7);
  const data = generateChartData(period, docStats);

  return (
    <div className="bg-[#111a27] rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Estatísticas</h2>
        <div className="flex gap-1 bg-[#1a2332] rounded-full p-1">
          {(['days', 'weeks', 'months'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                period === p
                  ? 'bg-[#5ba8d4] text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {p === 'days' ? 'Dias' : p === 'weeks' ? 'Semanas' : 'Meses'}
            </button>
          ))}
        </div>
      </div>

      {/* Day pills */}
      {period === 'days' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {dayLabels.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex flex-col items-center min-w-[40px] py-2 px-2 rounded-xl text-[10px] transition-all ${
                selectedDay === i
                  ? 'bg-[#5ba8d4] text-white'
                  : d.isToday
                  ? 'bg-[#5ba8d4]/20 text-[#5ba8d4]'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              <span className="text-sm font-bold">{d.num}</span>
              <span>{d.day}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradFeito" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5ba8d4" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#5ba8d4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5c542" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#f5c542" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a2332',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="meta"
              stroke="#f5c542"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="url(#gradMeta)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="feito"
              stroke="#5ba8d4"
              strokeWidth={2.5}
              fill="url(#gradFeito)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
