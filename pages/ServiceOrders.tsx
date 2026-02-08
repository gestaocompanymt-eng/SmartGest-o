
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Edit2, Share2, Wrench, MapPin, Camera, Trash2, Image as ImageIcon, CheckCircle2, Save, Layers, Settings, Building2, RefreshCcw, Play, Eye, Thermometer, Droplet, Wind, User as UserIcon, Activity
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, System, UserRole, AppData, Equipment } from '../types';
import { supabase, isSupabaseActive } from '../supabase';

// Componente para Gestão de Ordens de Serviço e Vistorias
const ServiceOrders: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRonda = user?.role === UserRole.RONDA;
  const userCondoId = user?.condo_id;
  const location = useLocation();

  // Permissão para exclusão: Admin ou Síndico/Gestor
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

  // Efeito para lidar com parâmetros de URL (Deep Linking para OS ou Equipamento)
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

  // Função para salvar ou atualizar a Ordem de Serviço
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    const formData = new FormData(e.currentTarget);
    const statusFromForm = formData.get('status') as OSStatus;
    const finalCondoId = userCondoId || selectedCondoId;
    const currentTechnicianId = user?.id || 'unknown';

    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Date.now()}`,
      type: isRonda ? OSType.VISTORIA : (formData.get('type') as OSType),
      status: statusFromForm || editingOS?.status || OSStatus.OPEN,
      condo_id: finalCondoId,
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

  const handleDeleteOS = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('ATENÇÃO: Deseja realmente excluir esta Ordem de Serviço permanentemente? Esta ação não pode ser desfeita.')) {
      try {
        if (navigator.onLine && isSupabaseActive) {
          const { error } = await supabase.from('service_orders').delete().eq('id', id);
          if (error) throw error;
        }
        
        const newOrders = data.serviceOrders.filter(o => o.id !== id);
        updateData({ ...data, serviceOrders: newOrders });
        setExpandedOS(null);
      } catch (err) {
        console.error("Erro ao excluir OS:", err);
        alert("Falha ao excluir Ordem de Serviço.");
      }
    }
  };

  // Filtragem avançada de OS
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
      alert('Copiado para a área de transferência!');
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
            <>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none flex-1 md:flex-none">
                <option value="all">Todos Status</option>
                {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none flex-1 md:flex-none">
                <option value="all">Todos Tipos</option>
                {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </>
          )}
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
            <div key={os.id} className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded ? 'border-blue-400 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
                onClick={() => setExpandedOS(isExpanded ? null : os.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${os.status === OSStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{os.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                        os.status === OSStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {os.status}
                      </span>
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{os.type}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight">{os.problem_description.substring(0, 80)}{os.problem_description.length > 80 ? '...' : ''}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center">
                      <Building2 size={12} className="mr-1" /> {condo?.name || '---'} {os.location && `• ${os.location}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Criada em</p>
                    <p className="text-xs font-bold text-slate-700">{new Date(os.created_at).toLocaleDateString()}</p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-5">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                          <Activity size={14} className="mr-1" /> Ações Realizadas
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                          {os.actions_performed || 'Nenhuma ação detalhada registrada.'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingOS(os); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2">
                          <Edit2 size={14} /> <span>Atualizar OS</span>
                        </button>
                        <button onClick={() => handleShare(os, condo?.name)} className="px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                          <Share2 size={18} />
                        </button>
                        {canDelete && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteOS(os.id); }} 
                            className="px-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                            title="Excluir Ordem de Serviço"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Peças Trocadas</p>
                          <p className="text-xs font-bold text-slate-900">{os.parts_replaced.length} itens</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Custo Total</p>
                          <p className="text-xs font-black text-blue-600">R$ {((os.service_value || 0) + (os.material_value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      
                      {os.photos_after.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Registro Fotográfico</p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                             {os.photos_after.map((p, i) => (
                               <img key={i} src={p} className="w-20 h-20 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredOS.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
            <FileText size={48} className="text-slate-300 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Nenhum registro encontrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingOS ? 'Atualizar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h2>
              <button onClick={closeModal} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {!editingOS && !isRonda && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular a</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'general', label: 'Geral', icon: Building2 },
                      { id: 'equipment', label: 'Equipamento', icon: Layers },
                      { id: 'system', label: 'Sistema', icon: Settings }
                    ].map(type => (
                      <button 
                        key={type.id} 
                        type="button" 
                        onClick={() => setAssignmentType(type.id as any)}
                        className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                          assignmentType === type.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
                        }`}
                      >
                        <type.icon size={14} />
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingOS && (
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                    <select required value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} disabled={!!userCondoId} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-60">
                      <option value="">Selecione...</option>
                      {data.condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                
                {!isRonda && (
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Serviço</label>
                    <select required name="type" value={osType} onChange={(e) => setOsType(e.target.value as OSType)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                      {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {!editingOS && assignmentType === 'equipment' && (
                <div className="space-y-1 animate-in fade-in duration-300">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Selecionar Equipamento</label>
                  <select required value={selectedEquipmentId} onChange={(e) => setSelectedEquipmentId(e.target.value)} className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-700 text-xs outline-none">
                    <option value="">Buscar no inventário...</option>
                    {availableEquipments.map(e => <option key={e.id} value={e.id}>{e.manufacturer} {e.model} ({e.location})</option>)}
                  </select>
                </div>
              )}

              {!editingOS && assignmentType === 'system' && (
                <div className="space-y-1 animate-in fade-in duration-300">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Selecionar Sistema</label>
                  <select required value={selectedSystemId} onChange={(e) => setSelectedSystemId(e.target.value)} className="w-full px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-700 text-xs outline-none">
                    <option value="">Buscar sistemas...</option>
                    {availableSystems.map(s => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição do Problema / Ocorrência</label>
                <textarea required name="description" defaultValue={editingOS?.problem_description} rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none resize-none" placeholder="Descreva detalhadamente o que foi identificado..." />
              </div>

              {editingOS && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                     <Wrench size={16} className="mr-2 text-blue-600" /> Relatório de Execução
                   </h4>
                   
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status de Andamento</label>
                    <select name="status" defaultValue={editingOS.status} className="w-full px-5 py-4 bg-white border rounded-2xl font-black text-xs">
                      {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Detalhamento das Ações</label>
                    <textarea name="actions" defaultValue={editingOS.actions_performed} rows={4} className="w-full px-5 py-4 bg-white border rounded-2xl font-bold text-xs outline-none resize-none" placeholder="Quais medidas técnicas foram tomadas?" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Valor do Serviço (R$)</label>
                      <input type="number" step="0.01" name="service_value" defaultValue={editingOS.service_value} className="w-full px-5 py-4 bg-white border rounded-2xl font-black text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Materiais (R$)</label>
                      <input type="number" step="0.01" name="material_value" defaultValue={editingOS.material_value} className="w-full px-5 py-4 bg-white border rounded-2xl font-black text-xs" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saveStatus === 'saving'}
                  className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center transition-all ${
                    saveStatus === 'saving' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 
                    saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white active:scale-95'
                  }`}
                >
                  {saveStatus === 'saving' ? <RefreshCcw size={16} className="animate-spin" /> : 
                   saveStatus === 'success' ? <CheckCircle2 size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
                  <span>{saveStatus === 'saving' ? 'Gravando...' : saveStatus === 'success' ? 'Salvo!' : 'Confirmar Registro'}</span>
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
