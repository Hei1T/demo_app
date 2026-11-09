/**
 * 自定义 HTML 模板渲染器
 *
 * 模板 = <body> 内片段 + CSS，后端负责拼 <head>。
 *
 * 支持占位符：
 *   {{name}} {{role}} {{org}} {{phone}} {{email}} {{addr}}
 *   {{phoneRaw}}   纯数字电话（给 tel: 用）
 *   {{wechatQr}}   微信二维码（profile.wechat 是 URL 时）
 *   {{cardCode}}   卡号
 *   {{initial}}    姓名首字
 *   {{links}} / {{social}}  社交平台胶囊（国内+国际）
 *   {{bio}} {{website}}
 *   {{link:领英}}  按 label 取链接 URL
 */

import { renderSocialChips, SOCIAL_CSS } from './platforms.js';

export type RenderProfile = {
  name: string;
  role?: string;
  org?: string;
  bio?: string;
  phone?: string;
  email?: string;
  addr?: string;
  website?: string;
  wechat?: string;
  wechatQr?: string;
  avatar?: string;
  languages?: string[];
  links?: { platform: string; value: string; label?: string }[];
  linksLegacy?: { label: string; url: string }[];
};

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/** 剥离危险内容：脚本、内联事件、javascript:、iframe、外部样式 */
export function sanitizeTemplateHtml(html: string): { html: string; warnings: string[] } {
  const warnings: string[] = [];
  let out = html;

  const before = out.length;
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  if (out.length !== before) warnings.push('已移除 <script>');

  const b2 = out.length;
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  if (out.length !== b2) warnings.push('已移除内联事件属性 (on*)');

  const b3 = out.length;
  out = out.replace(/javascript\s*:/gi, '');
  if (out.length !== b3) warnings.push('已移除 javascript: 协议');

  const b4 = out.length;
  out = out.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '');
  if (out.length !== b4) warnings.push('已移除 <iframe>');

  const b5 = out.length;
  out = out.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '');
  if (out.length !== b5) warnings.push('已移除外部样式 <link>');

  // 禁止固定定位遮挡（防钓鱼浮层）
  out = out.replace(/position\s*:\s*fixed/gi, 'position:relative');

  return { html: out, warnings };
}

/** 用资料替换占位符 */
export function renderPlaceholders(bodyHtml: string, profile: RenderProfile, cardCode: string): string {
  const tel = (profile.phone ?? '').replace(/[^\d+]/g, '');
  const initial = (profile.name || '?').trim().slice(0, 1) || '?';

  const socialHtml = renderSocialChips(profile.links, esc);
  const linksHtml = socialHtml || (profile.linksLegacy ?? [])
    .slice(0, 6)
    .map(
      (l) =>
        `<a class="tpl-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`,
    )
    .join('');

  const wechatQr =
    profile.wechat && /^https?:/i.test(profile.wechat)
      ? esc(profile.wechat)
      : '';

  const map: Record<string, string> = {
    name: esc(profile.name),
    role: esc(profile.role),
    org: esc(profile.org),
    phone: esc(profile.phone),
    phoneRaw: esc(tel),
    email: esc(profile.email),
    addr: esc(profile.addr),
    wechatQr,
    cardCode: esc(cardCode),
    initial: esc(initial),
    links: linksHtml,
    social: socialHtml,
    bio: esc(profile.bio),
    website: esc(profile.website),
  };

  let out = bodyHtml.replace(/\{\{\s*([a-zA-Z:]+)\s*\}\}/g, (m, key: string) => {
    if (key.startsWith('link:')) {
      const label = key.slice(5);
      const hit = (profile.linksLegacy ?? []).find((l) => l.label === label);
      return esc(hit?.url ?? '#');
    }
    return map[key] ?? '';
  });

  // 微信二维码：如果模板里写了 <img src="{{wechatQr}}">，没二维码时整张图删掉
  if (!wechatQr) {
    out = out.replace(/<img\b[^>]*src=["']\s*["'][^>]*>/gi, '');
  }

  return out;
}

/** 拼装完整 HTML 文档 */
export function assembleDocument(opts: {
  bodyHtml: string;
  cssText: string;
  title: string;
  themeColor?: string;
  extraMeta?: { name: string; content: string }[];
  cardCode?: string;
}): string {
  const { bodyHtml, cssText, title, themeColor, extraMeta, cardCode } = opts;
  const extra = (extraMeta ?? [])
    .map((m) => `<meta name="${esc(m.name)}" content="${esc(m.content)}">`)
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet">
<meta name="baiduspider" content="noindex,nofollow,noarchive">
${themeColor ? `<meta name="theme-color" content="${esc(themeColor)}">` : ''}
${extra}
<title>${esc(title)}</title>
<script src="/t.js" data-code="${esc(cardCode ?? '')}" defer></script>
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;
       background:var(--c-bg,#0b0d12);color:var(--c-text,#f2f4f8)}
  img{max-width:100%;display:block}
  a{color:inherit}
${cssText}
${SOCIAL_CSS}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}