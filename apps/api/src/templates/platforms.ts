/**
 * 社交平台目录：国内 + 国际
 *
 * 设计取舍：
 *   - 用「品牌色小圆点 + 平台名」而不是品牌 Logo，避免侵权、保证一致性
 *   - 每个平台带 color / short（单字缩写）/ urlTemplate
 *   - region: cn=国内, intl=国外, both=两者都有
 */

export type PlatformRegion = 'cn' | 'intl' | 'both';

export type Platform = {
  id: string;
  /** 中文名 */
  name: string;
  /** 英文名 */
  en: string;
  /** 品牌色 */
  color: string;
  /** 短标识（渲染用，1-2 字符） */
  short: string;
  region: PlatformRegion;
  /** 从账号生成 URL 的模板，{v} 为账号 */
  urlTemplate?: string;
  /** 需要粘贴完整链接而不是账号 */
  needsUrl?: boolean;
  /** 常见前缀提示 */
  hint?: string;
};

export const PLATFORMS: Platform[] = [
  // ============ 国内 ============
  { id: 'wechat', name: '微信', en: 'WeChat', color: '#07C160', short: '微', region: 'both', hint: '微信号' },
  { id: 'wechat_channel', name: '视频号', en: 'Channels', color: '#FA9D3B', short: '视', region: 'cn', hint: '视频号名称' },
  { id: 'wecom', name: '企业微信', en: 'WeCom', color: '#2B7FFF', short: '企', region: 'cn', needsUrl: true, hint: '企业微信名片链接' },
  { id: 'wechat_qr', name: '微信二维码', en: 'WeChat QR', color: '#07C160', short: '码', region: 'both', needsUrl: true, hint: '二维码图片链接' },
  { id: 'qq', name: 'QQ', en: 'QQ', color: '#12B7F5', short: 'Q', region: 'cn', urlTemplate: 'https://wpa.qq.com/msgrd?v=3&uin={v}', hint: 'QQ 号' },
  { id: 'weibo', name: '微博', en: 'Weibo', color: '#E6162D', short: '博', region: 'cn', urlTemplate: 'https://weibo.com/{v}', hint: '微博 ID' },
  { id: 'douyin', name: '抖音', en: 'Douyin', color: '#FE2C55', short: '抖', region: 'cn', needsUrl: true, hint: '抖音主页链接' },
  { id: 'xiaohongshu', name: '小红书', en: 'RED', color: '#FF2442', short: '红', region: 'cn', needsUrl: true, hint: '小红书主页链接' },
  { id: 'zhihu', name: '知乎', en: 'Zhihu', color: '#0084FF', short: '知', region: 'cn', urlTemplate: 'https://www.zhihu.com/people/{v}', hint: '知乎用户名' },
  { id: 'bilibili', name: '哔哩哔哩', en: 'Bilibili', color: '#00A1D6', short: 'B', region: 'cn', urlTemplate: 'https://space.bilibili.com/{v}', hint: 'UID' },
  { id: 'douban', name: '豆瓣', en: 'Douban', color: '#007722', short: '豆', region: 'cn', urlTemplate: 'https://www.douban.com/people/{v}', hint: '豆瓣 ID' },
  { id: 'feishu', name: '飞书', en: 'Feishu', color: '#3370FF', short: '飞', region: 'cn', needsUrl: true, hint: '飞书名片链接' },
  { id: 'dingtalk', name: '钉钉', en: 'DingTalk', color: '#0089FF', short: '钉', region: 'cn', needsUrl: true, hint: '钉钉名片链接' },
  { id: 'alipay', name: '支付宝', en: 'Alipay', color: '#1677FF', short: '支', region: 'cn', needsUrl: true, hint: '支付宝收款/名片链接' },
  { id: 'taobao', name: '淘宝', en: 'Taobao', color: '#FF5000', short: '淘', region: 'cn', needsUrl: true, hint: '店铺链接' },
  { id: 'gitee', name: 'Gitee', en: 'Gitee', color: '#C71D23', short: 'G', region: 'cn', urlTemplate: 'https://gitee.com/{v}', hint: '用户名' },

  // ============ 国际 ============
  { id: 'linkedin', name: '领英', en: 'LinkedIn', color: '#0A66C2', short: 'in', region: 'both', urlTemplate: 'https://www.linkedin.com/in/{v}', hint: 'LinkedIn 用户名' },
  { id: 'instagram', name: 'Instagram', en: 'Instagram', color: '#E4405F', short: 'IG', region: 'intl', urlTemplate: 'https://instagram.com/{v}', hint: '用户名' },
  { id: 'x', name: 'X', en: 'X', color: '#000000', short: 'X', region: 'intl', urlTemplate: 'https://x.com/{v}', hint: '用户名' },
  { id: 'facebook', name: 'Facebook', en: 'Facebook', color: '#1877F2', short: 'f', region: 'intl', urlTemplate: 'https://facebook.com/{v}', hint: '用户名' },
  { id: 'tiktok', name: 'TikTok', en: 'TikTok', color: '#000000', short: 'TT', region: 'intl', urlTemplate: 'https://tiktok.com/@{v}', hint: '用户名' },
  { id: 'youtube', name: 'YouTube', en: 'YouTube', color: '#FF0000', short: 'YT', region: 'intl', needsUrl: true, hint: '频道链接' },
  { id: 'whatsapp', name: 'WhatsApp', en: 'WhatsApp', color: '#25D366', short: 'WA', region: 'intl', urlTemplate: 'https://wa.me/{v}', hint: '国际格式手机号，如 8613800000000' },
  { id: 'telegram', name: 'Telegram', en: 'Telegram', color: '#26A5E4', short: 'TG', region: 'intl', urlTemplate: 'https://t.me/{v}', hint: '用户名' },
  { id: 'signal', name: 'Signal', en: 'Signal', color: '#3A76F0', short: 'SG', region: 'intl', needsUrl: true, hint: 'Signal 链接' },
  { id: 'line', name: 'LINE', en: 'LINE', color: '#00C300', short: 'LN', region: 'intl', needsUrl: true, hint: 'LINE 链接' },
  { id: 'kakao', name: 'KakaoTalk', en: 'KakaoTalk', color: '#FEE500', short: 'KK', region: 'intl', needsUrl: true, hint: 'Kakao 链接' },
  { id: 'discord', name: 'Discord', en: 'Discord', color: '#5865F2', short: 'DC', region: 'intl', needsUrl: true, hint: '邀请链接' },
  { id: 'github', name: 'GitHub', en: 'GitHub', color: '#181717', short: 'GH', region: 'both', urlTemplate: 'https://github.com/{v}', hint: '用户名' },
  { id: 'dribbble', name: 'Dribbble', en: 'Dribbble', color: '#EA4C89', short: 'Dr', region: 'intl', urlTemplate: 'https://dribbble.com/{v}', hint: '用户名' },
  { id: 'behance', name: 'Behance', en: 'Behance', color: '#1769FF', short: 'Be', region: 'intl', urlTemplate: 'https://behance.net/{v}', hint: '用户名' },
  { id: 'figma', name: 'Figma', en: 'Figma', color: '#F24E1E', short: 'Fg', region: 'both', needsUrl: true, hint: '主页链接' },
  { id: 'medium', name: 'Medium', en: 'Medium', color: '#000000', short: 'M', region: 'intl', urlTemplate: 'https://medium.com/@{v}', hint: '用户名' },
  { id: 'substack', name: 'Substack', en: 'Substack', color: '#FF6719', short: 'SS', region: 'intl', urlTemplate: 'https://{v}.substack.com', hint: '子域名' },
  { id: 'threads', name: 'Threads', en: 'Threads', color: '#000000', short: '@', region: 'intl', urlTemplate: 'https://threads.net/@{v}', hint: '用户名' },
  { id: 'bluesky', name: 'Bluesky', en: 'Bluesky', color: '#0285FF', short: 'BS', region: 'intl', needsUrl: true, hint: '主页链接' },
  { id: 'mastodon', name: 'Mastodon', en: 'Mastodon', color: '#6364FF', short: 'Ma', region: 'intl', needsUrl: true, hint: '主页链接' },
  { id: 'reddit', name: 'Reddit', en: 'Reddit', color: '#FF4500', short: 'Rd', region: 'intl', urlTemplate: 'https://reddit.com/user/{v}', hint: '用户名' },
  { id: 'pinterest', name: 'Pinterest', en: 'Pinterest', color: '#BD081C', short: 'Pi', region: 'intl', urlTemplate: 'https://pinterest.com/{v}', hint: '用户名' },
  { id: 'snapchat', name: 'Snapchat', en: 'Snapchat', color: '#FFFC00', short: 'Sc', region: 'intl', urlTemplate: 'https://snapchat.com/add/{v}', hint: '用户名' },
  { id: 'twitch', name: 'Twitch', en: 'Twitch', color: '#9146FF', short: 'Tw', region: 'intl', urlTemplate: 'https://twitch.tv/{v}', hint: '用户名' },
  { id: 'spotify', name: 'Spotify', en: 'Spotify', color: '#1DB954', short: 'Sp', region: 'intl', needsUrl: true, hint: '艺人/歌单链接' },
  { id: 'soundcloud', name: 'SoundCloud', en: 'SoundCloud', color: '#FF5500', short: 'SC', region: 'intl', urlTemplate: 'https://soundcloud.com/{v}', hint: '用户名' },
  { id: 'vimeo', name: 'Vimeo', en: 'Vimeo', color: '#1AB7EA', short: 'Vi', region: 'intl', urlTemplate: 'https://vimeo.com/{v}', hint: '用户名' },
  { id: 'calendly', name: '预约', en: 'Calendly', color: '#006BFF', short: 'Ca', region: 'intl', needsUrl: true, hint: '预约链接' },
  { id: 'notion', name: 'Notion', en: 'Notion', color: '#000000', short: 'No', region: 'both', needsUrl: true, hint: '页面链接' },
  { id: 'patreon', name: 'Patreon', en: 'Patreon', color: '#FF424D', short: 'Pa', region: 'intl', needsUrl: true, hint: '主页链接' },
  { id: 'paypal', name: 'PayPal', en: 'PayPal', color: '#003087', short: 'PP', region: 'intl', needsUrl: true, hint: '收款链接' },
  { id: 'custom', name: '自定义', en: 'Custom', color: '#888888', short: '·', region: 'both', needsUrl: true, hint: '完整链接' },
];

const BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

export function findPlatform(id: string): Platform | undefined {
  return BY_ID.get(id);
}

/** 把用户填的账号/链接转成可点击 URL */
export function resolveUrl(id: string, value: string): string {
  const p = findPlatform(id);
  const v = String(value ?? '').trim();
  if (!p || !v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (p.needsUrl || !p.urlTemplate) return v;
  return p.urlTemplate.replace('{v}', encodeURIComponent(v.replace(/^@/, '')));
}

/** 渲染成名片页上的社交胶囊 */
export function renderSocialChips(
  links: { platform: string; value: string; label?: string }[] | undefined,
  esc: (s: unknown) => string,
): string {
  if (!links || links.length === 0) return '';
  const items = links
    .filter((l) => l && l.platform && l.value)
    .slice(0, 16)
    .map((l) => {
      const p = findPlatform(l.platform);
      const url = resolveUrl(l.platform, l.value);
      if (!url) return '';
      const name = esc(l.label || p?.name || l.platform);
      const color = p?.color ?? '#888888';
      const short = esc(p?.short ?? '·');
      return `<a class="soc" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
  <span class="soc-dot" style="background:${color}">${short}</span>
  <span class="soc-name">${name}</span>
</a>`;
    })
    .filter(Boolean)
    .join('');
  if (!items) return '';
  return `<div class="soc-grid">${items}</div>`;
}

export const SOCIAL_CSS = `
.soc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.soc{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;
     background:rgba(127,127,127,.09);text-decoration:none;color:inherit;min-width:0}
.soc-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;
         font-size:11px;font-weight:700;color:#fff;flex:none;letter-spacing:0}
.soc-name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.92}
@media (max-width:380px){.soc-grid{grid-template-columns:1fr}}
`;
