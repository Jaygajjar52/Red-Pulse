import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';
import { roleNav } from '@/constants/nav';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';
import { MockBanner } from '@/components/common/MockBanner';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/api';
import { queryKeys } from '@/constants/queryKeys';
import { displayName } from '@/utils/format';
import type { UserRole } from '@/types';

function Sidebar({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {roleNav[role].map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                isActive
                  ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-100'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900',
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ role }: { role: UserRole }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: () => notificationApi.unread(),
  });
  const notificationsPath =
    role === 'DONOR' ? '/donor/notifications' : role === 'REQUESTER' ? '/requester/notifications' : undefined;

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] dark:bg-[#121110]">
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-950">
        <Logo />
        <button onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu />
        </button>
      </div>
      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950 lg:flex">
          <Logo />
          <div className="mt-8 flex-1 overflow-y-auto">
            <Sidebar role={role} />
          </div>
          <p className="text-xs text-stone-400">{displayName(user?.firstName, user?.lastName)}</p>
        </aside>
        <div>
          <header className="sticky top-0 z-20 hidden items-center justify-end gap-2 border-b border-stone-200 bg-white/90 px-6 py-3 backdrop-blur lg:flex dark:border-stone-800 dark:bg-stone-950/90">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {notificationsPath ? (
              <button
                className="relative rounded-xl p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="Notifications"
                onClick={() => navigate(notificationsPath)}
              >
                <Bell className="h-4 w-4" />
                {unread.data && unread.data.length > 0 ? (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-600" />
                ) : null}
              </button>
            ) : null}
            <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-stone-100" onClick={logout}>
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </header>
          <MockBanner />
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-stone-950/40" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="absolute top-0 left-0 flex h-full w-80 flex-col gap-6 bg-white p-5 dark:bg-stone-950">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X />
              </button>
            </div>
            <Sidebar role={role} onNavigate={() => setOpen(false)} />
            <button className="flex items-center gap-2 text-sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DonorLayout() {
  return <DashboardLayout role="DONOR" />;
}
export function RequesterLayout() {
  return <DashboardLayout role="REQUESTER" />;
}
export function HospitalLayout() {
  return <DashboardLayout role="HOSPITAL" />;
}
export function AdminLayout() {
  return <DashboardLayout role="ADMIN" />;
}
