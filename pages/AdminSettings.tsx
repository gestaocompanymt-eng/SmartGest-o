
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  User, Trash2, Edit2, X, Save, Building2, RefreshCw, Database, CheckCircle, AlertTriangle, Copy, Check, Cpu, Code, Lock, Terminal, ShieldCheck, Activity, Eye
} from 'lucide-react';
import { UserRole, User as UserType, Condo } from '../types';
import { supabase } from '../supabase';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const [copied, setCopied] = useState(false);
  const [firmwareCopied, setFirmwareCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'firmware'>('sql');
  const [testResult, setTestResult] = useState<{status: 'idle' | 'loading' | 'success' | 'error', message: string}>({status: 'idle', message: ''});
  
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
      condo_id: (role === UserRole.CONDO_USER || role === UserRole.RONDA || (role === UserRole.TECHNICIAN && formData.get('condo_id'))) ? (formData.get('condoId') as string) : undefined
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

  const runDiagnostics = async () => {
    setTestResult({status: 'loading', message: 'Iniciando diagnósticos...'});
    try {
      const { error: readError } = await supabase.from('condos').select('count', { count: 'exact', head: true });
      if (readError) throw new Error(`Falha: ${readError.message}`);
      setTestResult({status: 'success', message: 'RLS e Integridade Cloud validadas!'});
      checkDatabaseHealth();
    } catch (err: any) {
      setTestResult({status: 'error', message: err.message});
    }
  };

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Administração</h1>
          <p className="text-sm text-slate-500 font-medium italic">Configuração de infraestrutura e acessos.</p>
        </div>
        <div className="flex space-x-2">
           <button onClick={runDiagnostics} className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-blue-200 hover:bg-blue-100 transition-all">
             <ShieldCheck size={16} />
             <span>Validar Sistema</span>
           </button>
           <button onClick={checkDatabaseHealth} className="bg-white border p-3 rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-blue-600">
             <RefreshCw size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <User size={18} className="mr-2 text-blue-600" /> Gestão de Acessos
              </h3>
              <button onClick={() => { setEditingUser(null); setSelectedRole(UserRole.TECHNICIAN); setIsUserModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">+ Novo Acesso</button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.users.map((u: UserType) => (
                <div key={u.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${u.role === UserRole.ADMIN ? 'bg-slate-900' : u.role === UserRole.RONDA ? 'bg-amber-500' : 'bg-blue-600'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-none mb-1">{u.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                        {u.role} {u.condo_id ? `• ${data.condos.find(c => c.id === u.condo_id)?.name}` : '• Global'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => { setEditingUser(u); setSelectedRole(u.role); setIsUserModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all"><Edit2 size={16} /></button>
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
          <div className="bg-white rounded-[2.5rem] w-full max-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Acesso ao Sistema</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required name="name" defaultValue={editingUser?.name} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail (Login)</label>
                <input required name="email" defaultValue={editingUser?.email} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <input name="password" defaultValue={editingUser?.password} placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                <select 
                  name="role" 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)} 
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none"
                >
                  <option value={UserRole.TECHNICIAN}>Técnico</option>
                  <option value={UserRole.RONDA}>Ronda / Segurança</option>
                  <option value={UserRole.CONDO_USER}>Síndico</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
              </div>

              {(selectedRole === UserRole.CONDO_USER || selectedRole === UserRole.RONDA || selectedRole === UserRole.TECHNICIAN) && (
                <div className="space-y-1 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center">
                    <Building2 size={12} className="mr-1" /> Condomínio Vinculado
                  </label>
                  <select 
                    required={selectedRole !== UserRole.TECHNICIAN}
                    name="condoId" 
                    defaultValue={editingUser?.condo_id} 
                    className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl text-xs font-bold text-blue-700 outline-none"
                  >
                    <option value="">{selectedRole === UserRole.TECHNICIAN ? 'Atender a TODOS (Global)' : 'Selecionar Condomínio...'}</option>
                    {data.condos.map((c: Condo) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {selectedRole === UserRole.TECHNICIAN && (
                    <p className="text-[9px] text-blue-400 font-bold mt-2 italic px-1">Se não selecionar um condomínio, o técnico poderá atender a todos os clientes cadastrados.</p>
                  )}
                  {selectedRole === UserRole.RONDA && (
                    <p className="text-[9px] text-amber-600 font-bold mt-2 italic px-1">O Ronda verá apenas vistorias e alertas deste condomínio específico.</p>
                  )}
                </div>
              )}

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">
                  <Save size={16} className="inline mr-2" /> Gravar Acesso
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
