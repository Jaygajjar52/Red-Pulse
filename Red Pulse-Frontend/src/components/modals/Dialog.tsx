import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Button } from '../common/Button';
import { LoaderCircle } from 'lucide-react';

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <button className="absolute inset-0 bg-stone-950/40" aria-label="Close dialog" onClick={onClose} />
      <div className="relative z-10 m-3 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-stone-950">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>{children}</div>
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loading,
  tone = 'primary',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-stone-600 dark:text-stone-300">{description}</p>
    </Modal>
  );
}

export function LoadingOverlay({ show, label = 'Loading' }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-white/70 dark:bg-stone-950/70" role="status">
      <div className="flex items-center gap-2 text-sm">
        <LoaderCircle className={cn('h-4 w-4 animate-spin')} />
        {label}
      </div>
    </div>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-md bg-stone-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
        {label}
      </span>
    </span>
  );
}

export function Dropdown({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="relative">
      <summary className="list-none [&::-webkit-details-marker]:hidden">{trigger}</summary>
      <div className="absolute right-0 z-30 mt-2 min-w-48 rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-800 dark:bg-stone-950">
        {children}
      </div>
    </details>
  );
}
