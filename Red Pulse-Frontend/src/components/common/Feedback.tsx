import { cn } from '@/utils/cn';
import { AlertTriangle, Inbox, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800', className)} />;
}

export function Alert({
  title,
  children,
  tone = 'info',
}: {
  title: string;
  children?: ReactNode;
  tone?: 'info' | 'warning' | 'error' | 'success';
}) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-950',
    error: 'border-red-200 bg-red-50 text-red-950 dark:bg-red-950/50 dark:text-red-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  };
  return (
    <div className={cn('rounded-2xl border px-4 py-3', tones[tone])} role="status">
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Inbox className="mb-3 h-8 w-8 text-stone-400" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm text-stone-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-brand-600" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-stone-500">{message ?? 'Please try again in a moment.'}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry} variant="secondary">
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <WifiOff className="mb-3 h-8 w-8 text-stone-500" aria-hidden />
      <h2 className="text-lg font-semibold">Connection problem</h2>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        Red Pulse could not reach the server. Check your connection and try again.
      </p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry} variant="secondary">
          Retry
        </Button>
      ) : null}
    </div>
  );
}
