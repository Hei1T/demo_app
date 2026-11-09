/** 模板目录：主题（配色）+ 布局（结构） */
export type Tokens = {
  bg: string;
  surface: string;
  coverFrom: string;
  coverTo: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  card: string;
  accentFrom: string;
  accentTo: string;
  accentText: string;
  avatarFrom: string;
  avatarTo: string;
  avatarText: string;
  radius: number;
  grid: string;
  glow: string;
};

export type Template = {
  id: string;
  name: string;
  tier: 'free' | 'pro';
  layout: LayoutId;
  tokens: Tokens;
};

export type LayoutId = 'classic' | 'banner' | 'minimal';

export const THEMES: Template[] = [
  {
    id: 'noir',
    name: '黑金',
    tier: 'free',
    layout: 'classic',
    tokens: {
      bg: '#07080b', surface: '#0b0d12',
      coverFrom: '#1c2333', coverTo: '#0b0d12',
      text: '#f2f4f8', muted: '#98a1b3', faint: '#646d80',
      line: 'rgba(255,255,255,.085)', card: 'rgba(255,255,255,.05)',
      accentFrom: '#e8c86a', accentTo: '#c9a227', accentText: '#1a1406',
      avatarFrom: '#222c42', avatarTo: '#11151f', avatarText: '#f0d68a',
      radius: 16, grid: 'rgba(255,255,255,.04)', glow: 'rgba(232,200,106,.30)',
    },
  },
  {
    id: 'paper',
    name: '极简白',
    tier: 'free',
    layout: 'classic',
    tokens: {
      bg: '#e6e7ea', surface: '#ffffff',
      coverFrom: '#f5f6f8', coverTo: '#ffffff',
      text: '#111318', muted: '#5a6272', faint: '#878e9c',
      line: 'rgba(0,0,0,.10)', card: 'rgba(0,0,0,.035)',
      accentFrom: '#15171c', accentTo: '#000000', accentText: '#ffffff',
      avatarFrom: '#e4e7ec', avatarTo: '#f8f9fb', avatarText: '#15171c',
      radius: 16, grid: 'rgba(0,0,0,.045)', glow: 'rgba(0,0,0,.05)',
    },
  },
  {
    id: 'wood',
    name: '原木',
    tier: 'free',
    layout: 'classic',
    tokens: {
      bg: '#e2d8c6', surface: '#f8f3ea',
      coverFrom: '#f1e8d8', coverTo: '#f8f3ea',
      text: '#2d2318', muted: '#6a5640', faint: '#8b765c',
      line: 'rgba(92,64,38,.16)', card: 'rgba(122,88,52,.07)',
      accentFrom: '#b07a45', accentTo: '#8a5a2f', accentText: '#fff9f0',
      avatarFrom: '#e2d4bf', avatarTo: '#f2e8d8', avatarText: '#5a3f24',
      radius: 16, grid: 'rgba(92,64,38,.055)', glow: 'rgba(176,122,69,.28)',
    },
  },
  {
    id: 'neon',
    name: '霓虹',
    tier: 'pro',
    layout: 'classic',
    tokens: {
      bg: '#04050a', surface: '#07080f',
      coverFrom: '#180e38', coverTo: '#07080f',
      text: '#eff4ff', muted: '#8b9dc2', faint: '#65759b',
      line: 'rgba(0,229,255,.16)', card: 'rgba(0,229,255,.055)',
      accentFrom: '#00e5ff', accentTo: '#ff00c8', accentText: '#04060c',
      avatarFrom: '#101a3a', avatarTo: '#0a0f22', avatarText: '#00e5ff',
      radius: 20, grid: 'rgba(0,229,255,.06)', glow: 'rgba(0,229,255,.35)',
    },
  },
  {
    id: 'sunset',
    name: '日落',
    tier: 'pro',
    layout: 'classic',
    tokens: {
      bg: '#0a0503', surface: '#120806',
      coverFrom: '#4a1e12', coverTo: '#120806',
      text: '#fff2ea', muted: '#c9a494', faint: '#9a7466',
      line: 'rgba(255,180,140,.14)', card: 'rgba(255,150,100,.06)',
      accentFrom: '#ff8a3d', accentTo: '#e8452c', accentText: '#1a0a06',
      avatarFrom: '#3a170f', avatarTo: '#1a0a06', avatarText: '#ffb27a',
      radius: 16, grid: 'rgba(255,180,140,.05)', glow: 'rgba(255,138,61,.35)',
    },
  },
  {
    id: 'ocean',
    name: '深海',
    tier: 'pro',
    layout: 'classic',
    tokens: {
      bg: '#04080d', surface: '#050b12',
      coverFrom: '#0d2f4a', coverTo: '#050b12',
      text: '#eaf6ff', muted: '#9ec4dd', faint: '#6d94ad',
      line: 'rgba(120,200,255,.14)', card: 'rgba(100,180,240,.06)',
      accentFrom: '#3ec9ff', accentTo: '#1a6fa8', accentText: '#03121c',
      avatarFrom: '#0e2c42', avatarTo: '#06131c', avatarText: '#8fdcff',
      radius: 16, grid: 'rgba(120,200,255,.05)', glow: 'rgba(62,201,255,.30)',
    },
  },
];

export const LAYOUTS: Record<LayoutId, string[]> = {
  classic: ['header', 'avatar', 'name', 'chips', 'actions', 'wechat', 'contact', 'social', 'save'],
  banner: ['cover', 'avatar', 'name', 'actions', 'contact', 'social'],
  minimal: ['name', 'actions', 'contact'],
};

export function findTheme(id: string): Template {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
