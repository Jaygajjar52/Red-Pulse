import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, AlertTriangle, Calendar, Activity, ArrowRight, ShieldAlert, Layers } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { useAuth } from '@/context/AuthContext';
import { hospitalApi, inventoryApi, appointmentApi } from '@/api';

export function HospitalDashboardPage() {
  const { user } = useAuth();

  const { data: hospital, isLoading: loadingHospital } = useQuery({
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

  const { data: lowStock } = useQuery({
    queryKey: ['hospital-low-stock', hospitalId],
    queryFn: () => (hospitalId ? inventoryApi.lowStock(hospitalId) : []),
    enabled: !!hospitalId,
  });

  const { data: expiring } = useQuery({
    queryKey: ['hospital-expiring', hospitalId],
    queryFn: () => (hospitalId ? inventoryApi.expiring(hospitalId) : []),
    enabled: !!hospitalId,
  });

  const { data: appointments } = useQuery({
    queryKey: ['hospital-appointments', hospitalId],
    queryFn: () => (hospitalId ? appointmentApi.byHospital(hospitalId, { size: 5 }) : null),
    enabled: !!hospitalId,
  });

  const { data: hospitalRequests } = useQuery({
    queryKey: ['hospital-requests', hospitalId],
    queryFn: () => (hospitalId ? hospitalApi.bloodRequests(hospitalId, { size: 5 }) : null),
    enabled: !!hospitalId,
  });

  const { data: inventoryList } = useQuery({
    queryKey: ['hospital-inventory', hospitalId],
    queryFn: () => (hospitalId ? inventoryApi.list(hospitalId) : null),
    enabled: !!hospitalId,
  });

  const bloodGroups = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'];

  if (loadingHospital) return <PageSpinner label="Loading hospital dashboard..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${hospital?.name ?? 'Hospital'} Portal`}
        description="Monitor blood bank inventory, schedule appointments, and coordinate emergency response."
        actions={
          <div className="flex items-center gap-3">
            <Link to="/hospital/requests">
              <Button variant="secondary" size="sm">
                <Building2 className="mr-1.5 h-4 w-4" /> Issue Blood
              </Button>
            </Link>
            <Link to="/hospital/inventory">
              <Button size="sm">
                <Layers className="mr-1.5 h-4 w-4" /> Manage Inventory
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Low Stock Alerts"
          value={lowStock?.length ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          hint="Units below safety threshold"
        />
        <StatCard
          label="Expiring Units (<5 days)"
          value={expiring?.length ?? 0}
          icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
          hint="Requires priority dispatch"
        />
        <StatCard
          label="Today's Appointments"
          value={appointments?.content?.filter((a) => a.status === 'CONFIRMED' || a.status === 'SCHEDULED').length ?? 0}
          icon={<Calendar className="h-5 w-5 text-sky-600" />}
          hint="Scheduled donor visits"
        />
        <StatCard
          label="Incoming Requests"
          value={hospitalRequests?.totalElements ?? 0}
          icon={<Activity className="h-5 w-5 text-brand-600" />}
          hint="Patients requiring blood"
        />
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-600" />
              Real-Time Blood Stock Matrix (8 Groups)
            </h2>
            <p className="text-xs text-stone-500">Live units on shelf and reserve status across all major blood types</p>
          </div>
          <Link to="/hospital/inventory">
            <Button size="sm" variant="secondary">Adjust / Restock Units</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bloodGroups.map((bg) => {
            const stock = inventoryList?.content?.find((inv) => inv.bloodGroup === bg);
            const units = stock?.availableUnits ?? 0;
            const isLow = units < 3;
            const isCrit = units === 0;

            return (
              <div
                key={bg}
                className={`rounded-xl p-3 text-center border transition ${
                  isCrit
                    ? 'border-rose-300 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20'
                    : isLow
                    ? 'border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                    : 'border-stone-200 bg-stone-50/50 dark:border-stone-800 dark:bg-stone-800/40'
                }`}
              >
                <div className="font-bold text-sm text-stone-900 dark:text-white">
                  {bg.replace('_', ' ')}
                </div>
                <div className={`mt-1 text-2xl font-display font-extrabold ${
                  isCrit ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {units}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  {isCrit ? 'CRITICAL' : isLow ? 'LOW' : 'ADEQUATE'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {((lowStock && lowStock.length > 0) || (expiring && expiring.length > 0)) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white">Attention Required: Inventory Alerts</h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                  {lowStock?.length ?? 0} blood groups are on LOW/CRITICAL stock. {expiring?.length ?? 0} units expiring soon.
                </p>
              </div>
            </div>
            <Link to="/hospital/inventory">
              <Button size="sm" variant="secondary">Restock Inventory</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              Today's Phlebotomy & Appointments
            </h2>
            <Link to="/hospital/appointments" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {appointments?.content?.map((apt) => (
              <div
                key={apt.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white">{apt.donorName ?? 'Donor'}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Scheduled: {new Date(apt.scheduledAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={apt.status} />
                  <Link to="/hospital/appointments">
                    <Button size="sm" variant="secondary">Manage</Button>
                  </Link>
                </div>
              </div>
            ))}
            {(!appointments?.content || appointments.content.length === 0) && (
              <div className="rounded-2xl border border-stone-200 p-6 text-center text-stone-500 text-sm dark:border-stone-800">
                No donor appointments scheduled today.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-600" />
              Incoming Patient Blood Requests
            </h2>
            <Link to="/hospital/requests" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {hospitalRequests?.content?.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-600">{(req.bloodGroup ?? '').replace('_', ' ') || '—'}</span>
                    <span className="text-xs text-stone-500 font-medium">({req.unitsRequired} Units)</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">Requester: {req.requesterName ?? 'Patient'}</p>
                </div>
                <StatusBadge status={req.urgency} />
              </div>
            ))}
            {(!hospitalRequests?.content || hospitalRequests.content.length === 0) && (
              <div className="rounded-2xl border border-stone-200 p-6 text-center text-stone-500 text-sm dark:border-stone-800">
                No incoming blood requests.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
