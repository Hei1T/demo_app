import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts';
import { api, API_BASE } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  IconArrowLeft, IconExternalLink, IconCopy, IconEye, IconUsers,
  IconClick, IconClock, IconMapPin, IconDeviceMobile,
} from '@tabler/icons-react';
import { toast } from 'sonner';

const TPL_NAME: Record<string, string> = {
  noir: '黑金', paper: '极简白', wood: '原木', neon: '霓虹',
  sunset: '日落', ocean: '深海', aurora: '极光', aurora3: '极光3', ember: '余烬',
};
const TYPE_LABEL: Record<string, string> = {
  view: '打开', click: '点击', click_phone: '拨号', click_email: '邮件',
  click_map: '导航', click_wechat: '微信', click_social: '社交',
  save_contact: '存通讯录', copy: '复制', dwell: '停留', out: '外链',
};
const PIE_COLORS = ['#e8c86a', '#4ade80', '#60a5fa', '#f97316', '#c084fc', '#f43f5e', '#22d3ee', '#a3e635'];

type Detail = Awaited<ReturnType<typeof api.cardDetailFull>>;

export default function CardDetail() {
  const { code = '' } = useParams();
  const nav = useNavigate();
  const [days, setDays] = useState(30);
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .cardDetailFull(code, days)
      .then(setD)
      .catch((e) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [code, days]);

  const daily = useMemo(() => {
    if (!d) return [];
    const map = new Map<string, { day: string; views: number; uv: number; clicks: number }>();
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(today.getTime() - i * 86400000);
      const key = dt.toISOString().slice(0, 10);
      map.set(key, { day: key.slice(5), views: 0, uv: 0, clicks: 0 });
    }
    for (const x of d.daily) {
      const cur = map.get(x.day);
      if (cur) {
        cur.views = x.views;
        cur.uv = x.uv;
        cur.clicks = x.clicks;
      }
    }
    return Array.from(map.values());
  }, [d, days]);

  if (loading || !d) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4 @xl/main:grid-cols-3 @5xl/main:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  const p = d.card.profile ?? {};
  const s = d.summary;
  const kpis = [
    { label: '打开量', value: s.views, icon: IconEye },
    { label: '独立访客', value: s.uv, icon: IconUsers },
    { label: '点击量', value: s.clicks, icon: IconClick },
    { label: '点击率', value: `${s.ctr}%`, icon: IconClick },
    { label: '平均停留', value: `${(s.avgDwell / 1000).toFixed(1)}s`, icon: IconClock },
    { label: '平均滚动', value: `${s.avgScroll}%`, icon: IconDeviceMobile },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* 顶部 */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 size-8" onClick={() => nav('/cards')}>
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{String(p.name ?? '未命名')}</h2>
              <Badge variant="outline" className="font-mono text-[10px] text-primary">{d.card.code}</Badge>
              <Badge className="bg-primary/15 text-primary">{TPL_NAME[d.card.templateSlug] ?? d.card.templateSlug}</Badge>
              <Badge variant={d.card.enabled ? 'outline' : 'secondary'} className="text-[10px]">
                {d.card.enabled ? '启用中' : '已停用'}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {String(p.role ?? '')}{p.org ? ` · ${p.org}` : ''} · 所有者 {d.owner?.email ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`${API_BASE}/u/${d.card.code}`} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="size-3.5" />打开名片
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(`${API_BASE}/u/${d.card.code}`).then(
                () => toast.success('短链已复制'),
                () => toast.error('复制失败'),
              );
            }}
          >
            <IconCopy className="size-3.5" />复制链接
          </Button>
          {[7, 30, 90].map((x) => (
            <Button key={x} size="sm" variant={days === x ? 'default' : 'outline'} className="h-8 text-xs"
              onClick={() => setDays(x)}>
              {x} 天
            </Button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 px-4 @xl/main:grid-cols-3 @5xl/main:grid-cols-6 lg:px-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="border-border/50 bg-gradient-to-t from-primary/5 to-card">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  <k.icon className="size-3" />{k.label}
                </div>
                <div className="mt-1.5 text-2xl font-bold tabular-nums">{k.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 预览 + 趋势 */}
      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="border-border/50 p-0">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[15px]">名片预览</CardTitle>
            <CardDescription className="text-[11.5px]">实时 SSR 渲染</CardDescription>
          </CardHeader>
          <div className="relative h-[420px] overflow-hidden rounded-b-xl bg-muted/20">
            <iframe
              src={`${API_BASE}/u/${d.card.code}`}
              title="card"
              className="absolute left-1/2 top-0 h-[840px] w-[420px] origin-top -translate-x-1/2 scale-[0.5] border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </Card>

        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px]">打开趋势</CardTitle>
              <CardDescription className="text-[11.5px]">每日打开 / 访客 / 点击</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cdV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(days / 8)} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                    <Area type="monotone" dataKey="views" name="打开" stroke="var(--chart-1)" strokeWidth={2} fill="url(#cdV)" />
                    <Area type="monotone" dataKey="uv" name="访客" stroke="oklch(0.72 0.16 160)" strokeWidth={1.6} fill="none" />
                    <Area type="monotone" dataKey="clicks" name="点击" stroke="oklch(0.68 0.18 250)" strokeWidth={1.4} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 事件类型 + 城市 + 时段 */}
      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">行为分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {d.byType.map((t) => {
              const max = Math.max(...d.byType.map((x) => x.count), 1);
              return (
                <div key={t.type} className="flex items-center gap-2.5">
                  <span className="w-16 shrink-0 text-[11.5px]">{TYPE_LABEL[t.type] ?? t.type}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(t.count / max) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-[10.5px] tabular-nums text-muted-foreground">{t.count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-[15px]">
              <IconMapPin className="size-4 text-primary" />城市溯源
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {d.cities.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">暂无城市数据</div>
            )}
            {d.cities.map((c) => {
              const max = Math.max(...d.cities.map((x) => x.count), 1);
              return (
                <div key={c.city} className="flex items-center gap-2.5">
                  <span className="w-20 shrink-0 text-[11.5px]">{c.city}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-amber-600" style={{ width: `${(c.count / max) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-[10.5px] tabular-nums text-muted-foreground">{c.count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">时段热力</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.from({ length: 24 }, (_, h) => ({
                  hour: h,
                  count: d.hourly.find((x) => x.hour === h)?.count ?? 0,
                }))}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} labelFormatter={(v) => `${v}:00`} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {Array.from({ length: 24 }, (_, i) => <Cell key={i} fill="var(--chart-1)" opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近访问 */}
      <div className="px-4 lg:px-6">
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">最近访问（30 条）</CardTitle>
            <CardDescription className="text-[11.5px]">head 脚本采集的原始事件</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>时间</TableHead>
                <TableHead>行为</TableHead>
                <TableHead>城市</TableHead>
                <TableHead>点击内容</TableHead>
                <TableHead className="text-right">停留</TableHead>
                <TableHead className="text-right">滚动</TableHead>
                <TableHead>IP 段</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.recent.map((e, i) => (
                <TableRow key={i} className="hover:bg-muted/40">
                  <TableCell className="text-[11px] text-muted-foreground">
                    {new Date(e.at as string).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.type === 'view' ? 'default' : 'secondary'} className="text-[10px]">
                      {TYPE_LABEL[e.type] ?? e.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11.5px]">{e.city ?? '—'}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-[11.5px] text-muted-foreground">
                    {e.targetLabel || e.targetHref || '—'}
                  </TableCell>
                  <TableCell className="text-right text-[11px] tabular-nums">
                    {e.duration ? `${(e.duration / 1000).toFixed(1)}s` : '—'}
                  </TableCell>
                  <TableCell className="text-right text-[11px] tabular-nums">
                    {e.scrollDepth !== null ? `${e.scrollDepth}%` : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-[10.5px] text-muted-foreground">{e.ipMasked ?? '—'}</TableCell>
                </TableRow>
              ))}
              {d.recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                    还没有访问记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
