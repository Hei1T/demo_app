import { Injectable } from '@nestjs/common';
type RenderCard = {
  code: string;
  profile: {
    name: string;
    role?: string;
    org?: string;
    phone?: string;
    email?: string;
    addr?: string;
    wechat?: string;
  bio?: string;
  website?: string;
  wechatQr?: string;
  languages?: string[];
  links?: { platform: string; value: string; label?: string }[];
  linksLegacy?: { label: string; url: string }[];
  };
  templateSlug: string;
};
import type { Template } from '../templates/catalog.js';
import { TemplatesService } from '../templates/templates.service.js';
import { renderPlaceholders, assembleDocument } from '../templates/custom-render.js';
import { findPlatform, resolveUrl, SOCIAL_CSS } from '../templates/platforms.js';

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

@Injectable()
export class RenderService {
  constructor(private readonly templates: TemplatesService) {}

  renderCard(card: RenderCard): string {
    // ① 自定义 HTML 模板（后台上传的 body 片段）优先
    const custom = this.templates.getCachedEntity(card.templateSlug);
    if (custom?.enabled && custom.bodyHtml?.trim()) {
      const body = renderPlaceholders(custom.bodyHtml, card.profile, card.code);
      const titleTmpl = custom.headConfig?.title;
      const title = titleTmpl
        ? titleTmpl.replace(/\{\{\s*name\s*\}\}/g, card.profile.name ?? '')
        : `${card.profile.name} · 数字名片`;
      return assembleDocument({
        bodyHtml: body,
        cssText: custom.cssText ?? '',
        title,
        themeColor: custom.headConfig?.themeColor,
        extraMeta: custom.headConfig?.extraMeta,
        cardCode: card.code,
      });
    }

    // ② 内置模板（靠 tokens 生成）
    const tpl: Template = this.templates.getForRender(card.templateSlug);
    const p = card.profile;
    const t = tpl.tokens;
    const initial = (p.name || '?').trim().slice(0, 1) || '?';

    const tel = p.phone ? p.phone.replace(/[^\d+]/g, '') : '';
    const chips: string[] = [];
    if (p.addr) chips.push(`<span class="chip">⌖ ${esc(p.addr)}</span>`);
    if (p.org) chips.push(`<span class="chip">◎ ${esc(p.org)}</span>`);

    const contacts: string[] = [];
    if (p.phone) {
      contacts.push(`<a class="row" href="tel:${esc(tel)}">
        <span class="ic">☎</span>
        <span class="tx"><i>手机</i><b>${esc(p.phone)}</b></span>
        <span class="go">拨打</span></a>`);
    }
    if (p.email) {
      contacts.push(`<a class="row" href="mailto:${esc(p.email)}">
        <span class="ic">✉</span>
        <span class="tx"><i>邮箱</i><b>${esc(p.email)}</b></span>
        <span class="go">写邮件</span></a>`);
    }
    if (p.addr) {
      contacts.push(`<a class="row" href="https://uri.amap.com/search?keyword=${encodeURIComponent(p.addr)}" target="_blank" rel="noopener">
        <span class="ic">➤</span>
        <span class="tx"><i>地址</i><b>${esc(p.addr)}</b></span>
        <span class="go">导航</span></a>`);
    }

    // 社交平台：国内 + 国际，用品牌色胶囊
    const socialLinks = (p.links ?? []).filter((l) => l && l.platform && l.value);
    const social = socialLinks.length
      ? socialLinks
          .slice(0, 12)
          .map((l) => {
            const pl = findPlatform(l.platform);
            const url = resolveUrl(l.platform, l.value);
            if (!url) return '';
            return `<a class="soc" href="${esc(url)}" target="_blank" rel="noopener">
          <span class="soc-dot" style="background:${pl?.color ?? '#888'}">${esc(pl?.short ?? '·')}</span>
          <span class="soc-name">${esc(l.label || pl?.name || l.platform)}</span></a>`;
          })
          .filter(Boolean)
          .join('')
      : (p.linksLegacy ?? [])
          .slice(0, 6)
          .map(
            (l) => `<a class="soc" href="${esc(l.url)}" target="_blank" rel="noopener">
          <span class="soc-dot" style="background:#888">·</span>
          <span class="soc-name">${esc(l.label)}</span></a>`,
          )
          .join('');

    const wechatBlock = p.wechat
      ? /^https?:/i.test(p.wechat)
        ? `<img class="qr" src="${esc(p.wechat)}" alt="微信二维码">`
        : `<div class="qr ph">微信<br>${esc(p.wechat)}</div>`
      : `<div class="qr ph">微信<br>二维码</div>`;

    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet">
<meta name="baiduspider" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="${esc(t.surface)}">
<title>${esc(p.name)} · 数字名片</title>
<script src="/t.js" data-code="${esc(card.code)}" defer></script>
<style>
:root{
  --bg:${t.bg};--surface:${t.surface};--c1:${t.coverFrom};--c2:${t.coverTo};
  --text:${t.text};--muted:${t.muted};--faint:${t.faint};
  --line:${t.line};--card:${t.card};
  --acc1:${t.accentFrom};--acc2:${t.accentTo};--accText:${t.accentText};
  --av1:${t.avatarFrom};--av2:${t.avatarTo};--avText:${t.avatarText};
  --r:${t.radius}px;--grid:${t.grid};--glow:${t.glow};
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
body{display:flex;justify-content:center;align-items:flex-start;min-height:100vh}
.page{width:100%;max-width:440px;background:var(--surface);min-height:100vh;
  padding-bottom:32px;position:relative}

.cover{height:200px;position:relative;overflow:hidden;
  background:radial-gradient(130% 130% at 18% 0%,var(--c1) 0%,var(--c2) 55%,var(--surface) 100%)}
.cover::before{content:"";position:absolute;inset:0;
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),
                   linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:28px 28px;
  -webkit-mask-image:radial-gradient(circle at 50% 25%,#000 0%,transparent 76%);
  mask-image:radial-gradient(circle at 50% 25%,#000 0%,transparent 76%)}
.cover::after{content:"";position:absolute;width:300px;height:300px;top:-140px;right:-100px;
  border-radius:50%;background:radial-gradient(circle,var(--glow) 0%,transparent 68%)}
.brand{position:absolute;top:20px;left:22px;display:flex;align-items:center;gap:7px;
  font-size:11.5px;letter-spacing:.16em;color:var(--muted);z-index:2}
.pulse{width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 9px #4ade80}

.av-wrap{display:flex;justify-content:center;margin-top:-56px;position:relative;z-index:3}
.av{width:112px;height:112px;border-radius:50%;border:4px solid var(--surface);
  background:linear-gradient(150deg,var(--av1),var(--av2));
  display:flex;align-items:center;justify-content:center;
  font-size:40px;font-weight:800;letter-spacing:.04em;color:var(--avText);
  box-shadow:0 0 0 1px var(--line),0 22px 48px rgba(0,0,0,.22)}

.head{text-align:center;padding:16px 26px 0}
.name{font-size:31px;font-weight:800;margin:0 0 8px;line-height:1.15}
.role{font-size:14px;color:var(--muted);line-height:1.6;margin:0}
.chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px}
.chip{padding:6px 13px;border-radius:20px;background:var(--card);border:1px solid var(--line);
  font-size:12px;color:var(--muted)}

.ops{display:flex;gap:11px;padding:22px 22px 0}
.op{flex:1;height:54px;border-radius:var(--r);display:flex;align-items:center;justify-content:center;
  gap:8px;font-size:15px;font-weight:650;text-decoration:none;border:1px solid var(--line);
  background:var(--card);color:var(--text)}
.op.main{background:linear-gradient(135deg,var(--acc1),var(--acc2));color:var(--accText);
  border:0;box-shadow:0 12px 30px var(--glow)}

.sec{padding:24px 22px 0}
.lbl{font-size:10.5px;letter-spacing:.2em;color:var(--faint);font-weight:700;margin:0 0 11px}
.tileBox{display:flex;align-items:center;gap:15px;padding:16px;border-radius:calc(var(--r) + 2px);
  background:linear-gradient(180deg,var(--card),transparent);border:1px solid var(--line)}
.qr{width:108px;height:108px;border-radius:11px;background:#fff;padding:6px;flex:0 0 auto;
  object-fit:contain;box-shadow:0 6px 18px rgba(0,0,0,.14)}
.qr.ph{display:flex;align-items:center;justify-content:center;text-align:center;
  font-size:11px;line-height:1.4;color:#8a8a8a;font-weight:600}
.tileTxt b{display:block;font-size:15px;margin-bottom:6px}
.tileTxt p{margin:0;font-size:12px;color:var(--muted);line-height:1.65}

.rows{display:flex;flex-direction:column;gap:9px}
.row{display:flex;align-items:center;gap:13px;padding:14px 15px;
  border-radius:calc(var(--r) - 2px);background:var(--card);border:1px solid var(--line);
  text-decoration:none;color:var(--text)}
.ic{width:34px;height:34px;border-radius:10px;background:var(--surface);
  display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:15px;opacity:.85}
.tx{flex:1;min-width:0}
.tx i{display:block;font-style:normal;font-size:10.5px;letter-spacing:.1em;
  color:var(--faint);margin-bottom:3px}
.tx b{display:block;font-size:13.5px;font-weight:500;word-break:break-all}
.go{font-size:11.5px;color:var(--acc1);font-weight:700;flex:0 0 auto}

.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.soc-legacy{aspect-ratio:1/1;border-radius:calc(var(--r) - 1px);display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:7px;text-decoration:none;
  background:var(--card);border:1px solid var(--line);color:var(--muted);font-size:10.5px}
.dot{width:22px;height:22px;border-radius:50%;
  background:linear-gradient(135deg,var(--acc1),var(--acc2));opacity:.85}

.save{display:flex;align-items:center;justify-content:center;gap:9px;margin:24px 22px 0;
  height:54px;border-radius:var(--r);font-size:15px;font-weight:700;text-decoration:none;
  color:var(--text);background:var(--card);border:1px solid var(--line)}
footer{text-align:center;padding:28px 22px 0;font-size:10.5px;color:var(--faint);line-height:1.9}
footer b{color:var(--muted);font-weight:600}
${SOCIAL_CSS}
</style>
</head>
<body>
<div class="page">
  <div class="cover"><div class="brand"><span class="pulse"></span> NFC · 数字名片</div></div>
  <div class="av-wrap"><div class="av">${esc(initial)}</div></div>
  <div class="head">
    <h1 class="name">${esc(p.name)}</h1>
    ${p.role ? `<p class="role">${esc(p.role)}</p>` : ''}
    ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
  </div>

  <div class="ops">
    ${p.phone ? `<a class="op main" href="tel:${esc(tel)}">☎ 打电话</a>` : ''}
    ${p.email ? `<a class="op" href="mailto:${esc(p.email)}">✉ 发邮件</a>` : ''}
  </div>

  <div class="sec">
    <p class="lbl">WECHAT · 微信</p>
    <div class="tileBox">
      ${wechatBlock}
      <div class="tileTxt">
        <b>长按识别，加我微信</b>
        <p>备注「名片」优先通过<br>工作日 2 小时内回复</p>
      </div>
    </div>
  </div>

  ${contacts.length ? `<div class="sec">
    <p class="lbl">CONTACT · 联系方式</p>
    <div class="rows">${contacts.join('')}</div>
  </div>` : ''}

  ${social ? `<div class="sec">
    <p class="lbl">FIND ME · 找到我</p>
    <div class="soc-grid">${social}</div>
  </div>` : ''}

  <a class="save" href="/u/${esc(card.code)}/vcf">↓ 保存到通讯录</a>

  <footer>卡号 ${esc(card.code)}<br><b>NFC 数字名片</b></footer>
</div>
</body>
</html>`;
  }

  renderNotFound(): string {
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>名片不存在</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#07080b;color:#eef1f6;font-family:-apple-system,"PingFang SC",sans-serif;text-align:center}
h1{font-size:22px;margin:0 0 10px}p{color:#8b93a7;font-size:13px;margin:0}</style></head>
<body><div><h1>这张名片不存在</h1><p>可能已被删除，或者卡号有误</p></div></body></html>`;
  }

  renderVcf(card: RenderCard): string {
    const p = card.profile;
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${p.name};;;;`,
      `FN:${p.name}`,
    ];
    if (p.org) lines.push(`ORG:${p.org}`);
    if (p.role) lines.push(`TITLE:${p.role}`);
    if (p.phone) lines.push(`TEL;TYPE=CELL:${p.phone}`);
    if (p.email) lines.push(`EMAIL:${p.email}`);
    if (p.addr) lines.push(`ADR;TYPE=WORK:;;${p.addr};;;;`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  /** 名片被主人停用时的友好页面（用户手里的 NFC 卡没坏，只是暂时关闭） */
  renderDisabled(name: string): string {
    const who = esc(name || '这位');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<title>名片已暂停</title>
<style>
html,body{margin:0;height:100%;background:#0A0A0A;color:#FAFAFA;
  font-family:-apple-system,"PingFang SC",system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;-webkit-font-smoothing:antialiased}
.box{text-align:center;padding:0 32px;max-width:360px}
.ring{width:76px;height:76px;border-radius:50%;border:1px solid #2A2A2A;
  display:flex;align-items:center;justify-content:center;margin:0 auto 28px}
.dot{width:10px;height:10px;border-radius:50%;background:#3A3A3A}
h1{font-size:22px;font-weight:300;letter-spacing:3px;margin:0 0 14px}
p{font-size:14px;color:#9A9A9A;line-height:1.8;margin:0}
</style></head><body>
<div class="box">
  <div class="ring"><div class="dot"></div></div>
  <h1>名片已暂停</h1>
  <p>${who}的这张名片暂时关闭了<br>可以联系本人获取最新名片</p>
</div>
</body></html>`;
  }
  /** 名片已被主人作废：任何入口都看不到内容 */
  renderRevoked(name: string): string {
    const who = esc(name || '这张名片');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<title>名片已作废</title>
<style>
html,body{margin:0;height:100%;background:#0A0A0A;color:#FAFAFA;
  font-family:-apple-system,"PingFang SC",system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;-webkit-font-smoothing:antialiased}
.box{text-align:center;padding:0 32px;max-width:360px}
.ring{width:76px;height:76px;border-radius:50%;border:1px solid #2A2A2A;
  display:flex;align-items:center;justify-content:center;margin:0 auto 28px}
.bar{width:24px;height:2px;background:#4A4A4A;border-radius:1px}
h1{font-size:22px;font-weight:300;letter-spacing:3px;margin:0 0 14px}
p{font-size:14px;color:#9A9A9A;line-height:1.8;margin:0}
</style></head><body>
<div class="box">
  <div class="ring"><div class="bar"></div></div>
  <h1>名片已作废</h1>
  <p>${who}已经将这张名片作废<br>如需联系，请通过其他方式获取最新信息</p>
</div>
</body></html>`;
  }}
