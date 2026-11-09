import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Analytics = Awaited<ReturnType<typeof api.analytics>>;

const TPL_NAME: Record<string, string> = {
  noir: '黑金', paper: '极简白', wood: '原木',
  neon: '霓虹', sunset: '日落', ocean: '深海',
};

const TYPE_LABEL: Record<string, string> = {
  view: '打开',
  click_phone: '拨号',
  click_email: '邮件',
  click_map: '导航',
  click_wechat: '微信',
  click_social: '社交',
  save_contact: '存通讯录',
};

export default function Analytics() {
  const nav = useNavigate();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [fn, setFn] = useState<Awaited<ReturnType<typeof api.funnel>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .analytics(days)
      .then(setData)
      .catch(() => {});
    api
      .funnel(days)
      .then(setFn)
      .catch((e) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[320px] rounded-xl" />
        </div>
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
    );
  }

  const maxHour = Math.max(...data.hourly.map((h) => h.count), 1);
  const totalEvents = data.typeDist.reduce((s, t) => s + t.count, 0);

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 lg:px-6">
        <div>
          <h2 className="text-lg font-semibold">数据分析</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            模板表现 · Top 名片 · 事件分布 · 时段热力（PG 实时查询）
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              className="h-8 text-xs"
              onClick={() => setDays(d)}
            >
              {d} 天
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        {/* 模板表现 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">模板表现</CardTitle>
              <CardDescription className="text-[11.5px]">
                哪套模板带来的打开量与点击率最高
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {data.templates.slice(0, 8).map((t, i) => {
                  const max = Math.max(...data.templates.map((x) => x.views), 1);
                  return (
                    <div key={t.slug}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-2">
                          <span className="w-4 text-[10px] text-muted-foreground">{i + 1}</span>
                          <span className="font-medium">{TPL_NAME[t.slug] ?? t.slug}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {t.cards} 张
                          </span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {t.views} 次
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            CTR {t.ctr}%
                          </Badge>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(t.views / max) * 100}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-amber-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 事件分布 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">事件分布</CardTitle>
              <CardDescription className="text-[11.5px]">
                共 {totalEvents.toLocaleString()} 条事件
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2.5">
                {data.typeDist.map((t) => {
                  const pct = totalEvents ? (t.count / totalEvents) * 100 : 0;
                  return (
                    <div key={t.type} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-[11.5px] text-muted-foreground">
                        {TYPE_LABEL[t.type] ?? t.type}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            t.type === 'view' ? 'bg-primary' : 'bg-chart-3',
                          )}
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-[11px] tabular-nums text-muted-foreground">
                        {t.count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 城市溯源 + 停留 */}
      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">城市溯源</CardTitle>
              <CardDescription className="text-[11.5px]">
                head 脚本 + 服务端 IP 离线库解析
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {data.cities.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">还没有城市数据</div>
              ) : (
                <div className="space-y-2.5">
                  {data.cities.map((c) => {
                    const max = Math.max(...data.cities.map((x) => x.count), 1);
                    return (
                      <div key={c.city} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-[12px]">{c.city}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-600"
                            style={{ width: `${(c.count / max) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
                          {c.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">停留与滚动</CardTitle>
              <CardDescription className="text-[11.5px]">
                来自 {data.dwellSamples} 次离开上报
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10.5px] text-muted-foreground">平均停留</div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">
                    {(data.avgDwell / 1000).toFixed(1)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">秒</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] text-muted-foreground">省份数</div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">{data.regions.length}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {data.regions.slice(0, 5).map((r) => (
                  <div key={r.region} className="flex justify-between text-[11.5px]">
                    <span className="text-muted-foreground">{r.region}</span>
                    <span className="tabular-nums">{r.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {/* 漏斗 + 留存 + 来源 */}
      {fn && (
        <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px]">转化漏斗</CardTitle>
                <CardDescription className="text-[11.5px]">打开 → 点击 → 拨号/加微</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {fn.funnel.map((s, i) => {
                  const top = fn.funnel[0]?.count || 1;
                  const pct = Math.round((s.count / top) * 100);
                  const prev = i > 0 ? fn.funnel[i - 1].count : 0;
                  const step = i > 0 && prev ? Math.round((s.count / prev) * 100) : 100;
                  return (
                    <div key={s.step}>
                      <div className="mb-1 flex items-center justify-between text-[11.5px]">
                        <span>{s.step}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {s.count.toLocaleString()}
                          <span className="ml-1.5 text-[10px] opacity-70">{pct}%</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(pct, 1)}%` }}
                          transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-amber-600"
                        />
                      </div>
                      {i > 0 && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          转化 {step}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Card className="h-full border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px]">留存 & 环比</CardTitle>
                <CardDescription className="text-[11.5px]">
                  访客 {fn.retention.visitors.toLocaleString()} 人
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-2.5">
                    <div className="text-[10.5px] text-muted-foreground">次日留存</div>
                    <div className="mt-0.5 text-xl font-bold tabular-nums">{fn.retention.d1Rate}%</div>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <div className="text-[10.5px] text-muted-foreground">7 日留存</div>
                    <div className="mt-0.5 text-xl font-bold tabular-nums">{fn.retention.d7Rate}%</div>
                  </div>
                </div>
                <div className="rounded-lg border p-2.5">
                  <div className="text-[10.5px] text-muted-foreground">本期 vs 上期打开量</div>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-xl font-bold tabular-nums">
                      {fn.compare.current.toLocaleString()}
                    </span>
                    <span
                      className={
                        fn.compare.change >= 0 ? 'text-[11px] text-emerald-400' : 'text-[11px] text-rose-400'
                      }
                    >
                      {fn.compare.change >= 0 ? '+' : ''}
                      {fn.compare.change}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    上期 {fn.compare.previous.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <Card className="h-full border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px]">来源分布</CardTitle>
                <CardDescription className="text-[11.5px]">访客从哪来</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {fn.sources.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">无数据</div>
                )}
                {fn.sources.map((s) => {
                  const max = Math.max(...fn.sources.map((x) => x.count), 1);
                  return (
                    <div key={s.source} className="flex items-center gap-2.5">
                      <span className="w-16 shrink-0 text-[11.5px]">{s.source}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-3"
                          style={{ width: `${(s.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10.5px] tabular-nums text-muted-foreground">
                        {s.count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
      {/* 时段热力 */}
      <motion.div
        className="px-4 lg:px-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">时段热力</CardTitle>
            <CardDescription className="text-[11.5px]">
              一天中几点被打开最多（0-23 时）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(v) => `${v}时`}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => `${v}:00 - ${Number(v) + 1}:00`}
                  />
                  <Bar dataKey="count" name="打开" radius={[4, 4, 0, 0]}>
                    {data.hourly.map((h) => (
                      <Cell
                        key={h.hour}
                        fill={h.count / maxHour > 0.66 ? 'var(--chart-1)' : h.count / maxHour > 0.33 ? 'var(--chart-4)' : 'var(--muted-foreground)'}
                        opacity={h.count / maxHour > 0.66 ? 1 : 0.55}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 名片 */}
      <motion.div
        className="px-4 lg:px-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">Top 名片</CardTitle>
            <CardDescription className="text-[11.5px]">
              打开量最高的 10 张名片
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">#</TableHead>
                <TableHead>短码</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>模板</TableHead>
                <TableHead>所有者</TableHead>
                <TableHead className="text-right">打开</TableHead>
                <TableHead className="text-right">访客</TableHead>
                <TableHead className="text-right">点击率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCards.map((c, i) => (
                <TableRow
                  key={c.code}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => nav(`/cards/${c.code}`)}
                >
                  <TableCell className="text-[11px] text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-mono text-[11px] text-primary">{c.code}</TableCell>
                  <TableCell className="text-[13px]">{c.name || '—'}</TableCell>
                  <TableCell>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                      {TPL_NAME[c.templateSlug] ?? c.templateSlug}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {c.ownerEmail}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.views}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.uv}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.ctr}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
}
