
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Edit2, Share2, Wrench, MapPin, Camera, Trash2, Image as ImageIcon, CheckCircle2, Save, Layers, Settings, Building2, RefreshCcw, Play, Eye, Thermometer, Droplet, Wind, User as UserIcon
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, System, UserRole, AppData, Equipment } from '../types';
import { supabase, isSupabaseActive } from '../supabase';

const ServiceOrders: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRonda = user?.role === UserRole.RONDA;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const userCondoId = user?.condo_id;
  const location = useLocation();

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
    const statusParam = params.get('status');
    const equipmentParam = params.get('equipmentId');

    if (statusParam) setFilterStatus(statusParam);

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
        setIsModalOpen(true);
      }
    }
  }, [location.search, data.serviceOrders, data.equipments]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    const formData = new FormData(e.currentTarget);
    const statusFromForm = formData.get('status') as OSStatus;
    const condoId = (isRonda || isSindicoAdmin) ? (userCondoId || '') : (formData.get('condo_id') as string);
    const currentTechnicianId = user?.id || 'unknown';

    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Date.now()}`,
      type: isRonda ? OSType.VISTORIA : ((formData.get('type') as OSType) || osType),
      status: statusFromForm || editingOS?.status || OSStatus.OPEN,
      condo_id: condoId,
      location: formData.get('location') as string || '',
      equipment_id: assignmentType === 'equipment' ? selectedEquipmentId : undefined,
      system_id: assignmentType === 'system' ? selectedSystemId : undefined,
      problem_description: formData.get('description') as string,
      actions_performed: (formData.get('actions') as string) || editingOS?.actions_performed || '',
      parts_replaced: editingOS?.parts_replaced || [],
      photos_before: editingOS?.photos_before || [],
      photos_after: editingOS?.photos_after || [],
      technician_id: currentTechnicianId,
      created_at: editingOS?.created_at || new Date().toISOString(),
      service_value: Number(formData.get('service_value')) || 0,
      material_value: Number(formData.get('material_value')) || 0,
      completed_at: statusFromForm === OSStatus.COMPLETED ? new Date().toISOString() : editingOS?.completed_at,
      updated_at: new Date().toISOString()
    };

    try {
      if (navigator.onLine && isSupabaseActive) {
        const { error } = await supabase.from('service_orders').upsert(osData);
        if (error) throw error;
      }

      const newOrders = editingOS 
        ? data.serviceOrders.map((o: ServiceOrder) => o.id === editingOS.id ? osData : o) 
        : [osData, ...data.serviceOrders];
      
      updateData({ ...data, serviceOrders: newOrders });
      setSaveStatus('success');
      setTimeout(closeModal, 800);
    } catch (err) {
      console.error("Erro ao salvar OS:", err);
      setSaveStatus('error');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOS(null);
    setSaveStatus('idle');
    setAssignmentType('general');
    setSelectedEquipmentId('');
    setSelectedSystemId('');
  };

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => {
    const matchStatus = filterStatus === 'all' || os.status === filterStatus;
    const matchType = filterType === 'all' || os.type === filterType;
    if (isRonda) return os.type === OSType.VISTORIA && os.condo_id === userCondoId && matchStatus;
    if (isSindicoAdmin) return os.condo_id === userCondoId && matchStatus && matchType;
    return matchStatus && matchType;
  });

  const availableEquipments = useMemo(() => 
    data.equipments.filter((e: Equipment) => e.condo_id === selectedCondoId),
    [data.equipments, selectedCondoId]
  );

  const availableSystems = useMemo(() => 
    data.systems.filter((s: System) => s.condo_id === selectedCondoId),
    [data.systems, selectedCondoId]
  );

  const handleShare = async (os: ServiceOrder, condoName?: string) => {
    const text = `🛠️ *SmartGestão - ${os.type}*\n\n*ID:* ${os.id}\n*Condomínio:* ${condoName || 'Não informado'}\n*Status:* ${os.status}\n\n*Relato:* ${os.problem_description}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${os.type} ${os.id}`, text: text, url: window.location.origin });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copiado!');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {isRonda ? 'Minhas Vistorias' : 'Ordens de Serviço'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">{isRonda ? 'Inspeções e rondas periódicas.' : 'Gestão técnica e atendimentos.'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {!isRonda && (
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none flex-1 md:flex-none">
              <option value="all">Status: Todos</option>
              {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button onClick={() => { setEditingOS(null); setOsType(isRonda ? OSType.VISTORIA : OSType.SERVICE); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 flex-1 md:flex-none">
            <Plus size={16} className="inline mr-1" /> {isRonda ? 'Nova Vistoria' : 'Novo Chamado'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOS.map((os: ServiceOrder) => {
          const condo = data.condos.find((c: Condo) => c.id === os.condo_id);
          const techUser = data.users.find(u => u.id === os.technician_id);
          const isExpanded = expandedOS === os.id;
          
          return (
            <div key={os.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedOS(isExpanded ? null : os.id)}>
                <div className="flex items-center space-x-4 min-w-0">
                  <div className={`p-2.5 rounded-xl ${os.type === OSType.VISTORIA ? 'bg-amber-50 text-amber-600' : os.type === OSType.CORRETIVE ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {os.type === OSType.VISTORIA ? <Eye size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{condo?.name || 'Condomínio'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{os.id} • {os.type}</p>
                    {techUser && (
                      <p className="text-[9px] font-bold text-blue-500 uppercase mt-0.5 flex items-center">
                        <UserIcon size={10} className="mr-1" /> Executor: {techUser.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                    os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                    os.status === OSStatus.CANCELLED ? 'bg-slate-100 text-slate-500' : 
                    os.status === OSStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {os.status}
                  </span>
                  {isExpanded ? <ChevronDown size={16} className={expandedOS === os.id ? 'rotate-180 transition-transform' : 'transition-transform'} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-4 space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{os.type === OSType.VISTORIA ? 'Relato da Ronda' : 'Ocorrência'}</p>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl italic border border-slate-100">{os.problem_description}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Executadas</p>
                       <p className="text-slate-600 leading-relaxed bg-slate-900 text-white p-4 rounded-xl font-mono text-[10px] whitespace-pre-wrap">{os.actions_performed || 'Em aguardo...'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => { setEditingOS(os); setSelectedCondoId(os.condo_id); setAssignmentType(os.equipment_id ? 'equipment' : os.system_id ? 'system' : 'general'); setSelectedEquipmentId(os.equipment_id || ''); setSelectedSystemId(os.system_id || ''); setOsType(os.type); setIsModalOpen(true); }} className="bg-slate-900 text-white text-[9px] font-black uppercase px-6 py-3 rounded-xl flex items-center shadow-lg active:scale-95"><Edit2 size={14} className="mr-2" /> Editar / Finalizar</button>
                    <button onClick={() => handleShare(os, condo?.name)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-black uppercase px-6 py-3 rounded-xl flex items-center"><Share2 size={14} className="mr-2" /> Compartilhar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingOS ? 'Editar Registro' : (isRonda ? 'Nova Vistoria' : 'Novo Chamado')}</h2>
              <button onClick={closeModal} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                  <select required name="condo_id" value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} disabled={!!userCondoId} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-50">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Registro</label>
                  <select required name="type" value={osType} onChange={(e) => setOsType(e.target.value as OSType)} disabled={isRonda} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-50">
                    {isRonda ? <option value={OSType.VISTORIA}>{OSType.VISTORIA}</option> : Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* SELETOR DE ASSOCIAÇÃO - RESTAURADO */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular Registro a:</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button type="button" onClick={() => setAssignmentType('general')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${assignmentType === 'general' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Geral</button>
                  <button type="button" onClick={() => setAssignmentType('equipment')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${assignmentType === 'equipment' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Equipamento</button>
                  <button type="button" onClick={() => setAssignmentType('system')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${assignmentType === 'system' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Sistema</button>
                </div>

                {assignmentType === 'equipment' && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <select value={selectedEquipmentId} onChange={(e) => setSelectedEquipmentId(e.target.value)} required className="w-full px-5 py-4 bg-slate-50 border border-blue-200 rounded-2xl font-bold text-xs outline-none">
                      <option value="">Selecione o Equipamento...</option>
                      {availableEquipments.map((e: Equipment) => (
                        <option key={e.id} value={e.id}>{e.manufacturer} {e.model} ({e.location})</option>
                      ))}
                    </select>
                  </div>
                )}

                {assignmentType === 'system' && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <select value={selectedSystemId} onChange={(e) => setSelectedSystemId(e.target.value)} required className="w-full px-5 py-4 bg-slate-50 border border-blue-200 rounded-2xl font-bold text-xs outline-none">
                      <option value="">Selecione o Sistema...</option>
                      {availableSystems.map((s: System) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição / Ocorrência</label>
                <textarea required name="description" defaultValue={editingOS?.problem_description} rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none resize-none" placeholder="Relate o problema ou detalhes da visita..." />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Relatório Técnico</h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ações Realizadas</label>
                  <textarea name="actions" defaultValue={editingOS?.actions_performed} rows={3} className="w-full px-5 py-4 bg-slate-900 text-white font-mono text-[10px] rounded-2xl outline-none resize-none" placeholder="Relate o que foi executado..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status do Registro</label>
                  <select name="status" defaultValue={editingOS?.status || OSStatus.OPEN} className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-600 text-xs outline-none">
                    {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                <button type="submit" disabled={saveStatus === 'saving'} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center ${saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  {saveStatus === 'saving' ? <RefreshCcw size={16} className="animate-spin mr-2" /> : saveStatus === 'success' ? <CheckCircle2 size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
                  {saveStatus === 'saving' ? 'Gravando...' : saveStatus === 'success' ? 'Salvo!' : 'Salvar Registro'}
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
