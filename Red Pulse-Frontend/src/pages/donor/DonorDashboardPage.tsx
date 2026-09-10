import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Calendar, Award, Bell, ShieldCheck, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { donorApi, bloodRequestApi, appointmentApi, contributionApi, notificationApi } from '@/api';
import { toast } from 'sonner';

export function DonorDashboardPage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['donor-profile'],
    queryFn: () => donorApi.getProfile(),
  });

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['blood-requests', 'dashboard'],
    queryFn: () => bloodRequestApi.list({ size: 5 }),
  });

  const { data: appointments } = useQuery({
    queryKey: ['donor-appointments', profile?.id],
    queryFn: () => (profile ? appointmentApi.byDonor(profile.id, { size: 3 }) : null),
    enabled: !!profile,
  });

  const { data: stats } = useQuery({
    queryKey: ['donor-stats', profile?.id],
    queryFn: () => (profile ? contributionApi.statistics(profile.id) : null),
    enabled: !!profile,
  });

  const { data: unreadNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.unread(),
  });

  const toggleAvailability = useMutation({
    mutationFn: (newStatus: boolean) => donorApi.patchAvailability(newStatus),
    onSuccess: (updated) => {
      toast.success(updated.available ? 'You are now marked as AVAILABLE for donation' : 'Availability set to unavailable');
      queryClient.invalidateQueries({ queryKey: ['donor-profile'] });
    },
  });

  if (loadingProfile || loadingRequests) {
    return <PageSpinner label="Loading donor dashboard..." />;
  }

  const upcomingAppointment = appointments?.content?.find(
    (a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.firstName ?? 'Donor'}!`}
        description="Your blood donations save lives. Manage your availability, appointments, and emergency requests."
        actions={
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
            <span className="text-sm font-medium">Donation Status:</span>
            <button
              onClick={() => profile && toggleAvailability.mutate(!profile.available)}
              disabled={toggleAvailability.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profile?.available ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profile?.available ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${profile?.available ? 'text-emerald-600' : 'text-stone-500'}`}>
              {profile?.available ? 'AVAILABLE' : 'UNAVAILABLE'}
            </span>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Blood Group"
          value={profile?.bloodGroup?.replace('_', ' ') ?? 'N/A'}
          icon={<Heart className="h-5 w-5 text-brand-600" />}
          hint="Registered Group"
        />
        <StatCard
          label="Total Donations"
          value={stats?.completedDonations ?? 0}
          icon={<Award className="h-5 w-5 text-amber-500" />}
          hint={`${stats?.totalUnits ?? 0} units collected`}
        />
        <StatCard
          label="Upcoming Appointment"
          value={upcomingAppointment ? new Date(upcomingAppointment.scheduledAt).toLocaleDateString() : 'None'}
          icon={<Calendar className="h-5 w-5 text-sky-600" />}
          hint={upcomingAppointment?.hospitalName ?? 'No pending appointment'}
        />
        <StatCard
          label="Unread Alerts"
          value={unreadNotifications?.length ?? 0}
          icon={<Bell className="h-5 w-5 text-rose-500" />}
          hint="Check notification feed"
        />
      </div>

      {/* Profile Banner */}
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-rose-50 p-6 dark:from-stone-900 dark:to-stone-950 dark:border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Verification Status: {profile?.verificationStatus ?? 'UNVERIFIED'}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold font-display text-stone-900 dark:text-white">
              {profile?.available ? 'Ready to accept emergency blood requests' : 'Currently offline for donations'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
              Location: {profile?.city ?? 'Not set'}, {profile?.state ?? 'Not set'}
            </p>
          </div>
          <Link to="/donor/profile">
            <Button variant="secondary">Update Profile & Preferences</Button>
          </Link>
        </div>
      </div>

      {/* Emergency & Pending Blood Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-600" />
            Nearby Blood Requests
          </h2>
          <Link to="/donor/requests" className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1">
            View all requests <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests?.content?.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-lg bg-brand-100 dark:bg-brand-950 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-300">
                    {req.bloodGroup.replace('_', ' ')}
                  </span>
                  <h3 className="mt-2 font-bold text-stone-900 dark:text-white">{req.hospitalName ?? 'Hospital Request'}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{req.city ? `${req.city}, ${req.state}` : 'Location details'}</span>
                    {req.distanceKm && <span className="ml-2">({req.distanceKm} km away)</span>}
                  </div>
                </div>
                <StatusBadge status={req.urgency} />
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
                <span className="text-xs text-stone-500">Units required: <strong className="text-stone-900 dark:text-white">{req.unitsRequired}</strong></span>
                <Link to={`/donor/requests/${req.id}`}>
                  <Button size="sm">View Request</Button>
                </Link>
              </div>
            </div>
          ))}
          {(!requests?.content || requests.content.length === 0) && (
            <div className="col-span-full rounded-2xl border border-stone-200 p-8 text-center text-stone-500 dark:border-stone-800">
              No active blood requests currently matched for your group.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
