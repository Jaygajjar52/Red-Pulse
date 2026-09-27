import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { bloodRequestApi, matchingApi } from '@/api';
import { toast } from 'sonner';

export function RequesterRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFulfillModal, setShowFulfillModal] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['blood-request', id],
    queryFn: () => (id ? bloodRequestApi.get(id) : null),
    enabled: !!id,
  });

  const { data: matches } = useQuery({
    queryKey: ['request-matches', id],
    queryFn: () => (id ? matchingApi.list(id) : null),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => (id ? bloodRequestApi.cancel(id) : Promise.reject()),
    onSuccess: () => {
      toast.success('Request cancelled');
      queryClient.invalidateQueries({ queryKey: ['blood-request', id] });
      setShowCancelModal(false);
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: () => (id ? bloodRequestApi.fulfill(id) : Promise.reject()),
    onSuccess: () => {
      toast.success('Request marked as fulfilled');
      queryClient.invalidateQueries({ queryKey: ['blood-request', id] });
      setShowFulfillModal(false);
    },
  });

  if (isLoading) return <PageSpinner label="Loading request details..." />;
  if (!request) return <div className="p-8 text-center text-stone-500">Request not found.</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="secondary" size="sm" onClick={() => navigate('/requester/requests')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Requests
      </Button>

      <PageHeader
        title={`Request #${request.id.slice(-6)}`}
        description="Monitor status, view system matched donors, and manage fulfillment."
        actions={<StatusBadge status={request.status} />}
      />

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
            <span className="text-xs font-semibold text-stone-500 uppercase">Blood Group</span>
            <p className="mt-1 text-2xl font-bold font-display text-brand-600">
              {(request.bloodGroup ?? '').replace('_', ' ') || '—'}
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
            <span className="text-xs font-semibold text-stone-500 uppercase">Units Required</span>
            <p className="mt-1 text-2xl font-bold font-display text-stone-900 dark:text-white">
              {request.unitsRequired} Units
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
            <span className="text-xs font-semibold text-stone-500 uppercase">Urgency</span>
            <div className="mt-2">
              <StatusBadge status={request.urgency} />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
          <p>Hospital: <strong className="text-stone-900 dark:text-white">{request.hospitalName ?? 'Target Hospital'}</strong></p>
          <p>Required By: <strong className="text-stone-900 dark:text-white">{request.requiredDate ? new Date(request.requiredDate).toLocaleDateString() : '—'}</strong></p>
          {request.description && <p className="mt-2 text-xs text-stone-500 bg-stone-50 p-3 rounded-lg dark:bg-stone-800">{request.description}</p>}
        </div>

        {request.status !== 'FULFILLED' && request.status !== 'CANCELLED' && (
          <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-3 dark:border-stone-800">
            <Button variant="secondary" onClick={() => setShowFulfillModal(true)}>
              <CheckCircle className="mr-1.5 h-4 w-4 text-emerald-600" /> Mark as Fulfilled
            </Button>
            <Button variant="danger" onClick={() => setShowCancelModal(true)}>
              <XCircle className="mr-1.5 h-4 w-4" /> Cancel Request
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            Backend Matched Donors ({matches?.length ?? 0})
          </h2>
          <Link to={`/requester/find-donors?requestId=${request.id}`}>
            <Button size="sm" variant="secondary">View Full Match Board</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches?.map((m) => (
            <div
              key={m.donorId}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 dark:text-white">Donor #{m.donorId.slice(-6)}</span>
                <StatusBadge status={m.verificationStatus} />
              </div>
              <p className="text-xs text-stone-500">
                Blood Group: <strong className="text-stone-900 dark:text-white">{(m.bloodGroup ?? '').replace('_', ' ') || '—'}</strong> · Match Score: {m.matchScore}%
              </p>
              <p className="text-xs text-stone-500">Approx Distance: ~{m.approximateDistanceKm ?? 3} km</p>
            </div>
          ))}
          {(!matches || matches.length === 0) && (
            <div className="col-span-full rounded-2xl border border-stone-200 p-8 text-center text-stone-500 dark:border-stone-800">
              No matching donors returned by backend matching algorithm yet.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showCancelModal}
        title="Cancel Blood Request"
        description="Are you sure you want to cancel this request?"
        confirmLabel="Cancel Request"
        tone="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setShowCancelModal(false)}
      />

      <ConfirmDialog
        open={showFulfillModal}
        title="Mark Request as Fulfilled"
        description="Confirm that blood units have been collected and patient needs are fulfilled."
        confirmLabel="Confirm Fulfilled"
        loading={fulfillMutation.isPending}
        onConfirm={() => fulfillMutation.mutate()}
        onClose={() => setShowFulfillModal(false)}
      />
    </div>
  );
}
