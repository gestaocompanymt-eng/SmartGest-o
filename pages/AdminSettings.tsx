
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  User, Trash2, Edit2, X, Save, Building2, RefreshCw, Database, CheckCircle, AlertTriangle, 
  Github, Cloud, ShieldCheck, Activity, Key, Globe, ExternalLink, ArrowRight, Code
} from 'lucide-react';
import { UserRole, User as UserType, Condo, GithubConfig } from '../types';
import { syncDataToGithub } from '../githubService';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  
  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TECHNICIAN);
  
  // Estados do GitHub
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

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
      condo_id: (role === UserRole.SINDICO_ADMIN || role === UserRole.RONDA || (role === UserRole.TECHNICIAN && formData.get('condo_id'))) ? (formData.get('condoId') as string) : undefined
    };

    const newUsers = editingUser
      ? data.users.map((u: UserType) => u.id === editingUser.id ? userData : u)
      : [userData, ...data.users];

    await updateData({ ...data, users: newUsers });
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleGithubConfigSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const repo = (formData.get('gh_repo') as string).trim();
    const token = (formData.get('gh_token') as string).trim();
    
    if (repo && !repo.includes('/')) {
      alert("O repositório deve estar no formato 'usuario/nome-do-projeto'");
      return;
    }

    const config: GithubConfig = {
      token: token,
      repo: repo,
      lastSync: data.githubConfig?.lastSync
    };
    updateData({ ...data, githubConfig: config });
    alert('Configurações de nuvem gravadas com sucesso!');
  };

  const handleSyncNow = async () => {
    if (syncLoading) return;
    setSyncLoading(true);
    setSyncStatus({ type: null, msg: '' });
    
    const result = await syncDataToGithub(data);
    
    if (result.success) {
      setSyncStatus({ type: 'success', msg: result.message });
      updateData({
        ...data,
        githubConfig: {
          ...data.githubConfig,
          lastSync: new Date().toISOString()
        }
      });
    } else {
      setSyncStatus({ type: 'error', msg: result.message });
    }
    setSyncLoading(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Administração</h1>
          <p className="text-sm text-slate-500 font-medium italic">Infraestrutura e segurança global.</p>
        </div>
        
        {/* Assinatura Técnica do Adriano Pantaroto */}
        <div className="hidden md:flex flex-col items-end text-right">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Developer Signature</p>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
             <Code size={14} className="text-blue-600" />
             <span className="text-[10px] font-black text-slate-900">Adriano Pantaroto</span>
             <span className="text-[8px] font-bold text-slate-300">v5.2</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gestão de Acessos */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <User size={18} className="mr-2 text-blue-600" /> Usuários Cadastrados
              </h3>
              <button onClick={() => { setEditingUser(null); setSelectedRole(UserRole.TECHNICIAN); setIsUserModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">+ Novo Acesso</button>
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
                        {u.role === UserRole.SINDICO_ADMIN ? 'SÍNDICO / ADM' : u.role} {u.condo_id ? `• ${data.condos.find(c => c.id === u.condo_id)?.name}` : '• Global'}
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

        {/* GitHub Cloud Backup */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12">
              <Github size={120} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Cloud size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 leading-none">Backup em Nuvem</h3>
                  <p className="text-[10px] text-white/50 font-bold mt-1">Sincronização com GitHub</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                 <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Informação Técnica</p>
                 <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                   O sistema realiza backup automático a cada 15 minutos se o token estiver configurado. Garante redundância externa total dos seus dados.
                 </p>
              </div>

              <form onSubmit={handleGithubConfigSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center">
                    <Key size={10} className="mr-1" /> Token (PAT)
                  </label>
                  <input 
                    name="gh_token" 
                    type="password"
                    required
                    defaultValue={data.githubConfig?.token} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white/10 outline-none transition-all placeholder:text-white/20"
                    placeholder="ghp_xxxx..."
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center">
                    <Globe size={10} className="mr-1" /> Repositório
                  </label>
                  <input 
                    name="gh_repo" 
                    required
                    defaultValue={data.githubConfig?.repo} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white/10 outline-none transition-all placeholder:text-white/20"
                    placeholder="usuario/projeto"
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">
                  Gravar Configurações
                </button>
              </form>

              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={handleSyncNow}
                  disabled={syncLoading || !data.githubConfig?.token}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                    syncLoading ? 'bg-slate-800 text-white/50 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'
                  }`}
                >
                  {syncLoading ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
                  <span>{syncLoading ? 'Conectando...' : 'Sincronizar Manualmente'}</span>
                </button>

                {data.githubConfig?.lastSync && (
                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Último Backup</p>
                    <p className="text-[10px] text-emerald-400 font-bold">
                      {new Date(data.githubConfig.lastSync).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {syncStatus.type && (
                <div className={`p-4 rounded-2xl border flex items-start space-x-3 animate-in slide-in-from-bottom-2 ${
                  syncStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  {syncStatus.type === 'success' ? <CheckCircle size={16} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={16} className="text-red-400 shrink-0" />}
                  <p className={`text-[10px] font-bold ${syncStatus.type === 'success' ? 'text-emerald-200' : 'text-red-200'}`}>
                    {syncStatus.msg}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Perfil de Acesso</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required name="name" defaultValue={editingUser?.name} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Login (E-mail)</label>
                <input required name="email" defaultValue={editingUser?.email} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Perfil</label>
                <select 
                  name="role" 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)} 
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none"
                >
                  <option value={UserRole.TECHNICIAN}>Técnico Especialista</option>
                  <option value={UserRole.RONDA}>Ronda / Segurança</option>
                  <option value={UserRole.SINDICO_ADMIN}>Síndico / Gestor Administrativo</option>
                  <option value={UserRole.ADMIN}>Administrador Global</option>
                </select>
              </div>

              {(selectedRole === UserRole.SINDICO_ADMIN || selectedRole === UserRole.RONDA || selectedRole === UserRole.TECHNICIAN) && (
                <div className="space-y-1 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center">
                    <Building2 size={12} className="mr-1" /> Vínculo Predial
                  </label>
                  <select 
                    required={selectedRole !== UserRole.TECHNICIAN}
                    name="condoId" 
                    defaultValue={editingUser?.condo_id} 
                    className="w-full px-5 py-4 bg-white border border-blue-200 rounded-2xl text-xs font-bold text-blue-700 outline-none"
                  >
                    <option value="">{selectedRole === UserRole.TECHNICIAN ? 'Global (Todos os Condomínios)' : 'Selecionar Condomínio...'}</option>
                    {data.condos.map((c: Condo) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
