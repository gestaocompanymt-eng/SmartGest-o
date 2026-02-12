
import React from 'react';
import { Database, Copy, CheckCircle2, AlertTriangle, Terminal, ShieldCheck, Trash2, Rocket } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- 🚀 SMARTGESTÃO MASTER SCRIPT V8.5 (REPARO TOTAL REALTIME)
-- Este script garante a comunicação instantânea do nível d'água.

-- 1. HABILITAR REPLICAÇÃO (CRÍTICO PARA REALTIME)
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;

-- 2. GARANTIR PUBLICAÇÃO SUPABASE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'nivel_caixa'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE nivel_caixa;
    END IF;
END $$;

-- 3. PERMISSÕES DE ACESSO PÚBLICO (PARA TESTES IOT)
DROP POLICY IF EXISTS "Public Full Access" ON nivel_caixa;
CREATE POLICY "Public Full Access" ON nivel_caixa FOR ALL USING (true) WITH CHECK (true);

-- 4. ÍNDICE DE PERFORMANCE PARA BUSCA DE ARDUINO
CREATE INDEX IF NOT EXISTS idx_nivel_condominio ON nivel_caixa (condominio_id);

-- 5. RECONSTRUÇÃO DA INFRAESTRUTURA (OPCIONAL - USE COM CAUTELA)
-- Se o banco estiver vazio ou corrompido, descomente as linhas abaixo.
/*
CREATE TABLE IF NOT EXISTS nivel_caixa (
  id BIGSERIAL PRIMARY KEY,
  condominio_id TEXT,
  percentual NUMERIC,
  nivel_cm NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

NOTIFY pgrst, 'reload schema';
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
            <h1 className="text-xl font-black text-slate-900 leading-none">Reparo de Comunicação IOT</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Sincronismo Direto com Arduino</p>
          </div>
        </div>

        <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-blue-600 shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-900 uppercase">Ação Obrigatória</p>
            <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
              O Supabase exige que a tabela tenha "REPLICA IDENTITY FULL" para enviar mudanças parciais. 
              Copie o código abaixo e execute no SQL Editor do seu Supabase para reativar o sensor.
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
              <span>{copied ? 'Copiado!' : 'Copiar Script de Reparo'}</span>
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
