import { useEffect, useState } from 'react';
import { api, API_BASE } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { IconSettings } from '@tabler/icons-react';

export default function Settings() {
  const [me, setMe] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
  }, []);

  const rows: { label: string; value: string; hint?: string }[] = [
    { label: 'API 地址', value: API_BASE, hint: '前端请求的后端地址' },
    { label: '管理端地址', value: window.location.origin, hint: '当前后台地址' },
    { label: '数据库', value: 'PostgreSQL · 127.0.0.1:55433', hint: '本机实例，库名 nfc_saas' },
    { label: '埋点存储', value: 'PG events 表', hint: '暂未引入 ClickHouse' },
    { label: '模板存储', value: 'templates.bodyHtml + cssText', hint: 'head 由后端拼接' },
    { label: '防索引', value: 'X-Robots-Tag + robots.txt + meta', hint: '三层防护' },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <IconSettings className="size-5 text-primary" />
          设置
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">系统信息（只读）</p>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">当前管理员</CardTitle>
            <CardDescription className="text-[11.5px]">登录身份</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-[12.5px]">
            {!me ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">邮箱</span>
                  <span className="font-mono">{me.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">角色</span>
                  <Badge className="bg-primary/15 text-primary">{me.role}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">系统信息</CardTitle>
            <CardDescription className="text-[11.5px]">部署与配置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((r, i) => (
              <div key={r.label}>
                {i > 0 && <Separator className="mb-3 opacity-50" />}
                <div className="flex items-baseline justify-between gap-3">
                  <span className="shrink-0 text-[12px] text-muted-foreground">{r.label}</span>
                  <span className="truncate font-mono text-[11.5px]">{r.value}</span>
                </div>
                {r.hint && <div className="mt-1 text-[10.5px] text-muted-foreground/70">{r.hint}</div>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="border-border/50 bg-gradient-to-t from-primary/5 to-card">
          <CardContent className="p-4 text-[12px] text-muted-foreground">
            改密码、找回密码、操作日志、数据导出等能力还在开发中。
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
