import { describe, it, expect } from 'vitest';
import { inventorySchema } from '@/schemas';

describe('Inventory Schema Validation', () => {
  it('validates a valid inventory stock item', () => {
    const payload = {
      bloodGroup: 'A_NEGATIVE',
      availableUnits: 10,
      reservedUnits: 2,
      expiryDate: '2026-11-15',
    };
    const result = inventorySchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid blood group string', () => {
    const payload = {
      bloodGroup: 'INVALID_GROUP',
      availableUnits: 5,
      reservedUnits: 0,
      expiryDate: '2026-11-15',
    };
    const result = inventorySchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
