
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Monitor, Activity, Edit2, Trash2, X, Cpu, CheckCircle2, Circle, Layers, FilePlus, MapPin, Droplets, Save, Loader2, AlertTriangle, Info } from 'lucide-react';
import { System, SystemType, Condo, UserRole, Equipment, MonitoringPoint } from '../types';

const SystemsPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSys, setEditingSys] = useState<System | null>(null);
  const [points, setPoints] = useState<MonitoringPoint[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isTech = user?.role === UserRole.TECHNICIAN;
  const isCondo = user?.role === UserRole.CONDO_USER;

  const filteredSystems = isCondo
    ? data.systems.filter((s: System) => s.condo_id === user?.condo_id)
    : data.systems;

  const openModal = (sys: System | null) => {
    setSaveError(null);
    setEditingSys(sys);
    setSelectedTypeId(sys?.type_id || '1');
    setPoints(sys?.monitoring_points || []);
    setIsModalOpen(true);
  };

  const addPoint = () => {
    setPoints([...points, { id: Math.random().toString(36).substr(2, 5), name: `Reservatório ${points.length + 1}`, device_id: '' }]);
  };

  const removePoint = (idx: number) => {
    setPoints(points.filter((_, i) => i !== idx));
  };

  const updatePoint = (idx: number, field: keyof MonitoringPoint, value: string) => {
    const newPoints = [...points];
    newPoints[idx] = { ...newPoints[idx], [field]: value };
    setPoints(newPoints);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    
    const formData = new FormData(e.currentTarget);
    const condoId = formData.get('condoId') as string;
    const name = formData.get('name') as string;

    if (!condoId) {
      setSaveError("Selecione um condomínio para continuar.");
      setIsSaving(false);
      return;
    }

    // Limpeza de pontos: garante que o ID ESP32 não esteja vazio
    const validPoints = points
      .filter(p => p.device_id && p.device_id.trim() !== "")
      .map(p => ({ 
        id: p.id || Math.random().toString(36).substr(2, 5),
        name: p.name.trim() || 'Reservatório', 
        device_id: p.device_id.trim().toUpperCase() // Padroniza para caixa alta
      }));

    if (selectedTypeId === '7' && validPoints.length === 0) {
      setSaveError("Adicione pelo menos um Ponto com ID ESP32 válido.");
      setIsSaving(false);
      return;
    }

    const sysData: System = {
      id: editingSys?.id || `sys-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      condo_id: condoId,
      type_id: selectedTypeId,
      name: name.trim(),
      location: (formData.get('location') as string || '').trim(),
      equipment_ids: editingSys?.equipment_ids || [], 
      monitoring_points: selectedTypeId === '7' ? validPoints : [],
      parameters: (formData.get('parameters') as string || '').trim(),
      observations: (formData.get('observations') as string || '').trim(),
      updated_at: new Date().toISOString()
    };

    const newSystemsList = editingSys
      ? data.systems.map((s: System) => s.id === editingSys.id ? sysData : s)
      : [sysData, ...data.systems];

    try {
      await updateData({ ...data, systems: newSystemsList });
      setIsModalOpen(false);
      setEditingSys(null);
      setPoints([]);
    } catch (err: any) {
      setSaveError(err.message || "Erro de sincronização. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
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
          <p className="text-sm text-slate-500">Gestão de conjuntos técnicos e monitoramento.</p>
        </div>
        {(isAdmin || isTech) && (
          <button onClick={() => openModal(null)} className="w-full md:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-xl flex items-center justify-center space-x-2 font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
            <Plus size={18} />
            <span>Novo Sistema</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSystems.map((sys: System) => {
          const condo = data.condos.find((c: Condo) => c.id === sys.condo_id);
          const type = data.systemTypes.find((t: SystemType) => t.id === sys.type_id);
          const isMonitoring = sys.type_id === '7';
          
          return (
            <div key={sys.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-blue-400 transition-all">
              <div className={`md:w-32 p-6 flex flex-col items-center justify-center text-white shrink-0 ${isMonitoring ? 'bg-blue-600 shadow-xl shadow-blue-500/20' : 'bg-slate-900'}`}>
                <div className={`p-4 rounded-2xl ${isMonitoring ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>
                  {isMonitoring ? <Droplets size={24} /> : <Settings size={24} />}
                </div>
              </div>
              
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-2">
                   <div className="min-w-0">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                      {type?.name || 'Sistema'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight truncate">{sys.name}</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase mt-1 truncate">{condo?.name || 'Local Indefinido'}</p>
                   </div>
                   {(isAdmin || isTech) && (
                     <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(sys)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => deleteSystem(sys.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                     </div>
                   )}
                </div>

                {isMonitoring && sys.monitoring_points && sys.monitoring_points.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                     {sys.monitoring_points.map((p, i) => (
                       <span key={i} className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 uppercase flex items-center">
                         <Activity size={8} className="mr-1" /> {p.device_id}
                       </span>
                     ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     <MapPin size={12} className="mr-1.5" /> {sys.location}
                   </div>
                   <button onClick={() => navigate(`/os?systemId=${sys.id}`)} className="text-[10px] font-black text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest active:scale-95">
                      Abrir OS
                   </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredSystems.length === 0 && (
          <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center">
            <Layers size={40} className="text-slate-200 mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum sistema encontrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingSys ? 'Editar Sistema' : 'Novo Sistema'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {saveError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start space-x-3 text-red-600">
                   <AlertTriangle size={18} className="shrink-0" />
                   <p className="text-[10px] font-bold uppercase">{saveError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                    <select required name="condoId" defaultValue={editingSys?.condo_id} className="w-full px-4 py-3 bg-slate-50 border rounded-2xl font-bold outline-none text-xs focus:ring-2 focus:ring-blue-500/20">
                       <option value="">Selecione...</option>
                       {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Tipo de Sistema</label>
                    <select required value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-2xl font-bold outline-none text-xs focus:ring-2 focus:ring-blue-500/20">
                       {data.systemTypes.map((t: SystemType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nome Identificador</label>
                <input required name="name" defaultValue={editingSys?.name} placeholder="Ex: Central de Bombas de Incêndio" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl font-bold outline-none text-xs focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Localização</label>
                <input required name="location" defaultValue={editingSys?.location} placeholder="Ex: Subsolo 2 - Casa de Máquinas" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl font-medium outline-none text-xs focus:ring-2 focus:ring-blue-500/20" />
              </div>

              {selectedTypeId === '7' && (
                <div className="space-y-4 bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                     <h4 className="text-[10px] font-black text-blue-600 uppercase flex items-center">
                        <Droplets size={14} className="mr-2" /> Sensores IoT de Nível
                     </h4>
                     <button type="button" onClick={addPoint} className="text-[8px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg flex items-center active:scale-95 transition-all">
                       <Plus size={12} className="mr-1" /> Adicionar Ponto
                     </button>
                  </div>
                  
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100 flex items-start space-x-2">
                     <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                     <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase">
                       O <b>ID ESP32</b> é o código único colado no sensor físico. <br/>Ex: <code className="bg-blue-100 px-1 rounded">BOX-001</code>
                     </p>
                  </div>

                  <div className="space-y-3">
                    {points.map((p, i) => (
                      <div key={i} className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-blue-100 shadow-sm">
                        <input value={p.name} onChange={(e) => updatePoint(i, 'name', e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold outline-none" placeholder="Nome (Ex: Caixa Superior)" />
                        <div className="relative">
                           <input value={p.device_id} onChange={(e) => updatePoint(i, 'device_id', e.target.value)} className="w-28 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-[10px] font-black text-blue-600 placeholder:text-blue-300 outline-none uppercase" placeholder="ID ESP32" />
                        </div>
                        <button type="button" onClick={() => removePoint(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {points.length === 0 && (
                      <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase italic">Nenhum sensor configurado.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Observações Técnicas</label>
                <textarea name="parameters" defaultValue={editingSys?.parameters} rows={2} placeholder="Parâmetros de operação ou detalhes técnicos..." className="w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"></textarea>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" /> Sincronizando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" /> Salvar Sistema
                    </>
                  )}
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
