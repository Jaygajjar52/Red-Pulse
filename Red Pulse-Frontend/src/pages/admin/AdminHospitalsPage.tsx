import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { adminApi } from '@/api';
import type { Hospital } from '@/types';

export function AdminHospitalsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: hospitalsResponse, isLoading } = useQuery({
    queryKey: ['admin-hospitals', page, search],
    queryFn: () => adminApi.hospitals({ page, size: 10, search: search || undefined }),
  });

  if (isLoading) return <PageSpinner label="Loading partner hospital list..." />;

  const columns: Column<Hospital>[] = [
    {
      key: 'name',
      header: 'Hospital Name',
      render: (h: Hospital) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-sky-600 shrink-0" />
          <div>
            <p className="font-bold text-stone-900 dark:text-white">{h.name}</p>
            <p className="text-xs text-stone-500">{h.email ?? 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City / State',
      render: (h: Hospital) => `${h.city}, ${h.state}`,
    },
    {
      key: 'address',
      header: 'Address',
      render: (h: Hospital) => h.address,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (h: Hospital) => h.phone ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (h: Hospital) => <StatusBadge status={h.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Hospital Directory"
        description="Monitor registered medical facilities, emergency blood banks, and hospital licenses."
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search hospital or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={hospitalsResponse?.content ?? []}
          emptyTitle="No hospitals found."
          page={page}
          totalPages={hospitalsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
