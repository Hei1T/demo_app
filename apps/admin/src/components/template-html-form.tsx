import { useState } from 'react';
import { api, API_BASE } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { IconUpload, IconCode, IconEye } from '@tabler/icons-react';
import { toast } from 'sonner';

const SAMPLE_BODY = `<div class="wrap">
  <div class="hero">
    <div class="av">{{initial}}</div>
    <h1>{{name}}</h1>
    <p>{{role}} · {{org}}</p>
  </div>
  <div class="acts">
    <a class="btn main" href="tel:{{phoneRaw}}">打电话</a>
    <a class="btn" href="mailto:{{email}}">发邮件</a>
  </div>
  <footer>{{cardCode}}</footer>
</div>`;

const SAMPLE_CSS = `.wrap{max-width:440px;margin:0 auto;padding:40px 22px;background:#0e1015;color:#f4f5f7;min-height:100vh}
.av{width:96px;height:96px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#1a1406;background:linear-gradient(135deg,#f0c674,#c9a227)}
h1{font-size:30px;margin:0 0 8px;text-align:center}
.hero p{text-align:center;color:#98a1b3;margin:0;font-size:14px}
.acts{display:flex;gap:12px;margin:24px 0}
.btn{flex:1;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700;background:rgba(255,255,255,.06);color:#f4f5f7}
.btn.main{background:linear-gradient(135deg,#f0c674,#c9a227);color:#1a1406}
footer{text-align:center;color:#5b6478;font-size:11px;margin-top:30px}`;

export function TemplateHtmlForm({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [bodyHtml, setBodyHtml] = useState(SAMPLE_BODY);
  const [cssText, setCssText] = useState(SAMPLE_CSS);
  const [titleTmpl, setTitleTmpl] = useState('{{name}} · 数字名片');
  const [themeColor, setThemeColor] = useState('#0e1015');
  const [preview, setPreview] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function readFile(file: File, setter: (v: string) => void) {
    const text = await file.text();
    setter(text);
    toast.success(`已读取 ${file.name}`);
  }

  async function doPreview() {
    try {
      const r = await api.previewTemplate({
        bodyHtml,
        cssText,
        title: titleTmpl,
        themeColor,
      });
      setPreview(r.html);
      setWarnings(r.warnings);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '预览失败');
    }
  }

  async function save() {
    if (!slug.trim() || !name.trim()) {
      toast.error('slug 和名称必填');
      return;
    }
    setBusy(true);
    try {
      await api.createTemplate({
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        tier,
        bodyHtml,
        cssText,
        headConfig: { title: titleTmpl, themeColor },
      });
      toast.success('模板已发布');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="极光" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">slug</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="aurora"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">档位</Label>
          <Select value={tier} onValueChange={(v) => setTier(v as 'free' | 'pro')}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">免费</SelectItem>
              <SelectItem value="pro">PRO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="html">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="html" className="gap-1.5 text-xs">
            <IconCode className="size-3.5" />HTML
          </TabsTrigger>
          <TabsTrigger value="css" className="gap-1.5 text-xs">
            <IconCode className="size-3.5" />CSS
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5 text-xs">
            <IconEye className="size-3.5" />预览
          </TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">
              只填 &lt;body&gt; 里的内容 · 支持 {'{{name}} {{role}} {{phone}} {{phoneRaw}} {{email}} {{org}} {{addr}} {{initial}} {{cardCode}} {{links}}'}
            </Label>
            <label className="cursor-pointer text-[11px] text-primary hover:underline">
              <IconUpload className="mr-1 inline size-3" />
              选择文件
              <input
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], setBodyHtml)}
              />
            </label>
          </div>
          <Textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            className="h-52 font-mono text-[11.5px]"
          />
        </TabsContent>

        <TabsContent value="css" className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">
              会被塞进 &lt;head&gt; 的 &lt;style&gt;
            </Label>
            <label className="cursor-pointer text-[11px] text-primary hover:underline">
              <IconUpload className="mr-1 inline size-3" />
              选择文件
              <input
                type="file"
                accept=".css"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], setCssText)}
              />
            </label>
          </div>
          <Textarea
            value={cssText}
            onChange={(e) => setCssText(e.target.value)}
            className="h-52 font-mono text-[11.5px]"
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {warnings.map((w) => (
                <Badge key={w} variant="secondary" className="text-[10px] text-amber-500">
                  {w}
                </Badge>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={doPreview}>
              <IconEye className="size-3.5" />
              渲染预览
            </Button>
          </div>
          <div className="h-[380px] overflow-hidden rounded-lg border bg-muted/20">
            {preview ? (
              <iframe
                srcDoc={preview}
                title="preview"
                className="size-full border-0"
                sandbox=""
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                点「渲染预览」查看效果
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">&lt;title&gt; 模板</Label>
          <Input
            value={titleTmpl}
            onChange={(e) => setTitleTmpl(e.target.value)}
            className="font-mono text-[11px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">theme-color</Label>
          <Input
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            className="font-mono text-[11px]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={doPreview}>
          <IconEye className="size-4" />
          预览
        </Button>
        <Button onClick={save} disabled={busy}>
          {busy ? '发布中…' : '发布模板'}
        </Button>
      </div>
    </div>
  );
}
