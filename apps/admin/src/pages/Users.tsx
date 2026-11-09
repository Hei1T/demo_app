import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { api, type AdminUser } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  IconChevronLeft, IconChevronRight, IconSearch, IconUsers, IconEye, IconCategory,
} from '@tabler/icons-react';
import { toast } from 'sonner';

type Detail = Awaited<ReturnType<typeof api.userDetail>>;

const TPL_NAME: Record<string, string> = {
  noir: '黑金', paper: '极简白', wood: '原木',
  neon: '霓虹', sunset: '日落', ocean: '深海',
};

export default function UsersPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const size = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .users(page, size, q)
        .then((r) => {
          setItems(r.items);
          setTotal(r.total);
        })
        .catch((e) => toast.error(e instanceof Error ? e.message : '加载失败'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [page, q]);

  async function openDetail(u: AdminUser) {
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await api.userDetail(u.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setDetailLoading(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 lg:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <IconUsers className="size-5 text-primary" />
            用户
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">共 {total} 人 · 点击行看详情</p>
        </div>
        <div className="relative w-64">
          <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="搜索邮箱 / 姓名"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <motion.div className="px-4 lg:px-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-border/50">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>用户</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>套餐</TableHead>
                  <TableHead className="text-right">名片数</TableHead>
                  <TableHead>最近登录</TableHead>
                  <TableHead>注册时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => nav(`/users/${u.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-[11px] text-primary">
                            {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium">{u.name ?? '—'}</div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge className="bg-primary/15 text-primary hover:bg-primary/20">ADMIN</Badge>
                      ) : (
                        <Badge variant="secondary">USER</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.plan === 'pro' ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">PRO</Badge>
                      ) : (
                        <Badge variant="secondary">FREE</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{u.cards}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('zh-CN') : '—'}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {new Date(u.createdAt).toLocaleString('zh-CN')}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                      没有匹配的用户
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </motion.div>

      <div className="flex items-center justify-between px-4 text-xs text-muted-foreground lg:px-6">
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

      {/* 用户详情抽屉 */}
      <Sheet open={!!detail || detailLoading} onOpenChange={(o) => !o && (setDetail(null), setDetailLoading(false))}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{detail?.user.name ?? detail?.user.email ?? '加载中…'}</SheetTitle>
            <SheetDescription className="font-mono text-[11px]">
              {detail?.user.email}
            </SheetDescription>
          </SheetHeader>

          {detailLoading && (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          )}

          {detail && (
            <div className="mt-4 space-y-5">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={detail.user.role === 'admin' ? 'default' : 'secondary'}>
                  {detail.user.role}
                </Badge>
                <Badge className="bg-emerald-500/15 text-emerald-400" variant="outline">
                  {detail.user.plan}
                </Badge>
                <Badge variant="outline">
                  注册 {new Date(detail.user.createdAt).toLocaleDateString('zh-CN')}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                    <IconEye className="size-3" />打开量
                  </div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{detail.traffic.views}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-[10.5px] text-muted-foreground">点击量</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{detail.traffic.clicks}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-[10.5px] text-muted-foreground">CTR</div>
                  <div className="mt-1 text-xl font-bold tabular-nums text-primary">
                    {(detail.traffic.ctr * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium">
                  <IconCategory className="size-4 text-primary" />
                  名片 {detail.cards.length} 张
                </div>
                <div className="space-y-2">
                  {detail.cards.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                      还没有名片
                    </div>
                  )}
                  {detail.cards.map((c) => (
                    <div key={c.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-primary">{c.code}</span>
                          <span className="text-[13px] font-medium">{c.name || '未命名'}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {TPL_NAME[c.templateSlug] ?? c.templateSlug}
                          </Badge>
                        </div>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {c.opens} 次打开
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-2 text-[10.5px]">
                        <div>
                          <div className="text-muted-foreground">使用率</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(c.usageRate, 100)}%` }}
                              />
                            </div>
                            <span className="tabular-nums">{c.usageRate}%</span>
                          </div>
                          <div className="mt-0.5 text-[9.5px] text-muted-foreground">
                            {c.activeDays}/30 天
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">点击率</div>
                          <div className="mt-0.5 font-semibold tabular-nums">{c.ctr}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">占比</div>
                          <div className="mt-0.5 font-semibold tabular-nums">{c.share}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
