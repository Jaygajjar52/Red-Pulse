import { useQuery } from '@tanstack/react-query';
import { Award, Heart, Trophy, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { donorApi, contributionApi } from '@/api';

export function DonorContributionsPage() {
  const { data: profile } = useQuery({
    queryKey: ['donor-profile'],
    queryFn: () => donorApi.getProfile(),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['donor-stats', profile?.id],
    queryFn: () => (profile ? contributionApi.statistics(profile.id) : null),
    enabled: !!profile,
  });

  const { data: badges } = useQuery({
    queryKey: ['donor-badges'],
    queryFn: () => contributionApi.badges(),
  });

  const { data: milestones } = useQuery({
    queryKey: ['donor-milestones'],
    queryFn: () => contributionApi.milestones(),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['donor-leaderboard'],
    queryFn: () => contributionApi.leaderboard(),
  });

  if (loadingStats) return <PageSpinner label="Loading donor contributions & milestones..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Impact & Contributions"
        description="Celebrate your humanitarian contribution to saving lives through blood donation."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Donations"
          value={stats?.completedDonations ?? 0}
          icon={<Heart className="h-5 w-5 text-brand-600" />}
          hint="Completed drives"
        />
        <StatCard
          label="Total Blood Units"
          value={`${stats?.totalUnits ?? 0} Units`}
          icon={<Award className="h-5 w-5 text-amber-500" />}
          hint="Approx 3 lives saved per unit"
        />
        <StatCard
          label="Lives Impacted"
          value={(stats?.totalUnits ?? 0) * 3}
          icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
          hint="Direct community impact"
        />
      </div>

      {/* Badges Earned */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold font-display flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Achievement Badges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges?.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 flex items-start gap-3"
            >
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white">{b.name}</h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">{b.description}</p>
                <span className="mt-2 inline-block text-[10px] text-amber-700 font-semibold dark:text-amber-400">
                  Earned {new Date(b.earnedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones Progress */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold font-display">Contribution Milestones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones?.map((m) => {
            const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 dark:text-white">{m.name}</h3>
                  <span className="text-xs font-semibold text-stone-500">{m.progress} / {m.target} units</span>
                </div>
                <p className="text-xs text-stone-500">{m.description}</p>
                <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donor Leaderboard */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold font-display flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Community Heroes Leaderboard
        </h2>
        <div className="rounded-2xl border border-stone-200 bg-white shadow-xs dark:border-stone-800 dark:bg-stone-900 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800/50">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Donor</th>
                <th className="p-4">Total Donations</th>
                <th className="p-4">Units Donated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {leaderboard?.map((entry) => (
                <tr key={entry.donorId} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                  <td className="p-4 font-bold text-stone-900 dark:text-white">#{entry.rank}</td>
                  <td className="p-4 font-semibold">{entry.displayName}</td>
                  <td className="p-4 text-stone-600 dark:text-stone-300">{entry.totalDonations} drives</td>
                  <td className="p-4 text-brand-600 font-bold">{entry.totalUnits} Units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
