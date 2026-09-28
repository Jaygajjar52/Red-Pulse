import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from './Dialog';
import { Button } from '../common/Button';
import { Input, Textarea } from '../forms/Fields';
import { appointmentSchema, type AppointmentValues } from '@/schemas';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: AppointmentValues) => Promise<void>;
  donorId: string;
  hospitalId: string;
  bloodRequestId?: string;
}

export function AppointmentModal({ open, onClose, onSave, donorId, hospitalId, bloodRequestId }: AppointmentModalProps) {
  const form = useForm<AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      donorId,
      hospitalId,
      bloodRequestId,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      notes: '',
    },
  });

  return (
    <Modal
      open={open}
      title="Schedule Donation Appointment"
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
            Confirm Appointment
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          label="Date & Time"
          type="datetime-local"
          error={form.formState.errors.scheduledAt?.message}
          {...form.register('scheduledAt')}
        />
        <Textarea
          label="Notes (Optional)"
          placeholder="Any instructions or notes for hospital staff..."
          error={form.formState.errors.notes?.message}
          {...form.register('notes')}
        />
      </form>
    </Modal>
  );
}
