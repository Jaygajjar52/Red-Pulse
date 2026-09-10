import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/Feedback';
import { ErrorState, Skeleton } from '@/components/common/Feedback';
import { Button } from '@/components/common/Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-sm">
      <p className="text-stone-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  onRetry,
  page,
  totalPages,
  onPageChange,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: string;
  emptyTitle: string;
  emptyDescription?: string;
  onRetry?: () => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-100 text-stone-500 dark:border-stone-800">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn('px-4 py-3 font-medium', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-stone-50 last:border-0 dark:border-stone-900">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3', column.className)}>
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page && totalPages && onPageChange ? <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} /> : null}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end gap-3">{children}</div>;
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-900">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            value === tab.id ? 'bg-white shadow-sm dark:bg-stone-800' : 'text-stone-500',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
