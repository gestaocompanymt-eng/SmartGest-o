
import React, { useState } from 'react';
import { UserPlus, User, Mail, Shield, Plus, Settings2, Trash2, Save } from 'lucide-react';
import { UserRole, EquipmentType, SystemType } from '../types';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [newTypeName, setNewTypeName] = useState('');

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
            <button className="text-xs font-bold text-blue-600 flex items-center hover:underline">
              <UserPlus size={16} className="mr-1" /> ADICIONAR TÉCNICO
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {data.users.map((user: any) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    user.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-blue-500'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                    <p className="text-xs text-slate-400 flex items-center">
                      <Mail size={12} className="mr-1" /> {user.email}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  user.role === UserRole.ADMIN ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role}
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
            <p className="text-[10px] text-slate-400 italic font-medium">
              * O administrador pode criar novos tipos para expandir o formulário de cadastro dinamicamente.
            </p>
          </div>
        </div>

        {/* System Settings & Data Control */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 col-span-full">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-slate-800">Controle de Dados & Backup</h3>
                <p className="text-sm text-slate-500">Sincronização offline e exportação de relatórios gerenciais.</p>
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
                 <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Status do Servidor</p>
                 <p className="text-sm font-semibold text-emerald-600 flex items-center">
                    <CheckCircle2 size={14} className="mr-1" /> OPERACIONAL
                 </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                 <p className="text-xs font-bold text-blue-700 uppercase mb-1">Último Backup</p>
                 <p className="text-sm font-semibold text-blue-600">HOJE ÀS 14:30</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                 <p className="text-xs font-bold text-amber-700 uppercase mb-1">Armazenamento Local</p>
                 <p className="text-sm font-semibold text-amber-600">1.2 MB / 10 MB</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle2 = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

export default AdminSettings;
