
import React from 'react';
import { Database, Copy, CheckCircle2, AlertTriangle, Terminal, ShieldCheck } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- SCRIPT DE REPARAÇÃO SMARTGESTÃO (VERSÃO V6.0 - FIX TOTAL CLOUD)
-- Execute este script para resolver "Erro ao gravar na nuvem" definitivamente.

-- 1. GARANTIR FUNÇÃO DE TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. CORREÇÃO DE ESTRUTURA (FORÇA CRIAÇÃO DE COLUNAS TÉCNICAS)
DO $$
BEGIN
    -- EQUIPAMENTOS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipments' AND column_name='last_reading') THEN
        ALTER TABLE equipments ADD COLUMN last_reading JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipments' AND column_name='refrigeration_specs') THEN
        ALTER TABLE equipments ADD COLUMN refrigeration_specs JSONB DEFAULT '{}';
    END IF;

    -- ORDENS DE SERVIÇO
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='refrigeration_readings') THEN
        ALTER TABLE service_orders ADD COLUMN refrigeration_readings JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_orders' AND column_name='parts_replaced') THEN
        ALTER TABLE service_orders ADD COLUMN parts_replaced JSONB DEFAULT '[]';
    END IF;
    
    -- GARANTIR TIPOS NUMÉRICOS
    ALTER TABLE service_orders ALTER COLUMN service_value TYPE NUMERIC USING COALESCE(service_value, 0);
    ALTER TABLE service_orders ALTER COLUMN material_value TYPE NUMERIC USING COALESCE(material_value, 0);
END $$;

-- 3. CRIAÇÃO DAS TABELAS SE NÃO EXISTIREM (ESTRUTURA COMPLETA)
CREATE TABLE IF NOT EXISTS condos (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, manager TEXT, contract_type TEXT, start_date TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT, role TEXT NOT NULL, condo_id TEXT, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS equipments (id TEXT PRIMARY KEY, condo_id TEXT, type_id TEXT, manufacturer TEXT, model TEXT, power TEXT, voltage TEXT, nominal_current NUMERIC, measured_current NUMERIC, temperature NUMERIC, noise TEXT, electrical_state TEXT, location TEXT, observations TEXT, photos JSONB DEFAULT '[]', last_maintenance TIMESTAMP WITH TIME ZONE, maintenance_period INTEGER, refrigeration_specs JSONB, last_reading JSONB, tuya_device_id TEXT, monitoring_status TEXT, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS systems (id TEXT PRIMARY KEY, condo_id TEXT, type_id TEXT, name TEXT, location TEXT, equipment_ids JSONB DEFAULT '[]', monitoring_points JSONB DEFAULT '[]', parameters TEXT, observations TEXT, last_maintenance TIMESTAMP WITH TIME ZONE, maintenance_period INTEGER, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS service_orders (id TEXT PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL, condo_id TEXT, location TEXT, equipment_id TEXT, system_id TEXT, problem_description TEXT, actions_performed TEXT, parts_replaced JSONB DEFAULT '[]', photos_before JSONB DEFAULT '[]', photos_after JSONB DEFAULT '[]', refrigeration_readings JSONB, technician_id TEXT, service_value NUMERIC DEFAULT 0, material_value NUMERIC DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), completed_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS appointments (id TEXT PRIMARY KEY, condo_id TEXT, technician_id TEXT, equipment_id TEXT, system_id TEXT, date TEXT, time TEXT, description TEXT, status TEXT, is_recurring BOOLEAN DEFAULT FALSE, service_order_id TEXT, updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS monitoring_alerts (id TEXT PRIMARY KEY, equipment_id TEXT, message TEXT, value TEXT, is_resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- 4. POLÍTICAS RLS (RESET TOTAL)
ALTER TABLE condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

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
            <h1 className="text-xl font-black text-slate-900 leading-none">Reparação de Banco Cloud</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Sincronizador V6.0</p>
          </div>
        </div>

        <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-red-600 shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-red-900 uppercase">Ação Obrigatória</p>
            <p className="text-[10px] text-red-700 font-bold leading-relaxed">
              O "Erro ao gravar na nuvem" é causado por conflitos de esquema. Copie o script abaixo, vá ao SQL Editor do Supabase e execute-o agora para resetar as permissões e colunas.
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
              <span>{copied ? 'Copiado!' : 'Copiar Script V6.0'}</span>
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
