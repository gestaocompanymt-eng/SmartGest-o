
import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, ShieldCheck, Code, Database, Server, Info, Library, HelpCircle, Cpu, Zap, ChevronRight } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCpp, setCopiedCpp] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'esp32' | 'help'>('sql');

  const sqlScript = `-- 🚀 SMARTGESTÃO: SCRIPT DE INFRAESTRUTURA V13 (OTIMIZADO)
-- Finalidade: Reconstrução com ÍNDICES DE PERFORMANCE para evitar gargalos.

-- 1. LIMPEZA TOTAL
DROP TABLE IF EXISTS nivel_caixa, monitoring_alerts, appointments, service_orders, systems, equipments, users, condos, system_types, equipment_types CASCADE;

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
    tuya_device_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_equipments_condo_id ON equipments(condo_id);

CREATE TABLE nivel_caixa (
    id BIGSERIAL PRIMARY KEY,
    condominio_id TEXT NOT NULL,
    percentual NUMERIC NOT NULL,
    nivel_cm NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_nivel_device_id ON nivel_caixa(condominio_id);
CREATE INDEX idx_nivel_created_at ON nivel_caixa(created_at DESC);

-- 4. REALTIME CONFIG
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE nivel_caixa;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Publicação já ativa.';
    END;
END $$;

-- 5. RLS & PERMISSÕES
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
`;

  const cppScript = `// 🤖 SMARTGESTÃO IOT V9.5
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
  Serial.println("\\nWiFi OK!");
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
    doc["percentual"] = 100; // Simulação de tanque cheio

    String json;
    serializeJson(doc, json);
    int httpResponseCode = http.POST(json);
    Serial.printf("HTTP Response code: %d\\n", httpResponseCode);
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
            <h1 className="text-xl font-black text-slate-900 leading-none">Infraestrutura V14</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Sincronismo IOT e Diagnóstico</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
           <button onClick={() => setActiveTab('sql')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'sql' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>1. SQL Mestre</button>
           <button onClick={() => setActiveTab('esp32')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'esp32' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>2. ESP32 Code</button>
           <button onClick={() => setActiveTab('help')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'help' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-600'}`}>3. Erro de Upload?</button>
        </div>
      </div>

      {activeTab === 'sql' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 animate-in fade-in zoom-in-95">
          <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-start space-x-4 mb-8">
            <Server className="text-blue-400 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-blue-400 uppercase">Script de Performance</p>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Execute este script no SQL Editor do Supabase para otimizar as consultas.</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => handleCopy(sqlScript, setCopiedSql)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedSql ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
              {copiedSql ? <CheckCircle2 size={16} /> : <Database size={16} />}
              <span>Copiar SQL</span>
            </button>
            <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-800">
              <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">{sqlScript}</pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'esp32' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 animate-in fade-in zoom-in-95">
          <div className="relative">
            <button onClick={() => handleCopy(cppScript, setCopiedCpp)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedCpp ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
              {copiedCpp ? <CheckCircle2 size={16} /> : <Code size={16} />}
              <span>Copiar C++</span>
            </button>
            <div className="bg-slate-800 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl">
              <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto leading-relaxed">{cppScript}</pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Erro: "Failed to connect to ESP32"</h2>
              <p className="text-xs text-slate-500 font-bold">O erro 0x13 significa que a placa não está no modo de gravação.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-start space-x-4">
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">1</div>
                <div>
                  <p className="font-black text-slate-900 uppercase text-xs mb-1">Método do Botão BOOT</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                    Ao clicar em "Upload" no Arduino IDE, espere aparecer os pontos <code className="bg-slate-200 px-1 rounded">Connecting.......</code>. 
                    Nesse momento, **mantenha pressionado o botão BOOT** (ou IO0) da placa até que a porcentagem de gravação apareça.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-start space-x-4">
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">2</div>
                <div>
                  <p className="font-black text-slate-900 uppercase text-xs mb-1">Verifique o Cabo e Porta</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                    Certifique-se que o cabo USB é de **DADOS** e não apenas de carga. Verifique em <code className="bg-slate-200 px-1 rounded">Ferramentas -> Porta</code> se a porta COM correta está selecionada.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-start space-x-4">
                <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-black text-amber-900 uppercase text-xs mb-1">Dica de Hardware (Definitiva)</p>
                  <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
                    Se você precisa segurar o botão toda vez, solde um **capacitor eletrolítico de 10uF** entre os pinos **EN** e **GND**. Isso automatiza o reset para gravação.
                  </p>
                </div>
              </div>
            </div>

            <button onClick={() => setActiveTab('esp32')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center group transition-all">
              <ChevronRight size={16} className="mr-2 group-hover:translate-x-1 transition-transform" />
              Tentar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSetup;
