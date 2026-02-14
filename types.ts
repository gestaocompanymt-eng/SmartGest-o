
export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
  SINDICO_ADMIN = 'SINDICO_ADMIN',
  RONDA = 'RONDA'
}

export enum ContractType {
  CONTINUOUS = 'Manutenção Continuada',
  ON_DEMAND = 'Atendimento Avulso'
}

export enum OSType {
  PREVENTIVE = 'Preventiva',
  CORRETIVE = 'Corretiva',
  SERVICE = 'Serviço Avulso',
  VISTORIA = 'Vistoria / Ronda'
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
  updated_at?: string;
}

export interface RefrigerationSpecs {
  refrigerant_type?: string;
  gas_charge?: string;
  capacity_btu?: string;
  compressor_model?: string;
}

export interface RefrigerationReadings {
  high_pressure?: number;
  low_pressure?: number;
  superheat?: number;
  subcooling?: number;
  filter_clean?: boolean;
  drain_clean?: boolean;
  evaporator_temp?: number;
  condenser_temp?: number;
}

// Interface para alertas de monitoramento Tuya/Telemetria
export interface MonitoringAlert {
  id: string;
  equipment_id: string;
  message: string;
  value: string | number;
  is_resolved: boolean;
  created_at: string;
}

// Interface para leituras de nível de água (telemetria ESP32)
export interface WaterLevelEntry {
  id: string;
  condominio_id: string;
  percentual: number;
  created_at: string;
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
  maintenance_period?: number;
  updated_at?: string;
  refrigeration_specs?: RefrigerationSpecs;
  // Campos de monitoramento Tuya
  tuya_device_id?: string;
  monitoring_status?: 'normal' | 'atencao' | 'critico';
  is_online?: boolean;
  last_reading?: {
    power: number;
    current: number;
    voltage: number;
    timestamp: string;
  };
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
  last_maintenance?: string;
  maintenance_period?: number;
  updated_at?: string;
  // Pontos de monitoramento para telemetria
  monitoring_points?: {
    id: string;
    device_id: string;
    name: string;
  }[];
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
  updated_at?: string;
  refrigeration_readings?: RefrigerationReadings;
  sync_status?: 'pending' | 'synced';
}

export interface Appointment {
  id: string;
  condo_id: string;
  technician_id: string;
  equipment_id?: string;
  system_id?: string;
  date: string;
  time: string;
  description: string;
  status: 'Pendente' | 'Confirmada' | 'Realizada' | 'Cancelada';
  is_recurring?: boolean;
  service_order_id?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  condo_id?: string;
  updated_at?: string;
}

export interface GithubConfig {
  token: string;
  repo: string;
  lastSync?: string;
}

export interface AppData {
  condos: Condo[];
  equipments: Equipment[];
  systems: System[];
  serviceOrders: ServiceOrder[];
  appointments: Appointment[];
  users: User[];
  equipmentTypes: EquipmentType[];
  systemTypes: SystemType[];
  currentUser: User | null;
  githubConfig?: GithubConfig;
  monitoringAlerts: MonitoringAlert[];
  waterLevels: WaterLevelEntry[];
}
