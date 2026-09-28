import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from './Dialog';
import { Button } from '../common/Button';
import { Input, Select } from '../forms/Fields';
import { inventorySchema, type InventoryValues } from '@/schemas';
import type { BloodInventory } from '@/types';
import { BLOOD_GROUPS } from '@/constants/blood';

interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: InventoryValues) => Promise<void>;
  initialData?: BloodInventory | null;
}

export function InventoryModal({ open, onClose, onSave, initialData }: InventoryModalProps) {
  const form = useForm<InventoryValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: initialData
      ? {
          bloodGroup: initialData.bloodGroup,
          availableUnits: initialData.availableUnits,
          reservedUnits: initialData.reservedUnits,
          expiryDate: initialData.expiryDate?.split('T')[0] ?? '',
        }
      : {
          bloodGroup: 'O_POSITIVE',
          availableUnits: 1,
          reservedUnits: 0,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
  });

  return (
    <Modal
      open={open}
      title={initialData ? 'Update Blood Inventory' : 'Add Blood Inventory'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={form.formState.isSubmitting}
            onClick={form.handleSubmit(async (values) => {
              await onSave(values);
              form.reset();
              onClose();
            })}
          >
            Save Stock
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Select
          label="Blood Group"
          options={BLOOD_GROUPS.map((bg) => ({ value: bg.value, label: bg.label }))}
          error={form.formState.errors.bloodGroup?.message}
          {...form.register('bloodGroup')}
        />
        <Input
          label="Available Units"
          type="number"
          min={0}
          error={form.formState.errors.availableUnits?.message}
          {...form.register('availableUnits', { valueAsNumber: true })}
        />
        <Input
          label="Reserved Units"
          type="number"
          min={0}
          error={form.formState.errors.reservedUnits?.message}
          {...form.register('reservedUnits', { valueAsNumber: true })}
        />
        <Input
          label="Expiry Date"
          type="date"
          error={form.formState.errors.expiryDate?.message}
          {...form.register('expiryDate')}
        />
      </form>
    </Modal>
  );
}
