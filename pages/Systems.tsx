
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Edit2, Trash2, X, MapPin, Droplets, Save, Cpu } from 'lucide-react';
import { System, SystemType, Condo, UserRole, MonitoringPoint } from '../types';

const SystemsPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSys, setEditingSys] = useState<System | null>(null);
  const [points, setPoints] = useState<MonitoringPoint[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('1');

  const user = data.currentUser;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const isCondo = user?.role === UserRole.CONDO_USER;
  const userCondoId = user?.condo_id;

  const filteredSystems = isCondo
    ? data.systems.filter((s: System) => s.condo_id === userCondoId)
    : data.systems;

  const openModal = (sys: System | null) => {
    setEditingSys(sys);
    setSelectedTypeId(sys?.type_id || '1');
    setPoints(sys?.monitoring_points || []);
    setIsModalOpen(true);
  };

  const handleAddPoint = () => {
    const newPoint: MonitoringPoint = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      device_id: ''
    };
    setPoints([...points, newPoint]);
  };

  const removePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
  };

  const updatePoint = (id: string, field: keyof MonitoringPoint, value: string) => {
    setPoints(points.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const condoId = isCondo ? userCondoId : (formData.get('condoId') as string);

    const sysData: System = {
      id: editingSys?.id || `sys-${Date.now()}`,
      condo_id: condoId || '',
      type_id: selectedTypeId,
      name: (formData.get('name') as string).trim(),
      location: (formData.get('location') as string || '').trim(),
      equipment_ids: editingSys?.equipment_ids || [], 
      monitoring_points: points,
      parameters: (formData.get('parameters') as string || '').trim(),
      observations: (formData.get('observations') as string || '').trim(),
      updated_at: new Date().toISOString()
    };

    const newSystemsList = editingSys
      ? data.systems.map((s: System) => s.id === editingSys.id ? sysData : s)
      : [sysData, ...data.systems];

    await updateData({ ...data, systems: newSystemsList });
    setIsModalOpen(false);
    setEditingSys(null);
    setPoints([]);
  };

  const deleteSystem = (id: string) => {
    if (confirm('Deseja realmente excluir este sistema?')) {
      updateData({ ...data, systems: data.systems.filter((s: System) => s.id !== id) });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Sistemas</h1>
          <p className="text-sm text-slate-500">Gestão técnica e monitoramento.</p>
        </div>
        {isAdminOrTech && (
          <button onClick={() => openModal(null)} className="w-full md:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-xl flex items-center justify-center space-x-2 font-black uppercase text-[10px] tracking-widest shadow-lg">
            <Plus size={18} />
            <span>Novo Sistema</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSystems.map((sys: System) => {
          const condo = data.condos.find((c: Condo) => c.id === sys.condo_id);
          return (
            <div key={sys.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-blue-400 transition-all">
              <div className={`md:w-32 p-6 flex flex-col items-center justify-center text-white shrink-0 ${sys.type_id === '7' ? 'bg-blue-600' : 'bg-slate-900'}`}>
                <div className={`p-4 rounded-2xl ${sys.type_id === '7' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>
                  {sys.type_id === '7' ? <Droplets size={24} /> : <Settings size={24} />}
                </div>
              </div>
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-2">
                   <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 leading-tight truncate">{sys.name}</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase mt-1 truncate">{condo?.name || 'Local Indefinido'}</p>
                   </div>
                   {isAdminOrTech && (
                     <div className="flex space-x-1">
                        <button onClick={() => openModal(sys)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => deleteSystem(sys.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                     </div>
                   )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     <MapPin size={12} className="mr-1.5" /> {sys.location}
                   </div>
                   {sys.type_id === '7' && (
                     <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                        {sys.monitoring_points?.length || 0} Placas ESP32
                     </span>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingSys ? 'Editar Sistema' : 'Novo Sistema'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                    <select required name="condoId" defaultValue={editingSys?.condo_id} className="w-full px-4 py-3 bg-slate-50 border rounded-2xl font-bold outline-none text-xs">
                       <option value="">Selecione...</option>
                       {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Tipo de Sistema</label>
                    <select required value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-2xl font-bold outline-none text-xs">
                       {data.systemTypes.map((t: SystemType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                       <option value="7">Monitoramento Hidráulico (IOT)</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nome do Sistema</label>
                <input required name="name" defaultValue={editingSys?.name} placeholder="Ex: Reservatório Superior" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl font-bold outline-none text-xs" />
              </div>

              {selectedTypeId === '7' && (
                <div className="space-y-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase">Placas Associadas (ESP32)</h4>
                    <button type="button" onClick={handleAddPoint} className="text-[10px] font-black text-blue-600 hover:underline">+ Adicionar</button>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {points.map((p) => (
                      <div key={p.id} className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl shadow-sm relative">
                        <input 
                          placeholder="Nome (Ex: Tanque A)" 
                          value={p.name} 
                          onChange={(e) => updatePoint(p.id, 'name', e.target.value)}
                          className="px-2 py-2 border rounded-lg text-[10px] font-bold outline-none" 
                        />
                        <div className="relative">
                          <Cpu size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            placeholder="Device ID (Serial)" 
                            value={p.device_id} 
                            onChange={(e) => updatePoint(p.id, 'device_id', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border rounded-lg text-[10px] font-black outline-none font-mono" 
                          />
                        </div>
                        <button type="button" onClick={() => removePoint(p.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Salvar Sistema
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
