import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, MapPin, Bell } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { matchingApi } from '@/api';
import { toast } from 'sonner';

export function FindDonorsPage() {
  const [params] = useSearchParams();
  const requestId = params.get('requestId') ?? 'req-1';

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', requestId],
    queryFn: () => matchingApi.list(requestId),
  });

  const notifyMutation = useMutation({
    mutationFn: (donorId: string) => matchingApi.notify(requestId, donorId),
    onSuccess: () => {
      toast.success('Emergency alert notification sent to donor!');
    },
  });

  if (isLoading) return <PageSpinner label="Running backend donor matching algorithm..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find Matched Donors"
        description="View privacy-preserved nearby donors algorithmically matched by the Spring Boot backend."
      />

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <Search className="h-4 w-4 text-stone-400" />
          <span>Active Request ID: <strong>#{requestId}</strong></span>
        </div>
        <span className="text-xs text-stone-500">
          Exact donor personal details are masked for privacy & safety compliance.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches?.map((m) => (
          <div
            key={m.donorId}
            className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                  {m.bloodGroup.replace('_', ' ')}
                </span>
                <StatusBadge status={m.verificationStatus} />
              </div>

              <h3 className="mt-3 font-bold text-stone-900 dark:text-white">
                Matched Donor #{m.donorId.slice(-6)}
              </h3>

              <div className="mt-3 space-y-1 text-xs text-stone-600 dark:text-stone-300">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-stone-400" />
                  Approx Distance: ~{m.approximateDistanceKm ?? 4} km
                </p>
                <p>Compatibility Match Score: <strong className="text-emerald-600">{m.matchScore}%</strong></p>
                <p>Status: {m.available ? <span className="text-emerald-600 font-bold">AVAILABLE</span> : <span className="text-stone-400">BUSY</span>}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
              <Button
                size="sm"
                className="w-full"
                loading={notifyMutation.isPending}
                onClick={() => notifyMutation.mutate(m.donorId)}
              >
                <Bell className="mr-1.5 h-4 w-4" /> Send Donation Alert
              </Button>
            </div>
          </div>
        ))}

        {(!matches || matches.length === 0) && (
          <div className="col-span-full rounded-2xl border border-stone-200 p-12 text-center text-stone-500 dark:border-stone-800">
            No matching donors currently available in this radius.
          </div>
        )}
      </div>
    </div>
  );
}
