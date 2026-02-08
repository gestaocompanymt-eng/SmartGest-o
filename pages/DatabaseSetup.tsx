
import React from 'react';
import { Database, Copy, CheckCircle2, AlertTriangle, Terminal, ShieldCheck } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- SCRIPT DE INFRAESTRUTURA SMARTGESTÃO (VERSÃO V5.9 - FIX CLOUD SYNC)
-- Execute este script no SQL Editor do Supabase para corrigir erros de gravação.

-- 0. FUNÇÃO AUXILIAR PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. TABELA DE CONDOMÍNIOS
CREATE TABLE IF NOT EXISTS condos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  manager TEXT,
  contract_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  condo_id TEXT REFERENCES condos(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE EQUIPAMENTOS (COM CAMPOS DE TELEMETRIA)
CREATE TABLE IF NOT EXISTS equipments (
  id TEXT PRIMARY KEY,
  condo_id TEXT REFERENCES condos(id),
  type_id TEXT,
  manufacturer TEXT,
  model TEXT,
  power TEXT,
  voltage TEXT,
  nominal_current NUMERIC,
  measured_current NUMERIC,
  temperature NUMERIC,
  noise TEXT,
  electrical_state TEXT,
  location TEXT,
  observations TEXT,
  photos JSONB DEFAULT '[]',
  last_maintenance TIMESTAMP WITH TIME ZONE,
  maintenance_period INTEGER,
  refrigeration_specs JSONB,
  last_reading JSONB, -- ADICIONADO: Para telemetria Tuya/IOT
  tuya_device_id TEXT,
  monitoring_status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE SISTEMAS
CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY,
  condo_id TEXT REFERENCES condos(id),
  type_id TEXT,
  name TEXT,
  location TEXT,
  equipment_ids JSONB DEFAULT '[]',
  monitoring_points JSONB DEFAULT '[]',
  parameters TEXT,
  observations TEXT,
  last_maintenance TIMESTAMP WITH TIME ZONE,
  maintenance_period INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE ORDENS DE SERVIÇO (COM CAMPOS TÉCNICOS)
CREATE TABLE IF NOT EXISTS service_orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  condo_id TEXT REFERENCES condos(id),
  location TEXT,
  equipment_id TEXT REFERENCES equipments(id),
  system_id TEXT REFERENCES systems(id),
  problem_description TEXT,
  actions_performed TEXT,
  parts_replaced JSONB DEFAULT '[]',
  photos_before JSONB DEFAULT '[]',
  photos_after JSONB DEFAULT '[]',
  refrigeration_readings JSONB, -- ADICIONADO: Para dados de ar condicionado
  technician_id TEXT,
  service_value NUMERIC DEFAULT 0,
  material_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  condo_id TEXT REFERENCES condos(id),
  technician_id TEXT,
  equipment_id TEXT REFERENCES equipments(id),
  system_id TEXT REFERENCES systems(id),
  date TEXT,
  time TEXT,
  description TEXT,
  status TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  service_order_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TELEMETRIA (NÍVEL DE RESERVATÓRIO)
CREATE TABLE IF NOT EXISTS nivel_caixa (
  id BIGSERIAL PRIMARY KEY,
  condominio_id TEXT,
  percentual NUMERIC,
  nivel_cm NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ALERTAS DE MONITORAMENTO IOT
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id TEXT PRIMARY KEY,
  equipment_id TEXT REFERENCES equipments(id),
  message TEXT,
  value TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. APLICAÇÃO DE GATILHOS (AUTO-TIMESTAMP)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS tr_condos_updated ON condos;
    DROP TRIGGER IF EXISTS tr_users_updated ON users;
    DROP TRIGGER IF EXISTS tr_equipments_updated ON equipments;
    DROP TRIGGER IF EXISTS tr_systems_updated ON systems;
    DROP TRIGGER IF EXISTS tr_os_updated ON service_orders;
    DROP TRIGGER IF EXISTS tr_appts_updated ON appointments;
    DROP TRIGGER IF EXISTS tr_alerts_updated ON monitoring_alerts;

    CREATE TRIGGER tr_condos_updated BEFORE UPDATE ON condos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER tr_equipments_updated BEFORE UPDATE ON equipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER tr_systems_updated BEFORE UPDATE ON systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER tr_os_updated BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER tr_appts_updated BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER tr_alerts_updated BEFORE UPDATE ON monitoring_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- 10. POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nivel_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- 11. CRIAÇÃO DE POLÍTICAS DE ACESSO TOTAL
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Full Access" ON %I', t);
        EXECUTE format('CREATE POLICY "Full Access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">Ajuste de Banco Cloud</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Correção de Esquema V5.9</p>
          </div>
        </div>

        <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-amber-900 uppercase">Atenção Necessária</p>
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
              O erro de gravação ocorre porque o banco de dados não conhece as novas colunas técnicas de telemetria e refrigeração. Copie e execute o script abaixo para atualizar a estrutura.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={handleCopy}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl active:scale-95 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-50 border'
              }`}
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copiado!' : 'Copiar Script de Correção'}</span>
            </button>
          </div>
          
          <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl">
            <div className="flex items-center space-x-2 mb-6 text-slate-500">
               <Terminal size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console Supabase SQL Editor</span>
            </div>
            <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto custom-scrollbar leading-relaxed">
              {sqlScript}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
