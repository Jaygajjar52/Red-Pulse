import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

const tones: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800',
  MATCHED: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950 dark:text-sky-100',
  PARTIALLY_FULFILLED: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  FULFILLED: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  CANCELLED: 'bg-stone-100 text-stone-700 border-stone-200',
  SCHEDULED: 'bg-sky-50 text-sky-900 border-sky-200',
  CONFIRMED: 'bg-teal-50 text-teal-900 border-teal-200',
  COMPLETED: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  NO_SHOW: 'bg-orange-50 text-orange-900 border-orange-200',
  ACTIVE: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  BLOCKED: 'bg-red-50 text-red-900 border-red-200',
  VERIFIED: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  UNVERIFIED: 'bg-amber-50 text-amber-900 border-amber-200',
  NORMAL: 'bg-stone-100 text-stone-700 border-stone-200',
  URGENT: 'bg-orange-50 text-orange-900 border-orange-200',
  EMERGENCY: 'bg-brand-50 text-brand-800 border-brand-200',
  LOW: 'bg-orange-50 text-orange-900 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-900 border-red-200',
  ADEQUATE: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  OPEN: 'bg-brand-50 text-brand-800 border-brand-200',
  ALERT_SENT: 'bg-orange-50 text-orange-900 border-orange-200',
  RESOLVED: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};

const labels: Record<string, string> = {
  PARTIALLY_FULFILLED: 'Partially fulfilled',
  NO_SHOW: 'No show',
  ALERT_SENT: 'Alert sent',
};

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium', className)}>{children}</span>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const s = String(status);
  const readable = labels[s] ?? s.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return (
    <Badge className={tones[s] ?? 'bg-stone-100 text-stone-700 border-stone-200'}>
      <span className="sr-only">Status: </span>
      {readable}
    </Badge>
  );
}
