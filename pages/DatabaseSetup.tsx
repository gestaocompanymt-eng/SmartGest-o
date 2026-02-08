
import React from 'react';
import { Database, Copy, CheckCircle2, AlertTriangle, Terminal, ShieldCheck, Trash2, Rocket } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- 🚀 SMARTGESTÃO MASTER SCRIPT V8.0 (UNIFICAÇÃO TOTAL)
-- Este script limpa conflitos e reconstrói a base exata do App.
-- Instrução: Copie tudo e cole em um NOVO SQL Query no Supabase.

-- 1. LIMPEZA RADICAL DE CONFLITOS (Ordem correta para evitar erros de FK)
DROP TABLE IF EXISTS monitoring_alerts CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS service_orders CASCADE;
DROP TABLE IF EXISTS systems CASCADE;
DROP TABLE IF EXISTS equipments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS condos CASCADE;

-- 2. FUNÇÃO DE DATA AUTOMÁTICA
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. RECONSTRUÇÃO DA INFRAESTRUTURA

-- Tabela de Condomínios
CREATE TABLE condos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  manager TEXT,
  contract_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  condo_id TEXT REFERENCES condos(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Equipamentos (Com Refrigeração e IOT)
CREATE TABLE equipments (
  id TEXT PRIMARY KEY,
  condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
  type_id TEXT,
  manufacturer TEXT,
  model TEXT,
  power TEXT,
  voltage TEXT,
  nominal_current NUMERIC DEFAULT 0,
  measured_current NUMERIC DEFAULT 0,
  temperature NUMERIC DEFAULT 0,
  noise TEXT,
  electrical_state TEXT,
  location TEXT,
  observations TEXT,
  photos JSONB DEFAULT '[]',
  last_maintenance TIMESTAMP WITH TIME ZONE,
  maintenance_period INTEGER DEFAULT 30,
  refrigeration_specs JSONB DEFAULT '{}',
  last_reading JSONB DEFAULT '{}',
  tuya_device_id TEXT,
  monitoring_status TEXT DEFAULT 'normal',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sistemas
CREATE TABLE systems (
  id TEXT PRIMARY KEY,
  condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
  type_id TEXT,
  name TEXT,
  location TEXT,
  equipment_ids JSONB DEFAULT '[]',
  monitoring_points JSONB DEFAULT '[]',
  parameters TEXT,
  observations TEXT,
  last_maintenance TIMESTAMP WITH TIME ZONE,
  maintenance_period INTEGER DEFAULT 30,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Ordens de Serviço
CREATE TABLE service_orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
  location TEXT,
  equipment_id TEXT REFERENCES equipments(id) ON DELETE SET NULL,
  system_id TEXT REFERENCES systems(id) ON DELETE SET NULL,
  problem_description TEXT,
  actions_performed TEXT,
  parts_replaced JSONB DEFAULT '[]',
  photos_before JSONB DEFAULT '[]',
  photos_after JSONB DEFAULT '[]',
  refrigeration_readings JSONB DEFAULT '{}',
  technician_id TEXT,
  service_value NUMERIC DEFAULT 0,
  material_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Agendamentos
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
  technician_id TEXT,
  equipment_id TEXT,
  system_id TEXT,
  date TEXT,
  time TEXT,
  description TEXT,
  status TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  service_order_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Alertas IOT
CREATE TABLE monitoring_alerts (
  id TEXT PRIMARY KEY,
  equipment_id TEXT REFERENCES equipments(id) ON DELETE CASCADE,
  message TEXT,
  value TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TELEMETRIA (Mantida a estrutura atual)
CREATE TABLE IF NOT EXISTS nivel_caixa (
  id BIGSERIAL PRIMARY KEY,
  condominio_id TEXT,
  percentual NUMERIC,
  nivel_cm NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. GATILHOS DE ATUALIZAÇÃO
CREATE TRIGGER tr_condos_upd BEFORE UPDATE ON condos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_equipments_upd BEFORE UPDATE ON equipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_systems_upd BEFORE UPDATE ON systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_os_upd BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_appts_upd BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_alerts_upd BEFORE UPDATE ON monitoring_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. PERMISSÕES GLOBAIS (Resolve erros de permissão no App)
ALTER TABLE condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nivel_caixa ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Full Access" ON %I', t);
        EXECUTE format('CREATE POLICY "Public Full Access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
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
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Rocket size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">Unificação de Banco V8.0</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Script Mestre Consolidado</p>
          </div>
        </div>

        <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-amber-900 uppercase">Atenção Síndico / Gestor</p>
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
              O script abaixo remove as tabelas antigas (exceto a de telemetria de nível) para criar uma estrutura limpa. Isso apagará dados que não foram sincronizados corretamente antes, mas garantirá que o erro de gravação suma para sempre.
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
              <span>{copied ? 'Copiado!' : 'Copiar Script Unificado'}</span>
            </button>
          </div>
          
          <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl">
            <div className="flex items-center space-x-2 mb-6 text-slate-500">
               <Terminal size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console Supabase (SQL Editor)</span>
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
