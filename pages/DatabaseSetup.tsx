
import React from 'react';
import { Database, Copy, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- SCRIPT DE CONFIGURAÇÃO SMARTGESTÃO (VERSÃO V5.7)
-- Cole este código no SQL Editor do seu projeto Supabase e clique em "RUN"

-- 1. Tabela de Condomínios
CREATE TABLE IF NOT EXISTS condos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  manager TEXT,
  contract_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  condo_id TEXT REFERENCES condos(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Equipamentos
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
  tuya_device_id TEXT,
  monitoring_status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Sistemas
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

-- 5. Tabela de Ordens de Serviço
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
  technician_id TEXT,
  service_value NUMERIC DEFAULT 0,
  material_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Agendamentos
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

-- 7. Tabela de Nível de Reservatório (Telemetria)
CREATE TABLE IF NOT EXISTS nivel_caixa (
  id BIGSERIAL PRIMARY KEY,
  condominio_id TEXT,
  percentual NUMERIC,
  nivel_cm NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Alertas de Monitoramento (Anomalias IOT)
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id TEXT PRIMARY KEY,
  equipment_id TEXT REFERENCES equipments(id),
  message TEXT,
  value TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nivel_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso total (Simplificado para o app)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acesso Total" ON condos;
    DROP POLICY IF EXISTS "Acesso Total" ON users;
    DROP POLICY IF EXISTS "Acesso Total" ON equipments;
    DROP POLICY IF EXISTS "Acesso Total" ON systems;
    DROP POLICY IF EXISTS "Acesso Total" ON service_orders;
    DROP POLICY IF EXISTS "Acesso Total" ON appointments;
    DROP POLICY IF EXISTS "Acesso Total" ON nivel_caixa;
    DROP POLICY IF EXISTS "Acesso Total" ON monitoring_alerts;
    
    CREATE POLICY "Acesso Total" ON condos FOR ALL USING (true);
    CREATE POLICY "Acesso Total" ON users FOR ALL USING (true);
    CREATE POLICY "Acesso Total" ON equipments FOR ALL USING (true);
    CREATE POLICY "Acesso Total" ON systems FOR ALL USING (true);
    CREATE POLICY "Acesso Total" ON service_orders FOR ALL USING (true);
    CREATE POLICY "Acesso Total" ON appointments FOR ALL USING (true);
    CREATE POLICY "Acesso Total" ON nivel_caixa FOR ALL USING (true);
    CREATE POLICY "Acesso Total" ON monitoring_alerts FOR ALL USING (true);
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
            <h1 className="text-xl font-black text-slate-900">Configuração de Infraestrutura</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sincronização Supabase Cloud</p>
          </div>
        </div>

        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <p className="text-sm font-black text-amber-900 uppercase">Atenção Necessária</p>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Para garantir que o Celular e o Notebook tenham os mesmos dados, o script agora inclui a tabela de <strong>Alertas/Anomalias</strong>. Execute este script no Supabase para ativar a sincronização total.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={handleCopy}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-50 border'
              }`}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>
          
          <div className="bg-slate-900 rounded-3xl p-6 pt-16 overflow-hidden">
            <div className="flex items-center space-x-2 mb-4 text-slate-500">
               <Terminal size={14} />
               <span className="text-[9px] font-black uppercase tracking-widest">Supabase SQL Editor</span>
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
