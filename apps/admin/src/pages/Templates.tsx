import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api, type AdminTemplate, API_BASE } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconPalette, IconExternalLink, IconRefresh, IconPlus, IconCopy,
  IconTrash, IconPencil, IconEye, IconEyeOff, IconCode,
} from '@tabler/icons-react';
import { TemplateHtmlForm } from '@/components/template-html-form';
import { toast } from 'sonner';

const COLOR_FIELDS: { key: string; label: string }[] = [
  { key: 'bg', label: '页面底色' },
  { key: 'surface', label: '卡片底色' },
  { key: 'coverFrom', label: '封面起' },
  { key: 'coverTo', label: '封面止' },
  { key: 'text', label: '主文字' },
  { key: 'muted', label: '次文字' },
  { key: 'accentFrom', label: '主色起' },
  { key: 'accentTo', label: '主色止' },
  { key: 'accentText', label: '按钮文字' },
  { key: 'avatarFrom', label: '头像起' },
  { key: 'avatarTo', label: '头像止' },
  { key: 'avatarText', label: '头像文字' },
];

const DEFAULT_TOKENS: Record<string, string> = {
  bg: '#07080b', surface: '#0b0d12', coverFrom: '#1c2333', coverTo: '#0b0d12',
  text: '#f2f4f8', muted: '#98a1b3', faint: '#646d80',
  line: 'rgba(255,255,255,.085)', card: 'rgba(255,255,255,.05)',
  accentFrom: '#e8c86a', accentTo: '#c9a227', accentText: '#1a1406',
  avatarFrom: '#222c42', avatarTo: '#11151f', avatarText: '#f0d68a',
  grid: 'rgba(255,255,255,.04)', glow: 'rgba(232,200,106,.30)',
};

function ColorRow({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={isHex ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="size-8 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] text-muted-foreground">{label}</div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 px-2 font-mono text-[11px]"
        />
      </div>
    </div>
  );
}

function TemplateForm({
  initial, submitText, onSubmit,
}: {
  initial?: { slug: string; name: string; tier: 'free' | 'pro'; tokens: Record<string, string | number> };
  submitText: string;
  onSubmit: (v: {
    slug: string; name: string; tier: 'free' | 'pro'; tokens: Record<string, string | number>;
  }) => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [tier, setTier] = useState<'free' | 'pro'>(initial?.tier ?? 'free');
  const [tokens, setTokens] = useState<Record<string, string>>({
    ...DEFAULT_TOKENS,
    ...(initial?.tokens as Record<string, string> | undefined),
  });
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">模板名</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="余烬" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">slug（唯一标识）</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="ember"
            disabled={!!initial}
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">档位</Label>
        <Select value={tier} onValueChange={(v) => setTier(v as 'free' | 'pro')}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">免费</SelectItem>
            <SelectItem value="pro">PRO（付费）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">配色</div>
        <div className="grid max-h-[320px] grid-cols-2 gap-x-4 gap-y-2.5 overflow-y-auto pr-1">
          {COLOR_FIELDS.map((f) => (
            <ColorRow
              key={f.key}
              label={f.label}
              value={tokens[f.key] ?? '#000000'}
              onChange={(v) => setTokens((t) => ({ ...t, [f.key]: v }))}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          disabled={busy}
          onClick={async () => {
            if (!name.trim() || !slug.trim()) {
              toast.error('名称和 slug 必填');
              return;
            }
            setBusy(true);
            try {
              await onSubmit({ slug: slug.trim(), name: name.trim(), tier, tokens });
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? '提交中…' : submitText}
        </Button>
      </div>
    </div>
  );
}

export default function Templates() {
  const [items, setItems] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openHtml, setOpenHtml] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminTemplate | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.templates();
      setItems(r.templates);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(t: AdminTemplate) {
    try {
      await api.updateTemplate(t.slug, { enabled: !t.enabled });
      setItems((prev) => prev.map((x) => (x.slug === t.slug ? { ...x, enabled: !x.enabled } : x)));
      toast.success(`${t.name} 已${t.enabled ? '停用' : '启用'}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败');
    }
  }

  async function remove(t: AdminTemplate) {
    if (!confirm(`删除模板「${t.name}」？此操作不可恢复。`)) return;
    try {
      await api.deleteTemplate(t.slug);
      toast.success('已删除');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }

  async function duplicate(t: AdminTemplate) {
    try {
      const r = await api.duplicateTemplate(t.slug);
      toast.success(`已复制为 ${r.slug}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '复制失败');
    }
  }

  const shown = onlyEnabled ? items.filter((t) => t.enabled) : items;
  const totalUsage = items.reduce((s, t) => s + t.usage, 0);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 lg:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <IconPalette className="size-5 text-primary" />
              模板管理
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              共 {items.length} 套 · 累计使用 {totalUsage} 张名片 · 停用后新用户不可选
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch id="only-enabled" checked={onlyEnabled} onCheckedChange={setOnlyEnabled} />
              <Label htmlFor="only-enabled" className="text-xs text-muted-foreground">
                只看启用
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <IconRefresh className="size-4" />
              刷新
            </Button>
            <Dialog open={openHtml} onOpenChange={setOpenHtml}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  <IconCode className="size-4" />
                  上传 HTML
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>上传 HTML 模板</DialogTitle>
                  <DialogDescription>
                    只填 body 内容 + CSS，head 由后端自动拼接
                  </DialogDescription>
                </DialogHeader>
                <TemplateHtmlForm
                  onSaved={() => {
                    setOpenHtml(false);
                    load();
                  }}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <IconPlus className="size-4" />
                  新建模板
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>新建模板</DialogTitle>
                  <DialogDescription>
                    创建后立即生效，用户可在 App 中选择
                  </DialogDescription>
                </DialogHeader>
                <TemplateForm
                  submitText="创建"
                  onSubmit={async (v) => {
                    await api.createTemplate(v);
                    toast.success('模板已创建');
                    setOpenCreate(false);
                    load();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3 lg:px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3 lg:px-6">
            {shown.map((t, i) => (
              <motion.div
                key={t.slug}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <Card className="overflow-hidden border-border/50 p-0">
                  <div className="relative h-[320px] overflow-hidden border-b bg-muted/30">
                    <iframe
                      src={`${API_BASE}/preview/${t.slug}`}
                      title={t.name}
                      loading="lazy"
                      scrolling="no"
                      className="pointer-events-none absolute left-1/2 top-0 h-[640px] w-[400px] origin-top -translate-x-1/2 scale-[0.5] border-0"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <Badge className="bg-black/50 text-[10px] backdrop-blur">{t.slug}</Badge>
                      <Badge
                        variant={t.tier === 'pro' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {t.tier === 'pro' ? 'PRO' : '免费'}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-[15px]">{t.name}</CardTitle>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          v{t.version} · 使用 {t.usage} 张
                        </p>
                      </div>
                      <Switch checked={t.enabled} onCheckedChange={() => toggle(t)} />
                    </div>
                  </CardHeader>

                  <CardContent className="flex items-center gap-1.5 p-4 pt-0">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a
                        href={`${API_BASE}/preview/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconExternalLink className="size-3.5" />
                        预览
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title="编辑配色"
                      onClick={() => setEditTarget(t)}
                    >
                      <IconPencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title="复制"
                      onClick={() => duplicate(t)}
                    >
                      <IconCopy className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      title="删除"
                      onClick={() => remove(t)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && shown.length === 0 && (
          <div className="py-20 text-center text-sm text-muted-foreground">没有模板</div>
        )}

        {/* 编辑配色 */}
        <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>编辑「{editTarget?.name}」</DialogTitle>
              <DialogDescription>改配色会自动升版本号，已写出的卡立即生效</DialogDescription>
            </DialogHeader>
            {editTarget && (
              <TemplateForm
                initial={{
                  slug: editTarget.slug,
                  name: editTarget.name,
                  tier: editTarget.tier,
                  tokens: editTarget.tokens as Record<string, string>,
                }}
                submitText="保存"
                onSubmit={async (v) => {
                  await api.updateTemplate(editTarget.slug, {
                    name: v.name,
                    tier: v.tier,
                    tokens: v.tokens,
                  });
                  toast.success('已保存，版本 +1');
                  setEditTarget(null);
                  load();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
