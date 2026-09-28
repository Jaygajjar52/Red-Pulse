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

      {emergencies?.content && emergencies.content.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 dark:border-rose-900/50 dark:bg-rose-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span>Active Emergency Broadcast in Progress</span>
            </div>
            <Link to="/requester/emergency">
              <Button size="sm" variant="danger">View All Alerts</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {emergencies.content.slice(0, 3).map((em) => (
              <div key={em.id} className="rounded-xl border border-rose-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-600">{(em.bloodGroup ?? '').replace('_', ' ')}</span> · <strong>{em.unitsRequired} Units</strong>
                  <p className="text-stone-500 mt-0.5">{em.hospitalName ?? 'Emergency Care Center'}</p>
                </div>
                <Link to={`/requester/emergency/${em.id}`}>
                  <Button size="sm" variant="secondary">Live Track</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
                      {(req.bloodGroup ?? '').replace('_', ' ') || '—'}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <h3 className="mt-3 font-bold text-stone-900 dark:text-white">{req.hospitalName ?? 'Hospital'}</h3>
                  <p className="text-xs text-stone-500 mt-1">Required Date: {req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : '—'}</p>
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

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-600" />
            Hospital Blood Banks
          </h2>
          <div className="space-y-3">
            {hospitals?.content?.map((h) => (
              <div key={h.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white">{h.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40">VERIFIED</span>
                </div>
                <p className="text-xs text-stone-500">{h.address}, {h.city}</p>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-semibold pt-1">Phone: {h.phone || '+91 79 2630 0000'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
