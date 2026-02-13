
import React from 'react';
import { Copy, CheckCircle2, AlertTriangle, Rocket, ShieldCheck } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- 🚀 SMARTGESTÃO MASTER SCRIPT V9.2 (SOLUÇÃO DEFINITIVA DE NÍVEL)
-- Este script limpa as políticas de segurança que impedem o Realtime de ver o valor 0.

-- 1. GARANTIR ESTRUTURA E TIPAGEM
CREATE TABLE IF NOT EXISTS nivel_caixa (
  id BIGSERIAL PRIMARY KEY,
  condominio_id TEXT NOT NULL,
  percentual NUMERIC NOT NULL DEFAULT 0,
  nivel_cm NUMERIC DEFAULT 0,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RESET TOTAL DE POLÍTICAS (CORREÇÃO DE "PAGINA ADMIN SUMIU" E "NÍVEL NÃO FUNCIONA")
ALTER TABLE nivel_caixa DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para anon" ON nivel_caixa;
CREATE POLICY "Permitir tudo para anon" ON nivel_caixa FOR ALL USING (true) WITH CHECK (true);

-- 3. HABILITAR IDENTIDADE DE RÉPLICA FULL (OBRIGATÓRIO PARA VER MUDANÇAS NO APP)
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;

-- 4. CONFIGURAR CANAL DE BROADCAST REALTIME
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE nivel_caixa;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publicação já existe ou erro ignorado';
END $$;

-- 5. PERMISSÕES EXPLÍCITAS PARA A ROLE ANON (ESP32)
GRANT ALL ON TABLE nivel_caixa TO anon;
GRANT ALL ON TABLE nivel_caixa TO authenticated;
GRANT ALL ON TABLE nivel_caixa TO service_role;
GRANT ALL ON SEQUENCE nivel_caixa_id_seq TO anon;

-- 6. GARANTIR QUE O REALTIME ESCUTE UPDATES E INSERTS
ALTER TABLE nivel_caixa SET (realtime.enabled = true);

-- Script concluído V9.2. Rode no Editor SQL do Supabase.
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
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none text-blue-600">Correção de Políticas V9.2</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sincronismo Supabase Master</p>
          </div>
        </div>

        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-red-600 shrink-0 mt-1" size={24} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-red-900 uppercase">Atenção Crítica</p>
            <p className="text-[10px] text-red-700 font-bold leading-relaxed">
              O Supabase por padrão bloqueia transmissões de Realtime se as políticas RLS não estiverem explicitamente configuradas para <b>REPLICA IDENTITY FULL</b>. Execute o script abaixo para liberar o fluxo de dados do Arduino.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={handleCopy} className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copiado!' : 'Copiar Script de Reparo V9.2'}</span>
            </button>
          </div>
          <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-800">
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed">{sqlScript}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
