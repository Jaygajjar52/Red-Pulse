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
  const hospitalId = user?.hospitalId ?? 'hospital-1';

  const { data: hospital, isLoading: loadingHospital } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => hospitalApi.get(hospitalId),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['hospital-low-stock', hospitalId],
    queryFn: () => inventoryApi.lowStock(hospitalId),
  });

  const { data: expiring } = useQuery({
    queryKey: ['hospital-expiring', hospitalId],
    queryFn: () => inventoryApi.expiring(hospitalId),
  });

  const { data: appointments } = useQuery({
    queryKey: ['hospital-appointments', hospitalId],
    queryFn: () => appointmentApi.byHospital(hospitalId, { size: 5 }),
  });

  const { data: hospitalRequests } = useQuery({
    queryKey: ['hospital-requests', hospitalId],
    queryFn: () => hospitalApi.bloodRequests(hospitalId, { size: 5 }),
  });

  if (loadingHospital) return <PageSpinner label="Loading hospital dashboard..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${hospital?.name ?? 'Hospital'} Portal`}
        description="Monitor blood bank inventory, schedule appointments, and coordinate emergency response."
        actions={
          <Link to="/hospital/inventory">
            <Button>
              <Layers className="mr-2 h-4 w-4" /> Manage Blood Inventory
            </Button>
          </Link>
        }
      />

      {/* Stats Overview */}
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

      {/* Critical Stock Banner */}
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

      {/* Appointments & Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              Upcoming Donor Appointments
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
                <StatusBadge status={apt.status} />
              </div>
            ))}
            {(!appointments?.content || appointments.content.length === 0) && (
              <div className="rounded-2xl border border-stone-200 p-6 text-center text-stone-500 text-sm dark:border-stone-800">
                No appointments scheduled today.
              </div>
            )}
          </div>
        </div>

        {/* Incoming Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-600" />
              Hospital Blood Requests
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
                    <span className="font-bold text-brand-600">{req.bloodGroup.replace('_', ' ')}</span>
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
