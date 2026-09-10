import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { bloodRequestApi } from '@/api';
import { BLOOD_GROUP_OPTIONS } from '@/constants/blood';
import type { BloodRequest } from '@/types';

export function RequesterRequestsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: requestsResponse, isLoading } = useQuery({
    queryKey: ['blood-requests', 'my', page, search, statusFilter, bloodGroupFilter],
    queryFn: () => bloodRequestApi.my({ page, size: 10, search: search || undefined }),
  });

  if (isLoading) return <PageSpinner label="Loading blood requests..." />;

  const columns: Column<BloodRequest>[] = [
    {
      key: 'hospitalName',
      header: 'Hospital',
      render: (r: BloodRequest) => (
        <div>
          <p className="font-bold text-stone-900 dark:text-white">{r.hospitalName ?? 'Hospital'}</p>
          <p className="text-xs text-stone-500">{r.city ? `${r.city}, ${r.state}` : ''}</p>
        </div>
      ),
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
      header: 'Units Required',
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
      key: 'action',
      header: 'Action',
      render: (r: BloodRequest) => (
        <Link to={`/requester/requests/${r.id}`}>
          <Button size="sm" variant="secondary">View / Edit</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Blood Requests"
        description="Track all submitted blood requests, search matched donors, and manage fulfillment."
        actions={
          <Link to="/requester/create-request">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Request
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search hospital or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
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
        <div className="w-48">
          <Select
            label=""
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            options={[
              { value: '', label: 'All Blood Groups' },
              ...BLOOD_GROUP_OPTIONS,
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={requestsResponse?.content ?? []}
          emptyTitle="No blood requests found."
          page={page}
          totalPages={requestsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
