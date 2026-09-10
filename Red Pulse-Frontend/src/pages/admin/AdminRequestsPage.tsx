import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { bloodRequestApi } from '@/api';
import { BLOOD_GROUP_OPTIONS } from '@/constants/blood';
import type { BloodRequest, BloodGroup, RequestStatus, Urgency } from '@/types';

export function AdminRequestsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: requestsResponse, isLoading } = useQuery({
    queryKey: ['admin-blood-requests', page, search, statusFilter, bloodGroupFilter, urgencyFilter],
    queryFn: () =>
      bloodRequestApi.list({
        page,
        size: 10,
        search: search || undefined,
        status: statusFilter ? (statusFilter as RequestStatus) : undefined,
        bloodGroup: bloodGroupFilter ? (bloodGroupFilter as BloodGroup) : undefined,
        urgency: urgencyFilter ? (urgencyFilter as Urgency) : undefined,
      }),
  });

  if (isLoading) return <PageSpinner label="Loading all platform blood requests..." />;

  const columns: Column<BloodRequest>[] = [
    {
      key: 'hospitalName',
      header: 'Hospital / Facility',
      render: (r: BloodRequest) => (
        <div>
          <p className="font-bold text-stone-900 dark:text-white">{r.hospitalName ?? 'Hospital'}</p>
          <p className="text-xs text-stone-500">{r.city ? `${r.city}, ${r.state}` : ''}</p>
        </div>
      ),
    },
    {
      key: 'requesterName',
      header: 'Requester',
      render: (r: BloodRequest) => r.requesterName ?? 'Patient',
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (r: BloodRequest) => (
        <span className="font-bold text-brand-600">{r.bloodGroup.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'unitsRequired',
      header: 'Units',
      render: (r: BloodRequest) => `${r.unitsRequired} Unit(s)`,
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
    {
      key: 'createdAt',
      header: 'Created At',
      render: (r: BloodRequest) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Universal Blood Request Registry"
        description="Global system overview of all active, fulfilled, and emergency blood requests."
      />

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search hospital or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'MATCHED', label: 'Matched' },
              { value: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled' },
              { value: 'FULFILLED', label: 'Fulfilled' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            label=""
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            options={[
              { value: '', label: 'All Groups' },
              ...BLOOD_GROUP_OPTIONS,
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            label=""
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            options={[
              { value: '', label: 'All Urgencies' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'URGENT', label: 'Urgent' },
              { value: 'EMERGENCY', label: 'Emergency' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={requestsResponse?.content ?? []}
          emptyTitle="No blood requests found matching criteria."
          page={page}
          totalPages={requestsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
