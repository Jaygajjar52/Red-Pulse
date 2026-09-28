import { getData, sendData, wrapPageResponse } from './httpHelpers';
import type { BloodGroup, BloodInventory, InventoryPayload, InventoryStockStatus, StockUpdatePayload } from '@/types';
import type { InventoryApi } from './contracts';
import { asEnumValue, asNumber, asString } from './typed';

const VALID_BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'] as const;

function normalizeInventory(inv: Record<string, unknown>): BloodInventory {
  return {
    id: String(inv.id ?? ''),
    hospitalId: String(inv.hospitalId ?? ''),
    bloodGroup: asEnumValue<BloodGroup>(inv.bloodGroup, VALID_BLOOD_GROUPS, 'O_POSITIVE') ?? 'O_POSITIVE',
    availableUnits: asNumber(inv.availableUnits) ?? asNumber(inv.quantityUnits) ?? 0,
    reservedUnits: asNumber(inv.reservedUnits) ?? 0,
    expiryDate: asString(inv.expiryDate) ?? '',
    stockStatus: asEnumValue<InventoryStockStatus>(inv.stockStatus ?? 'ADEQUATE', ['ADEQUATE', 'LOW', 'CRITICAL', 'EXPIRED'], 'ADEQUATE') ?? 'ADEQUATE',
    updatedAt: asString(inv.updatedAt) ?? asString(inv.lastUpdated) ?? '',
  };
}

export const inventoryApi: InventoryApi = {
  list: async (hospitalId: string, params?: Record<string, unknown>) => {
    const raw = await getData<unknown>(`/api/hospitals/${hospitalId}/inventory`, params);
    const paged = wrapPageResponse<Record<string, unknown>>(raw);
    return {
      ...paged,
      content: paged.content.map(normalizeInventory),
    };
  },
  getByGroup: async (hospitalId: string, bloodGroup: string) => {
    const res = await getData<Record<string, unknown>>(`/api/hospitals/${hospitalId}/inventory/${bloodGroup}`);
    return Array.isArray(res) ? res.map(normalizeInventory) : [normalizeInventory(res)];
  },
  create: async (hospitalId: string, payload: InventoryPayload) => {
    const body: Record<string, unknown> = {
      ...payload,
      quantityUnits: asNumber(payload.quantityUnits) ?? asNumber(payload.availableUnits),
    };
    const res = await sendData<Record<string, unknown>>('post', `/api/hospitals/${hospitalId}/inventory`, body);
    return normalizeInventory(res);
  },
  update: async (hospitalId: string, inventoryId: string, payload: InventoryPayload) => {
    const body: Record<string, unknown> = {
      ...payload,
      quantityUnits: asNumber(payload.quantityUnits) ?? asNumber(payload.availableUnits),
    };
    const res = await sendData<Record<string, unknown>>('put', `/api/hospitals/${hospitalId}/inventory/${inventoryId}`, body);
    return normalizeInventory(res);
  },
  updateStock: async (hospitalId: string, inventoryId: string, payload: StockUpdatePayload) => {
    const body: Record<string, unknown> = {
      ...payload,
      units: asNumber(payload.units) ?? asNumber(payload.availableUnits),
      action: asString(payload.action) ?? 'SET',
    };
    const res = await sendData<Record<string, unknown>>('patch', `/api/hospitals/${hospitalId}/inventory/${inventoryId}/stock`, body);
    return normalizeInventory(res);
  },
  lowStock: async (hospitalId: string) => {
    const res = await getData<Record<string, unknown>[]>(`/api/hospitals/${hospitalId}/inventory/low-stock`);
    return Array.isArray(res) ? res.map(normalizeInventory) : [];
  },
  expiring: async (hospitalId: string) => {
    const res = await getData<Record<string, unknown>[]>(`/api/hospitals/${hospitalId}/inventory/expiring`);
    return Array.isArray(res) ? res.map(normalizeInventory) : [];
  },
};
