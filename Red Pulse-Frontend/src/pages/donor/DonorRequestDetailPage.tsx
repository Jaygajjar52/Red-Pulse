import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Calendar, Heart, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { bloodRequestApi, donorApi, appointmentApi } from '@/api';
import { toast } from 'sonner';
import type { CreateAppointmentPayload } from '@/types';

export function DonorRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['blood-request', id],
    queryFn: () => (id ? bloodRequestApi.get(id) : null),
    enabled: !!id,
  });

  const { data: profile } = useQuery({
    queryKey: ['donor-profile'],
    queryFn: () => donorApi.getProfile(),
  });

  const scheduleAppointmentMutation = useMutation({
    mutationFn: (values: CreateAppointmentPayload) => appointmentApi.create(values),
    onSuccess: () => {
      toast.success('Donation appointment scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['donor-appointments'] });
      navigate('/donor/appointments');
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to schedule appointment');
    },
  });

  if (isLoading) return <PageSpinner label="Loading request details..." />;
  if (!request) return <div className="p-8 text-center text-stone-500">Request not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="secondary" size="sm" onClick={() => navigate('/donor/requests')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Requests
      </Button>

      <PageHeader
        title={`Blood Request #${request.id.slice(-6)}`}
        description="Review patient requirements and hospital location before accepting this donation request."
        actions={<StatusBadge status={request.urgency} />}
      />

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
            <span className="text-xs text-stone-500 font-semibold uppercase">Blood Group Required</span>
            <div className="mt-1 flex items-center gap-2">
              <Heart className="h-6 w-6 text-brand-600" />
              <span className="text-2xl font-bold font-display text-stone-900 dark:text-white">
                {request.bloodGroup.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
            <span className="text-xs text-stone-500 font-semibold uppercase">Units Needed</span>
            <p className="mt-1 text-2xl font-bold font-display text-stone-900 dark:text-white">
              {request.unitsRequired} Units
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-stone-900 dark:text-white">Hospital & Location</h3>
          <div className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
            <MapPin className="h-4 w-4 text-stone-400 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900 dark:text-white">{request.hospitalName ?? 'Hospital details'}</p>
              <p>{request.city ? `${request.city}, ${request.state}` : 'Hospital Location'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-stone-900 dark:text-white">Required Date</h3>
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <Calendar className="h-4 w-4 text-stone-400" />
            <span>{new Date(request.requiredDate).toLocaleDateString()}</span>
          </div>
        </div>

        {request.description && (
          <div className="space-y-2">
            <h3 className="font-bold text-stone-900 dark:text-white">Clinical / Patient Context</h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 bg-stone-50 p-4 rounded-xl dark:bg-stone-800">
              {request.description}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between dark:border-stone-800">
          <StatusBadge status={request.status} />
          {request.status === 'PENDING' || request.status === 'MATCHED' ? (
            <Button onClick={() => setShowAppointmentModal(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Accept & Schedule Appointment
            </Button>
          ) : (
            <span className="text-xs text-stone-500">This request is already fulfilled or cancelled.</span>
          )}
        </div>
      </div>

      {profile && (
        <AppointmentModal
          open={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          donorId={profile.id}
          hospitalId={request.hospitalId}
          bloodRequestId={request.id}
          onSave={async (values) => {
            await scheduleAppointmentMutation.mutateAsync(values);
          }}
        />
      )}
    </div>
  );
}
