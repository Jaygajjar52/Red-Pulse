import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, X, Siren } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';
import { publicNav } from '@/constants/nav';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { roleHome } from '@/context/authUtils';
import { useTheme } from '@/context/useTheme';
import { cn } from '@/utils/cn';
import { EmergencyQuickSosModal } from '@/components/emergency/EmergencyQuickSosModal';

export function PublicNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm lg:flex" aria-label="Primary">
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn('hover:text-brand-700', isActive && 'font-semibold text-brand-700')}
                end={item.to === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Button
              variant="danger"
              size="sm"
              className="font-bold shadow-sm animate-pulse flex items-center gap-1.5"
              onClick={() => setSosModalOpen(true)}
            >
              <Siren className="h-4 w-4" /> Urgent Blood SOS
            </Button>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <>
                <Button variant="secondary" onClick={() => navigate(roleHome(user.role))}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium">
                  Login
                </Link>
                <Button onClick={() => navigate('/register')}>Register</Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="p-2 rounded-xl bg-rose-600 text-white shadow-xs font-bold text-xs flex items-center gap-1"
            >
              <Siren className="h-4 w-4" /> SOS
            </button>
            <button className="rounded-xl p-2" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu />
            </button>
          </div>
        </div>
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-stone-950/40" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div className="absolute top-0 right-0 flex h-full w-80 flex-col gap-4 bg-white p-5 dark:bg-stone-950">
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setOpen(false)} aria-label="Close">
                  <X />
                </button>
              </div>
              <Button
                variant="danger"
                className="w-full font-bold justify-center"
                onClick={() => {
                  setOpen(false);
                  setSosModalOpen(true);
                }}
              >
                <Siren className="h-4 w-4 mr-2" /> Urgent Blood SOS
              </Button>
              {publicNav.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <Button onClick={() => navigate(roleHome(user.role))}>Dashboard</Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                  <Button onClick={() => navigate('/register')}>Register</Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <EmergencyQuickSosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-stone-500">
            Coordinating donors, requesters, and hospitals for faster, safer blood response.
          </p>
        </div>
        <div>
          <p className="font-medium">Platform</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-stone-500">
            <Link to="/how-it-works">How it works</Link>
            <Link to="/find-blood">Find blood</Link>
            <Link to="/become-donor">Become a donor</Link>
          </div>
        </div>
        <div>
          <p className="font-medium">Organization</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-stone-500">
            <Link to="/about">About</Link>
            <Link to="/hospitals">Hospitals</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="font-medium">Safety</p>
          <p className="mt-3 text-sm text-stone-500">
            Eligibility, matching, and clinical decisions are determined by the hospital and backend rules — never by this
            website alone.
          </p>
        </div>
      </div>
    </footer>
  );
}
