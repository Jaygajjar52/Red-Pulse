import { env } from '@/constants/env';
import { Alert } from '@/components/common/Feedback';

export function MockBanner() {
  if (!env.useMockApi) return null;
  return (
    <div className="px-4 pt-3">
      <Alert tone="warning" title="Demo / mock data">
        Mock API mode is enabled. Records shown here are for frontend development only and are not live donation data.
      </Alert>
    </div>
  );
}
