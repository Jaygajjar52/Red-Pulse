import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { adminApi } from '@/api';
import { toast } from 'sonner';
import type { DonorProfile } from '@/types';

export function AdminDonorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [targetVerifyId, setTargetVerifyId] = useState<string | null>(null);

  const { data: donorsResponse, isLoading } = useQuery({
    queryKey: ['admin-donors', page, search],
    queryFn: () => adminApi.donors({ page, size: 10, search: search || undefined }),
  });

  const verifyMutation = useMutation({
    mutationFn: (donorId: string) => adminApi.verifyDonor(donorId),
    onSuccess: () => {
      toast.success('Donor verified successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-donors'] });
      setTargetVerifyId(null);
    },
    onError: (err: unknown) => toast.error((err as Error).message || 'Failed to verify donor'),
  });

  if (isLoading) return <PageSpinner label="Loading donor registry..." />;

  const columns: Column<DonorProfile>[] = [
    {
      key: 'name',
      header: 'Donor Name',
      render: (d: DonorProfile) => (
        <div>
          <p className="font-bold text-stone-900 dark:text-white">{d.firstName} {d.lastName}</p>
          <p className="text-xs text-stone-500">{d.email}</p>
        </div>
      ),
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (d: DonorProfile) => (
        <span className="font-bold text-brand-600">{d.bloodGroup.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'location',
      header: 'City / Location',
      render: (d: DonorProfile) => `${d.city}, ${d.state}`,
    },
    {
      key: 'available',
      header: 'Availability',
      render: (d: DonorProfile) => (
        <span className={d.available ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
          {d.available ? 'AVAILABLE' : 'OFFLINE'}
        </span>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Verification Status',
      render: (d: DonorProfile) => <StatusBadge status={d.verificationStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d: DonorProfile) =>
        d.verificationStatus !== 'VERIFIED' ? (
          <Button size="sm" onClick={() => setTargetVerifyId(d.id)}>
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verify Donor
          </Button>
        ) : (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Verified
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Directory & Verification"
        description="Verify donor identities, inspect blood types, and manage clinical readiness."
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search donor name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={donorsResponse?.content ?? []}
          emptyTitle="No donor records found."
          page={page}
          totalPages={donorsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <ConfirmDialog
        open={!!targetVerifyId}
        title="Verify Blood Donor"
        description="Confirm that donor identity, blood group, and health questionnaire meet platform standards."
        confirmLabel="Confirm Verification"
        loading={verifyMutation.isPending}
        onConfirm={() => targetVerifyId && verifyMutation.mutate(targetVerifyId)}
        onClose={() => setTargetVerifyId(null)}
      />
    </div>
  );
}
