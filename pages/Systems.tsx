
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Edit2, Trash2, X, MapPin, Droplets, Save, Cpu, Calendar, Clock } from 'lucide-react';
import { System, SystemType, Condo, UserRole, MonitoringPoint } from '../types';

const SystemsPage: React.FC<{ data: any; updateData: (d: any) => void; deleteData?: (type: any, id: string) => void }> = ({ data, updateData, deleteData }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSys, setEditingSys] = useState<System | null>(null);
  const [points, setPoints] = useState<MonitoringPoint[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('1');

  const user = data.currentUser;
  // Permissão expandida: Admin, Técnico ou Síndico/Gestor
  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN || user?.role === UserRole.SINDICO_ADMIN;
  const isCondo = user?.role === UserRole.SINDICO_ADMIN;
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

  const handleDeleteSystem = async (id: string) => {
    if (!canManage) return;
    if (window.confirm('ATENÇÃO: Deseja realmente excluir este sistema? Esta ação removerá também todos os vínculos de monitoramento IOT associados. Esta ação é definitiva.')) {
      if (deleteData) {
        await deleteData('systems', id);
      } else {
        const newSystemsList = data.systems.filter((s: System) => s.id !== id);
        await updateData({ ...data, systems: newSystemsList });
      }
    }
  };

  const handleAddPoint = () => {
    setPoints([...points, { id: Math.random().toString(36).substr(2, 9), name: '', device_id: '' }]);
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
    setPoints([]);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Sistemas Prediais</h1>
          <p className="text-sm text-slate-500 font-medium">Cronogramas de manutenção e telemetria IOT.</p>
        </div>
        {canManage && (
          <button onClick={() => openModal(null)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 font-black uppercase text-[10px] tracking-widest shadow-xl">
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
              <div className={`md:w-32 p-6 flex flex-col items-center justify-center text-white shrink-0 ${sys.type_id === '7' ? 'bg-blue-600 shadow-xl shadow-blue-500/20' : 'bg-slate-900'}`}>
                 {sys.type_id === '7' ? <Droplets size={28} /> : <Settings size={28} />}
                 {sys.maintenance_period && (
                    <div className="mt-4 text-center">
                       <p className="text-[7px] font-black text-white/40 uppercase">A cada</p>
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
                          <button onClick={() => openModal(sys)} className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all" title="Editar Sistema"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteSystem(sys.id)} className="p-2.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl transition-all" title="Excluir Sistema"><Trash2 size={16} /></button>
                        </>
                      )}
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Próxima Vistoria</p>
                      <p className="text-[10px] font-black text-slate-800">{nextDate ? nextDate.toLocaleDateString() : 'Não definido'}</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Local</p>
                      <p className="text-[10px] font-black text-slate-800 truncate">{sys.location}</p>
                   </div>
                </div>

                {sys.type_id === '7' && (
                  <div className="flex items-center space-x-2">
                     <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sinal IOT Ativo</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Configurar Sistema</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                    <select required name="condoId" defaultValue={editingSys?.condo_id} disabled={isCondo} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-60">
                       <option value="">Selecione...</option>
                       {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Tipo</label>
                    <select required value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                       {data.systemTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                       <option value="7">Monitoramento de Nível IOT</option>
                    </select>
                 </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">Revisão a cada (Dias)</label>
                    <input required type="number" name="maintenance_period" defaultValue={editingSys?.maintenance_period || 30} className="w-full px-5 py-4 bg-white border border-indigo-200 rounded-2xl font-black text-indigo-700 text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">Última Revisão</label>
                    <input required type="date" name="last_maintenance" defaultValue={editingSys?.last_maintenance?.split('T')[0]} className="w-full px-5 py-4 bg-white border border-indigo-200 rounded-2xl font-black text-indigo-700 text-xs" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nome do Sistema / Identificação</label>
                <input required name="name" defaultValue={editingSys?.name} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-xs" />
              </div>

              {selectedTypeId === '7' && (
                <div className="space-y-3 bg-blue-50 p-5 rounded-3xl border border-blue-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-blue-700 uppercase">Associação IOT (ESP32)</h4>
                    <button type="button" onClick={handleAddPoint} className="text-[9px] font-black text-blue-600">+ Adicionar Placa</button>
                  </div>
                  {points.map((p) => (
                    <div key={p.id} className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-blue-100 shadow-sm relative">
                      <input placeholder="Ex: Tanque Norte" value={p.name} onChange={(e) => setPoints(points.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} className="px-3 py-2 border rounded-xl text-[10px] font-bold" />
                      <input placeholder="Serial ID" value={p.device_id} onChange={(e) => setPoints(points.map(x => x.id === p.id ? {...x, device_id: e.target.value} : x))} className="px-3 py-2 border rounded-xl text-[10px] font-black font-mono" />
                    </div>
                  ))}
                </div>
              )}

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
