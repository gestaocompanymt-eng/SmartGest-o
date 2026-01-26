
import { AppData, UserRole } from './types';
import { INITIAL_EQUIPMENT_TYPES, INITIAL_SYSTEM_TYPES } from './constants';

const STORAGE_KEY = 'smart_gestao_data';

const initialData: AppData = {
  condos: [],
  equipments: [],
  systems: [],
  serviceOrders: [],
  users: [
    { id: 'admin1', name: 'Admin Principal', role: UserRole.ADMIN, email: 'admin', password: '41414889Ai' },
    { id: 'tech1', name: 'Carlos Técnico', role: UserRole.TECHNICIAN, email: 'carlos@smartgestao.com', password: '123' }
  ],
  equipmentTypes: INITIAL_EQUIPMENT_TYPES,
  systemTypes: INITIAL_SYSTEM_TYPES,
  currentUser: null
};

export const getStore = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;
  
  try {
    const parsedData: AppData = JSON.parse(saved);
    
    // Garantir que os usuários básicos sempre existam para evitar bloqueios por dados antigos
    initialData.users.forEach(defaultUser => {
      const exists = parsedData.users.some(u => u.email.toLowerCase() === defaultUser.email.toLowerCase());
      if (!exists) {
        parsedData.users.push(defaultUser);
      }
    });
    
    return parsedData;
  } catch (e) {
    return initialData;
  }
};

export const saveStore = (data: AppData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Falha ao salvar no LocalStorage (provavelmente cheio):", e);
    return false;
  }
};

export const clearStore = () => {
  localStorage.removeItem(STORAGE_KEY);
};
