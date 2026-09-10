import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Select } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { bloodRequestApi } from '@/api';
import { BLOOD_GROUPS } from '@/constants/blood';
import type { BloodGroup, Urgency } from '@/types';

export function DonorRequestsPage() {
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['blood-requests', bloodGroupFilter, urgencyFilter],
    queryFn: () =>
      bloodRequestApi.list({
        bloodGroup: bloodGroupFilter ? (bloodGroupFilter as BloodGroup) : undefined,
        urgency: urgencyFilter ? (urgencyFilter as Urgency) : undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Requests"
        description="Browse active patient and hospital blood requests that match your blood type."
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-48">
          <Select
            label="Blood Group"
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            options={[
              { value: '', label: 'All Blood Groups' },
              ...BLOOD_GROUPS.map((bg) => ({ value: bg.value, label: bg.label })),
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            label="Urgency Level"
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            options={[
              { value: '', label: 'All Urgencies' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'URGENT', label: 'Urgent' },
              { value: 'EMERGENCY', label: 'Emergency' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner label="Fetching requests..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests?.content?.map((req) => (
            <div
              key={req.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                    {req.bloodGroup.replace('_', ' ')}
                  </span>
                  <StatusBadge status={req.urgency} />
                </div>
                <h3 className="mt-3 font-bold text-lg text-stone-900 dark:text-white">
                  {req.hospitalName ?? 'Hospital Request'}
                </h3>
                <p className="text-xs text-stone-500 mt-1">Requester: {req.requesterName ?? 'Patient'}</p>
                <div className="mt-4 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                  <p>Required Date: <strong>{new Date(req.requiredDate).toLocaleDateString()}</strong></p>
                  <p>Units Needed: <strong>{req.unitsRequired}</strong></p>
                  {req.city && <p>Location: <strong>{req.city}, {req.state}</strong></p>}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                <StatusBadge status={req.status} />
                <Link to={`/donor/requests/${req.id}`}>
                  <Button size="sm">Details & Accept</Button>
                </Link>
              </div>
            </div>
          ))}
          {(!requests?.content || requests.content.length === 0) && (
            <div className="col-span-full rounded-2xl border border-stone-200 p-12 text-center text-stone-500 dark:border-stone-800">
              No matching blood requests found for selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
