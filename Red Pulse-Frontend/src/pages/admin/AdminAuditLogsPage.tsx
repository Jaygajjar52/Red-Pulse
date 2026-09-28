import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Fields';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { adminApi } from '@/api';
import { saveDownloadFromResponse } from '@/utils/download';
import { toast } from 'sonner';
import type { AuditLog } from '@/types';

export function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: auditResponse, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, search],
    queryFn: () => adminApi.filterAuditLogs({ page, size: 10, search: search || undefined }),
  });

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await adminApi.exportAuditLogs({ search: search || undefined, format });
      await saveDownloadFromResponse(res.data, res.contentDisposition, `audit-logs.${format}`);
      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Export failed');
    }
  };

  if (isLoading) return <PageSpinner label="Loading security audit log..." />;

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (a: AuditLog) => new Date(a.timestamp).toLocaleString(),
    },
    {
      key: 'userEmail',
      header: 'User',
      render: (a: AuditLog) => (
        <div>
          <p className="font-semibold text-stone-900 dark:text-white">{a.userEmail ?? 'System'}</p>
          {a.ipAddress && <p className="text-[10px] text-stone-400 font-mono">IP: {a.ipAddress}</p>}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (a: AuditLog) => (
        <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200">{a.action}</span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity / Target',
      render: (a: AuditLog) => (
        <div>
          <span className="font-semibold">{a.entity}</span>
          {a.entityId && <span className="ml-1 text-xs text-stone-500 font-mono">(#{a.entityId.slice(-6)})</span>}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (a: AuditLog) => a.description,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & System Audit Logs"
        description="Immutable administrative trail tracking user authentication, state mutations, and access attempts."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleExport('csv')}>
              <Download className="mr-1 h-3.5 w-3.5" /> CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleExport('pdf')}>
              <Download className="mr-1 h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search action or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={auditResponse?.content ?? []}
          emptyTitle="No audit log records found."
          page={page}
          totalPages={auditResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
