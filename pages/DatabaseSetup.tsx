
import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, Rocket, ShieldCheck, Cpu, Code, Database, ChevronRight, Info, Library } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCpp, setCopiedCpp] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'esp32'>('sql');

  const sqlScript = `-- 🚀 SMARTGESTÃO REPAIR SCRIPT V9.4 (MASTER REALTIME)
-- Execute este script no EDITOR SQL do Supabase para destravar os níveis de 0% e 100%.

-- 1. DESATIVAR RLS (ROW LEVEL SECURITY)
-- Isso garante que o banco não bloqueie nenhum dado enviado pelo Arduino.
ALTER TABLE IF EXISTS nivel_caixa DISABLE ROW LEVEL SECURITY;

-- 2. CONFIGURAR RÉPLICA FULL (ESSENCIAL PARA O APP VER MUDANÇAS)
-- Sem isso, o banco não envia o valor do nível quando ele muda de 50 para 0, por exemplo.
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;

-- 3. PERMISSÕES TOTAIS
DROP POLICY IF EXISTS "Permitir tudo para anon" ON nivel_caixa;
CREATE POLICY "Permitir tudo para anon" ON nivel_caixa FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE nivel_caixa TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE nivel_caixa_id_seq TO anon, authenticated, service_role;

-- 4. HABILITAR CANAL REALTIME
ALTER TABLE nivel_caixa SET (realtime.enabled = true);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE nivel_caixa;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publicação já existe.';
END $$;
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
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  int nivel_atual = 0;

  // Lógica de leitura (LOW significa que a água tocou o sensor)
  if (digitalRead(pino_100) == LOW) nivel_atual = 100;
  else if (digitalRead(pino_75) == LOW) nivel_atual = 75;
  else if (digitalRead(pino_50) == LOW) nivel_atual = 50;
  else if (digitalRead(pino_25) == LOW) nivel_atual = 25;
  else nivel_atual = 0;

  Serial.printf(">>> Lendo Sensores... Nível: %d%%\\n", nivel_atual);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(supabase_url);
    
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);

    StaticJsonDocument<256> doc;
    doc["condominio_id"] = device_id;
    doc["percentual"] = nivel_atual;
    doc["status"] = (nivel_atual <= 25) ? "ALERTA" : "OK";

    String json;
    serializeJson(doc, json);

    Serial.print("Enviando para o App... ");
    int code = http.POST(json);

    if (code > 0) {
      Serial.printf("SUCESSO! Status: %d\\n", code);
    } else {
      Serial.printf("ERRO NO ENVIO: %s\\n", http.errorToString(code).c_str());
    }
    http.end();
  } else {
    Serial.println("ERRO: WiFi desconectado!");
    WiFi.begin(ssid, password);
  }

  Serial.println("Aguardando 10 segundos...\\n");
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
            <h1 className="text-xl font-black text-slate-900 leading-none">Configuração IOT V9.4</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Sincronismo Supabase Master</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
           <button onClick={() => setActiveTab('sql')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'sql' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>1. SQL (Banco)</button>
           <button onClick={() => setActiveTab('esp32')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'esp32' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>2. ESP32 (Hardware)</button>
        </div>
      </div>

      {activeTab === 'sql' ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 animate-in fade-in duration-300">
          <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start space-x-4 mb-8">
            <AlertTriangle className="text-red-600 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-red-900 uppercase">Atenção Crítica</p>
              <p className="text-[10px] text-red-700 font-bold leading-relaxed">
                Se o nível trava em 50% ou 75% no App, execute este script no <b>SQL Editor do Supabase</b>. Ele força o banco a enviar os valores 0 e 100 que o sistema pode estar ignorando.
              </p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => handleCopy(sqlScript, setCopiedSql)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedSql ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
              {copiedSql ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>Copiar SQL V9.4</span>
            </button>
            <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-800">
              <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed">{sqlScript}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 animate-in fade-in duration-300">
          {/* GUIA DE RESOLUÇÃO DO ERRO DE BIBLIOTECA */}
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-start space-x-4 mb-8">
            <Library className="text-amber-600 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-amber-900 uppercase">Como corrigir o erro: "ArduinoJson.h: No such file"</p>
              <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                1. No seu Arduino IDE, clique em <b>Sketch</b> > <b>Incluir Biblioteca</b> > <b>Gerenciar Bibliotecas</b>.<br/>
                2. Busque por <b>ArduinoJson</b>.<br/>
                3. Instale a versão feita por <b>Benoit Blanchon</b>.<br/>
                4. Feito isso, o código abaixo vai compilar sem erros.
              </p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => handleCopy(cppScript, setCopiedCpp)} className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copiedCpp ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
              {copiedCpp ? <CheckCircle2 size={16} /> : <Code size={16} />}
              <span>Copiar Código ESP32 V9.4</span>
            </button>
            <div className="bg-slate-800 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-700">
              <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto custom-scrollbar leading-relaxed">{cppScript}</pre>
            </div>
          </div>

          <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
             <h4 className="text-[10px] font-black text-slate-900 uppercase mb-4 flex items-center"><Info size={14} className="mr-2 text-blue-500" /> Dica de Depuração</h4>
             <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
               Abra o <b>Monitor Serial</b> na IDE do Arduino (velocidade 115200). Se aparecer "SUCESSO! Status: 201", o dado chegou no banco de dados. Se ele não aparecer no App, verifique se o <b>Serial Monitor: ESP32_TANQUE_01</b> cadastrado no App é igual ao <b>device_id</b> do código acima.
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSetup;
