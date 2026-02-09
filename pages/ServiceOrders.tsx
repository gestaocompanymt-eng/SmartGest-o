
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Edit2, Share2, Wrench, MapPin, Camera, Trash2, Image as ImageIcon, CheckCircle2, Save, Layers, Settings, Building2, RefreshCw, Play, Eye, Thermometer, Droplet, Wind, User as UserIcon, Activity
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, System, UserRole, AppData, Equipment, Appointment } from '../types';

const ServiceOrders: React.FC<{ data: AppData; updateData: (d: AppData) => void; deleteData?: (table: string, id: string) => void }> = ({ data, updateData, deleteData }) => {
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRonda = user?.role === UserRole.RONDA;
  const userCondoId = user?.condo_id;
  const location = useLocation();

  const canDelete = isAdmin || isSindicoAdmin;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>(isRonda ? OSType.VISTORIA : 'all');
  const [expandedOS, setExpandedOS] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const [selectedCondoId, setSelectedCondoId] = useState(userCondoId || '');
  const [assignmentType, setAssignmentType] = useState<'general' | 'equipment' | 'system'>('general');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [osType, setOsType] = useState<OSType>(isRonda ? OSType.VISTORIA : OSType.SERVICE);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const osId = params.get('id');
    const equipmentParam = params.get('equipmentId');

    if (osId) {
      const os = data.serviceOrders.find(o => o.id === osId);
      if (os) {
        setEditingOS(os);
        setExpandedOS(os.id);
        setSelectedCondoId(os.condo_id);
        setAssignmentType(os.equipment_id ? 'equipment' : os.system_id ? 'system' : 'general');
        setSelectedEquipmentId(os.equipment_id || '');
        setSelectedSystemId(os.system_id || '');
        setOsType(os.type);
        setIsModalOpen(true);
      }
    } else if (equipmentParam) {
      const eq = data.equipments.find(e => e.id === equipmentParam);
      if (eq) {
        setSelectedCondoId(eq.condo_id);
        setAssignmentType('equipment');
        setSelectedEquipmentId(eq.id);
        setOsType(OSType.SERVICE);
        setIsModalOpen(true);
      }
    }
  }, [location.search, data.serviceOrders, data.equipments]);

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => {
    const matchStatus = filterStatus === 'all' || os.status === filterStatus;
    const matchType = filterType === 'all' || os.type === filterType;
    if (isRonda) return os.type === OSType.VISTORIA && os.condo_id === userCondoId && matchStatus;
    if (isSindicoAdmin) return os.condo_id === userCondoId && matchStatus && matchType;
    return matchStatus && matchType;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    
    const formData = new FormData(e.currentTarget);
    const finalCondoId = userCondoId || selectedCondoId || formData.get('condo_id') as string;
    if (!finalCondoId) return setSaveStatus('idle');

    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: isRonda ? OSType.VISTORIA : (formData.get('type') as OSType || osType),
      status: (formData.get('status') as OSStatus) || editingOS?.status || OSStatus.OPEN,
      condo_id: finalCondoId,
      location: (formData.get('location') as string) || '',
      equipment_id: assignmentType === 'equipment' ? selectedEquipmentId : (editingOS?.equipment_id || undefined),
      system_id: assignmentType === 'system' ? selectedSystemId : (editingOS?.system_id || undefined),
      problem_description: (formData.get('description') as string),
      actions_performed: (formData.get('actions') as string) || editingOS?.actions_performed || '',
      parts_replaced: editingOS?.parts_replaced || [],
      photos_before: editingOS?.photos_before || [],
      photos_after: editingOS?.photos_after || [],
      technician_id: user?.id || 'unknown',
      created_at: editingOS?.created_at || new Date().toISOString(),
      service_value: Number(formData.get('service_value')) || 0,
      material_value: Number(formData.get('material_value')) || 0,
      completed_at: (formData.get('status') === OSStatus.COMPLETED) ? new Date().toISOString() : editingOS?.completed_at,
      updated_at: new Date().toISOString()
    };

    try {
      const newOrders = editingOS 
        ? data.serviceOrders.map((o: ServiceOrder) => o.id === editingOS.id ? osData : o) 
        : [osData, ...data.serviceOrders];
      await updateData({ ...data, serviceOrders: newOrders });
      setSaveStatus('success');
      setTimeout(() => closeModal(), 800);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOS(null);
    setSaveStatus('idle');
  };

  // LIMPEZA EM LOTE (DELETE ALL FILTERED)
  const handleDeleteAllFilteredOS = async () => {
    if (!canDelete) return;
    const count = filteredOS.length;
    if (count === 0) return alert("Nenhuma Ordem de Serviço para excluir.");
    
    if (window.confirm(`ATENÇÃO: Você está prestes a excluir ${count} Ordens de Serviço de uma vez. Esta ação é irreversível e limpará todo o histórico filtrado. Deseja prosseguir?`)) {
      setSaveStatus('saving');
      try {
        const remainingOS = data.serviceOrders.filter(os => !filteredOS.some(f => f.id === os.id));
        
        // No Cloud (Iterativo devido às limitações do deleteData individual)
        if (deleteData) {
          for (const os of filteredOS) {
            await deleteData('service_orders', os.id);
          }
        }
        
        await updateData({ ...data, serviceOrders: remainingOS });
        setSaveStatus('success');
        alert(`${count} ordens excluídas com sucesso.`);
        setSaveStatus('idle');
      } catch (error) {
        setSaveStatus('error');
        alert("Erro ao limpar em lote.");
      }
    }
  };

  const handleDeleteOS = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Excluir esta Ordem de Serviço?')) {
      if (deleteData) await deleteData('service_orders', id);
      else updateData({ ...data, serviceOrders: data.serviceOrders.filter(o => o.id !== id) });
    }
  };

  const availableEquipments = useMemo(() => 
    data.equipments.filter((e: Equipment) => e.condo_id === selectedCondoId),
    [data.equipments, selectedCondoId]
  );

  const availableSystems = useMemo(() => 
    data.systems.filter((s: System) => s.condo_id === selectedCondoId),
    [data.systems, selectedCondoId]
  );

  const handleShare = async (os: ServiceOrder, condoName?: string) => {
    const text = `🛠️ *SmartGestão - ${os.type}*\n\n*ID:* ${os.id}\n*Status:* ${os.status}\n\n*Relato:* ${os.problem_description}`;
    if (navigator.share) await navigator.share({ title: `${os.type}`, text: text });
    else { await navigator.clipboard.writeText(text); alert('Copiado!'); }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {isRonda ? 'Minhas Vistorias' : 'Ordens de Serviço'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">{isRonda ? 'Rondas periódicas.' : 'Gestão técnica.'}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {canDelete && filteredOS.length > 5 && (
            <button 
              onClick={handleDeleteAllFilteredOS}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-200 hover:bg-red-200 transition-all flex items-center"
            >
              <Trash2 size={14} className="mr-1.5" /> Limpar Tudo ({filteredOS.length})
            </button>
          )}
          
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none">
            <option value="all">Todos Status</option>
            {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <button onClick={() => { setSelectedCondoId(userCondoId || ''); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Nova OS</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOS.map((os) => {
          const condo = data.condos.find(c => c.id === os.condo_id);
          const isExpanded = expandedOS === os.id;
          return (
            <div key={os.id} className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded ? 'border-blue-400 shadow-md' : 'border-slate-200 shadow-sm'}`}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4" onClick={() => setExpandedOS(isExpanded ? null : os.id)}>
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${os.status === OSStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{os.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{os.status}</span>
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{os.type}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight">{os.problem_description.substring(0, 80)}...</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center">
                      <Building2 size={12} className="mr-1" /> {condo?.name || '---'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3">
                   {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 p-5 space-y-4">
                  <p className="text-sm text-slate-600 italic bg-slate-50 p-4 rounded-xl">{os.actions_performed || 'Sem detalhes de execução.'}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingOS(os); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2">
                      <Edit2 size={14} /> <span>Atualizar</span>
                    </button>
                    <button onClick={() => handleShare(os, condo?.name)} className="px-4 bg-slate-100 text-slate-600 rounded-xl"><Share2 size={18} /></button>
                    {canDelete && <button onClick={() => handleDeleteOS(os.id)} className="px-4 bg-red-50 text-red-600 rounded-xl"><Trash2 size={18} /></button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingOS ? 'Editar OS' : 'Nova OS'}</h2>
              <button onClick={closeModal} className="p-2.5 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                  <select required name="condo_id" value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} disabled={!!userCondoId} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                    <option value="">Selecione...</option>
                    {data.condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {!isRonda && (
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo</label>
                    <select required name="type" value={osType} onChange={(e) => setOsType(e.target.value as OSType)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                      {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição</label>
                <textarea required name="description" defaultValue={editingOS?.problem_description} rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs" />
              </div>
              {editingOS && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                  <select name="status" defaultValue={editingOS.status} className="w-full px-5 py-4 bg-white border rounded-2xl font-black text-xs">
                    {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <textarea name="actions" defaultValue={editingOS.actions_performed} rows={4} className="w-full px-5 py-4 bg-white border rounded-2xl font-bold text-xs" placeholder="Relatório técnico..." />
                </div>
              )}
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" disabled={saveStatus === 'saving'} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center">
                  {saveStatus === 'saving' ? <RefreshCw className="animate-spin" /> : <Save className="mr-2" />}
                  <span>{saveStatus === 'saving' ? 'Salvando...' : 'Confirmar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
