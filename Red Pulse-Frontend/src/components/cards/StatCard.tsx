import type { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '@/utils/cn';

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-2 text-xs text-stone-500">{hint}</p> : null}
        </div>
        {icon ? (
          <div className={cn('rounded-xl bg-brand-50 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200')}>
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
