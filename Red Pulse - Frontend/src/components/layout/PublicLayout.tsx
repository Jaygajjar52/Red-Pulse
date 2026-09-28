import { Outlet } from 'react-router-dom';
import { PublicFooter, PublicNavbar } from './PublicChrome';
import { MockBanner } from '@/components/common/MockBanner';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] dark:bg-stone-950">
      <PublicNavbar />
      <MockBanner />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
