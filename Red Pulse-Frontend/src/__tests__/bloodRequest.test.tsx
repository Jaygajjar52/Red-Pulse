import { describe, it, expect } from 'vitest';
import { bloodRequestSchema } from '@/schemas';

describe('Blood Request Schema Validation', () => {
  it('validates a correct blood request payload', () => {
    const payload = {
      bloodGroup: 'O_POSITIVE',
      unitsRequired: 2,
      hospitalId: 'hospital-1',
      requiredDate: '2026-10-01',
      urgency: 'URGENT',
      description: 'Urgent surgery scheduled',
    };
    const result = bloodRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('fails validation when unitsRequired is negative or zero', () => {
    const payload = {
      bloodGroup: 'O_POSITIVE',
      unitsRequired: 0,
      hospitalId: 'hospital-1',
      requiredDate: '2026-10-01',
      urgency: 'NORMAL',
    };
    const result = bloodRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
