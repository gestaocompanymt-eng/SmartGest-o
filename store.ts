
import { AppData, UserRole } from './types';
import { INITIAL_EQUIPMENT_TYPES, INITIAL_SYSTEM_TYPES } from './constants';

const STORAGE_KEY = 'smart_gestao_data_v5';

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
  waterLevels: [],
  monitoringAlerts: []
};

export const getStore = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;
  
  try {
    const parsedData: AppData = JSON.parse(saved);
    
    // Garantir integridade de arrays
    const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];
    
    const data: AppData = {
      ...initialData,
      ...parsedData,
      condos: ensureArray(parsedData.condos),
      equipments: ensureArray(parsedData.equipments),
      systems: ensureArray(parsedData.systems),
      serviceOrders: ensureArray(parsedData.serviceOrders),
      appointments: ensureArray(parsedData.appointments),
      users: ensureArray(parsedData.users),
      waterLevels: ensureArray(parsedData.waterLevels),
      monitoringAlerts: ensureArray(parsedData.monitoringAlerts),
    };
    
    return data;
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
