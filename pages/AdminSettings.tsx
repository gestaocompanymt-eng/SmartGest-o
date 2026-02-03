
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  User, Trash2, Edit2, X, Save, Building2, RefreshCw, Database, CheckCircle, AlertTriangle, Copy, Check, Cpu, Code
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

  const deleteUser = (id: string) => {
    if (window.confirm('Deseja realmente remover este acesso?')) {
      const newUsers = data.users.filter((u: UserType) => u.id !== id);
      updateData({ ...data, users: newUsers });
    }
  };

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

  const sqlCode = `
-- 1. CONDOMÍNIOS
CREATE TABLE IF NOT EXISTS public.condos (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    address TEXT,
    manager TEXT,
    contract_type TEXT,
    start_date TEXT
);

-- 2. EQUIPAMENTOS
CREATE TABLE IF NOT EXISTS public.equipments (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    condo_id TEXT REFERENCES public.condos(id) ON DELETE CASCADE,
    type_id TEXT,
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
    photos TEXT[], -- Array de Base64 ou URLs
    last_maintenance TEXT,
    device_id TEXT -- Vínculo ESP32
);

-- 3. SISTEMAS
CREATE TABLE IF NOT EXISTS public.systems (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    condo_id TEXT REFERENCES public.condos(id) ON DELETE CASCADE,
    type_id TEXT,
    name TEXT,
    location TEXT,
    equipment_ids TEXT[],
    monitoring_points JSONB DEFAULT '[]'::jsonb, -- Lista de IDs ESP32
    parameters TEXT,
    observations TEXT
);

-- 4. USUÁRIOS
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    condo_id TEXT
);

-- 5. ORDENS DE SERVIÇO
CREATE TABLE IF NOT EXISTS public.service_orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    type TEXT,
    status TEXT,
    condo_id TEXT REFERENCES public.condos(id),
    location TEXT,
    equipment_id TEXT,
    system_id TEXT,
    problem_description TEXT,
    actions_performed TEXT,
    parts_replaced TEXT[],
    photos_before TEXT[],
    photos_after TEXT[],
    technician_id TEXT,
    service_value NUMERIC DEFAULT 0,
    material_value NUMERIC DEFAULT 0
);

-- 6. AGENDA
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    condo_id TEXT REFERENCES public.condos(id),
    technician_id TEXT,
    date TEXT,
    time TEXT,
    description TEXT,
    status TEXT
);

-- 7. TELEMETRIA IOT (NÍVEL)
CREATE TABLE IF NOT EXISTS public.nivel_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    condominio_id TEXT NOT NULL, -- Device ID do ESP32
    percentual INTEGER DEFAULT 0,
    nivel_cm INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Normal'
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.nivel_caixa;
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Administração</h1>
          <p className="text-sm text-slate-500 font-medium">Gestão de acessos e infraestrutura cloud.</p>
        </div>
        <div className="flex space-x-2">
           <button onClick={checkDatabaseHealth} className="bg-white border p-3 rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-blue-600">
              <RefreshCw size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Code size={120} /></div>
             <div className="relative z-10">
               <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/40"><Cpu size={24} /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Script de Inicialização SQL</h3>
               </div>
               <p className="text-xs text-slate-400 mb-6 font-bold leading-relaxed max-w-md">Para garantir que o app funcione perfeitamente com todas as funções de IOT e Fotos, execute este script no <span className="text-blue-400">SQL Editor</span> do Supabase.</p>
               
               <div className="bg-black/60 p-5 rounded-2xl font-mono text-[10px] text-blue-300 border border-white/10 max-h-64 overflow-y-auto custom-scrollbar mb-6 relative group">
                  <pre className="whitespace-pre-wrap">{sqlCode}</pre>
                  <button onClick={handleCopy} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-md">
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
               </div>
               
               <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                  <AlertTriangle size={14} />
                  <span>Isso criará ou atualizará as colunas necessárias sem apagar dados existentes.</span>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <Database size={16} className="mr-2 text-blue-600" /> Status da Sincronização Cloud
              </h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
               {Object.entries(tableStatus).map(([table, status]) => (
                 <div key={table} className="flex flex-col p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                    <span className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">{table}</span>
                    <div className="flex items-center space-x-2">
                      {status === 'checking' && <RefreshCw size={14} className="text-blue-500 animate-spin" />}
                      {status === 'ok' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                      {status === 'error' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                      <span className={`text-[10px] font-black uppercase ${status === 'ok' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                        {status === 'ok' ? 'Online' : status === 'error' ? 'Ausente' : 'Verificando'}
                      </span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <User size={18} className="mr-2 text-blue-600" /> Equipe e Acessos
              </h3>
              <button onClick={() => { 
                setEditingUser(null); 
                setSelectedRole(UserRole.TECHNICIAN); 
                setIsUserModalOpen(true); 
              }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">+ Novo</button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.users.map((u: UserType) => (
                <div key={u.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${u.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-blue-600'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-none mb-1">{u.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{u.role} • {u.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => { 
                      setEditingUser(u); 
                      setSelectedRole(u.role); 
                      setIsUserModalOpen(true); 
                    }} className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => deleteUser(u.id)} className="p-2.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingUser ? 'Editar Acesso' : 'Novo Acesso'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required name="name" defaultValue={editingUser?.name} placeholder="Ex: João da Silva" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <input required name="email" defaultValue={editingUser?.email} placeholder="Ex: joao@smartgestao.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <input required name="password" defaultValue={editingUser?.password} placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                <select 
                  name="role" 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                >
                  <option value={UserRole.TECHNICIAN}>Técnico</option>
                  <option value={UserRole.CONDO_USER}>Síndico</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
              </div>
              {selectedRole === UserRole.CONDO_USER && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center">
                    <Building2 size={12} className="mr-1" /> Vincular Condomínio
                  </label>
                  <select 
                    required 
                    name="condoId" 
                    defaultValue={editingUser?.condo_id} 
                    className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs font-bold text-blue-700 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
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
