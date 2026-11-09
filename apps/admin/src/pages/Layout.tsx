import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { api, getToken, clearToken } from '@/lib/api';

const TITLES: Record<string, string> = {
  '/': '总览',
  '/analytics': '数据分析',
  '/users': '用户',
  '/cards': '名片',
  '/templates': '模板',
  '/links': '失效短链',
  '/settings': '设置',
};

export default function Layout() {
  const loc = useLocation();
  const [user, setUser] = useState({ name: 'Admin', email: '' });

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    api
      .me()
      .then((u) => setUser({ name: u.email.split('@')[0], email: u.email }))
      .catch(() => clearToken());
  }, []);

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader
          title={loc.pathname.startsWith('/users/') ? '用户详情' : loc.pathname.startsWith('/cards/') ? '名片详情' : (TITLES[loc.pathname] ?? '总览')}
        />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
