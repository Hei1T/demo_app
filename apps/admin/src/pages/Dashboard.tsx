import { useEffect, useMemo, useState } from 'react';
import { api, type Overview } from '@/lib/api';
import { SectionCards, type Kpi } from '@/components/section-cards';
import { ChartAreaInteractive, type ChartPoint } from '@/components/chart-area-interactive';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .overview(range)
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [range]);

  /** 补零成完整日期序列 */
  const chartData: ChartPoint[] = useMemo(() => {
    const map = new Map<string, ChartPoint>();
    const today = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: key, views: 0, users: 0 });
    }
    if (data) {
      for (const d of data.daily.views) {
        const cur = map.get(d.day);
        if (cur) cur.views = Number(d.count);
      }
      for (const d of data.daily.users) {
        const cur = map.get(d.day);
        if (cur) cur.users = Number(d.count);
      }
    }
    return Array.from(map.values());
  }, [data, range]);

  const kpis: Kpi[] = useMemo(() => {
    if (!data) return [];
    const last7 = chartData.slice(-7);
    const prev7 = chartData.slice(-14, -7);
    const sum = (arr: ChartPoint[], k: 'views' | 'users') => arr.reduce((s, x) => s + x[k], 0);
    const pct = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : null) : Math.round(((cur - prev) / prev) * 100);

    const ctr = data.traffic.viewsTotal
      ? Math.round((data.traffic.clicksTotal / data.traffic.viewsTotal) * 100)
      : 0;

    return [
      {
        label: '注册用户',
        value: data.users.total.toLocaleString(),
        delta: pct(sum(last7, 'users'), sum(prev7, 'users')),
        hint: `今日新增 ${data.users.today} 人`,
      },
      {
        label: '名片总数',
        value: data.cards.total.toLocaleString(),
        delta: null,
        hint: `平均每用户 ${(data.cards.total / Math.max(data.users.total, 1)).toFixed(1)} 张`,
      },
      {
        label: '总打开量',
        value: data.traffic.viewsTotal.toLocaleString(),
        delta: pct(sum(last7, 'views'), sum(prev7, 'views')),
        hint: `今日 ${data.traffic.viewsToday} · 独立访客 ${data.traffic.visitorsToday}`,
      },
      {
        label: '总点击量',
        value: data.traffic.clicksTotal.toLocaleString(),
        delta: null,
        hint: `点击率 CTR ${ctr}%`,
      },
    ];
  }, [data, chartData]);

  if (loading || !data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards items={kpis} />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive
            data={chartData}
            range={range}
            onRangeChange={setRange}
          />
        </div>
      </div>
    </div>
  );
}
