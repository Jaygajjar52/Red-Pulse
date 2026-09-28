export type JsonRecord = Record<string, unknown>;

export function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

export function asEnumValue<T extends string>(value: unknown, validValues: readonly T[], fallback?: T): T | undefined {
  if (typeof value !== 'string') return fallback;
  const exact = validValues.find((entry) => entry === value);
  if (exact) return exact;
  const normalized = value.toUpperCase();
  const match = validValues.find((entry) => entry.toUpperCase() === normalized);
  return match ?? fallback;
}

export function ensureRecord(value: unknown): JsonRecord | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return undefined;
}
