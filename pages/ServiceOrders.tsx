
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Edit2, Share2, Wrench, MapPin, Camera, Trash2, Image as ImageIcon, CheckCircle2, Save, Layers, Settings, Building2, RefreshCcw, Play, Eye
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, System, UserRole, AppData, Equipment } from '../types';

const ServiceOrders: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;
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
  const [initialDescription, setInitialDescription] = useState('');
  const [osType, setOsType] = useState<OSType>(isRonda ? OSType.VISTORIA : OSType.SERVICE);

  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const osId = params.get('id');
    const systemId = params.get('systemId');
    const equipmentId = params.get('equipmentId');
    const description = params.get('description');
    const isVistoria = params.get('vistoria') === 'true';

    if (osId) {
      const os = data.serviceOrders.find(o => o.id === osId);
      if (os) {
        setEditingOS(os);
        setExpandedOS(os.id);
        setSelectedCondoId(os.condo_id);
        setAssignmentType(os.equipment_id ? 'equipment' : os.system_id ? 'system' : 'general');
        setSelectedEquipmentId(os.equipment_id || '');
        setSelectedSystemId(os.system_id || '');
        setPhotosBefore(os.photos_before || []);
        setPhotosAfter(os.photos_after || []);
        setOsType(os.type);
        setIsModalOpen(true);
      }
    } else if (systemId) {
      const sys = data.systems.find((s: System) => s.id === systemId);
      if (sys && (!userCondoId || sys.condo_id === userCondoId)) openNewOSWithSystem(sys, isVistoria);
    } else if (equipmentId) {
      const eq = data.equipments.find((e: Equipment) => e.id === equipmentId);
      if (eq && (!userCondoId || eq.condo_id === userCondoId)) openNewOSWithEquipment(eq, description || '', isVistoria);
    }
  }, [location.search, data.systems, data.equipments, userCondoId]);

  const openNewOSWithSystem = (sys: System, isVistoria: boolean) => {
    setSelectedCondoId(sys.condo_id);
    setAssignmentType('system');
    setSelectedSystemId(sys.id);
    setSelectedEquipmentId('');
    setInitialDescription('');
    setEditingOS(null);
    setOsType(isVistoria ? OSType.VISTORIA : OSType.SERVICE);
    setPhotosBefore([]);
    setPhotosAfter([]);
    setIsModalOpen(true);
  };

  const openNewOSWithEquipment = (eq: Equipment, desc: string, isVistoria: boolean) => {
    setSelectedCondoId(eq.condo_id);
    setAssignmentType('equipment');
    setSelectedEquipmentId(eq.id);
    setSelectedSystemId('');
    setInitialDescription(desc);
    setEditingOS(null);
    setOsType(isVistoria ? OSType.VISTORIA : OSType.SERVICE);
    setPhotosBefore([]);
    setPhotosAfter([]);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'before') setPhotosBefore(prev => [...prev, base64String]);
        else setPhotosAfter(prev => [...prev, base64String]);
      };
      reader.readAsDataURL(file);
    });
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    const formData = new FormData(e.currentTarget);
    const statusFromForm = formData.get('status') as OSStatus;
    const condoId = (user?.role === UserRole.RONDA || isCondoUser) ? (userCondoId || '') : (formData.get('condo_id') as string);

    const osData: ServiceOrder = {
      id: editingOS?.id || `${isRonda ? 'VST' : 'OS'}-${Date.now()}`,
      type: (formData.get('type') as OSType) || osType,
      status: statusFromForm || editingOS?.status || OSStatus.OPEN,
      condo_id: condoId,
      location: formData.get('location') as string,
      equipment_id: assignmentType === 'equipment' ? (formData.get('equipment_id') as string) : undefined,
      system_id: assignmentType === 'system' ? (formData.get('system_id') as string) : undefined,
      problem_description: formData.get('description') as string,
      actions_performed: (formData.get('actions') as string) || editingOS?.actions_performed || '',
      parts_replaced: editingOS?.parts_replaced || [],
      photos_before: photosBefore,
      photos_after: photosAfter,
      technician_id: editingOS?.technician_id || user?.id || 'unknown',
      created_at: editingOS?.created_at || new Date().toISOString(),
      service_value: Number(formData.get('service_value')) || 0,
      material_value: Number(formData.get('material_value')) || 0,
      completed_at: statusFromForm === OSStatus.COMPLETED ? new Date().toISOString() : editingOS?.completed_at,
      updated_at: new Date().toISOString()
    };

    await updateData({ 
      ...data, 
      serviceOrders: editingOS 
        ? data.serviceOrders.map((o: ServiceOrder) => o.id === editingOS.id ? osData : o) 
        : [osData, ...data.serviceOrders] 
    });

    setSaveStatus('success');
    setTimeout(closeModal, 800);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOS(null);
    setAssignmentType('general');
    setSelectedCondoId(userCondoId || '');
    setSelectedEquipmentId('');
    setSelectedSystemId('');
    setInitialDescription('');
    setPhotosBefore([]);
    setPhotosAfter([]);
    setSaveStatus('idle');
  };

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => {
    const matchStatus = filterStatus === 'all' || os.status === filterStatus;
    const matchType = filterType === 'all' || os.type === filterType;
    
    // Filtro de Ronda: Apenas Vistorias do seu próprio condomínio
    if (isRonda) {
      return os.type === OSType.VISTORIA && os.condo_id === userCondoId && matchStatus;
    }

    // Filtro de Técnico Restrito: Apenas OS do seu condomínio
    if (user?.role === UserRole.TECHNICIAN && user.condo_id) {
       return os.condo_id === user.condo_id && matchStatus && matchType;
    }

    // Filtro Síndico
    if (isCondoUser) {
       return os.condo_id === userCondoId && matchStatus && matchType;
    }
    
    return matchStatus && matchType;
  });

  const filteredEquipments = useMemo(() => {
    return data.equipments.filter(e => e.condo_id === selectedCondoId);
  }, [data.equipments, selectedCondoId]);

  const filteredSystems = useMemo(() => {
    return data.systems.filter(s => s.condo_id === selectedCondoId);
  }, [data.systems, selectedCondoId]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {isRonda ? 'Minhas Vistorias' : 'Ordens de Serviço'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isRonda ? 'Inspeções e rondas periódicas.' : 'Gestão técnica e atendimentos.'}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {!isRonda && (
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none flex-1 md:flex-none">
              <option value="all">Tipos: Todos</option>
              {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button 
            onClick={() => { setEditingOS(null); setOsType(isRonda ? OSType.VISTORIA : OSType.SERVICE); setIsModalOpen(true); }} 
            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 flex-1 md:flex-none"
          >
            <Plus size={16} className="inline mr-1" /> {isRonda ? 'Nova Vistoria' : 'Novo Chamado'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOS.map((os: ServiceOrder) => {
          const condo = data.condos.find((c: Condo) => c.id === os.condo_id);
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
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                       <p className="text-slate-600 leading-relaxed bg-slate-900 text-white p-4 rounded-xl font-mono text-[10px]">{os.actions_performed || 'Em aguardo...'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button 
                      onClick={() => { 
                        setEditingOS(os); 
                        setSelectedCondoId(os.condo_id);
                        setAssignmentType(os.equipment_id ? 'equipment' : os.system_id ? 'system' : 'general');
                        setSelectedEquipmentId(os.equipment_id || '');
                        setSelectedSystemId(os.system_id || '');
                        setPhotosBefore(os.photos_before || []);
                        setPhotosAfter(os.photos_after || []);
                        setOsType(os.type);
                        setIsModalOpen(true); 
                      }} 
                      className="bg-slate-900 text-white text-[9px] font-black uppercase px-6 py-3 rounded-xl flex items-center transition-all shadow-lg active:scale-95"
                    >
                      <Edit2 size={14} className="mr-2" /> {os.status === OSStatus.COMPLETED ? 'Ver Detalhes' : 'Editar / Finalizar'}
                    </button>
                    <button 
                      onClick={() => handleShare(os, condo?.name)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-black uppercase px-6 py-3 rounded-xl flex items-center transition-colors"
                    >
                      <Share2 size={14} className="mr-2" /> Compartilhar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingOS ? 'Gerenciar Registro' : isRonda ? 'Nova Vistoria' : 'Novo Chamado'}</h2>
              <button onClick={closeModal} className="p-2 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingOS?.status || OSStatus.OPEN}
                    className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-700 text-xs outline-none"
                  >
                    {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                  {(userCondoId) ? (
                    <div className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-black text-xs text-slate-600">
                      {data.condos.find((c: Condo) => c.id === userCondoId)?.name || 'NÃO VINCULADO'}
                    </div>
                  ) : (
                    <select 
                      disabled={!!editingOS}
                      required 
                      name="condo_id" 
                      value={selectedCondoId} 
                      onChange={(e) => setSelectedCondoId(e.target.value)} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none"
                    >
                      <option value="">Selecione...</option>
                      {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {!isRonda && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Registro</label>
                  <select 
                    name="type" 
                    value={osType}
                    onChange={(e) => setOsType(e.target.value as OSType)}
                    className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none"
                  >
                    {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vínculo do Atendimento</label>
                <div className="grid grid-cols-3 gap-2">
                   <button type="button" onClick={() => setAssignmentType('general')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${assignmentType === 'general' ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white text-slate-400 border-slate-200'}`}>Geral</button>
                   <button type="button" onClick={() => setAssignmentType('equipment')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${assignmentType === 'equipment' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white text-slate-400 border-slate-200'}`}>Ativo</button>
                   <button type="button" onClick={() => setAssignmentType('system')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${assignmentType === 'system' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-400 border-slate-200'}`}>Sistema</button>
                </div>
              </div>

              {assignmentType === 'equipment' && (
                <div className="space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Escolher Equipamento</label>
                  <select required name="equipment_id" value={selectedEquipmentId} onChange={(e) => setSelectedEquipmentId(e.target.value)} className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-900 text-xs outline-none">
                    <option value="">Escolha...</option>
                    {filteredEquipments.map(e => <option key={e.id} value={e.id}>{e.manufacturer} - {e.model} ({e.location})</option>)}
                  </select>
                </div>
              )}

              {assignmentType === 'system' && (
                <div className="space-y-1 animate-in slide-in-from-top duration-200">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Escolher Sistema</label>
                  <select required name="system_id" value={selectedSystemId} onChange={(e) => setSelectedSystemId(e.target.value)} className="w-full px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-900 text-xs outline-none">
                    <option value="">Escolha...</option>
                    {filteredSystems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{osType === OSType.VISTORIA ? 'O que foi observado?' : 'Relato do Problema'}</label>
                  <textarea required name="description" defaultValue={editingOS?.problem_description || initialDescription} rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Evidências (Antes / Ocorrência)</label>
                  <div className="flex gap-2 flex-wrap">
                    {photosBefore.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p} className="w-20 h-20 object-cover rounded-xl border" />
                        <button type="button" onClick={() => setPhotosBefore(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                      </div>
                    ))}
                    <label className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-all">
                      <Camera size={20} />
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, 'before')} />
                    </label>
                  </div>
                </div>
              </div>

              {(editingOS || selectedCondoId) && (
                <div className="pt-6 border-t space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Relatório de Ação / Conclusão</label>
                    <textarea name="actions" defaultValue={editingOS?.actions_performed} rows={4} className="w-full px-5 py-4 bg-slate-900 text-blue-100 border border-slate-800 rounded-2xl text-[10px] font-mono outline-none" placeholder="Relate o que foi feito para sanar..."></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Evidências (Depois / Execução)</label>
                    <div className="flex gap-2 flex-wrap">
                      {photosAfter.map((p, i) => (
                        <div key={i} className="relative group">
                          <img src={p} className="w-24 h-24 object-cover rounded-xl border border-blue-200" />
                          <button type="button" onClick={() => setPhotosAfter(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                        </div>
                      ))}
                      <label className="w-24 h-24 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-blue-400 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition-all">
                        <Camera size={24} />
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, 'after')} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 flex gap-4 shrink-0">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" disabled={saveStatus === 'saving'} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center">
                  {saveStatus === 'saving' ? <RefreshCcw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  {saveStatus === 'saving' ? 'Gravando...' : 'Gravar Registro'}
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
