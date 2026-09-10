import { getData, sendData } from './httpHelpers';
import type { InventoryApi } from './contracts';

export const inventoryApi: InventoryApi = {
  list: (hospitalId, params) => getData(`/api/hospitals/${hospitalId}/inventory`, params),
  getByGroup: (hospitalId, bloodGroup) => getData(`/api/hospitals/${hospitalId}/inventory/${bloodGroup}`),
  create: (hospitalId, payload) => sendData('post', `/api/hospitals/${hospitalId}/inventory`, payload),
  update: (hospitalId, inventoryId, payload) =>
    sendData('put', `/api/hospitals/${hospitalId}/inventory/${inventoryId}`, payload),
  updateStock: (hospitalId, inventoryId, payload) =>
    sendData('patch', `/api/hospitals/${hospitalId}/inventory/${inventoryId}/stock`, payload),
  lowStock: (hospitalId) => getData(`/api/hospitals/${hospitalId}/inventory/low-stock`),
  expiring: (hospitalId) => getData(`/api/hospitals/${hospitalId}/inventory/expiring`),
};
