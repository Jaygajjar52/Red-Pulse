import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { useAuth } from '@/context/AuthContext';
import { appointmentApi } from '@/api';
import { toast } from 'sonner';
import type { Appointment } from '@/types';

export function HospitalAppointmentsPage() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? 'hospital-1';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ['hospital-appointments', hospitalId, page],
    queryFn: () => appointmentApi.byHospital(hospitalId, { page, size: 10 }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.confirm(id),
    onSuccess: () => {
      toast.success('Appointment confirmed!');
      queryClient.invalidateQueries({ queryKey: ['hospital-appointments', hospitalId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.complete(id),
    onSuccess: () => {
      toast.success('Appointment completed!');
      queryClient.invalidateQueries({ queryKey: ['hospital-appointments', hospitalId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.cancel(id),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['hospital-appointments', hospitalId] });
    },
  });

  if (isLoading) return <PageSpinner label="Loading hospital appointments..." />;

  const columns: Column<Appointment>[] = [
    {
      key: 'donorName',
      header: 'Donor Name',
      render: (a: Appointment) => a.donorName ?? 'Donor',
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled Date & Time',
      render: (a: Appointment) => new Date(a.scheduledAt).toLocaleString(),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (a: Appointment) => a.notes ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: Appointment) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a: Appointment) => (
        <div className="flex items-center gap-2">
          {a.status === 'SCHEDULED' && (
            <Button size="sm" variant="secondary" onClick={() => confirmMutation.mutate(a.id)}>
              Confirm Arrival
            </Button>
          )}
          {a.status === 'CONFIRMED' && (
            <Button size="sm" onClick={() => completeMutation.mutate(a.id)}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Completed
            </Button>
          )}
          {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
            <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate(a.id)}>
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Appointments Schedule"
        description="Manage donor arrival schedules, confirm walk-ins, and record appointment outcomes."
      />

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={appointmentsResponse?.content ?? []}
          emptyTitle="No scheduled appointments for this hospital."
          page={page}
          totalPages={appointmentsResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
