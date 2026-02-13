
import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, ShieldCheck, Code, Database, Server, Info, Library } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCpp, setCopiedCpp] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'esp32'>('sql');

  const sqlScript = `-- 🚀 SMARTGESTÃO: SCRIPT DE RECONSTRUÇÃO TOTAL V12
-- Finalidade: Reset completo, criação de tabelas e Políticas RLS funcionais.

-- ==========================================
-- 1. LIMPEZA TOTAL (RESET)
-- ==========================================
DROP TABLE IF EXISTS nivel_caixa, monitoring_alerts, appointments, service_orders, systems, equipments, users, condos, system_types, equipment_types CASCADE;

-- ==========================================
-- 2. TABELAS DE APOIO E CONFIGURAÇÃO
-- ==========================================
CREATE TABLE equipment_types (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE system_types (id TEXT PRIMARY KEY, name TEXT NOT NULL);

-- ==========================================
-- 3. NÚCLEO: CONDOMÍNIOS E USUÁRIOS
-- ==========================================
CREATE TABLE condos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    manager TEXT,
    contract_type TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    condo_id TEXT REFERENCES condos(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ATIVOS E SISTEMAS
-- ==========================================
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
    tuya_device_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE systems (
    id TEXT PRIMARY KEY,
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    type_id TEXT REFERENCES system_types(id),
    name TEXT NOT NULL,
    location TEXT,
    equipment_ids TEXT[] DEFAULT '{}',
    monitoring_points JSONB DEFAULT '[]',
    parameters TEXT,
    observations TEXT,
    last_maintenance DATE DEFAULT CURRENT_DATE,
    maintenance_period INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. OPERAÇÃO (ORDENS DE SERVIÇO E AGENDA)
-- ==========================================
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    technician_id TEXT,
    equipment_id TEXT REFERENCES equipments(id),
    system_id TEXT REFERENCES systems(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pendente',
    is_recurring BOOLEAN DEFAULT FALSE,
    service_order_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. TELEMETRIA IOT (NÍVEL E ALERTAS)
-- ==========================================
CREATE TABLE nivel_caixa (
    id BIGSERIAL PRIMARY KEY,
    condominio_id TEXT NOT NULL, -- Serial do ESP32
    percentual NUMERIC NOT NULL,
    nivel_cm NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE monitoring_alerts (
    id TEXT PRIMARY KEY,
    equipment_id TEXT REFERENCES equipments(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    value TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. CONFIGURAÇÕES DE REPLICAÇÃO (REALTIME)
-- ==========================================
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;
ALTER TABLE service_orders REPLICA IDENTITY FULL;

-- Tratamento de Publicação Realtime (Evita Erro 55000)
DO $$
DECLARE
    is_all_tables BOOLEAN;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    SELECT puballtables INTO is_all_tables FROM pg_publication WHERE pubname = 'supabase_realtime';

    IF NOT is_all_tables THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE 
                nivel_caixa, service_orders, monitoring_alerts, appointments, equipments, systems;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'Algumas tabelas já estão na publicação.';
        END;
    END IF;
END $$;

-- ==========================================
-- 8. POLÍTICAS RLS (SEGURANÇA FUNCIONAL)
-- ==========================================
-- Habilitamos o RLS, mas criamos políticas que permitem acesso total à chave 'anon' 
-- para garantir que o App e o ESP32 funcionem sem login complexo neste estágio.

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Acesso Total Anon" ON %I', t);
        EXECUTE format('CREATE POLICY "Acesso Total Anon" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- Permissões de Banco
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ==========================================
-- 9. DADOS INICIAIS (ESSENCIAL)
-- ==========================================
INSERT INTO equipment_types (id, name) VALUES 
('1', 'Bombas'), ('2', 'Exaustores'), ('3', 'SPA'), ('4', 'Aquecedores de Piscina'), 
('5', 'Sauna'), ('6', 'Aquecimento de Água'), ('7', 'Elétrica e Automação'), ('8', 'Ar Condicionado / Refrigeração')
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_types (id, name) VALUES 
('1', 'Aquecimento de Água Central'), ('2', 'Aquecimento de Piscina'), ('3', 'Sistema de SPA'), 
('4', 'Sistema de Sauna'), ('5', 'Sistema de Pressurização'), ('6', 'Sistema de Exaustão'), 
('7', 'Sistema de Ar Condicionado / Climatização')
ON CONFLICT (id) DO NOTHING;

-- ✅ FIM DO SCRIPT V12
`;

  const cppScript = `// 🤖 SMARTGESTÃO IOT CLIENT V9.5 - ESP32
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "NOME_DO_SEU_WIFI";
const char* password = "SENHA_DO_SEU_WIFI";
const char* supabase_url = "https://rlldyyipyapkehtxwvqk.supabase.co/rest/v1/nivel_caixa";
const char* supabase_key = "sb_publishable_mOmsdU6uKC0eI6_ppTiHhQ_6NJD8jYv"; 
const char* device_id = "ESP32_TANQUE_01"; 

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nConectado!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(supabase_url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);

    StaticJsonDocument<200> doc;
    doc["condominio_id"] = device_id;
    doc["percentual"] = 100; // Altere para sua lógica de sensor

    String json;
    serializeJson(doc, json);
    int code = http.POST(json);
    Serial.printf("Envio: %d\\n", code);
    http.end();
  }
  delay(10000);
}
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
            <h1 className="text-xl font-black text-slate-900 leading-none">Reconstrução V12</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Script Master com Políticas RLS</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
           <button onClick={() => setActiveTab('sql')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'sql' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>1. SQL Mestre</button>
           <button onClick={() => setActiveTab('esp32')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'esp32' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>2. ESP32</button>
        </div>
      </div>

      {activeTab === 'sql' ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
          <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-start space-x-4 mb-8">
            <Server className="text-blue-400 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-blue-400 uppercase">Instruções de Reconstrução</p>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                Este script deleta as tabelas antigas e cria novas com **Políticas RLS Ativas**. 
                Isso resolve o problema de permissão e garante que o Realtime funcione para todos os níveis (0-100%).
              </p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => handleCopy(sqlScript, setCopiedSql)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedSql ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
              {copiedSql ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>Copiar Script V12</span>
            </button>
            <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-800">
              <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">{sqlScript}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
          <div className="relative">
            <button onClick={() => handleCopy(cppScript, setCopiedCpp)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedCpp ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
              {copiedCpp ? <CheckCircle2 size={16} /> : <Code size={16} />}
              <span>Copiar ESP32</span>
            </button>
            <div className="bg-slate-800 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl">
              <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto leading-relaxed">{cppScript}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSetup;
