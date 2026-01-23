
export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN'
}

export enum ContractType {
  CONTINUOUS = 'Manutenção Continuada',
  ON_DEMAND = 'Atendimento Avulso'
}

export enum OSType {
  PREVENTIVE = 'Preventiva',
  CORRECTIVE = 'Corretiva',
  SERVICE = 'Serviço Avulso'
}

export enum OSStatus {
  OPEN = 'Aberta',
  IN_PROGRESS = 'Em Execução',
  COMPLETED = 'Concluída',
  CANCELLED = 'Cancelada'
}

export interface EquipmentType {
  id: string;
  name: string;
}

export interface SystemType {
  id: string;
  name: string;
}

export interface Condo {
  id: string;
  name: string;
  address: string;
  manager: string;
  contractType: ContractType;
  startDate: string;
}

export interface Equipment {
  id: string;
  condoId: string;
  typeId: string;
  manufacturer: string;
  model: string;
  power: string;
  voltage: string;
  nominalCurrent: number;
  measuredCurrent: number;
  temperature: number;
  noise: 'Normal' | 'Anormal';
  electricalState: 'Bom' | 'Regular' | 'Crítico';
  location: string;
  observations: string;
  photos: string[];
  lastMaintenance: string;
}

export interface System {
  id: string;
  condoId: string;
  typeId: string;
  name: string;
  equipmentIds: string[];
  parameters: string;
  observations: string;
}

export interface ServiceOrder {
  id: string;
  type: OSType;
  status: OSStatus;
  condoId: string;
  equipmentId?: string;
  systemId?: string;
  problemDescription: string;
  actionsPerformed: string;
  partsReplaced: string[];
  photosBefore: string[];
  photosAfter: string[];
  technicianId: string;
  createdAt: string;
  completedAt?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
}

// AppData interface centralizing the application state structure
export interface AppData {
  condos: Condo[];
  equipments: Equipment[];
  systems: System[];
  serviceOrders: ServiceOrder[];
  users: User[];
  equipmentTypes: EquipmentType[];
  systemTypes: SystemType[];
  currentUser: User | null;
}
