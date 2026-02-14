
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Edit2, Trash2, X, Droplets, Save, Calendar, Clock } from 'lucide-react';
import { System, SystemType, Condo, UserRole } from '../types';

const SystemsPage: React.FC<{ data: any; updateData: (d: any) => void; deleteData?: (type: any, id: string) => void }> = ({ data, updateData, deleteData }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSys, setEditingSys] = useState<System | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState('1');

  const user = data.currentUser;
  const isSindico = user?.role === UserRole.SINDICO_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isTech = user?.role === UserRole.TECHNICIAN;

  const canManage = isAdmin || isTech || isSindico;
  const userCondoId = user?.condo_id;

  const filteredSystems = (isSindico || (isTech && userCondoId))
    ? data.systems.filter((s: System) => s.condo_id === userCondoId)
    : data.systems;

  const openModal = (sys: System | null) => {
    setEditingSys(sys);
    setSelectedTypeId(sys?.type_id || '1');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const condoId = userCondoId || (formData.get('condoId') as string);

    if (!condoId) {
      alert("Erro: Condomínio não identificado.");
      return;
    }

    const sysData: System = {
      id: editingSys?.id || `sys-${Date.now()}`,
      condo_id: condoId,
      type_id: selectedTypeId,
      name: (formData.get('name') as string || '').trim(),
      location: (formData.get('location') as string || '').trim(),
      equipment_ids: editingSys?.equipment_ids || [], 
      parameters: (formData.get('parameters') as string || '').trim(),
      observations: (formData.get('observations') as string || '').trim(),
      last_maintenance: formData.get('last_maintenance') as string || new Date().toISOString(),
      maintenance_period: Number(formData.get('maintenance_period')) || 30,
      updated_at: new Date().toISOString()
    };

    const newSystemsList = editingSys
      ? data.systems.map((s: System) => s.id === editingSys.id ? sysData : s)
      : [sysData, ...data.systems];

    await updateData({ ...data, systems: newSystemsList });
    setIsModalOpen(false);
    setEditingSys(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Sistemas Prediais</h1>
          <p className="text-sm text-slate-500 font-medium italic">Cronogramas de manutenção preventiva.</p>
        </div>
        {canManage && (
          <button onClick={() => openModal(null)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
            <Plus size={18} />
            <span>Novo Sistema</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSystems.map((sys: System) => {
          const condo = data.condos.find((c: Condo) => c.id === sys.condo_id);
          const nextDate = sys.last_maintenance && sys.maintenance_period ? new Date(new Date(sys.last_maintenance).getTime() + sys.maintenance_period * 86400000) : null;
          
          return (
            <div key={sys.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-blue-400 transition-all">
              <div className={`md:w-32 p-6 flex flex-col items-center justify-center text-white shrink-0 bg-slate-900`}>
                 <Settings size={28} />
                 {sys.maintenance_period && (
                    <div className="mt-4 text-center">
                       <p className="text-[10px] font-black text-white">{sys.maintenance_period}d</p>
                    </div>
                 )}
              </div>
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 leading-tight truncate">{sys.name}</h3>
                    <p className="text-[9px] font-black text-blue-600 uppercase mt-1 tracking-widest">{condo?.name || 'Localização Geral'}</p>
                   </div>
                   <div className="flex space-x-1 shrink-0">
                      {canManage && (
                        <>
                          <button onClick={() => openModal(sys)} className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => deleteData && deleteData('systems', sys.id)} className="p-2.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </>
                      )}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Configurar Sistema</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                    <select required name="condoId" defaultValue={editingSys?.condo_id || userCondoId} disabled={!!userCondoId} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none">
                       {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Tipo</label>
                    <select required value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                       {data.systemTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nome do Sistema</label>
                <input required name="name" defaultValue={editingSys?.name} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-xs" />
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Gravar Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemsPage;
