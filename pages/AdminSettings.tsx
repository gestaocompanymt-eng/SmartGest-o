
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  User, Trash2, Edit2, X, Save, Building2, RefreshCw, Database, CheckCircle, AlertTriangle, 
  Github, Cloud, ShieldCheck, Activity, Key, Globe, ExternalLink, ArrowRight, Code, Eye, EyeOff,
  Server
} from 'lucide-react';
import { UserRole, User as UserType, Condo, GithubConfig } from '../types';
import { syncDataToGithub } from '../githubService';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void; deleteData?: (type: any, id: string) => void }> = ({ data, updateData, deleteData }) => {
  const user = data.currentUser;
  const navigate = useNavigate();
  
  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TECHNICIAN);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Deseja realmente remover este acesso? Esta ação é definitiva.')) {
      if (deleteData) {
        deleteData('users', id);
      } else {
        const newUsers = data.users.filter((u: UserType) => u.id !== id);
        updateData({ ...data, users: newUsers });
      }
    }
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const role = formData.get('role') as UserRole;
      
      const userData: UserType = {
        id: editingUser?.id || Math.random().toString(36).substr(2, 9),
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: (formData.get('password') as string) || editingUser?.password || '',
        role: role,
        condo_id: (role !== UserRole.ADMIN) ? (formData.get('condo_id') as string) : undefined
      };

      const newUsers = editingUser
        ? data.users.map((u: UserType) => u.id === editingUser.id ? userData : u)
        : [userData, ...data.users];

      await updateData({ ...data, users: newUsers });
      
      setIsUserModalOpen(false);
      setEditingUser(null);
      setShowPassword(false);
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubConfigSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const repo = (formData.get('gh_repo') as string).trim();
    const token = (formData.get('gh_token') as string).trim();
    
    const config: GithubConfig = {
      token: token,
      repo: repo,
      lastSync: data.githubConfig?.lastSync
    };
    updateData({ ...data, githubConfig: config });
    alert('Configurações de nuvem gravadas!');
  };

  const handleSyncNow = async () => {
    if (syncLoading) return;
    setSyncLoading(true);
    const result = await syncDataToGithub(data);
    if (result.success) {
      setSyncStatus({ type: 'success', msg: result.message });
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
        <button 
          onClick={() => navigate('/database')}
          className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-400 transition-all shadow-sm"
        >
          <Server size={14} className="text-blue-600" />
          <span>Configurar Banco</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <User size={18} className="mr-2 text-blue-600" /> Usuários Cadastrados
              </h3>
              <button onClick={() => { setEditingUser(null); setSelectedRole(UserRole.TECHNICIAN); setIsUserModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">+ Novo Acesso</button>
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
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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

                <button type="submit" className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Perfil de Acesso</h2>
              <button onClick={() => { setIsUserModalOpen(false); setEditingUser(null); setIsSubmitting(false); }} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required={!editingUser} 
                    className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none pr-12" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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

              {selectedRole !== UserRole.ADMIN && (
                <div className="space-y-1 animate-in fade-in duration-300">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vínculo com Condomínio</label>
                  <select 
                    required
                    name="condo_id" 
                    defaultValue={editingUser?.condo_id} 
                    className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs font-black text-blue-700 outline-none"
                  >
                    <option value="">Selecione a Unidade...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">
                  {isSubmitting ? <RefreshCw className="animate-spin mx-auto" size={16} /> : 'Gravar Acesso'}
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
