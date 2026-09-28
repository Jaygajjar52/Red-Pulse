import { Outlet } from 'react-router-dom';
import { Logo } from './Logo';
import { MockBanner } from '@/components/common/MockBanner';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-800 p-10 text-white lg:flex">
        <Logo className="text-white" />
        <div>
          <p className="font-display text-4xl leading-tight">Blood response, coordinated with care.</p>
          <p className="mt-4 max-w-md text-brand-100">
            Sign in to manage requests, donations, inventory, and emergency alerts across Red Pulse.
          </p>
        </div>
        <p className="text-sm text-brand-100">Trusted by donors, requesters, and hospitals.</p>
      </div>
      <div className="flex flex-col justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <MockBanner />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
