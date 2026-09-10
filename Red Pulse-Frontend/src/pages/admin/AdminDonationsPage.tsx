import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { donationApi } from '@/api';
import { BLOOD_GROUP_OPTIONS } from '@/constants/blood';
import type { DonationRecord, DonationStatus, BloodGroup } from '@/types';

export function AdminDonationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: donationsResponse, isLoading } = useQuery({
    queryKey: ['admin-donations', page, search, statusFilter, bloodGroupFilter],
    queryFn: () =>
      donationApi.list({
        page,
        size: 10,
        search: search || undefined,
        status: statusFilter ? (statusFilter as DonationStatus) : undefined,
        bloodGroup: bloodGroupFilter ? (bloodGroupFilter as BloodGroup) : undefined,
      }),
  });

  if (isLoading) return <PageSpinner label="Loading all donation records..." />;

  const columns: Column<DonationRecord>[] = [
    {
      key: 'donorName',
      header: 'Donor Name',
      render: (d: DonationRecord) => d.donorName ?? 'Anonymous Donor',
    },
    {
      key: 'hospitalName',
      header: 'Hospital',
      render: (d: DonationRecord) => d.hospitalName ?? 'Medical Center',
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
      header: 'Donation Date',
      render: (d: DonationRecord) => new Date(d.donatedAt).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d: DonationRecord) => <StatusBadge status={d.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Donation Ledger"
        description="Global record of all blood donation drives, units collected, and hospital transactions."
      />

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search donor or hospital..."
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
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'COMPLETED', label: 'Completed' },
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
          rows={donationsResponse?.content ?? []}
          emptyTitle="No donation records found."
          page={page}
          totalPages={donationsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
