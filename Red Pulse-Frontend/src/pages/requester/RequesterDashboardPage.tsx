import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, Activity, AlertTriangle, Building2, UserCheck, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { bloodRequestApi, emergencyApi, hospitalApi } from '@/api';

export function RequesterDashboardPage() {
  const { data: myRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['blood-requests', 'my'],
    queryFn: () => bloodRequestApi.my({ size: 5 }),
  });

  const { data: emergencies, isLoading: loadingEmergencies } = useQuery({
    queryKey: ['emergency-requests'],
    queryFn: () => emergencyApi.list({ size: 3 }),
  });

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals', 'nearby'],
    queryFn: () => hospitalApi.list({ size: 4 }),
  });

  if (loadingRequests || loadingEmergencies) {
    return <PageSpinner label="Loading requester dashboard..." />;
  }

  const activeCount = myRequests?.content?.filter((r) => r.status === 'PENDING' || r.status === 'MATCHED').length ?? 0;
  const fulfilledCount = myRequests?.content?.filter((r) => r.status === 'FULFILLED').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requester Dashboard"
        description="Create and track blood requests, search available donors, and contact emergency centers."
        actions={
          <div className="flex items-center gap-3">
            <Link to="/requester/create-request">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Request Blood
              </Button>
            </Link>
            <Link to="/requester/emergency">
              <Button variant="danger">
                <AlertTriangle className="mr-2 h-4 w-4" /> Emergency Request
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Requests"
          value={activeCount}
          icon={<Activity className="h-5 w-5 text-brand-600" />}
          hint="Pending matching/fulfilment"
        />
        <StatCard
          label="Emergency Alerts"
          value={emergencies?.totalElements ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
          hint="Active urgent broadcasts"
        />
        <StatCard
          label="Fulfilled Requests"
          value={fulfilledCount}
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
          hint="Completed blood matches"
        />
        <StatCard
          label="Nearby Hospitals"
          value={hospitals?.totalElements ?? 0}
          icon={<Building2 className="h-5 w-5 text-sky-600" />}
          hint="Partner medical centers"
        />
      </div>

      {/* Active Requests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">My Blood Requests</h2>
          <Link to="/requester/requests" className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1">
            View all my requests <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myRequests?.content?.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                    {req.bloodGroup.replace('_', ' ')}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
                <h3 className="mt-3 font-bold text-stone-900 dark:text-white">{req.hospitalName ?? 'Hospital'}</h3>
                <p className="text-xs text-stone-500 mt-1">Required Date: {new Date(req.requiredDate).toLocaleDateString()}</p>
                <p className="text-xs text-stone-500">Units Required: {req.unitsRequired}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                <StatusBadge status={req.urgency} />
                <Link to={`/requester/requests/${req.id}`}>
                  <Button size="sm" variant="secondary">Manage Request</Button>
                </Link>
              </div>
            </div>
          ))}
          {(!myRequests?.content || myRequests.content.length === 0) && (
            <div className="col-span-full rounded-2xl border border-stone-200 p-8 text-center text-stone-500 dark:border-stone-800">
              You have no active blood requests yet. Click 'Request Blood' to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
