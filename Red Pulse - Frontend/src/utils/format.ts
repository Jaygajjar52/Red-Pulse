import { BLOOD_GROUP_LABELS } from '@/constants/blood';
import type { BloodGroup } from '@/types';

export function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatBloodGroup(group?: BloodGroup): string {
  if (!group) return '—';
  return BLOOD_GROUP_LABELS[group] ?? group;
}

export function displayName(first?: string, last?: string): string {
  return [first, last].filter(Boolean).join(' ') || 'Red Pulse user';
}

export function formatDistance(km?: number): string {
  if (km === undefined || km === null) return 'Approximate distance unavailable';
  return `${km.toFixed(1)} km approx.`;
}
