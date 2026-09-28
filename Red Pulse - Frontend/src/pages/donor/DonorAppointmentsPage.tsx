import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { donorApi, appointmentApi } from '@/api';
import { toast } from 'sonner';

export function DonorAppointmentsPage() {
  const queryClient = useQueryClient();
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['donor-profile'],
    queryFn: () => donorApi.getProfile(),
  });

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ['donor-appointments', profile?.id],
    queryFn: () => (profile ? appointmentApi.byDonor(profile.id) : null),
    enabled: !!profile,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.cancel(id),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['donor-appointments'] });
      setCancelTargetId(null);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to cancel appointment');
    },
  });

  if (isLoading) return <PageSpinner label="Loading appointments..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Appointments"
        description="View your upcoming and scheduled blood donation appointments."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointmentsResponse?.content?.map((apt) => (
          <div
            key={apt.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-bold dark:text-white">
                <Calendar className="h-5 w-5 text-brand-600" />
                <span>{new Date(apt.scheduledAt).toLocaleString()}</span>
              </div>
              <StatusBadge status={apt.status} />
            </div>

            <div className="text-sm text-stone-600 dark:text-stone-300 space-y-1">
              <p className="font-semibold text-stone-900 dark:text-white flex items-center gap-1">
                <MapPin className="h-4 w-4 text-stone-400" />
                {apt.hospitalName ?? 'Hospital'}
              </p>
              {apt.notes && <p className="text-xs text-stone-500 bg-stone-50 p-2 rounded-lg dark:bg-stone-800">{apt.notes}</p>}
            </div>

            {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setCancelTargetId(apt.id)}
                >
                  <XCircle className="mr-1 h-4 w-4" /> Cancel Appointment
                </Button>
              </div>
            )}
          </div>
        ))}
        {(!appointmentsResponse?.content || appointmentsResponse.content.length === 0) && (
          <div className="col-span-full rounded-2xl border border-stone-200 p-12 text-center text-stone-500 dark:border-stone-800">
            No blood donation appointments scheduled yet.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelTargetId}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this scheduled blood donation appointment?"
        confirmLabel="Yes, Cancel"
        tone="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelTargetId && cancelMutation.mutate(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
      />
    </div>
  );
}
