import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { useAuth } from '@/context/AuthContext';
import { hospitalApi } from '@/api';
import type { BloodRequest } from '@/types';

export function HospitalRequestsPage() {
  const { user } = useAuth();

  const { data: hospital } = useQuery({
    queryKey: ['hospital', 'me', user?.hospitalId],
    queryFn: async () => {
      try {
        return await hospitalApi.getMe();
      } catch {
        if (user?.hospitalId) return await hospitalApi.get(user.hospitalId);
        return null;
      }
    },
  });

  const hospitalId = hospital?.id ?? user?.hospitalId;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: requestsResponse, isLoading } = useQuery({
    queryKey: ['hospital-requests', hospitalId, page, search],
    queryFn: () => (hospitalId ? hospitalApi.bloodRequests(hospitalId, { page, size: 10, search: search || undefined }) : { content: [], totalElements: 0, page: 0, size: 10, totalPages: 0 }),
    enabled: !!hospitalId,
  });

  if (isLoading) return <PageSpinner label="Loading incoming requests..." />;

  const columns: Column<BloodRequest>[] = [
    {
      key: 'requesterName',
      header: 'Requester / Patient',
      render: (r: BloodRequest) => r.requesterName ?? 'Patient',
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (r: BloodRequest) => (
        <span className="font-bold text-brand-600">{(r.bloodGroup ?? '').replace('_', ' ') || '—'}</span>
      ),
    },
    {
      key: 'unitsRequired',
      header: 'Units Required',
      render: (r: BloodRequest) => `${r.unitsRequired} Unit(s)`,
    },
    {
      key: 'requiredDate',
      header: 'Required Date',
      render: (r: BloodRequest) => r.requiredDate ? new Date(r.requiredDate).toLocaleDateString() : '—',
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (r: BloodRequest) => <StatusBadge status={r.urgency} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: BloodRequest) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Blood Requests"
        description="Review all requests assigned to or originating at this hospital facility."
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search requester name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={requestsResponse?.content ?? []}
          emptyTitle="No blood requests assigned to this hospital."
          page={page}
          totalPages={requestsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
