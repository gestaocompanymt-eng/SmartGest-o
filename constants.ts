
import { EquipmentType, SystemType } from './types';

export const INITIAL_EQUIPMENT_TYPES: EquipmentType[] = [
  { id: '1', name: 'Bombas' },
  { id: '2', name: 'Exaustores' },
  { id: '3', name: 'SPA' },
  { id: '4', name: 'Aquecedores de Piscina' },
  { id: '5', name: 'Sauna' },
  { id: '6', name: 'Aquecimento de Água' },
  { id: '7', name: 'Elétrica e Automação' },
  { id: '8', name: 'Ar Condicionado / Refrigeração' }
];

export const INITIAL_SYSTEM_TYPES: SystemType[] = [
  { id: '1', name: 'Aquecimento de Água Central' },
  { id: '2', name: 'Aquecimento de Piscina' },
  { id: '3', name: 'Sistema de SPA' },
  { id: '4', name: 'Sistema de Sauna' },
  { id: '5', name: 'Sistema de Pressurização' },
  { id: '6', name: 'Sistema de Exaustão' },
  { id: '7', name: 'Sistema de Ar Condicionado / Climatização' }
];

export const APP_CONFIG = {
  TITLE: 'SmartGestão',
  PRIMARY_COLOR: '#0f172a',
  ACCENT_COLOR: '#3b82f6'
};
