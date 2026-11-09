import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api, API_BASE, type InvalidLinks } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { IconAlertTriangle, IconExternalLink, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Links() {
  const [data, setData] = useState<InvalidLinks | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await api.invalidLinks());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const s = data?.summary;

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 lg:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <IconAlertTriangle className="size-5 text-amber-500" />
            失效短链
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            用户手里的 NFC 卡扫开已经看不到内容的名片
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <IconRefresh className="size-4" />
          刷新
        </Button>
      </div>

      {/* 汇总 */}
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 lg:px-6">
        {loading || !s ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  合计失效
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums">{s.total}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  已停用
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums text-amber-500">
                  {s.disabled}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">扫开显示「已暂停」</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  已删除
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums text-rose-400">
                  {s.deleted}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">扫开显示 404</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 列表 */}
      <motion.div
        className="px-4 lg:px-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">失效明细</CardTitle>
            <CardDescription className="text-[11.5px]">
              短码永久保留、永不复用，旧卡不会扫到别人的名片
            </CardDescription>
          </CardHeader>
          {loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>短码</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>所有者</TableHead>
                  <TableHead>模板</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>最后访问</TableHead>
                  <TableHead className="text-right">事件数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((it) => (
                  <TableRow key={it.code} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-[12px] text-primary">
                      {it.code}
                    </TableCell>
                    <TableCell className="text-[13px]">{it.name || '—'}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {it.ownerEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {it.templateSlug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          it.reason === '已删除'
                            ? 'border-rose-500/40 text-[10px] text-rose-400'
                            : 'border-amber-500/40 text-[10px] text-amber-500'
                        }
                      >
                        {it.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {it.lastViewAt
                        ? new Date(it.lastViewAt).toLocaleString('zh-CN')
                        : '从未访问'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{it.totalEvents}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-[11px]"
                        onClick={() =>
                          window.open(`${API_BASE}${it.link}`, '_blank', 'noopener')
                        }
                      >
                        <IconExternalLink className="size-3.5" />
                        验证
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.items.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                      没有失效的短链，所有卡片都在正常服务
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
