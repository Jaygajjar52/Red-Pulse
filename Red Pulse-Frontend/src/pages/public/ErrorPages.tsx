import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-medium text-brand-700">404</p>
      <h1 className="mt-2 font-display text-4xl">Page not found</h1>
      <p className="mt-3 text-stone-500">The page you requested does not exist in Red Pulse.</p>
      <Button className="mt-6" onClick={() => undefined}>
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-medium text-brand-700">403</p>
      <h1 className="mt-2 font-display text-4xl">Access denied</h1>
      <p className="mt-3 text-stone-500">
        Your account does not have permission to view this area. Frontend role checks only control navigation; the backend
        remains the authorization authority.
      </p>
      <div className="mt-6">
        <Link to="/" className="text-brand-700 underline">
          Return home
        </Link>
      </div>
    </div>
  );
}
