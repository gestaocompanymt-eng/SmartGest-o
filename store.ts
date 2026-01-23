
import { Condo, Equipment, System, ServiceOrder, User, EquipmentType, SystemType, AppData, UserRole } from './types';
import { INITIAL_EQUIPMENT_TYPES, INITIAL_SYSTEM_TYPES } from './constants';

const STORAGE_KEY = 'smart_gestao_data';

// AppData interface has been moved to types.ts to be shared across components

const initialData: AppData = {
  condos: [],
  equipments: [],
  systems: [],
  serviceOrders: [],
  users: [
    { id: 'admin1', name: 'Admin Principal', role: UserRole.ADMIN, email: 'admin' },
    { id: 'tech1', name: 'Carlos Técnico', role: UserRole.TECHNICIAN, email: 'carlos@smartgestao.com' }
  ],
  equipmentTypes: INITIAL_EQUIPMENT_TYPES,
  systemTypes: INITIAL_SYSTEM_TYPES,
  currentUser: null
};

export const getStore = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : initialData;
};

export const saveStore = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearStore = () => {
  localStorage.removeItem(STORAGE_KEY);
};
