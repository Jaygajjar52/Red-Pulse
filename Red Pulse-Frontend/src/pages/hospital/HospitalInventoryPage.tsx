import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, AlertTriangle, Layers } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { InventoryModal } from '@/components/modals/InventoryModal';
import { useAuth } from '@/context/AuthContext';
import { inventoryApi, hospitalApi } from '@/api';
import { toast } from 'sonner';
import type { BloodInventory } from '@/types';
import type { InventoryValues } from '@/schemas';

export function HospitalInventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: hospital } = useQuery({
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

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<BloodInventory | null>(null);

  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: ['hospital-inventory', hospitalId, page],
    queryFn: () => (hospitalId ? inventoryApi.list(hospitalId, { page, size: 10 }) : { content: [], totalElements: 0, page: 0, size: 10, totalPages: 0 }),
    enabled: !!hospitalId,
  });

  const createMutation = useMutation({
    mutationFn: (values: InventoryValues) => {
      if (!hospitalId) throw new Error('Hospital profile must be configured first');
      return inventoryApi.create(hospitalId, values);
    },
    onSuccess: () => {
      toast.success('Inventory stock item added!');
      queryClient.invalidateQueries({ queryKey: ['hospital-inventory', hospitalId] });
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to add inventory');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: InventoryValues }) => {
      if (!hospitalId) throw new Error('Hospital profile must be configured first');
      return inventoryApi.update(hospitalId, id, values);
    },
    onSuccess: () => {
      toast.success('Inventory stock updated!');
      queryClient.invalidateQueries({ queryKey: ['hospital-inventory', hospitalId] });
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to update inventory');
    },
  });

  if (isLoading) return <PageSpinner label="Loading blood inventory..." />;

  const columns: Column<BloodInventory>[] = [
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (row: BloodInventory) => (
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-brand-100 px-3 py-1 text-sm font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
            {(row.bloodGroup ?? '').replace('_', ' ') || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'availableUnits',
      header: 'Available Units',
      render: (row: BloodInventory) => (
        <span className="text-base font-bold text-stone-900 dark:text-white">
          {row.availableUnits} Units
        </span>
      ),
    },
    {
      key: 'reservedUnits',
      header: 'Reserved Units',
      render: (row: BloodInventory) => `${row.reservedUnits} Units`,
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (row: BloodInventory) => (
        <span className={row.expiryDate && (new Date(row.expiryDate).getTime() - Date.now() < 5 * 24 * 60 * 60 * 1000) ? 'text-red-600 font-bold' : ''}>
          {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Stock Status',
      render: (row: BloodInventory) => <StatusBadge status={row.stockStatus} />,
    },
    {
      key: 'action',
      header: 'Actions',
      render: (row: BloodInventory) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setEditItem(row);
            setModalOpen(true);
          }}
        >
          <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Inventory Management"
        description="Monitor real-time blood stock counts, reserve units for pending surgeries, and track expiry dates."
        actions={
          <Button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Inventory Batch
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 flex items-center gap-4">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-semibold">Total Stock Units</span>
            <p className="text-2xl font-bold font-display text-stone-900 dark:text-white">
              {inventoryResponse?.content?.reduce((sum, i) => sum + i.availableUnits, 0) ?? 0} Units
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs dark:border-amber-900/40 dark:bg-stone-900 flex items-center gap-4">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-950">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-amber-800 font-semibold dark:text-amber-400">Low Stock Types</span>
            <p className="text-2xl font-bold font-display text-amber-900 dark:text-white">
              {inventoryResponse?.content?.filter((i) => i.stockStatus === 'LOW' || i.stockStatus === 'CRITICAL').length ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={inventoryResponse?.content ?? []}
          emptyTitle="No blood inventory records found. Add a batch to get started."
          page={page}
          totalPages={inventoryResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <InventoryModal
        open={modalOpen}
        initialData={editItem}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        onSave={async (values) => {
          if (editItem) {
            await updateMutation.mutateAsync({ id: editItem.id, values });
          } else {
            await createMutation.mutateAsync(values);
          }
        }}
      />
    </div>
  );
}
