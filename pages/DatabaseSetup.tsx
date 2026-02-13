
import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, Rocket, ShieldCheck, Cpu, Code, Database, ChevronRight, Info, Library, Server } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCpp, setCopiedCpp] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'esp32'>('sql');

  const sqlScript = `-- 🚀 SMARTGESTÃO: SCRIPT DE INFRAESTRUTURA COMPLETA (V10)
-- Finalidade: Criar do zero todas as tabelas e políticas necessárias.
-- Local: Execute no "SQL Editor" do seu projeto Supabase.

-- ==========================================
-- 1. LIMPEZA DE SEGURANÇA (OPCIONAL)
-- ==========================================
-- DROP TABLE IF EXISTS nivel_caixa, monitoring_alerts, service_orders, appointments, equipments, systems, condos, users, equipment_types, system_types CASCADE;

-- ==========================================
-- 2. CRIAÇÃO DAS TABELAS DE APOIO
-- ==========================================

CREATE TABLE IF NOT EXISTS equipment_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- ==========================================
-- 3. TABELA DE CONDOMÍNIOS E USUÁRIOS
-- ==========================================

CREATE TABLE IF NOT EXISTS condos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    manager TEXT,
    contract_type TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS equipments (
    id TEXT PRIMARY KEY,
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    type_id TEXT REFERENCES equipment_types(id),
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
    photos TEXT[],
    last_maintenance DATE,
    maintenance_period INTEGER,
    tuya_device_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS systems (
    id TEXT PRIMARY KEY,
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    type_id TEXT REFERENCES system_types(id),
    name TEXT NOT NULL,
    location TEXT,
    equipment_ids TEXT[],
    monitoring_points JSONB,
    parameters TEXT,
    observations TEXT,
    last_maintenance DATE,
    maintenance_period INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. OPERAÇÃO (OS E AGENDA)
-- ==========================================

CREATE TABLE IF NOT EXISTS service_orders (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    condo_id TEXT REFERENCES condos(id) ON DELETE CASCADE,
    equipment_id TEXT REFERENCES equipments(id),
    system_id TEXT REFERENCES systems(id),
    problem_description TEXT,
    actions_performed TEXT,
    parts_replaced TEXT[],
    photos_before TEXT[],
    photos_after TEXT[],
    technician_id TEXT,
    service_value NUMERIC DEFAULT 0,
    material_value NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

CREATE TABLE IF NOT EXISTS appointments (
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

CREATE TABLE IF NOT EXISTS nivel_caixa (
    id BIGSERIAL PRIMARY KEY,
    condominio_id TEXT NOT NULL, -- Serial do ESP32
    percentual NUMERIC NOT NULL,
    nivel_cm NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id TEXT PRIMARY KEY,
    equipment_id TEXT REFERENCES equipments(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    value TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. CONFIGURAÇÕES DE PERFORMANCE E REALTIME
-- ==========================================

-- Essencial para o ESP32 conseguir atualizar e o App ver a mudança de 100 para 0
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;
ALTER TABLE service_orders REPLICA IDENTITY FULL;

-- Habilitar publicação Realtime para as tabelas críticas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE nivel_caixa, service_orders, monitoring_alerts, appointments;

-- ==========================================
-- 8. POLÍTICAS DE ACESSO (RLS - MODO OPEN)
-- ==========================================

-- Desativa RLS para simplificar comunicação IOT/App neste estágio
ALTER TABLE equipment_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE condos DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE systems DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE nivel_caixa DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts DISABLE ROW LEVEL SECURITY;

-- Garante permissões de leitura/escrita para a chave anônima
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ✅ FIM DO SCRIPT MASTER V10
`;

  const cppScript = `// 🤖 SMARTGESTÃO IOT CLIENT V9.4 - ESP32 / ARDUINO
// IMPORTANTE: Instale a biblioteca "ArduinoJson" no Gerenciador de Bibliotecas!

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURAÇÕES WIFI ---
const char* ssid = "NOME_DO_SEU_WIFI";
const char* password = "SENHA_DO_SEU_WIFI";

// --- CONFIGURAÇÕES SUPABASE ---
const char* supabase_url = "https://rlldyyipyapkehtxwvqk.supabase.co/rest/v1/nivel_caixa";
const char* supabase_key = "sb_publishable_mOmsdU6uKC0eI6_ppTiHhQ_6NJD8jYv"; 

// --- IDENTIFICAÇÃO DO DISPOSITIVO ---
// Certifique-se que este nome é o mesmo que você colocou no menu SISTEMAS do App
const char* device_id = "ESP32_TANQUE_01"; 

// --- PINOS DOS ELETRODOS ---
const int pino_100 = 32;
const int pino_75  = 33;
const int pino_50  = 25;
const int pino_25  = 26;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\\n--- SMARTGESTÃO IOT START ---");
  
  pinMode(pino_100, INPUT_PULLUP);
  pinMode(pino_75,  INPUT_PULLUP);
  pinMode(pino_50,  INPUT_PULLUP);
  pinMode(pino_25,  INPUT_PULLUP);

  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Conectado!");
}

void loop() {
  int nivel_atual = 0;

  if (digitalRead(pino_100) == LOW) nivel_atual = 100;
  else if (digitalRead(pino_75) == LOW) nivel_atual = 75;
  else if (digitalRead(pino_50) == LOW) nivel_atual = 50;
  else if (digitalRead(pino_25) == LOW) nivel_atual = 25;
  else nivel_atual = 0;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(supabase_url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);

    StaticJsonDocument<256> doc;
    doc["condominio_id"] = device_id;
    doc["percentual"] = nivel_atual;

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
            <h1 className="text-xl font-black text-slate-900 leading-none">Infraestrutura SmartGestão V10</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Console de Administração do Banco</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
           <button onClick={() => setActiveTab('sql')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'sql' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>1. SQL Master</button>
           <button onClick={() => setActiveTab('esp32')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'esp32' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>2. Código ESP32</button>
        </div>
      </div>

      {activeTab === 'sql' ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 animate-in fade-in duration-300">
          <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-start space-x-4 mb-8">
            <Server className="text-blue-400 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-blue-400 uppercase">Script de Reconstrução Total</p>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                Este código cria todas as tabelas (Usuários, Ativos, OS, Telemetria) e configura o Realtime. 
                Use-o para restaurar seu Supabase se você deletou as tabelas de nível.
              </p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => handleCopy(sqlScript, setCopiedSql)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedSql ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
              {copiedSql ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>Copiar Script de Reconstrução</span>
            </button>
            <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-800">
              <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed">{sqlScript}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 animate-in fade-in duration-300">
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-start space-x-4 mb-8">
            <Library className="text-amber-600 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-amber-900 uppercase">Instalação de Bibliotecas</p>
              <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                Antes de compilar, instale a biblioteca <b>ArduinoJson</b> na sua IDE do Arduino.
              </p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => handleCopy(cppScript, setCopiedCpp)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedCpp ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
              {copiedCpp ? <CheckCircle2 size={16} /> : <Code size={16} />}
              <span>Copiar Código ESP32</span>
            </button>
            <div className="bg-slate-800 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-700">
              <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto custom-scrollbar leading-relaxed">{cppScript}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSetup;
