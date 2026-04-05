import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Edit2, Check, X, Crown, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  adminId: number;
  docStats: { today: number; week: number; month: number };
}

interface ServiceCount {
  name: string;
  count: number;
  color: string;
}

interface DailyData {
  date: string;
  label: string;
  count: number;
}

type Period = 'week' | 'month' | '3months';

const SERVICE_COLORS: Record<string, string> = {
  'CNH Digital': 'hsl(340 75% 55%)',
  'RG / CIN': 'hsl(280 65% 55%)',
  'CRLV': 'hsl(201 55% 59%)',
  'Hapvida': 'hsl(40 75% 55%)',
  'Náutica': 'hsl(160 60% 45%)',
  'Estudante': 'hsl(210 20% 50%)',
};

const GOALS_KEY = (adminId: number) => `dashboard_goals_${adminId}`;

function getDateRange(period: Period): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(start.getDate() - 6);
  else if (period === 'month') start.setDate(start.getDate() - 29);
  else start.setDate(start.getDate() - 89);
  return { start, end };
}

function formatLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (period === 'week') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  if (period === 'month') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  // 3 months: show week ranges
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function StatisticsChart({ adminId, docStats }: Props) {
  const [period, setPeriod] = useState<Period>('week');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [serviceCounts, setServiceCounts] = useState<ServiceCount[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  // Goals
  const [weekGoal, setWeekGoal] = useState(50);
  const [monthGoal, setMonthGoal] = useState(200);
  const [editingWeek, setEditingWeek] = useState(false);
  const [editingMonth, setEditingMonth] = useState(false);
  const [weekInput, setWeekInput] = useState('50');
  const [monthInput, setMonthInput] = useState('200');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GOALS_KEY(adminId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.weekGoal) { setWeekGoal(parsed.weekGoal); setWeekInput(String(parsed.weekGoal)); }
        if (parsed.monthGoal) { setMonthGoal(parsed.monthGoal); setMonthInput(String(parsed.monthGoal)); }
      }
    } catch {}
  }, [adminId]);

  const saveGoals = (wg: number, mg: number) => {
    localStorage.setItem(GOALS_KEY(adminId), JSON.stringify({ weekGoal: wg, monthGoal: mg }));
  };

  const handleSaveWeek = () => {
    const v = parseInt(weekInput);
    if (isNaN(v) || v <= 0) return;
    setWeekGoal(v);
    saveGoals(v, monthGoal);
    setEditingWeek(false);
  };

  const handleSaveMonth = () => {
    const v = parseInt(monthInput);
    if (isNaN(v) || v <= 0) return;
    setMonthGoal(v);
    saveGoals(weekGoal, v);
    setEditingMonth(false);
  };

  // Fetch daily activity data + service counts
  useEffect(() => {
    async function fetchData() {
      setLoadingChart(true);
      const { start } = getDateRange(period);
      const startISO = start.toISOString();

      try {
        // Fetch all records with created_at for the admin in parallel
        const tables = [
          { name: 'CNH Digital', table: 'usuarios' as const },
          { name: 'RG / CIN', table: 'usuarios_rg' as const },
          { name: 'CRLV', table: 'usuarios_crlv' as const },
          { name: 'Hapvida', table: 'hapvida_atestados' as const },
          { name: 'Náutica', table: 'chas' as const },
          { name: 'Estudante', table: 'carteira_estudante' as const },
        ];

        const results = await Promise.all(
          tables.map(async (t) => {
            const { data } = await supabase
              .from(t.table)
              .select('created_at')
              .eq('admin_id', adminId)
              .gte('created_at', startISO)
              .order('created_at', { ascending: true });
            return { name: t.name, records: data || [] };
          })
        );

        // Build daily counts
        const dayMap: Record<string, number> = {};
        const svcMap: Record<string, number> = {};

        results.forEach((r) => {
          svcMap[r.name] = (svcMap[r.name] || 0) + r.records.length;
          r.records.forEach((rec) => {
            if (!rec.created_at) return;
            const day = rec.created_at.slice(0, 10);
            dayMap[day] = (dayMap[day] || 0) + 1;
          });
        });

        // Fill empty days
        const { start: s, end: e } = getDateRange(period);
        const days: DailyData[] = [];
        const cur = new Date(s);
        while (cur <= e) {
          const key = cur.toISOString().slice(0, 10);
          days.push({
            date: key,
            label: formatLabel(key, period),
            count: dayMap[key] || 0,
          });
          cur.setDate(cur.getDate() + 1);
        }

        // For 3months period, aggregate by week
        if (period === '3months') {
          const weeklyData: DailyData[] = [];
          for (let i = 0; i < days.length; i += 7) {
            const chunk = days.slice(i, i + 7);
            const total = chunk.reduce((s, d) => s + d.count, 0);
            weeklyData.push({
              date: chunk[0].date,
              label: chunk[0].label,
              count: total,
            });
          }
          setDailyData(weeklyData);
        } else {
          setDailyData(days);
        }

        // Service counts sorted
        const svcArr = Object.entries(svcMap)
          .map(([name, count]) => ({ name, count, color: SERVICE_COLORS[name] || 'hsl(210 20% 50%)' }))
          .sort((a, b) => b.count - a.count);
        setServiceCounts(svcArr);

        // Also fetch total counts for "top service" (all-time)
        if (period === 'week') {
          const allTimeCounts = await Promise.all(
            tables.map(async (t) => {
              const { count } = await supabase
                .from(t.table)
                .select('id', { count: 'exact', head: true })
                .eq('admin_id', adminId);
              return { name: t.name, count: count || 0, color: SERVICE_COLORS[t.name] || 'hsl(210 20% 50%)' };
            })
          );
          // Only use all-time if period counts are empty
          if (svcArr.every(s => s.count === 0)) {
            setServiceCounts(allTimeCounts.sort((a, b) => b.count - a.count));
          }
        }
      } catch (e) {
        console.error('Error fetching chart data:', e);
      } finally {
        setLoadingChart(false);
      }
    }
    fetchData();
  }, [adminId, period]);

  const totalPeriod = dailyData.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...dailyData.map(d => d.count), 1);
  const weekProgress = Math.min((docStats.week / weekGoal) * 100, 100);
  const monthProgress = Math.min((docStats.month / monthGoal) * 100, 100);
  const topService = serviceCounts.length > 0 ? serviceCounts[0] : null;
  const totalServices = serviceCounts.reduce((s, c) => s + c.count, 0);

  const cardStyle = {
    background: 'hsl(215 30% 10%)',
    border: '1px solid hsl(210 40% 16%)',
    borderRadius: '12px',
  };

  const periodLabels: Record<Period, string> = {
    week: 'Última semana',
    month: 'Último mês',
    '3months': 'Últimos 3 meses',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" style={{ color: 'hsl(201 55% 59%)' }} />
        <h2 className="text-base font-bold text-white">Estatísticas</h2>
      </div>

      {/* Bar Chart + Top Service */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 p-4" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Produção</p>
              <p className="text-[10px] text-white/30">{totalPeriod} serviços no período</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 p-0.5">
              {(['week', 'month', '3months'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    period === p
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {p === 'week' ? '7 dias' : p === 'month' ? '30 dias' : '3 meses'}
                </button>
              ))}
            </div>
          </div>

          {loadingChart ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'hsl(201 55% 59%)' }} />
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} barCategoryGap="15%">
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'hsl(210 20% 35%)' }}
                    axisLine={{ stroke: 'hsl(210 25% 18%)' }}
                    tickLine={false}
                    interval={period === 'month' ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(210 20% 35%)' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(215 30% 12%)',
                      border: '1px solid hsl(210 40% 20%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`${value} serviços`, 'Total']}
                    labelFormatter={(label) => `Período: ${label}`}
                    cursor={{ fill: 'hsla(201, 55%, 59%, 0.08)' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(142 71% 45%)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Service + Service Breakdown */}
        <div className="p-4 space-y-4" style={cardStyle}>
          {/* Top service highlight */}
          {topService && (
            <div className="text-center pb-3 border-b border-white/5">
              <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Mais usado</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-bold text-white">{topService.name}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: topService.color }}>{topService.count}</p>
              <p className="text-[10px] text-white/30">
                {totalServices > 0 ? `${Math.round((topService.count / totalServices) * 100)}% do total` : 'no período'}
              </p>
            </div>
          )}

          {/* All services breakdown */}
          <div className="space-y-2">
            <p className="text-[10px] text-white/30 uppercase tracking-wide">Por módulo</p>
            {serviceCounts.length === 0 ? (
              <p className="text-[10px] text-white/20 text-center py-4">Nenhum serviço no período</p>
            ) : (
              serviceCounts.map((svc) => (
                <div key={svc.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: svc.color }} />
                  <span className="text-[11px] text-white/60 flex-1 truncate">{svc.name}</span>
                  <span className="text-[11px] font-bold text-white">{svc.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Goals + Daily stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Week goal */}
        <div className="p-4" style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            {editingWeek ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-semibold text-white shrink-0">Meta:</span>
                <input
                  type="number"
                  value={weekInput}
                  onChange={(e) => setWeekInput(e.target.value)}
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-sm text-white outline-none focus:border-[hsl(201,55%,59%)]"
                  autoFocus
                />
                <button onClick={handleSaveWeek} className="p-1 hover:bg-white/10 rounded">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </button>
                <button onClick={() => { setEditingWeek(false); setWeekInput(String(weekGoal)); }} className="p-1 hover:bg-white/10 rounded">
                  <X className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-semibold text-white">Meta Semanal</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'hsl(201 55% 59%)' }}>{docStats.week}/{weekGoal}</span>
                  <button onClick={() => setEditingWeek(true)} className="p-1 hover:bg-white/10 rounded">
                    <Edit2 className="h-3 w-3 text-white/30" />
                  </button>
                </div>
              </>
            )}
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
            {weekProgress >= 100 ? '🎯 Meta atingida!' : `Faltam ${weekGoal - docStats.week} para completar`}
          </p>
        </div>

        {/* Month goal */}
        <div className="p-4" style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            {editingMonth ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-semibold text-white shrink-0">Meta:</span>
                <input
                  type="number"
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-sm text-white outline-none focus:border-[hsl(40,75%,55%)]"
                  autoFocus
                />
                <button onClick={handleSaveMonth} className="p-1 hover:bg-white/10 rounded">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </button>
                <button onClick={() => { setEditingMonth(false); setMonthInput(String(monthGoal)); }} className="p-1 hover:bg-white/10 rounded">
                  <X className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-semibold text-white">Meta Mensal</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'hsl(40 75% 55%)' }}>{docStats.month}/{monthGoal}</span>
                  <button onClick={() => setEditingMonth(true)} className="p-1 hover:bg-white/10 rounded">
                    <Edit2 className="h-3 w-3 text-white/30" />
                  </button>
                </div>
              </>
            )}
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
            {monthProgress >= 100 ? '🎯 Meta atingida!' : `Faltam ${monthGoal - docStats.month} para completar`}
          </p>
        </div>
      </div>

      {/* Daily stats counters */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: docStats.today, label: 'Hoje', color: 'hsl(142 71% 45%)' },
          { value: docStats.week, label: 'Semana', color: 'hsl(201 55% 59%)' },
          { value: docStats.month, label: 'Mês', color: 'hsl(40 75% 55%)' },
        ].map((stat) => (
          <div key={stat.label} className="p-3 text-center" style={cardStyle}>
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'hsl(210 20% 35%)' }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
