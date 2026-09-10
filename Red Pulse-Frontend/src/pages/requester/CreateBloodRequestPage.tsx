import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select, Textarea } from '@/components/forms/Fields';
import { Button } from '@/components/common/Button';
import { bloodRequestSchema, type BloodRequestValues } from '@/schemas';
import { bloodRequestApi, hospitalApi } from '@/api';
import { BLOOD_GROUP_OPTIONS } from '@/constants/blood';
import type { BloodGroup, Urgency } from '@/types';
import { toast } from 'sonner';

export function CreateBloodRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => hospitalApi.list(),
  });

  const form = useForm<BloodRequestValues>({
    resolver: zodResolver(bloodRequestSchema),
    defaultValues: {
      bloodGroup: 'O_POSITIVE',
      unitsRequired: 1,
      hospitalId: '',
      requiredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      urgency: 'NORMAL',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: BloodRequestValues) =>
      bloodRequestApi.create({
        ...values,
        bloodGroup: values.bloodGroup as BloodGroup,
        urgency: values.urgency as Urgency,
      }),
    onSuccess: (created) => {
      toast.success('Blood request created successfully!');
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      navigate(`/requester/requests/${created.id}`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to create request');
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="secondary" size="sm" onClick={() => navigate('/requester/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <PageHeader
        title="Create Blood Request"
        description="Fill out patient requirements and target hospital to trigger donor matching."
      />

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
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
            label="Hospital / Medical Facility"
            options={[
              { value: '', label: 'Select Target Hospital' },
              ...(hospitals?.content?.map((h) => ({ value: h.id, label: `${h.name} (${h.city})` })) ?? []),
            ]}
            error={form.formState.errors.hospitalId?.message}
            {...form.register('hospitalId')}
          />

          <Input
            label="Required Date"
            type="date"
            error={form.formState.errors.requiredDate?.message}
            {...form.register('requiredDate')}
          />

          <Select
            label="Urgency Level"
            options={[
              { value: 'NORMAL', label: 'Normal (Standard Schedule)' },
              { value: 'URGENT', label: 'Urgent (Required within 24h)' },
              { value: 'EMERGENCY', label: 'Emergency (Immediate Dispatch)' },
            ]}
            error={form.formState.errors.urgency?.message}
            {...form.register('urgency')}
          />

          <Textarea
            label="Additional Notes / Patient Condition"
            placeholder="Specify room number, patient name (optional), or clinical notes..."
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/requester/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Submit Blood Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
