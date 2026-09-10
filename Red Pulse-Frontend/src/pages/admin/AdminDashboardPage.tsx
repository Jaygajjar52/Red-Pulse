import { useQuery } from '@tanstack/react-query';
import { Users, HeartHandshake, Building2, Activity, ShieldAlert, Layers, Heart } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { analyticsApi } from '@/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AdminDashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => analyticsApi.overview(),
  });

  const { data: donationSeries } = useQuery({
    queryKey: ['admin-analytics-donations'],
    queryFn: () => analyticsApi.donations(),
  });

  const { data: requestSeries } = useQuery({
    queryKey: ['admin-analytics-requests'],
    queryFn: () => analyticsApi.bloodRequests(),
  });

  const { data: inventoryBreakdown } = useQuery({
    queryKey: ['admin-analytics-inventory'],
    queryFn: () => analyticsApi.inventory(),
  });

  const { data: bloodGroupBreakdown } = useQuery({
    queryKey: ['admin-analytics-blood-groups'],
    queryFn: () => analyticsApi.bloodGroups(),
  });

  if (loadingOverview) return <PageSpinner label="Loading admin system overview..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration & Analytics"
        description="Global platform telemetry, user metrics, real-time blood bank inventory, and emergency response statistics."
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Users"
          value={overview?.totalUsers ?? 0}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          hint={`${overview?.totalDonors ?? 0} Active Donors`}
        />
        <StatCard
          label="Partner Hospitals"
          value={overview?.totalHospitals ?? 0}
          icon={<Building2 className="h-5 w-5 text-sky-600" />}
          hint="Registered facilities"
        />
        <StatCard
          label="Total Blood Inventory"
          value={`${overview?.totalBloodInventory ?? 0} Units`}
          icon={<Layers className="h-5 w-5 text-emerald-600" />}
          hint="Across all hospitals"
        />
        <StatCard
          label="Emergency Requests"
          value={overview?.emergencyRequests ?? 0}
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
          hint="Active urgent broadcasts"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Donations Completed"
          value={overview?.totalDonations ?? 0}
          icon={<HeartHandshake className="h-5 w-5 text-brand-600" />}
          hint="Lifetime collections"
        />
        <StatCard
          label="Active Blood Requests"
          value={overview?.activeBloodRequests ?? 0}
          icon={<Activity className="h-5 w-5 text-amber-500" />}
          hint="Pending matching/fulfillment"
        />
        <StatCard
          label="Registered Donors"
          value={overview?.totalDonors ?? 0}
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          hint="Verified donors"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations Over Time Line Chart */}
        <ChartCard title="Donations Over Time" description="Monthly completed blood donation drives">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={donationSeries?.series ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip />
              <Line type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Requests Over Time Bar Chart */}
        <ChartCard title="Blood Requests Volume" description="Monthly blood request volume trends">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={requestSeries?.series ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Inventory Distribution Donut Chart */}
        <ChartCard title="Inventory by Blood Group" description="Current unit distribution in partner hospitals">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={inventoryBreakdown?.breakdown ?? []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
              >
                {(inventoryBreakdown?.breakdown ?? []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Blood Group Demographics Bar Chart */}
        <ChartCard title="Blood Group Demographics" description="Distribution of registered donor blood groups">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bloodGroupBreakdown?.breakdown ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
