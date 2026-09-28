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
          value={upcomingAppointment?.scheduledAt ? new Date(upcomingAppointment.scheduledAt).toLocaleDateString() : 'None'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-rose-50 p-6 dark:from-stone-900 dark:to-stone-950 dark:border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Clinical Eligibility Status: {profile?.isEligible !== false ? 'QUALIFIED TO DONATE' : 'COOLDOWN ACTIVE'}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                profile?.isEligible !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              }`}>
                {profile?.isEligible !== false ? 'Eligible Today' : `${profile?.cooldownDaysRemaining ?? 0} Days Left`}
              </span>
            </div>

            <h3 className="mt-3 text-2xl font-bold font-display text-stone-900 dark:text-white">
              {profile?.available ? 'You are Available & Active for Emergency Dispatches' : 'You are Currently Offline'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
              Registered Biometrics: Weight: <strong>{profile?.weight ?? 65} kg</strong> (Min 45kg) · Age: <strong>{profile?.age ?? 25} yrs</strong> (Min 18) · Cooldown: <strong>56 Days</strong> between donations.
            </p>

            {profile?.ineligibilityReason && (
              <div className="mt-3 p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-xs text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 font-medium">
                {profile.ineligibilityReason}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-brand-100 dark:border-stone-800">
            <Link to="/donor/requests">
              <Button size="sm">
                <Heart className="mr-1.5 h-4 w-4" /> Find Blood Requests
              </Button>
            </Link>
            <Link to="/donor/appointments">
              <Button size="sm" variant="secondary">
                <Calendar className="mr-1.5 h-4 w-4" /> My Appointments
              </Button>
            </Link>
            <Link to="/donor/profile">
              <Button size="sm" variant="ghost">
                Edit Health Profile
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" /> Donor Tier & Milestone
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
                {(stats?.completedDonations ?? 0) >= 10 ? 'PLATINUM' : (stats?.completedDonations ?? 0) >= 5 ? 'GOLD' : (stats?.completedDonations ?? 0) >= 3 ? 'SILVER' : 'BRONZE'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-stone-500">
                Next Milestone: {(stats?.completedDonations ?? 0) >= 10 ? 'Elite Life Saver Award' : `${3 - ((stats?.completedDonations ?? 0) % 3)} more donations to next tier!`}
              </p>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden dark:bg-stone-800">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, ((stats?.completedDonations ?? 0) / 10) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Every unit of blood you donate can save up to <strong>3 lives</strong> in clinical trauma or surgery.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
            <Link to="/donor/contributions" className="text-xs text-brand-600 font-bold hover:underline flex items-center justify-between">
              <span>View Leaderboard & Badges</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

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
                    {(req.bloodGroup ?? '').replace('_', ' ') || '—'}
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
