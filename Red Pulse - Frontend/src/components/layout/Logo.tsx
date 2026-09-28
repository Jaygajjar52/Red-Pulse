import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
        <Droplets className="h-5 w-5" aria-hidden />
      </span>
      {compact ? <span className="sr-only">Red Pulse</span> : <span className="font-display text-lg">Red Pulse</span>}
    </Link>
  );
}
