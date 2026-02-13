
import React from 'react';
import { Copy, CheckCircle2, AlertTriangle, Rocket, ShieldCheck } from 'lucide-react';

const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- 🚀 SMARTGESTÃO REPAIR SCRIPT V9.3 (MODO MASTER)
-- Execute este script no EDITOR SQL do Supabase para destravar os níveis de 0% e 100%.

-- 1. DESATIVAR RLS TEMPORARIAMENTE PARA GARANTIR FLUXO
ALTER TABLE IF EXISTS nivel_caixa DISABLE ROW LEVEL SECURITY;

-- 2. RESET DE POLÍTICAS (PERMISSÃO TOTAL PARA ARDUINO E APP)
DROP POLICY IF EXISTS "Permitir tudo para anon" ON nivel_caixa;
CREATE POLICY "Permitir tudo para anon" ON nivel_caixa FOR ALL USING (true) WITH CHECK (true);

-- 3. COMANDO CRÍTICO: FORÇAR ENVIO DE TODAS AS COLUNAS NO REALTIME
-- Sem isso, o Supabase pode enviar apenas o ID nas atualizações (updates),
-- travando o App no último valor conhecido.
ALTER TABLE nivel_caixa REPLICA IDENTITY FULL;

-- 4. RE-ATIVAR PUBLICAÇÃO DE TEMPO REAL
-- Garante que a tabela está na lista de transmissão do banco.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE nivel_caixa;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'A tabela já está na publicação.';
END $$;

-- 5. PERMISSÕES DE ACESSO AO SEQUENCIAL
GRANT ALL ON TABLE nivel_caixa TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE nivel_caixa_id_seq TO anon, authenticated, service_role;

-- 6. HABILITAR REALTIME EXPLÍCITO
ALTER TABLE nivel_caixa SET (realtime.enabled = true);

-- Script concluído V9.3. 
-- APÓS EXECUTAR: Reinicie o App e verifique se o pulso azul aparece no topo da tela de Reservatórios.
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
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-900/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">Reparo Supabase V9.3</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 italic">Solução definitiva para travamento de níveis</p>
          </div>
        </div>

        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start space-x-4 mb-8">
          <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={24} />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-amber-900 uppercase">Por que os níveis travam?</p>
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
              O Supabase usa um recurso chamado <b>Replica Identity</b>. Se estiver configurado como 'Default', ele envia apenas o ID quando o Arduino faz um UPDATE. O script abaixo muda para <b>FULL</b>, forçando o banco a enviar o percentual (0, 100, etc) em tempo real.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={handleCopy} className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copiado!' : 'Copiar Script V9.3'}</span>
            </button>
          </div>
          <div className="bg-slate-900 rounded-[2rem] p-8 pt-20 overflow-hidden shadow-2xl border-4 border-slate-800">
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">{sqlScript}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
