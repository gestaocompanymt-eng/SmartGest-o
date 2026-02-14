
import React, { useState } from 'react';
import { Copy, CheckCircle2, Database, Server, Info } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlScript = `-- 🚀 SMARTGESTÃO: SCRIPT CORE V15
-- Finalidade: Estrutura essencial de gestão predial.

-- 1. LIMPEZA TOTAL
DROP TABLE IF EXISTS appointments, service_orders, systems, equipments, users, condos, system_types, equipment_types CASCADE;

-- 2. TABELAS BASE
CREATE TABLE equipment_types (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE system_types (id TEXT PRIMARY KEY, name TEXT NOT NULL);

CREATE TABLE condos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    manager TEXT,
    contract_type TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICES DE PERFORMANCE
CREATE INDEX idx_condos_name ON condos(name);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    condo_id TEXT REFERENCES condos(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_condo_id ON users(condo_id);

CREATE TABLE equipments (
    id TEXT PRIMARY KEY,
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    type_id TEXT REFERENCES equipment_types(id),
    manufacturer TEXT,
    model TEXT,
    power TEXT,
    voltage TEXT,
    nominal_current NUMERIC DEFAULT 0,
    measured_current NUMERIC DEFAULT 0,
    temperature NUMERIC DEFAULT 0,
    noise TEXT DEFAULT 'Normal',
    electrical_state TEXT DEFAULT 'Bom',
    location TEXT,
    observations TEXT,
    photos TEXT[] DEFAULT '{}',
    last_maintenance DATE DEFAULT CURRENT_DATE,
    maintenance_period INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_equipments_condo_id ON equipments(condo_id);

CREATE TABLE systems (
    id TEXT PRIMARY KEY,
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    type_id TEXT REFERENCES system_types(id),
    name TEXT NOT NULL,
    location TEXT,
    equipment_ids TEXT[] DEFAULT '{}',
    parameters TEXT,
    observations TEXT,
    last_maintenance DATE DEFAULT CURRENT_DATE,
    maintenance_period INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_orders (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aberta',
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    equipment_id TEXT REFERENCES equipments(id),
    system_id TEXT REFERENCES systems(id),
    problem_description TEXT,
    actions_performed TEXT,
    parts_replaced TEXT[] DEFAULT '{}',
    photos_before TEXT[] DEFAULT '{}',
    photos_after TEXT[] DEFAULT '{}',
    technician_id TEXT,
    service_value NUMERIC DEFAULT 0,
    material_value NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS & PERMISSÕES
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Acesso Total" ON %I', t);
        EXECUTE format('CREATE POLICY "Acesso Total" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. SEED DATA
INSERT INTO equipment_types (id, name) VALUES 
('1', 'Bombas'), ('2', 'Exaustores'), ('3', 'SPA'), ('4', 'Aquecedores de Piscina'), 
('5', 'Sauna'), ('6', 'Aquecimento de Água'), ('7', 'Elétrica e Automação'), ('8', 'Ar Condicionado / Refrigeração')
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_types (id, name) VALUES 
('1', 'Aquecimento de Água Central'), ('2', 'Aquecimento de Piscina'), ('3', 'Sistema de SPA'), 
('4', 'Sistema de Sauna'), ('5', 'Sistema de Pressurização'), ('6', 'Sistema de Exaustão'), 
('7', 'Sistema de Ar Condicionado / Climatização')
ON CONFLICT (id) DO NOTHING;
`;

  const handleCopy = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">Configuração V15</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Estrutura Gestão Predial</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-start space-x-4 mb-8">
          <Server className="text-blue-400 shrink-0 mt-1" size={24} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-400 uppercase">Script de Reconstrução</p>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
              Este script remove toda a camada de telemetria e reconstrói as tabelas core de gestão.
            </p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => handleCopy(sqlScript, setCopiedSql)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedSql ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
            {copiedSql ? <CheckCircle2 size={16} /> : <Database size={16} />}
            <span>Copiar SQL Core</span>
          </button>
          <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-800">
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">{sqlScript}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
