
import React from 'react';
import { Database, Copy, CheckCircle2, AlertTriangle, Terminal, ShieldCheck, Trash2, Rocket, Key } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- 🚀 SMARTGESTÃO MASTER SCRIPT V8.6 (CONEXÃO TOTAL IOT)
-- Rode este script no Editor SQL do seu Supabase.

-- 1. GARANTIR ESTRUTURA COMPATÍVEL
CREATE TABLE IF NOT EXISTS nivel_caixa (
  id BIGSERIAL PRIMARY KEY,
  condominio_id TEXT NOT NULL,
  percentual NUMERIC DEFAULT 0,
  nivel_cm NUMERIC DEFAULT 0,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DESABILITAR RLS (ACESSO DIRETO PARA PLACAS IOT)
-- Isso permite que o Arduino insira dados usando a anon key.
ALTER TABLE nivel_caixa DISABLE ROW LEVEL SECURITY;

-- 3. HABILITAR REPLICAÇÃO REALTIME (PARA O APP ATUALIZAR SOZINHO)
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;

-- 4. CONFIGURAR CANAL DE BROADCAST REALTIME
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'nivel_caixa'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE nivel_caixa;
    END IF;
END $$;

-- 5. PERMISSÕES EXPLÍCITAS PARA O ARDUINO
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON TABLE nivel_caixa TO anon;
GRANT ALL ON SEQUENCE nivel_caixa_id_seq TO anon;

-- Script concluído com sucesso.
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
            <h1 className="text-xl font-black text-slate-900 leading-none">V8.6 Connectivity Master</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Sincronismo IOT ESP32</p>
          </div>
        </div>

        <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-blue-600 shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-900 uppercase">Instrução de Correção</p>
            <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
              O Arduino envia o campo <b>"percentual"</b>. Se você não vir dados, rode o script abaixo para abrir o canal Realtime e as permissões de gravação.
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
              <span>{copied ? 'Copiado!' : 'Copiar Script V8.6'}</span>
            </button>
          </div>
          
          <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl">
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
