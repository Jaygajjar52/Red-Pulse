import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Fields';
import { ChartCard } from '@/components/charts/ChartCard';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { analyticsApi } from '@/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AdminAnalyticsPage() {
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');

  const { data: donations, isLoading } = useQuery({
    queryKey: ['analytics-donations', fromDate, toDate],
    queryFn: () => analyticsApi.donations({ from: fromDate, to: toDate }),
  });

  const { data: bloodRequests } = useQuery({
    queryKey: ['analytics-requests', fromDate, toDate],
    queryFn: () => analyticsApi.bloodRequests({ from: fromDate, to: toDate }),
  });

  const { data: emergencyStats } = useQuery({
    queryKey: ['analytics-emergency'],
    queryFn: () => analyticsApi.emergencyRequests(),
  });

  const { data: userStats } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: () => analyticsApi.users(),
  });

  if (isLoading) return <PageSpinner label="Rendering system analytics..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deep Telemetry & Business Intelligence"
        description="Comprehensive analytical reporting across donations, urgent dispatches, user demographics, and hospital inventory."
      />

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-48">
          <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="w-48">
          <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard title="Donation Drive Trajectory" description="Monthly trajectory of blood units collected">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={donations?.series ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip />
              <Area type="monotone" dataKey="value" stroke="#e11d48" fill="#ffe4e6" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Blood Requests Volume" description="Demand trends grouped by timeframe">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bloodRequests?.series ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Role Breakdown" description="Proportion of Donors, Requesters, Hospitals, and Admins">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={userStats?.breakdown ?? []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {(userStats?.breakdown ?? []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Emergency Response Status" description="Breakdown of emergency dispatches">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={emergencyStats?.breakdown ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
