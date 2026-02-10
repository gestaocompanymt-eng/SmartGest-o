
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Edit2, Share2, Wrench, MapPin, Camera, Trash2, Image as ImageIcon, CheckCircle2, Save, Layers, Settings, Building2, RefreshCw, Play, Eye, Thermometer, Droplet, Wind, User as UserIcon, Activity, CloudOff, Cloud
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

  // Estados para Fotos
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  // Helper para buscar nome do usuário com Cargo
  const getUserNameWithRole = (id?: string) => {
    if (!id) return 'Não atribuído';
    if (id === 'AUTOMAÇÃO' || id === 'SISTEMA') return '🤖 SISTEMA';
    const found = data.users.find(u => u.id === id);
    if (!found) return 'Usuário Removido';
    const roleLabel = found.role === UserRole.RONDA ? 'RONDA' : 
                      found.role === UserRole.TECHNICIAN ? 'TÉCNICO' : 
                      found.role === UserRole.ADMIN ? 'ADM' : 'GESTOR';
    return `${found.name} (${roleLabel})`;
  };

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
        setPhotosBefore(os.photos_before || []);
        setPhotosAfter(os.photos_after || []);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => {
    const files = e.target.files;
    if (!files) return;
    
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'before') setPhotosBefore(prev => [...prev, base64]);
        else setPhotosAfter(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number, target: 'before' | 'after') => {
    if (target === 'before') setPhotosBefore(prev => prev.filter((_, i) => i !== index));
    else setPhotosAfter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    
    const formData = new FormData(e.currentTarget);
    const finalCondoId = userCondoId || selectedCondoId || formData.get('condo_id') as string;
    if (!finalCondoId) {
      setSaveStatus('idle');
      return;
    }

    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: isRonda ? OSType.VISTORIA : (formData.get('type') as OSType || osType),
      status: (formData.get('status') as OSStatus) || editingOS?.status || OSStatus.OPEN,
      condo_id: finalCondoId,
      location: (formData.get('location') as string) || '',
      equipment_id: assignmentType === 'equipment' ? selectedEquipmentId : undefined,
      system_id: assignmentType === 'system' ? selectedSystemId : undefined,
      problem_description: (formData.get('description') as string),
      actions_performed: (formData.get('actions') as string) || editingOS?.actions_performed || '',
      parts_replaced: editingOS?.parts_replaced || [],
      photos_before: photosBefore,
      photos_after: photosAfter,
      technician_id: user?.id || editingOS?.technician_id || 'unknown', 
      created_at: editingOS?.created_at || new Date().toISOString(),
      service_value: Number(formData.get('service_value')) || 0,
      material_value: Number(formData.get('material_value')) || 0,
      completed_at: (formData.get('status') === OSStatus.COMPLETED) ? new Date().toISOString() : editingOS?.completed_at,
      updated_at: new Date().toISOString(),
      sync_status: navigator.onLine ? 'synced' : 'pending' // Define status inicial de sincronia
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
    setAssignmentType('general');
    setSelectedEquipmentId('');
    setSelectedSystemId('');
    setPhotosBefore([]);
    setPhotosAfter([]);
  };

  const handleDeleteOS = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Excluir esta Ordem de Serviço?')) {
      if (deleteData) await deleteData('service_orders', id);
      else updateData({ ...data, serviceOrders: data.serviceOrders.filter(o => o.id !== id) });
    }
  };

  const handleShare = async (os: ServiceOrder, condoName?: string) => {
    const text = `🛠️ *SmartGestão - ${os.type}*\n\n*ID:* ${os.id}\n*Status:* ${os.status}\n*Resp:* ${getUserNameWithRole(os.technician_id)}\n\n*Relato:* ${os.problem_description}`;
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
          const isPending = os.sync_status === 'pending';

          return (
            <div key={os.id} className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded ? 'border-blue-400 shadow-md' : 'border-slate-200 shadow-sm'} ${isPending ? 'border-amber-200 bg-amber-50/10' : ''}`}>
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
                      {isPending && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase">
                          <CloudOff size={10} /> Sincronia Pendente
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight">{os.problem_description.substring(0, 80)}...</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center">
                        <Building2 size={12} className="mr-1" /> {condo?.name || '---'}
                      </p>
                      <p className="text-[10px] text-blue-600 font-black uppercase flex items-center">
                        <UserIcon size={12} className="mr-1" /> {getUserNameWithRole(os.technician_id)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3">
                   {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 p-5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Relatório Técnico</p>
                       <p className="text-sm text-slate-600 italic bg-slate-50 p-4 rounded-xl">{os.actions_performed || 'Sem detalhes de execução.'}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Histórico</p>
                       <p className="text-[10px] font-bold text-slate-700">Abertura: {new Date(os.created_at).toLocaleString()}</p>
                       <p className="text-[10px] font-bold text-slate-700">Responsável: {getUserNameWithRole(os.technician_id)}</p>
                       {os.completed_at && <p className="text-[10px] font-bold text-emerald-600">Conclusão: {new Date(os.completed_at).toLocaleString()}</p>}
                       {isPending && <p className="text-[9px] font-black text-amber-600 uppercase mt-2 flex items-center gap-1"><CloudOff size={12}/> Armazenado Localmente</p>}
                     </div>
                  </div>

                  {/* GALERIA DE FOTOS NA VISUALIZAÇÃO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {os.photos_before && os.photos_before.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos (Antes do Serviço)</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {os.photos_before.map((p, i) => (
                            <img key={i} src={p} className="w-24 h-24 object-cover rounded-xl shadow-sm border" alt="Antes" />
                          ))}
                        </div>
                      </div>
                    )}
                    {os.photos_after && os.photos_after.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Fotos (Depois do Serviço)</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {os.photos_after.map((p, i) => (
                            <img key={i} src={p} className="w-24 h-24 object-cover rounded-xl shadow-sm border border-emerald-100" alt="Depois" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserIcon size={18} className="text-blue-600" />
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Responsável Logado</p>
                    <p className="text-xs font-black text-blue-900">{user?.name} ({user?.role === UserRole.RONDA ? 'RONDA' : 'TÉCNICO'})</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg uppercase">Sessão Ativa</span>
                   {!navigator.onLine && <span className="text-[8px] font-black text-amber-600 uppercase mt-1">Trabalhando Offline</span>}
                </div>
              </div>
              
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Vincular Atendimento a:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['general', 'equipment', 'system'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAssignmentType(type)}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${
                        assignmentType === type
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {type === 'general' ? 'Geral' : type === 'equipment' ? 'Equipamento' : 'Sistema'}
                    </button>
                  ))}
                </div>
              </div>

              {assignmentType === 'equipment' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Selecionar Equipamento</label>
                  <select
                    required
                    value={selectedEquipmentId}
                    onChange={(e) => setSelectedEquipmentId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs"
                  >
                    <option value="">Selecione o ativo...</option>
                    {data.equipments
                      .filter(e => e.condo_id === selectedCondoId)
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.manufacturer} {e.model} ({e.location})</option>
                      ))}
                  </select>
                </div>
              )}

              {assignmentType === 'system' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Selecionar Sistema Predial</label>
                  <select
                    required
                    value={selectedSystemId}
                    onChange={(e) => setSelectedSystemId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs"
                  >
                    <option value="">Selecione o sistema...</option>
                    {data.systems
                      .filter(s => s.condo_id === selectedCondoId)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição do Problema / Solicitação</label>
                <textarea required name="description" defaultValue={editingOS?.problem_description} rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs" />
              </div>

              {/* SEÇÃO DE REGISTRO FOTOGRÁFICO - ANTES */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registrar Fotos (Início do Atendimento)</label>
                <div className="flex flex-wrap gap-3">
                  {photosBefore.map((p, i) => (
                    <div key={i} className="relative group">
                      <img src={p} className="w-20 h-20 object-cover rounded-xl border border-slate-200" alt={`Before ${i}`} />
                      <button type="button" onClick={() => removePhoto(i, 'before')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                    <Camera size={20} />
                    <span className="text-[8px] font-black mt-1 uppercase">Abrir</span>
                    <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleFileChange(e, 'before')} />
                  </label>
                </div>
              </div>

              {editingOS && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status do Atendimento</label>
                    <select name="status" defaultValue={editingOS.status} className="w-full px-5 py-4 bg-white border rounded-2xl font-black text-xs">
                      {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ações Realizadas (Relatório)</label>
                    <textarea name="actions" defaultValue={editingOS.actions_performed} rows={4} className="w-full px-5 py-4 bg-white border rounded-2xl font-bold text-xs" placeholder="Descreva o que foi feito..." />
                  </div>

                  {/* SEÇÃO DE REGISTRO FOTOGRÁFICO - DEPOIS */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Registrar Fotos (Evidência de Conclusão)</label>
                    <div className="flex flex-wrap gap-3">
                      {photosAfter.map((p, i) => (
                        <div key={i} className="relative group">
                          <img src={p} className="w-20 h-20 object-cover rounded-xl border border-emerald-100" alt={`After ${i}`} />
                          <button type="button" onClick={() => removePhoto(i, 'after')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center text-emerald-400 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                        <Camera size={20} />
                        <span className="text-[8px] font-black mt-1 uppercase">Capturar</span>
                        <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleFileChange(e, 'after')} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" disabled={saveStatus === 'saving'} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center">
                  {saveStatus === 'saving' ? <RefreshCw className="animate-spin" /> : <Save className="mr-2" />}
                  <span>
                    {saveStatus === 'saving' ? 'Salvando...' : (navigator.onLine ? 'Confirmar OS' : 'Salvar Local (Offline)')}
                  </span>
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
