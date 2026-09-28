import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Fields';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { useAuth } from '@/context/AuthContext';
import { hospitalSchema, type HospitalValues } from '@/schemas';
import { hospitalApi } from '@/api';
import { toast } from 'sonner';

export function HospitalProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: hospital, isLoading } = useQuery({
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

  const form = useForm<HospitalValues>({
    resolver: zodResolver(hospitalSchema),
    values: {
      name: hospital?.name ?? '',
      registrationNumber: hospital?.registrationNumber ?? 'REG-HP-' + (user?.id ? user.id.slice(-6) : '001'),
      email: hospital?.email ?? user?.email ?? '',
      phone: hospital?.phone ?? user?.phone ?? '',
      address: hospital?.address ?? '',
      city: hospital?.city ?? user?.city ?? '',
      state: hospital?.state ?? user?.state ?? '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: HospitalValues) => {
      if (hospitalId) {
        return hospitalApi.update(hospitalId, values);
      }
      return hospitalApi.create(values);
    },
    onSuccess: () => {
      toast.success(hospitalId ? 'Hospital profile details updated!' : 'Hospital profile created successfully!');
      queryClient.invalidateQueries({ queryKey: ['hospital'] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to save hospital details');
    },
  });

  if (isLoading) return <PageSpinner label="Loading hospital details..." />;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Hospital Profile & Address"
        description="Maintain hospital contact details, emergency phone line, and license coordinates."
      />

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">Facility Status</h2>
            <p className="text-xs text-stone-500">Verified medical institution license</p>
          </div>
          <StatusBadge status={hospital?.status ?? 'ACTIVE'} />
        </div>

        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Hospital Name" error={form.formState.errors.name?.message} {...form.register('name')} />
            <Input label="License / Registration No." error={form.formState.errors.registrationNumber?.message} {...form.register('registrationNumber')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email Address" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
            <Input label="Emergency Phone Line" error={form.formState.errors.phone?.message} {...form.register('phone')} />
          </div>

          <Input label="Street Address" error={form.formState.errors.address?.message} {...form.register('address')} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" error={form.formState.errors.city?.message} {...form.register('city')} />
            <Input label="State" error={form.formState.errors.state?.message} {...form.register('state')} />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" loading={saveMutation.isPending}>
              {hospitalId ? 'Update Hospital Profile' : 'Save Hospital Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
