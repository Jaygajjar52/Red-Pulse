import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select } from '@/components/forms/Fields';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { StatusBadge } from '@/components/common/Badge';
import { donorProfileSchema, type DonorProfileValues } from '@/schemas';
import { donorApi } from '@/api';
import { BLOOD_GROUPS } from '@/constants/blood';
import { toast } from 'sonner';

export function DonorProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['donor-profile'],
    queryFn: () => donorApi.getProfile(),
  });

  const form = useForm<DonorProfileValues>({
    resolver: zodResolver(donorProfileSchema),
    values: {
      bloodGroup: profile?.bloodGroup ?? 'O_POSITIVE',
      gender: profile?.gender ?? 'MALE',
      weight: profile?.weight ?? 65,
      dateOfBirth: profile?.dateOfBirth ?? '1998-01-01',
      city: profile?.city ?? '',
      state: profile?.state ?? '',
      available: profile?.available ?? true,
      phone: profile?.phone ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: DonorProfileValues) => donorApi.updateProfile(values),
    onSuccess: () => {
      toast.success('Donor profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['donor-profile'] });
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to update profile');
    },
  });

  if (isLoading) return <PageSpinner label="Loading donor profile..." />;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Donor Profile & Preferences"
        description="Keep your clinical details, weight, and blood group accurate to ensure safe donation readiness."
      />

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">Clinical & Verification Status</h2>
            <p className="text-xs text-stone-500">Official verification status and donation cooldown metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={profile?.verificationStatus ?? 'UNVERIFIED'} />
            {profile?.isEligible === false && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Cooldown Active ({profile.cooldownDaysRemaining ?? 0} days left)
              </span>
            )}
          </div>
        </div>

        {profile?.ineligibilityReason && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <strong>Donation Status Notice:</strong> {profile.ineligibilityReason}
          </div>
        )}

        <form onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Blood Group"
              options={BLOOD_GROUPS.map((bg) => ({ value: bg.value, label: bg.label }))}
              error={form.formState.errors.bloodGroup?.message}
              {...form.register('bloodGroup')}
            />
            <Select
              label="Gender"
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
              error={form.formState.errors.gender?.message}
              {...form.register('gender')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Weight (kg)"
              type="number"
              step="0.5"
              placeholder="e.g. 65"
              error={form.formState.errors.weight?.message}
              {...form.register('weight', { valueAsNumber: true })}
            />
            <Input
              label="Date of Birth"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              error={form.formState.errors.dateOfBirth?.message}
              {...form.register('dateOfBirth')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" error={form.formState.errors.city?.message} {...form.register('city')} />
            <Input label="State" error={form.formState.errors.state?.message} {...form.register('state')} />
          </div>

          <Input label="Phone Number" error={form.formState.errors.phone?.message} {...form.register('phone')} />

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="availableCheck"
              className="h-4 w-4 rounded-sm text-brand-600 focus:ring-brand-500 border-stone-300"
              {...form.register('available')}
            />
            <label htmlFor="availableCheck" className="text-sm font-medium text-stone-700 dark:text-stone-300">
              I am active and available for emergency blood donations
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" loading={updateMutation.isPending}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
