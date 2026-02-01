
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Monitor, Activity, Edit2, Trash2, X, Cpu, CheckCircle2, Circle, Layers, FilePlus, MapPin, Droplets, Save, Loader2, AlertTriangle } from 'lucide-react';
import { System, SystemType, Condo, UserRole, Equipment, MonitoringPoint } from '../types';

const SystemsPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSys, setEditingSys] = useState<System | null>(null);
  const [points, setPoints] = useState<MonitoringPoint[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
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
    setPoints([...points, { id: Math.random().toString(36).substr(2, 5), name: `Ponto ${points.length + 1}`, device_id: '' }]);
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
      setSaveError("Selecione um condomínio.");
      setIsSaving(false);
      return;
    }

    // Filtra pontos válidos
    const validPoints = points
      .filter(p => p.device_id && p.device_id.trim() !== "")
      .map(p => ({ 
        id: p.id || Math.random().toString(36).substr(2, 5),
        name: p.name.trim(), 
        device_id: p.device_id.trim() 
      }));

    const sysData: System = {
      id: editingSys?.id || `sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      condo_id: condoId,
      type_id: String(selectedTypeId),
      name: name.trim(),
      location: (formData.get('location') as string || '').trim(),
      equipment_ids: editingSys?.equipment_ids || [], 
      // Usamos [] em vez de null/undefined para garantir que o Postgres entenda como JSON vazio se for o caso
      monitoring_points: String(selectedTypeId) === '7' ? validPoints : [],
      parameters: (formData.get('parameters') as string || '').trim(),
      observations: (formData.get('observations') as string || '').trim(),
      updated_at: new Date().toISOString()
    };

    const newSystems = editingSys
      ? data.systems.map((s: System) => s.id === editingSys.id ? sysData : s)
      : [sysData, ...data.systems];

    try {
      // O updateData agora lança exceção se a nuvem falhar
      await updateData({ ...data, systems: newSystems });
      
      // Sucesso
      setIsModalOpen(false);
      setEditingSys(null);
      setPoints([]);
    } catch (err: any) {
      console.error("Falha ao salvar sistema:", err);
      setSaveError(err.message || "Erro de conexão com o servidor. Tente novamente.");
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
          <p className="text-sm text-slate-500">Gestão de conjuntos técnicos e monitoramento IoT.</p>
        </div>
        {(isAdmin || isTech) && (
          <button onClick={() => openModal(null)} className="w-full md:w-auto bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center justify-center space-x-2 font-bold shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
            <Plus size={20} />
            <span className="uppercase text-[10px] tracking-widest">Novo Sistema</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {filteredSystems.map((sys: System) => {
          const condo = data.condos.find((c: Condo) => c.id === sys.condo_id);
          const type = data.systemTypes.find((t: SystemType) => t.id === sys.type_id);
          const isMonitoring = String(sys.type_id) === '7';
          const pointsCount = sys.monitoring_points?.length || 0;
          
          return (
            <div key={sys.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-blue-400 transition-all">
              <div className={`md:w-1/3 p-6 md:p-8 flex flex-col items-center justify-center text-white space-y-4 shrink-0 ${isMonitoring ? 'bg-blue-600' : 'bg-slate-900'}`}>
                <div className={`p-4 rounded-2xl shadow-xl ${isMonitoring ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                  {isMonitoring ? <Droplets size={32} /> : <Monitor size={32} />}
                </div>
                <div className="text-center">
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isMonitoring ? 'text-blue-100' : 'text-blue-400'}`}>
                    {isMonitoring ? 'Telemetria' : 'Status'}
                  </p>
                  <div className="flex items-center justify-center space-x-1.5 text-white">
                    <Activity size={14} className="animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">
                      {isMonitoring ? `${pointsCount} Pontos` : 'Ativo'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-5 md:p-6 flex flex-col min-w-0">
                <div className="flex justify-between items-start mb-4">
                   <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                      {type?.name || 'Sistema Operacional'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight truncate">{sys.name}</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight truncate mt-1">{condo?.name || 'Local Indefinido'}</p>
                   </div>
                   {(isAdmin || isTech) && (
                     <div className="flex space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openModal(sys)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => deleteSystem(sys.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                     </div>
                   )}
                </div>

                {isMonitoring && sys.monitoring_points && sys.monitoring_points.length > 0 && (
                   <div className="flex flex-wrap gap-2 mb-4">
                      {sys.monitoring_points.map((p, i) => (
                        <span key={i} className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 uppercase">
                          {p.name}: {p.device_id}
                        </span>
                      ))}
                   </div>
                )}

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4 flex-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                    <MapPin size={10} className="mr-1" /> {sys.location}
                  </p>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed italic line-clamp-2">
                    {sys.parameters || 'Parâmetros não definidos.'}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                   <div className="flex space-x-2">
                    <button onClick={() => navigate(`/os?systemId=${sys.id}`)} className="text-[10px] font-black text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all uppercase tracking-widest active:scale-95 flex items-center">
                      <FilePlus size={14} className="mr-1.5" /> Abrir OS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingSys ? 'Editar Sistema' : 'Novo Sistema'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {saveError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top">
                  <AlertTriangle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-red-600 leading-relaxed">{saveError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                    <select required name="condoId" defaultValue={editingSys?.condo_id} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none text-xs">
                       <option value="">Selecione...</option>
                       {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                    <select 
                      required 
                      value={selectedTypeId} 
                      onChange={(e) => setSelectedTypeId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none text-xs"
                    >
                       {data.systemTypes.map((t: SystemType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Sistema</label>
                <input required name="name" defaultValue={editingSys?.name} placeholder="Ex: Monitoramento de Reservatórios" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Localização</label>
                <input required name="location" defaultValue={editingSys?.location} placeholder="Ex: Subsolo 1 - Área Técnica" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-medium outline-none text-xs" />
              </div>

              {String(selectedTypeId) === '7' && (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                     <h4 className="text-[10px] font-black text-blue-600 uppercase flex items-center">
                        <Droplets size={14} className="mr-2" /> Dispositivos de Nível (ESP32)
                     </h4>
                     <button type="button" onClick={addPoint} className="text-[9px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg flex items-center active:scale-95">
                       <Plus size={12} className="mr-1" /> Add Ponto
                     </button>
                  </div>
                  <div className="space-y-3">
                    {points.map((p, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6 space-y-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase">Nome Local</label>
                           <input value={p.name} onChange={(e) => updatePoint(i, 'name', e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg text-xs font-bold" placeholder="Ex: Superior" />
                        </div>
                        <div className="col-span-5 space-y-1">
                           <label className="text-[8px] font-black text-blue-500 uppercase">ID Placa</label>
                           <input value={p.device_id} onChange={(e) => updatePoint(i, 'device_id', e.target.value)} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-black text-blue-600" placeholder="Ex: box_001" />
                        </div>
                        <div className="col-span-1">
                           <button type="button" onClick={() => removePoint(i)} className="p-2 text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                    {points.length === 0 && (
                      <p className="text-[9px] text-slate-400 italic text-center py-2">Clique em "Add Ponto" para configurar os sensores IoT.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Parâmetros / Observações</label>
                <textarea name="parameters" defaultValue={editingSys?.parameters} rows={3} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-medium outline-none"></textarea>
              </div>

              <div className="flex gap-3 pt-6 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" /> Salvando...
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
