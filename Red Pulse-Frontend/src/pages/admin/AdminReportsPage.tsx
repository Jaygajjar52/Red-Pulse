import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select } from '@/components/forms/Fields';
import { Button } from '@/components/common/Button';
import { reportApi } from '@/api';
import { BLOOD_GROUPS } from '@/constants/blood';
import { saveDownloadFromResponse } from '@/utils/download';
import { toast } from 'sonner';
import type { ReportType } from '@/api/contracts';
import type { BloodGroup, Urgency } from '@/types';

export function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('donations');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [city, setCity] = useState('');
  const [urgency, setUrgency] = useState<string>('');
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await reportApi.download(reportType, {
        from: fromDate || undefined,
        to: toDate || undefined,
        bloodGroup: bloodGroup ? (bloodGroup as BloodGroup) : undefined,
        city: city || undefined,
        urgency: urgency ? (urgency as Urgency) : undefined,
        format,
      });
      await saveDownloadFromResponse(res.data, res.contentDisposition, `${reportType}-report.${format}`);
    },
    onSuccess: () => {
      toast.success(`${reportType.toUpperCase()} report downloaded successfully!`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to download report');
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Automated Data Export & Reports"
        description="Generate, filter, and export official CSV / PDF reports for compliance, medical auditing, and analytics."
      />

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-6">
        <div className="space-y-4">
          <Select
            label="Report Category"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            options={[
              { value: 'donations', label: 'Donation Ledger Report' },
              { value: 'blood-requests', label: 'Blood Request Registry Report' },
              { value: 'inventory', label: 'Hospital Inventory Stock Report' },
              { value: 'donors', label: 'Donor Demographics Report' },
              { value: 'hospitals', label: 'Hospital Facilities Directory Report' },
              { value: 'emergency-requests', label: 'Emergency Response Alert Report' },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Blood Group Filter"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              options={[
                { value: '', label: 'All Blood Groups' },
                ...BLOOD_GROUPS.map((bg) => ({ value: bg.value, label: bg.label })),
              ]}
            />
            <Input label="City Filter" placeholder="Filter by city..." value={city} onChange={(e) => setCity(e.target.value)} />
            <Select
              label="Urgency Filter"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              options={[
                { value: '', label: 'All Urgencies' },
                { value: 'NORMAL', label: 'Normal' },
                { value: 'URGENT', label: 'Urgent' },
                { value: 'EMERGENCY', label: 'Emergency' },
              ]}
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-stone-500 uppercase">Export Format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                CSV Spreadsheet (.csv)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <FileText className="h-4 w-4 text-rose-600" />
                PDF Document (.pdf)
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end dark:border-stone-800">
          <Button loading={downloadMutation.isPending} onClick={() => downloadMutation.mutate()}>
            <Download className="mr-2 h-4 w-4" /> Download Report ({format.toUpperCase()})
          </Button>
        </div>
      </div>
    </div>
  );
}
