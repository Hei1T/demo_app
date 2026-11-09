const BASE = (import.meta.env.VITE_API_BASE as string) ?? 'http://127.0.0.1:3000';
const TOKEN_KEY = 'nfc_admin_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error('UNAUTHORIZED');
  }
  if (res.status === 403) throw new Error('FORBIDDEN');
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export type Overview = {
  range: { days: number; since: string };
  users: { total: number; today: number };
  cards: { total: number; today: number };
  traffic: { viewsTotal: number; viewsToday: number; visitorsToday: number; clicksTotal: number };
  templateUsage: { slug: string; count: number }[];
  daily: { views: { day: string; count: number }[]; users: { day: string; count: number }[] };
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  cards: number;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AdminCard = {
  id: string;
  code: string;
  name: string;
  templateSlug: string;
  ownerEmail: string;
  opens: number;
  createdAt: string;
};

export type AdminTemplate = {
  slug: string;
  name: string;
  tier: 'free' | 'pro';
  layout: string;
  enabled: boolean;
  version: number;
  usage: number;
  hasCustomHtml: boolean;
  tokens: Record<string, string | number>;
  updatedAt: string;
};


export type InvalidLinks = {
  summary: { disabled: number; deleted: number; total: number };
  items: {
    code: string;
    name: string;
    templateSlug: string;
    ownerEmail: string;
    reason: string;
    deletedAt: string | null;
    createdAt: string;
    lastViewAt: string | null;
    totalEvents: number;
    link: string;
  }[];
};
export const api = {
  login: (email: string, password: string) =>
    req<{ accessToken: string; user: { id: string; email: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),
  me: () => req<{ id: string; email: string; role: string }>('/auth/me'),
  overview: (days = 30) => req<Overview>(`/admin/stats?days=${days}`),

  users: (page = 1, size = 20, q = '') =>
    req<{ total: number; page: number; size: number; items: AdminUser[] }>(
      `/admin/users?page=${page}&size=${size}&q=${encodeURIComponent(q)}`,
    ),
  userDetail: (id: string) =>
    req<{
      user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        plan: string;
        createdAt: string;
        lastLoginAt: string | null;
      };
      traffic: { views: number; clicks: number; ctr: number };
      cards: {
        id: string;
        code: string;
        name: string;
        templateSlug: string;
        enabled: boolean;
        opens: number;
        activeDays: number;
        usageRate: number;
        ctr: number;
        share: number;
        createdAt: string;
      }[];
    }>(`/admin/users/${id}`),

  cards: (page = 1, size = 20, q = '', template = '') =>
    req<{ total: number; page: number; size: number; items: AdminCard[] }>(
      `/admin/cards?page=${page}&size=${size}&q=${encodeURIComponent(q)}&template=${encodeURIComponent(template)}`,
    ),
  cardDetail: (code: string) =>
    req<{
      card: {
        id: string;
        code: string;
        profile: Record<string, unknown>;
        templateSlug: string;
        enabled: boolean;
        createdAt: string;
        updatedAt: string;
      };
      owner: { id: string; email: string; name: string | null } | null;
      byType: Record<string, number>;
      daily: { day: string; count: number }[];
      recent: {
        type: string;
        ua: string | null;
        referer: string | null;
        ipMasked: string | null;
        at: string;
      }[];
    }>(`/admin/cards/${encodeURIComponent(code)}`),

  templates: () => req<{ templates: AdminTemplate[] }>('/admin/templates'),
  createTemplate: (body: {
    slug: string;
    name: string;
    tier?: 'free' | 'pro';
    tokens?: Record<string, string | number>;
    bodyHtml?: string;
    cssText?: string;
    headConfig?: { title?: string; themeColor?: string };
  }) =>
    req<{ ok: boolean; slug: string }>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  previewTemplate: (body: {
    bodyHtml: string;
    cssText?: string;
    title?: string;
    themeColor?: string;
  }) =>
    req<{ ok: boolean; html: string; warnings: string[] }>('/admin/templates/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  duplicateTemplate: (slug: string) =>
    req<{ ok: boolean; slug: string }>(
      `/admin/templates/${encodeURIComponent(slug)}/duplicate`,
      { method: 'POST', body: JSON.stringify({}) },
    ),
  updateTemplate: (
    slug: string,
    patch: {
      enabled?: boolean;
      name?: string;
      tier?: 'free' | 'pro';
      tokens?: Record<string, string | number>;
      bodyHtml?: string;
      cssText?: string;
      headConfig?: { title?: string; themeColor?: string };
    },
  ) =>
    req<{ ok: boolean }>(`/admin/templates/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteTemplate: (slug: string) =>
    req<{ ok: boolean }>(`/admin/templates/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }),


  userOverview: (id: string, days = 30) =>
    req<{
      range: { days: number; since: string };
      user: {
        id: string; email: string; name: string | null; role: string; plan: string;
        createdAt: string; lastLoginAt: string | null;
      };
      summary: { cards: number; views: number; uv: number; clicks: number; ctr: number; avgDwell: number; cities: number };
      daily: { day: string; views: number; uv: number }[];
      templates: { slug: string; views: number; cards: number }[];
      cities: { city: string; count: number }[];
      clickTypes: { type: string; count: number }[];
    }>(`/admin/users/${id}/overview?days=${days}`),

  userCards: (id: string, page = 1, size = 20, q = '', sort = 'views') =>
    req<{
      total: number; page: number; size: number;
      items: {
        id: string; code: string; name: string; templateSlug: string; enabled: boolean;
        views: number; uv: number; clicks: number; ctr: number;
        usageRate: number; activeDays: number; share: number; createdAt: string;
      }[];
    }>(`/admin/users/${id}/cards?page=${page}&size=${size}&q=${encodeURIComponent(q)}&sort=${sort}`),

  funnel: (days = 30) =>
    req<{
      range: { days: number; since: string };
      funnel: { step: string; count: number }[];
      retention: { visitors: number; d1: number; d1Rate: number; d7: number; d7Rate: number };
      compare: { current: number; previous: number; change: number };
      sources: { source: string; count: number }[];
    }>(`/admin/funnel?days=${days}`),

  cardDetailFull: (code: string, days = 30) =>
    req<{
      range: { days: number; since: string };
      card: {
        id: string; code: string; profile: Record<string, unknown>;
        templateSlug: string; enabled: boolean; createdAt: string; updatedAt: string;
      };
      owner: { id: string; email: string; name: string | null } | null;
      summary: { views: number; uv: number; clicks: number; ctr: number; avgDwell: number; avgScroll: number; dwellSamples: number };
      byType: { type: string; count: number }[];
      daily: { day: string; views: number; uv: number; clicks: number }[];
      cities: { city: string; count: number }[];
      hourly: { hour: number; count: number }[];
      recent: {
        type: string; city: string | null; region: string | null;
        targetLabel: string | null; targetHref: string | null;
        ipMasked: string | null; duration: number | null; scrollDepth: number | null; at: string;
      }[];
    }>(`/admin/cards/${encodeURIComponent(code)}/detail?days=${days}`),
  invalidLinks: () => req<InvalidLinks>('/admin/links/invalid'),

  analytics: (days = 30) =>
    req<{
      range: { days: number; since: string };
      cities: { city: string; count: number }[];
      regions: { region: string; count: number }[];
      avgDwell: number;
      dwellSamples: number;
      templates: {
        slug: string;
        cards: number;
        views: number;
        clicks: number;
        ctr: number;
        viewsPerCard: number;
      }[];
      topCards: {
        code: string;
        name: string;
        templateSlug: string;
        ownerEmail: string;
        views: number;
        uv: number;
        clicks: number;
        ctr: number;
      }[];
      typeDist: { type: string; count: number }[];
      hourly: { hour: number; count: number }[];
    }>(`/admin/analytics?days=${days}`),
};

export { BASE as API_BASE };
