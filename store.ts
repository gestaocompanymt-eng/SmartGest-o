
import { AppData, UserRole } from './types';
import { INITIAL_EQUIPMENT_TYPES, INITIAL_SYSTEM_TYPES } from './constants';

const STORAGE_KEY = 'smart_gestao_data_v5_clean';

const initialData: AppData = {
  condos: [],
  equipments: [],
  systems: [],
  serviceOrders: [],
  appointments: [],
  users: [
    { id: 'admin1', name: 'Admin Principal', role: UserRole.ADMIN, email: 'admin', password: '41414889Ai' },
    { id: 'master', name: 'Adriano Master', role: UserRole.ADMIN, email: 'master', password: '123' }
  ],
  equipmentTypes: INITIAL_EQUIPMENT_TYPES,
  systemTypes: INITIAL_SYSTEM_TYPES,
  currentUser: null,
  monitoringAlerts: [],
  waterLevels: []
};

export const getStore = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;
  
  try {
    const parsedData: AppData = JSON.parse(saved);
    const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];
    
    const mergeTypes = (initial: any[], saved: any[]) => {
      const merged = [...ensureArray(saved)];
      initial.forEach(initItem => {
        if (!merged.find(m => m.id === initItem.id)) {
          merged.push(initItem);
        } else {
          const idx = merged.findIndex(m => m.id === initItem.id);
          merged[idx] = initItem;
        }
      });
      return merged;
    };
    
    return {
      ...initialData,
      ...parsedData,
      condos: ensureArray(parsedData.condos),
      equipments: ensureArray(parsedData.equipments),
      systems: ensureArray(parsedData.systems),
      serviceOrders: ensureArray(parsedData.serviceOrders),
      appointments: ensureArray(parsedData.appointments),
      users: ensureArray(parsedData.users),
      equipmentTypes: mergeTypes(INITIAL_EQUIPMENT_TYPES, parsedData.equipmentTypes),
      systemTypes: mergeTypes(INITIAL_SYSTEM_TYPES, parsedData.systemTypes),
      monitoringAlerts: ensureArray(parsedData.monitoringAlerts),
      waterLevels: ensureArray(parsedData.waterLevels)
    };
  } catch (e) {
    return initialData;
  }
};

export const saveStore = (data: AppData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Erro ao persistir dados localmente:", e);
    return false;
  }
};

export const clearStore = () => {
  localStorage.removeItem(STORAGE_KEY);
};
