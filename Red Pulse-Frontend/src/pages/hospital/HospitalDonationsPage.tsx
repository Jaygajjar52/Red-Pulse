import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { donationApi } from '@/api';
import { toast } from 'sonner';
import type { DonationRecord } from '@/types';

export function HospitalDonationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [targetCompleteId, setTargetCompleteId] = useState<string | null>(null);

  const { data: donationsResponse, isLoading } = useQuery({
    queryKey: ['hospital-donations', page],
    queryFn: () => donationApi.list({ page, size: 10 }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => donationApi.complete(id),
    onSuccess: () => {
      toast.success('Donation collection completed!');
      queryClient.invalidateQueries({ queryKey: ['hospital-donations'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-inventory'] });
      setTargetCompleteId(null);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to complete donation');
    },
  });

  if (isLoading) return <PageSpinner label="Loading donation collection records..." />;

  const columns: Column<DonationRecord>[] = [
    {
      key: 'donorName',
      header: 'Donor Name',
      render: (d: DonationRecord) => d.donorName ?? 'Anonymous Donor',
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (d: DonationRecord) => (
        <span className="font-bold text-brand-600">{d.bloodGroup.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'units',
      header: 'Units Collected',
      render: (d: DonationRecord) => `${d.units} Unit(s)`,
    },
    {
      key: 'donatedAt',
      header: 'Donated At',
      render: (d: DonationRecord) => new Date(d.donatedAt).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d: DonationRecord) => <StatusBadge status={d.status} />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (d: DonationRecord) =>
        d.status === 'SCHEDULED' ? (
          <Button size="sm" onClick={() => setTargetCompleteId(d.id)}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Completed
          </Button>
        ) : (
          <span className="text-xs text-stone-400">Finalized</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Collections"
        description="Record blood extractions, complete collection logs, and automatically credit donor accounts."
      />

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={donationsResponse?.content ?? []}
          emptyTitle="No donation records found."
          page={page}
          totalPages={donationsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <ConfirmDialog
        open={!!targetCompleteId}
        title="Complete Blood Donation"
        description="Confirm that blood has been successfully collected and tested. This will automatically update hospital inventory."
        confirmLabel="Confirm Collection"
        loading={completeMutation.isPending}
        onConfirm={() => targetCompleteId && completeMutation.mutate(targetCompleteId)}
        onClose={() => setTargetCompleteId(null)}
      />
    </div>
  );
}
