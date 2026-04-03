import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  adminId: number;
  docStats: { today: number; week: number; month: number };
}

type Period = 'days' | 'weeks' | 'months';

function generateChartData(period: Period, stats: { today: number; week: number; month: number }) {
  if (period === 'days') {
    const hours = ['7am', '8am', '9am', '10am', '11am', '12am', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm'];
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">Estatísticas</h2>
        <div className="flex gap-4">
          {(['days', 'weeks', 'months'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-sm transition-all ${
                period === p
                  ? 'text-white font-semibold'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {p === 'days' ? 'Dias' : p === 'weeks' ? 'Semanas' : 'Meses'}
            </button>
          ))}
        </div>
      </div>

      {/* Day pills row - like the reference */}
      {period === 'days' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {dayLabels.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex flex-col items-center min-w-[44px] py-2.5 px-2 rounded-2xl text-[10px] transition-all ${
                selectedDay === i
                  ? 'bg-[#5ba8d4]/20 text-[#5ba8d4] border border-[#5ba8d4]/40'
                  : 'bg-[#1a1a2e] text-white/40 hover:text-white/60 border border-white/5'
              }`}
            >
              <span className="text-sm font-bold">{d.num}</span>
              <span className="mt-0.5">{d.day}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chart - purple fill like reference */}
      <div className="h-[240px] bg-[#0e0e1a] rounded-2xl p-4 border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradFeito" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5ba8d4" stopOpacity={0.5} />
                <stop offset="40%" stopColor="#5ba8d4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#5ba8d4" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
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
              stroke="#fff"
              strokeWidth={2}
              fill="url(#gradFeito)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
