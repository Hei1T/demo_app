import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  IconInnerShadowTop,
  IconDashboard,
  IconChartHistogram,
  IconUsers,
  IconId,
  IconPalette,
  IconAlertTriangle,
  IconSettings,
  IconLogout,
  IconExternalLink,
} from '@tabler/icons-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';
import { clearToken } from '@/lib/api';

const NAV = [
  {
    label: '概览',
    items: [
      { title: '总览', url: '/', icon: IconDashboard, end: true },
      { title: '数据分析', url: '/analytics', icon: IconChartHistogram },
    ],
  },
  {
    label: '业务',
    items: [
      { title: '用户', url: '/users', icon: IconUsers },
      { title: '名片', url: '/cards', icon: IconId },
      { title: '模板', url: '/templates', icon: IconPalette },
  { title: '失效短链', url: '/links', icon: IconAlertTriangle },
    ],
  },
  {
    label: '系统',
    items: [{ title: '设置', url: '/settings', icon: IconSettings }],
  },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: { name: string; email: string } }) {
  const go = useNavigate();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <NavLink to="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">NFC SaaS</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink to={item.url} end={item.end}>
                      {({ isActive }) => (
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <span>
                            <item.icon />
                            <span>{item.title}</span>
                          </span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="http://127.0.0.1:3000/preview" target="_blank" rel="noopener noreferrer">
                    <IconExternalLink />
                    <span>模板市场预览</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    clearToken();
                    go('/login');
                  }}
                >
                  <IconLogout />
                  <span>退出登录</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ ...user, avatar: '' }} />
      </SidebarFooter>
    </Sidebar>
  );
}
