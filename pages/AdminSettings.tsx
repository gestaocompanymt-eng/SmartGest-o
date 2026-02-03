
import React, { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  User, Trash2, Edit2, X, Save, Building2, RefreshCw, Cpu, Copy, Check, Database, CheckCircle, AlertTriangle
} from 'lucide-react';
import { UserRole, User as UserType, Condo } from '../types';
import { supabase } from '../supabase';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const [copied, setCopied] = useState(false);
  
  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TECHNICIAN);
  const [tableStatus, setTableStatus] = useState<Record<string, 'checking' | 'ok' | 'error'>>({});

  const checkDatabaseHealth = async () => {
    const tables = ['users', 'condos', 'equipments', 'systems', 'service_orders', 'appointments', 'nivel_caixa'];
    const newStatus: any = {};
    for (const table of tables) {
      newStatus[table] = 'checking';
      setTableStatus({ ...newStatus });
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        newStatus[table] = error ? 'error' : 'ok';
      } catch {
        newStatus[table] = 'error';
      }
      setTableStatus({ ...newStatus });
    }
  };

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    const userId = editingUser?.id || `user-${Date.now()}`;
    const userData: UserType = {
      id: userId,
      name: formData.get('name') as string,
      email: (formData.get('email') as string).trim().toLowerCase(),
      role: role,
      password: (formData.get('password') as string).trim(),
      condo_id: role === UserRole.CONDO_USER ? (formData.get('condoId') as string) : undefined
    };
    const newUsersList = editingUser 
      ? data.users.map((u: UserType) => u.id === editingUser.id ? userData : u) 
      : [...data.users, userData];
    await updateData({ ...data, users: newUsersList });
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (confirm('Deseja remover o acesso deste colaborador permanentemente?')) {
      updateData({ ...data, users: data.users.filter((u: any) => u.id !== id) });
    }
  };

  const sqlOptimizer = `
-- SMARTGESTÃO: OTIMIZADOR DE BANCO DE DADOS
-- Este script impede que o banco salve registros se o nível for igual ao anterior.

CREATE OR REPLACE FUNCTION public.filter_unchanged_levels()
RETURNS TRIGGER AS $$
DECLARE
  last_val INTEGER;
BEGIN
  -- Busca o último valor registrado para este dispositivo específico
  SELECT nivel_cm INTO last_val 
  FROM public.nivel_caixa
  WHERE condominio_id = NEW.condominio_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se o valor novo for igual ao último, aborta a inserção (Retorna NULL)
  IF last_val IS NOT NULL AND last_val = NEW.nivel_cm THEN
    RETURN NULL; 
  END IF;
  
  -- Se mudou, permite a gravação
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica a Trigger na tabela nivel_caixa
DROP TRIGGER IF EXISTS tr_filter_levels ON public.nivel_caixa;
CREATE TRIGGER tr_filter_levels
BEFORE INSERT ON public.nivel_caixa
FOR EACH ROW EXECUTE FUNCTION public.filter_unchanged_levels();
  `.trim();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlOptimizer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="no-print">
        <h1 className="text-2xl font-black text-slate-900 leading-tight">Administração</h1>
        <p className="text-sm text-slate-500 font-medium">Gestão técnica, equipe e otimização de infraestrutura.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 no-print">
        <div className="xl:col-span-2 space-y-8">
          
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Cpu size={120} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                   <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                      <Cpu className="text-white" size={24} />
                   </div>
                   <div>
                      <h3 className="font-black uppercase text-xs tracking-[0.2em] text-blue-400">Otimizador de Telemetria</h3>
                      <p className="text-xs text-slate-400 font-bold">Filtro de Inteligência de Dados</p>
                   </div>
                </div>
                
                <p className="text-sm font-medium text-slate-300 mb-8 leading-relaxed max-w-xl">
                  Este script SQL cria uma regra de "Delta-Filtering". O banco ignorará entradas do ESP32 se o nível da água não tiver sofrido alteração, reduzindo drasticamente o tráfego e o custo de armazenamento.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative group">
                   <pre className="text-[10px] font-mono text-blue-300/80 overflow-x-auto whitespace-pre custom-scrollbar max-h-48">
                     {sqlOptimizer}
                   </pre>
                   <button 
                     onClick={handleCopySql}
                     className="absolute top-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-lg hover:bg-blue-50 transition-all flex items-center space-x-2 active:scale-95"
                   >
                     {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                     <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copiado!' : 'Copiar Script'}</span>
                   </button>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <Database size={16} className="mr-2 text-blue-600" /> Saúde do Ecossistema Cloud
              </h3>
              <button onClick={checkDatabaseHealth} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
               {Object.entries(tableStatus).map(([table, status]) => (
                 <div key={table} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">{table}</span>
                    <div className="flex items-center space-x-2">
                      {status === 'checking' && <RefreshCw size={12} className="text-blue-500 animate-spin" />}
                      {status === 'ok' && <CheckCircle size={12} className="text-emerald-500" />}
                      {status === 'error' && <AlertTriangle size={12} className="text-red-500" />}
                      <span className={`text-[10px] font-bold uppercase ${status === 'ok' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                        {status === 'ok' ? 'Online' : status === 'error' ? 'Erro' : '...'}
                      </span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-xs">
                <User size={18} className="mr-2 text-blue-600" /> Equipe SmartGestão
              </h3>
              <button onClick={() => { 
                setEditingUser(null); 
                setSelectedRole(UserRole.TECHNICIAN); 
                setIsUserModalOpen(true); 
              }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Novo Acesso</button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.users.map((u: UserType) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${u.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-blue-600'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role} • {u.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => { 
                      setEditingUser(u); 
                      setSelectedRole(u.role); 
                      setIsUserModalOpen(true); 
                    }} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                    <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">{editingUser ? 'Editar' : 'Novo'} Acesso</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required name="name" defaultValue={editingUser?.name} placeholder="Ex: João da Silva" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                <input required name="email" defaultValue={editingUser?.email} placeholder="Ex: joao@smartgestao.com" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <input required name="password" defaultValue={editingUser?.password} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Perfil de Usuário</label>
                <select 
                  name="role" 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)} 
                  className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none"
                >
                  <option value={UserRole.TECHNICIAN}>Técnico</option>
                  <option value={UserRole.CONDO_USER}>Síndico</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
              </div>

              {selectedRole === UserRole.CONDO_USER && (
                <div className="space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center">
                    <Building2 size={12} className="mr-1" /> Condomínio Vinculado
                  </label>
                  <select 
                    required 
                    name="condoId" 
                    defaultValue={editingUser?.condo_id} 
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 outline-none"
                  >
                    <option value="">Selecione o Condomínio...</option>
                    {data.condos.map((c: Condo) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                  <Save size={16} className="inline mr-2" /> Salvar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
