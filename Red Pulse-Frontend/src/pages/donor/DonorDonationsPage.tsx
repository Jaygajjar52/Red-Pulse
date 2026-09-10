import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { donorApi, contributionApi } from '@/api';
import { BLOOD_GROUP_OPTIONS } from '@/constants/blood';
import type { DonationRecord } from '@/types';

export function DonorDonationsPage() {
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: profile } = useQuery({
    queryKey: ['donor-profile'],
    queryFn: () => donorApi.getProfile(),
  });

  const { data: donationsResponse, isLoading } = useQuery({
    queryKey: ['donor-donations', profile?.id, page, search, bloodGroupFilter],
    queryFn: () =>
      profile
        ? contributionApi.donations(profile.id, {
            page,
            size: 10,
            search: search || undefined,
          })
        : null,
    enabled: !!profile,
  });

  if (isLoading) return <PageSpinner label="Loading donation history..." />;

  const columns: Column<DonationRecord>[] = [
    {
      key: 'donatedAt',
      header: 'Date',
      render: (row: DonationRecord) => new Date(row.donatedAt).toLocaleDateString(),
    },
    {
      key: 'hospitalName',
      header: 'Hospital',
      render: (row: DonationRecord) => row.hospitalName ?? 'Hospital',
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (row: DonationRecord) => (
        <span className="font-semibold">{row.bloodGroup.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'units',
      header: 'Units',
      render: (row: DonationRecord) => `${row.units} Unit(s)`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: DonationRecord) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation History"
        description="Comprehensive log of all blood contributions you have made across hospitals."
      />

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
