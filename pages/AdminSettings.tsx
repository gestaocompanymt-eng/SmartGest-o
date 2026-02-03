
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  User, Trash2, Edit2, X, Save, Building2, RefreshCw, Database, CheckCircle, AlertTriangle, Copy, Check, Cpu
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

  // Fix: Implemented missing deleteUser function
  const deleteUser = (id: string) => {
    if (window.confirm('Deseja realmente remover este acesso?')) {
      const newUsers = data.users.filter((u: UserType) => u.id !== id);
      updateData({ ...data, users: newUsers });
    }
  };

  // Fix: Implemented missing handleUserSubmit function
  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    
    const userData: UserType = {
      id: editingUser?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: (formData.get('password') as string) || editingUser?.password || '',
      role: role,
      condo_id: role === UserRole.CONDO_USER ? (formData.get('condoId') as string) : undefined
    };

    const newUsers = editingUser
      ? data.users.map((u: UserType) => u.id === editingUser.id ? userData : u)
      : [userData, ...data.users];

    await updateData({ ...data, users: newUsers });
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const checkDatabaseHealth = async () => {
    const tables = ['users', 'condos', 'equipments', 'systems', 'service_orders', 'nivel_caixa'];
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

  const sqlCode = `
-- TABELA DE TELEMETRIA (Execute no SQL Editor do Supabase)
CREATE TABLE IF NOT EXISTS public.nivel_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    condominio_id TEXT NOT NULL, -- Device ID do ESP32
    percentual INTEGER DEFAULT 0,
    nivel_cm INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Normal'
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_nivel_device ON public.nivel_caixa(condominio_id, created_at DESC);
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 leading-tight">Administração</h1>
        <p className="text-sm text-slate-500 font-medium">Gestão de acessos e infraestrutura cloud.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
             <div className="flex items-center space-x-3 mb-4">
                <Cpu size={24} className="text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-widest">Configuração do Banco (IOT)</h3>
             </div>
             <p className="text-[10px] text-slate-400 mb-4 font-bold leading-relaxed">Se você ainda não criou a tabela de telemetria no Supabase, copie o código abaixo e execute no SQL Editor do painel da Supabase.</p>
             <div className="bg-black/40 p-4 rounded-xl font-mono text-[10px] text-blue-300 overflow-x-auto mb-4 relative">
                <pre>{sqlCode}</pre>
                <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <Database size={16} className="mr-2 text-blue-600" /> Saúde do Ecossistema
              </h3>
              <button onClick={checkDatabaseHealth} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <User size={18} className="mr-2 text-blue-600" /> Equipe e Acessos
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-md:max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <input required name="email" defaultValue={editingUser?.email} placeholder="Ex: joao@smartgestao.com" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <input required name="password" defaultValue={editingUser?.password} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Perfil</label>
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center">
                    <Building2 size={12} className="mr-1" /> Condomínio
                  </label>
                  <select 
                    required 
                    name="condoId" 
                    defaultValue={editingUser?.condo_id} 
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                  <Save size={16} className="inline mr-2" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
