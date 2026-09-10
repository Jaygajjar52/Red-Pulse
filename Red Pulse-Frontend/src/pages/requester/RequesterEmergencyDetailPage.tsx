import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { emergencyApi } from '@/api';
import { toast } from 'sonner';

export function RequesterEmergencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: emergency, isLoading } = useQuery({
    queryKey: ['emergency', id],
    queryFn: () => (id ? emergencyApi.get(id) : null),
    enabled: !!id,
  });

  const alertDonorsMutation = useMutation({
    mutationFn: () => (id ? emergencyApi.alertDonors(id) : Promise.reject()),
    onSuccess: () => {
      toast.success('Alert sent to matching donors!');
      queryClient.invalidateQueries({ queryKey: ['emergency', id] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => (id ? emergencyApi.resolve(id) : Promise.reject()),
    onSuccess: () => {
      toast.success('Emergency request marked as resolved.');
      queryClient.invalidateQueries({ queryKey: ['emergency', id] });
    },
  });

  if (isLoading) return <PageSpinner label="Loading emergency details..." />;
  if (!emergency) return <div className="p-8 text-center text-stone-500">Emergency record not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="secondary" size="sm" onClick={() => navigate('/requester/emergency')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Emergency Center
      </Button>

      <PageHeader
        title={`Emergency Broadcast #${emergency.id.slice(-6)}`}
        description="Monitor broadcast status, re-alert donors, or resolve when units are collected."
        actions={<StatusBadge status={emergency.status} />}
      />

      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-rose-50 p-4 dark:bg-stone-800">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase">Blood Group</span>
            <p className="mt-1 text-2xl font-bold font-display text-rose-700 dark:text-rose-400">
              {emergency.bloodGroup.replace('_', ' ')}
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
            <span className="text-xs font-semibold text-stone-500 uppercase">Units Required</span>
            <p className="mt-1 text-2xl font-bold font-display text-stone-900 dark:text-white">
              {emergency.unitsRequired} Units
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
            <span className="text-xs font-semibold text-stone-500 uppercase">Status</span>
            <div className="mt-2">
              <StatusBadge status={emergency.status} />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
          <p>Target Hospital: <strong className="text-stone-900 dark:text-white">{emergency.hospitalName ?? 'Emergency ER'}</strong></p>
          <p>Location: <strong className="text-stone-900 dark:text-white">{emergency.approximateLocation ?? 'Trauma Center'}</strong></p>
          <p>Created At: <strong>{new Date(emergency.createdAt).toLocaleString()}</strong></p>
          {emergency.description && (
            <p className="mt-2 text-xs text-stone-500 bg-stone-50 p-3 rounded-lg dark:bg-stone-800">
              {emergency.description}
            </p>
          )}
        </div>

        {/* Dispatch Controls */}
        <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-3 dark:border-stone-800">
          {emergency.status !== 'RESOLVED' && (
            <>
              <Button variant="danger" loading={alertDonorsMutation.isPending} onClick={() => alertDonorsMutation.mutate()}>
                <Bell className="mr-1.5 h-4 w-4" /> Re-Alert Nearby Donors
              </Button>
              <Button variant="secondary" loading={resolveMutation.isPending} onClick={() => resolveMutation.mutate()}>
                <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" /> Mark Resolved
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
