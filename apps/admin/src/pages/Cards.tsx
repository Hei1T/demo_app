import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { api, type AdminCard } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, CreditCard, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function CardsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<AdminCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const size = 20;

  useEffect(() => {
    setLoading(true);
    api
      .cards(page, size)
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [page]);

  const pages = Math.max(1, Math.ceil(total / size));

  function copy(code: string) {
    navigator.clipboard.writeText(code).then(
      () => toast.success(`已复制 ${code}`),
      () => toast.error('复制失败'),
    );
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight">名片</h1>
          <p className="mt-1 text-xs text-muted-foreground">共 {total} 张</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CreditCard size={18} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="overflow-hidden border-border/60">
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
                  <TableHead>短码</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>模板</TableHead>
                  <TableHead>所有者</TableHead>
                  <TableHead className="text-right">打开量</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/40"
                    onClick={() => nav(`/cards/${c.code}`)}
                  >
                    <TableCell>
                      <button
                        onClick={() => copy(c.code)}
                        className="group flex items-center gap-1.5 font-mono text-[12px] text-primary"
                      >
                        {c.code}
                        <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                      </button>
                    </TableCell>
                    <TableCell className="text-[13px]">{c.name || '—'}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/15 text-primary hover:bg-primary/20">{c.templateSlug}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{c.ownerEmail}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.opens}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString('zh-CN')}
                    </TableCell>
                  </motion.tr>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                      暂无名片
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </motion.div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          第 {page} 页 / 共 {pages} 页
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-4" />上一页
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            下一页<ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
