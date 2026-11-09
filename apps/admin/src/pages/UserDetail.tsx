import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  IconArrowLeft, IconSearch, IconChevronLeft, IconChevronRight,
  IconEye, IconUsers, IconClick, IconClock, IconMapPin, IconCategory,
} from '@tabler/icons-react';
import { toast } from 'sonner';

const TPL_NAME: Record<string, string> = {
  noir: '黑金', paper: '极简白', wood: '原木',
  neon: '霓虹', sunset: '日落', ocean: '深海', aurora: '极光', aurora3: '极光3', ember: '余烬',
};

const CLICK_LABEL: Record<string, string> = {
  click_phone: '拨号', click_email: '邮件', click_map: '导航',
  click_wechat: '微信', click_social: '社交', save_contact: '存通讯录', copy: '复制',
};

const PIE_COLORS = ['#e8c86a', '#4ade80', '#60a5fa', '#f97316', '#c084fc', '#f43f5e', '#22d3ee'];

type Overview = Awaited<ReturnType<typeof api.userOverview>>;
type CardsResp = Awaited<ReturnType<typeof api.userCards>>;

export default function UserDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [days, setDays] = useState(30);
  const [ov, setOv] = useState<Overview | null>(null);
  const [cards, setCards] = useState<CardsResp | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('views');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .userOverview(id, days)
      .then(setOv)
      .catch((e) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id, days]);

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .userCards(id, page, 20, q, sort)
        .then(setCards)
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [id, page, q, sort]);

  const daily = useMemo(() => {
    if (!ov) return [];
    const map = new Map<string, { day: string; views: number; uv: number }>();
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { day: key.slice(5), views: 0, uv: 0 });
    }
    for (const d of ov.daily) {
      const cur = map.get(d.day);
      if (cur) {
        cur.views = d.views;
        cur.uv = d.uv;
      }
    }
    return Array.from(map.values());
  }, [ov, days]);

  if (loading || !ov) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid gap-4 @xl/main:grid-cols-3 @5xl/main:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    );
  }

  const { user, summary } = ov;
  const pages = Math.max(1, Math.ceil((cards?.total ?? 0) / 20));

  const kpis = [
    { label: '名片数', value: summary.cards, icon: IconCategory },
    { label: '打开量', value: summary.views, icon: IconEye },
    { label: '独立访客', value: summary.uv, icon: IconUsers },
    { label: '点击量', value: summary.clicks, icon: IconClick },
    { label: '点击率', value: `${summary.ctr}%`, icon: IconClick },
    { label: '平均停留', value: `${(summary.avgDwell / 1000).toFixed(1)}s`, icon: IconClock },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* 顶部 */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 size-8" onClick={() => nav('/users')}>
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{user.name ?? user.email}</h2>
            <p className="font-mono text-[11px] text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
              <Badge variant="outline" className="text-emerald-400">{user.plan}</Badge>
              <Badge variant="outline">
                注册 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
              </Badge>
              {user.lastLoginAt && (
                <Badge variant="outline" className="text-muted-foreground">
                  最近登录 {new Date(user.lastLoginAt).toLocaleString('zh-CN')}
                </Badge>
              )}
            </div>
          </div>
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

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 px-4 @xl/main:grid-cols-3 @5xl/main:grid-cols-6 lg:px-6">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="border-border/50 bg-gradient-to-t from-primary/5 to-card">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  <k.icon className="size-3" />
                  {k.label}
                </div>
                <div className="mt-1.5 text-2xl font-bold tabular-nums">{k.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 趋势 + 模板 */}
      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px]">打开趋势</CardTitle>
              <CardDescription className="text-[11.5px]">每日打开量 / 独立访客</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="uvViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(days / 8)} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="views" name="打开" stroke="var(--chart-1)" strokeWidth={2} fill="url(#uvViews)" />
                    <Area type="monotone" dataKey="uv" name="访客" stroke="oklch(0.72 0.16 160)" strokeWidth={1.6} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px]">模板分布</CardTitle>
              <CardDescription className="text-[11.5px]">按打开量</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ov.templates} layout="vertical" margin={{ left: 4, right: 12 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="slug"
                      width={62}
                      tick={{ fontSize: 10.5 }}
                      tickFormatter={(v: string) => TPL_NAME[v] ?? v}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                      formatter={(v: number) => [`${v} 次打开`, '']}
                    />
                    <Bar dataKey="views" radius={[0, 6, 6, 0]}>
                      {ov.templates.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 城市 + 点击类型 */}
      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-1.5 text-[15px]">
                <IconMapPin className="size-4 text-primary" />
                城市溯源
              </CardTitle>
              <CardDescription className="text-[11.5px]">
                {summary.cities} 个城市 · head 脚本采集
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {ov.cities.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">还没有城市数据</div>
              ) : (
                <div className="space-y-2">
                  {ov.cities.map((c) => {
                    const max = Math.max(...ov.cities.map((x) => x.count), 1);
                    return (
                      <div key={c.city} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-[11.5px]">{c.city}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.count / max) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-600"
                          />
                        </div>
                        <span className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px]">点击类型</CardTitle>
              <CardDescription className="text-[11.5px]">用户在名片上做了什么</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {ov.clickTypes.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">还没有点击</div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ov.clickTypes.map((c) => ({
                          name: CLICK_LABEL[c.type] ?? c.type,
                          value: c.count,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={78}
                        paddingAngle={2}
                      >
                        {ov.clickTypes.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10.5 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 名片表 */}
      <motion.div className="px-4 lg:px-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-[15px]">名片列表（{cards?.total ?? 0} 张）</CardTitle>
              <CardDescription className="text-[11.5px]">按打开量排序，含使用率</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">按打开量</SelectItem>
                  <SelectItem value="name">按姓名</SelectItem>
                  <SelectItem value="created">按创建时间</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-52">
                <IconSearch className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="搜索编号/姓名"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>短码</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>模板</TableHead>
                <TableHead className="text-right">打开</TableHead>
                <TableHead className="text-right">访客</TableHead>
                <TableHead className="text-right">点击率</TableHead>
                <TableHead className="w-32 text-right">使用率</TableHead>
                <TableHead className="text-right">占比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cards?.items ?? []).map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => nav(`/cards/${c.code}`)}
                >
                  <TableCell className="font-mono text-[11px] text-primary">{c.code}</TableCell>
                  <TableCell className="text-[13px]">{c.name || '—'}</TableCell>
                  <TableCell>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                      {TPL_NAME[c.templateSlug] ?? c.templateSlug}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.views}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.uv}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.ctr}%</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${c.usageRate}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] tabular-nums">{c.usageRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {c.share}%
                  </TableCell>
                </TableRow>
              ))}
              {(cards?.items.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-sm text-muted-foreground">
                    没有匹配的名片
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
            <span>第 {page} 页 / 共 {pages} 页</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <IconChevronLeft className="size-4" />上一页
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                下一页<IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
