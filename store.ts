
import { AppData, UserRole } from './types';
import { INITIAL_EQUIPMENT_TYPES, INITIAL_SYSTEM_TYPES } from './constants';

const STORAGE_KEY = 'smart_gestao_data_v3';

// Added monitoringAlerts to initialData
const initialData: AppData = {
  condos: [],
  equipments: [],
  systems: [],
  serviceOrders: [],
  appointments: [],
  waterLevels: [],
  users: [
    { id: 'admin1', name: 'Admin Principal', role: UserRole.ADMIN, email: 'admin', password: '41414889Ai' },
    { id: 'tech1', name: 'Carlos Técnico', role: UserRole.TECHNICIAN, email: 'carlos@smartgestao.com', password: '123' }
  ],
  equipmentTypes: INITIAL_EQUIPMENT_TYPES,
  systemTypes: INITIAL_SYSTEM_TYPES,
  currentUser: null,
  monitoringAlerts: []
};

export const getStore = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;
  
  try {
    const parsedData: AppData = JSON.parse(saved);
    
    initialData.users.forEach(defaultUser => {
      const exists = parsedData.users?.some(u => u.email.toLowerCase() === defaultUser.email.toLowerCase());
      if (!exists) {
        if (!parsedData.users) parsedData.users = [];
        parsedData.users.push(defaultUser);
      }
    });

    if (!parsedData.appointments) parsedData.appointments = [];
    if (!parsedData.condos) parsedData.condos = [];
    if (!parsedData.equipments) parsedData.equipments = [];
    if (!parsedData.systems) parsedData.systems = [];
    if (!parsedData.serviceOrders) parsedData.serviceOrders = [];
    if (!parsedData.waterLevels) parsedData.waterLevels = [];
    if (!parsedData.users) parsedData.users = [];
    if (!parsedData.equipmentTypes) parsedData.equipmentTypes = INITIAL_EQUIPMENT_TYPES;
    if (!parsedData.systemTypes) parsedData.systemTypes = INITIAL_SYSTEM_TYPES;
    // Added fallback initialization for monitoringAlerts field
    if (!parsedData.monitoringAlerts) parsedData.monitoringAlerts = [];
    
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
    console.error("Falha ao salvar no LocalStorage:", e);
    return false;
  }
};

export const clearStore = () => {
  localStorage.removeItem(STORAGE_KEY);
};
