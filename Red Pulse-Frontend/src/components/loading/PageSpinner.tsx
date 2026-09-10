import { LoaderCircle } from 'lucide-react';

export function PageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-stone-500" role="status">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
