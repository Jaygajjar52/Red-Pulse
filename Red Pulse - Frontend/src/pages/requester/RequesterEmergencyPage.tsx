import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select, Textarea } from '@/components/forms/Fields';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { emergencySchema, type EmergencyValues } from '@/schemas';
import { emergencyApi, hospitalApi } from '@/api';
import { BLOOD_GROUP_OPTIONS } from '@/constants/blood';
import type { BloodGroup, Urgency } from '@/types';
import { toast } from 'sonner';

export function RequesterEmergencyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => hospitalApi.list(),
  });

  const { data: emergencies } = useQuery({
    queryKey: ['emergencies'],
    queryFn: () => emergencyApi.list(),
  });

  const form = useForm<EmergencyValues>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      bloodGroup: 'O_NEGATIVE',
      unitsRequired: 2,
      hospitalId: '',
      emergencyLevel: 'EMERGENCY',
      description: '',
      approximateLocation: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: EmergencyValues) =>
      emergencyApi.create({
        ...values,
        bloodGroup: values.bloodGroup as BloodGroup,
        emergencyLevel: values.emergencyLevel as Urgency,
      }),
    onSuccess: (created) => {
      toast.success('Emergency blood request broadcasted!');
      queryClient.invalidateQueries({ queryKey: ['emergencies'] });
      navigate(`/requester/emergency/${created.id}`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to trigger emergency request');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Blood Dispatch"
        description="Trigger priority push broadcasts to all verified nearby donors and hospitals."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-rose-200 bg-rose-50/20 p-6 dark:border-stone-800 dark:bg-stone-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-lg dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
            <span>Emergency Broadcast Form</span>
          </div>

          <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <Select
              label="Blood Group Needed"
              options={BLOOD_GROUP_OPTIONS}
              error={form.formState.errors.bloodGroup?.message}
              {...form.register('bloodGroup')}
            />

            <Input
              label="Units Required"
              type="number"
              min={1}
              error={form.formState.errors.unitsRequired?.message}
              {...form.register('unitsRequired', { valueAsNumber: true })}
            />

            <Select
              label="Hospital / Emergency ER"
              options={[
                { value: '', label: 'Select Target Hospital' },
                ...(hospitals?.content?.map((h) => ({ value: h.id, label: `${h.name} (${h.city})` })) ?? []),
              ]}
              error={form.formState.errors.hospitalId?.message}
              {...form.register('hospitalId')}
            />

            <Input
              label="Approximate Location / City"
              placeholder="e.g. City Trauma Center, ICU Ward"
              error={form.formState.errors.approximateLocation?.message}
              {...form.register('approximateLocation')}
            />

            <Textarea
              label="Emergency Details / Clinical Suitability Note"
              placeholder="Critical accident, surgery in progress, etc..."
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />

            <div className="pt-2">
              <Button type="submit" variant="danger" className="w-full" loading={createMutation.isPending}>
                <AlertTriangle className="mr-2 h-4 w-4" /> Trigger Emergency Alert Broadcast
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-lg text-stone-900 dark:text-white">Active Emergency Alerts</h2>
          <div className="space-y-3">
            {emergencies?.content?.map((em) => (
              <div
                key={em.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-600">{(em.bloodGroup ?? '').replace('_', ' ') || '—'}</span>
                  <StatusBadge status={em.status} />
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-semibold">{em.hospitalName ?? 'Hospital ER'}</p>
                <p className="text-xs text-stone-500">Units: {em.unitsRequired} · {em.createdAt ? new Date(em.createdAt).toLocaleTimeString() : '—'}</p>
                <Link to={`/requester/emergency/${em.id}`} className="block pt-2">
                  <Button size="sm" variant="secondary" className="w-full">Track Emergency</Button>
                </Link>
              </div>
            ))}
            {(!emergencies?.content || emergencies.content.length === 0) && (
              <div className="rounded-2xl border border-stone-200 p-6 text-center text-stone-500 text-sm dark:border-stone-800">
                No active emergency broadcasts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
