
export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
  CONDO_USER = 'CONDO_USER'
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
  contract_type: ContractType;
  start_date: string;
}

export interface Equipment {
  id: string;
  condo_id: string;
  type_id: string;
  manufacturer: string;
  model: string;
  power: string;
  voltage: string;
  nominal_current: number;
  measured_current: number;
  temperature: number;
  noise: 'Normal' | 'Anormal';
  electrical_state: 'Bom' | 'Regular' | 'Crítico';
  location: string;
  observations: string;
  photos: string[];
  last_maintenance: string;
  
  // Monitoring Extension (Tuya)
  tuya_device_id?: string;
  monitoring_status?: 'normal' | 'atencao' | 'critico';
  last_reading?: {
    power?: number;
    current?: number;
    voltage?: number;
    timestamp: string;
  };
  is_online?: boolean;
}

export interface MonitoringAlert {
  id: string;
  equipment_id: string;
  condo_id: string;
  severity: 'warning' | 'critical';
  message: string;
  value: string;
  timestamp: string;
  is_resolved: boolean;
}

export interface System {
  id: string;
  condo_id: string;
  type_id: string;
  name: string;
  location: string;
  equipment_ids: string[];
  parameters: string;
  observations: string;
}

export interface ServiceOrder {
  id: string;
  type: OSType;
  status: OSStatus;
  condo_id: string;
  location?: string;
  equipment_id?: string;
  system_id?: string; 
  problem_description: string;
  actions_performed: string;
  parts_replaced: string[];
  photos_before: string[];
  photos_after: string[];
  technician_id: string;
  created_at: string;
  completed_at?: string;
  service_value?: number;
  material_value?: number;
}

export interface Appointment {
  id: string;
  condo_id: string;
  technician_id: string;
  date: string;
  time: string;
  description: string;
  status: 'Pendente' | 'Confirmada' | 'Realizada' | 'Cancelada';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  condo_id?: string;
}

export interface AppData {
  condos: Condo[];
  equipments: Equipment[];
  systems: System[];
  serviceOrders: ServiceOrder[];
  appointments: Appointment[];
  monitoringAlerts: MonitoringAlert[];
  users: User[];
  equipmentTypes: EquipmentType[];
  systemTypes: SystemType[];
  currentUser: User | null;
}
