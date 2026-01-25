
import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  UserPlus, User, Trash2, Edit2, X, Save, Building2, LayoutList, RotateCcw
} from 'lucide-react';
import { UserRole, User as UserType, ServiceOrder, Condo } from '../types';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  
  // Bloqueio de segurança: Se o usuário logado não for ADMIN, redireciona para a home.
  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TECHNICIAN);

  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [selectedTechId, setSelectedTechId] = useState('all');

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    // Fix: Map formData to correct condo_id property on User interface
    const userData: UserType = {
      id: editingUser?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: role,
      password: formData.get('password') as string,
      condo_id: role === UserRole.CONDO_USER ? (formData.get('condoId') as string) : undefined
    };

    if (editingUser) {
      updateData({ ...data, users: data.users.map((u: UserType) => u.id === editingUser.id ? userData : u) });
    } else {
      updateData({ ...data, users: [...data.users, userData] });
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (confirm('Deseja remover o acesso deste colaborador permanentemente?')) {
      updateData({ ...data, users: data.users.filter((u: any) => u.id !== id) });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 leading-tight">Administração</h1>
        <p className="text-sm text-slate-500">Gestão técnica, equipe e controle de acessos.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-xs">
            <User size={18} className="mr-2 text-blue-600" /> Colaboradores e Síndicos
          </h3>
          <button onClick={() => { setEditingUser(null); setSelectedRole(UserRole.TECHNICIAN); setIsUserModalOpen(true); }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Novo Membro</button>
        </div>
        <div className="divide-y divide-slate-100">
          {data.users.map((user: UserType) => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${user.role === UserRole.ADMIN ? 'bg-slate-900' : user.role === UserRole.CONDO_USER ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-100 text-slate-500">{user.role}</span>
                  </div>
                  {/* Fix: Updated condoId access to condo_id */}
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {user.email} {user.condo_id && `• ${data.condos.find((c:any)=>c.id===user.condo_id)?.name}`}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => { setEditingUser(user); setSelectedRole(user.role); setIsUserModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                <button onClick={() => deleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingUser ? 'Editar Acesso' : 'Novo Acesso'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input required name="name" defaultValue={editingUser?.name} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail / Login</label>
                <input required name="email" defaultValue={editingUser?.email} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha de Acesso</label>
                <input required name="password" type="text" defaultValue={editingUser?.password} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargo / Permissão</label>
                <select name="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold">
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.TECHNICIAN}>Técnico de Campo</option>
                  <option value={UserRole.CONDO_USER}>Usuário de Condomínio (Síndico)</option>
                </select>
              </div>
              {selectedRole === UserRole.CONDO_USER && (
                <div className="space-y-1 animate-in fade-in">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Condomínio Atrelado</label>
                  <select required name="condoId" defaultValue={editingUser?.condo_id} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-xs uppercase transition-all active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-slate-900/20 transition-all active:scale-95">Salvar Acesso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
