
import React, { useState } from 'react';
import { UserPlus, User, Mail, Shield, Plus, Settings2, Trash2, Edit2, X, Key, CheckCircle2, Save } from 'lucide-react';
import { UserRole, EquipmentType, User as UserType } from '../types';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [newTypeName, setNewTypeName] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const addEquipmentType = () => {
    if (!newTypeName) return;
    const newType: EquipmentType = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTypeName
    };
    updateData({ ...data, equipmentTypes: [...data.equipmentTypes, newType] });
    setNewTypeName('');
  };

  const removeEquipmentType = (id: string) => {
    updateData({ ...data, equipmentTypes: data.equipmentTypes.filter((t: any) => t.id !== id) });
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: UserType = {
      id: editingUser?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as UserRole,
      password: formData.get('password') as string,
    };

    if (editingUser) {
      updateData({
        ...data,
        users: data.users.map((u: UserType) => u.id === editingUser.id ? userData : u)
      });
    } else {
      updateData({
        ...data,
        users: [...data.users, userData]
      });
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (data.users.length <= 1) {
      alert("Não é possível remover o único usuário do sistema.");
      return;
    }
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      updateData({
        ...data,
        users: data.users.filter((u: UserType) => u.id !== id)
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel de Controle</h1>
        <p className="text-slate-500">Configurações globais e gestão de equipe.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* User Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center">
              <User size={20} className="mr-2 text-blue-500" /> Equipe Técnica
            </h3>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="text-xs font-bold text-blue-600 flex items-center hover:underline"
            >
              <UserPlus size={16} className="mr-1" /> ADICIONAR TÉCNICO
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {data.users.map((user: UserType) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    user.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-blue-500'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        user.role === UserRole.ADMIN ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center">
                      <Mail size={12} className="mr-1" /> {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteUser(user.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Types Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Settings2 size={20} className="mr-2 text-blue-500" /> Tipos de Equipamentos
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Ex: Bomba de recalque" 
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              <button 
                onClick={addEquipmentType}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {data.equipmentTypes.map((type: EquipmentType) => (
                <div key={type.id} className="group flex items-center bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200">
                  {type.name}
                  <button 
                    onClick={() => removeEquipmentType(type.id)}
                    className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Control Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 col-span-full">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-slate-800">Controle de Dados & Segurança</h3>
                <p className="text-sm text-slate-500">Sincronização em tempo real com Supabase.</p>
              </div>
              <div className="flex space-x-3">
                 <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                   EXPORTAR DB (JSON)
                 </button>
                 <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
                   SINCRONIZAR AGORA
                 </button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                 <p className="text-xs font-bold text-emerald-700 uppercase mb-1 text-center md:text-left">Status do Servidor</p>
                 <p className="text-sm font-semibold text-emerald-600 flex items-center justify-center md:justify-start">
                    <CheckCircle2 size={14} className="mr-1" /> OPERACIONAL
                 </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                 <p className="text-xs font-bold text-blue-700 uppercase mb-1 text-center md:text-left">Supabase Sync</p>
                 <p className="text-sm font-semibold text-blue-600 text-center md:text-left uppercase">Ativo</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center md:text-left">
                 <p className="text-xs font-bold text-amber-700 uppercase mb-1">Cache Local</p>
                 <p className="text-sm font-semibold text-amber-600">Sincronizado</p>
              </div>
           </div>
        </div>
      </div>

      {/* User Management Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingUser ? 'Editar Usuário' : 'Novo Técnico/Admin'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required name="name" defaultValue={editingUser?.name} placeholder="Ex: João Silva" className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Login / E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required name="email" defaultValue={editingUser?.email} placeholder="Ex: joao@empresa.com" className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Senha</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required name="password" type="text" defaultValue={editingUser?.password} placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Papel / Acesso</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select name="role" defaultValue={editingUser?.role || UserRole.TECHNICIAN} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none bg-white">
                    <option value={UserRole.ADMIN}>Administrador (Acesso Total)</option>
                    <option value={UserRole.TECHNICIAN}>Técnico (Apenas Operacional)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <Save size={18} className="mr-2" /> Salvar
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
