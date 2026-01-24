
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, Filter, FileText, CheckCircle2, Clock, AlertCircle, 
  Share2, Edit2, Trash2, X, User as UserIcon, Settings, 
  Wrench, Camera, Image as ImageIcon, Trash, ChevronDown, ChevronUp
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, Equipment, System, UserRole } from '../types';

const ServiceOrders: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOS, setExpandedOS] = useState<string | null>(null);
  
  // Estados para o formulário dinâmico
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'equipment' | 'system' | 'general'>('general');
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  const fileInputBeforeRef = useRef<HTMLInputElement>(null);
  const fileInputAfterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const systemId = params.get('systemId');
    const equipmentId = params.get('equipmentId');

    if (systemId) {
      const sys = data.systems.find((s: System) => s.id === systemId);
      if (sys) {
        openNewOSWithSystem(sys);
      }
    }
  }, [location.search, data.systems]);

  const openNewOSWithSystem = (sys: System) => {
    setSelectedCondoId(sys.condoId);
    setAssignmentType('system');
    setEditingOS(null);
    setPhotosBefore([]);
    setPhotosAfter([]);
    setIsModalOpen(true);
  };

  const handleEditOS = (os: ServiceOrder) => {
    setEditingOS(os);
    setSelectedCondoId(os.condoId);
    if (os.systemId) setAssignmentType('system');
    else if (os.equipmentId) setAssignmentType('equipment');
    else setAssignmentType('general');
    
    setPhotosBefore(os.photosBefore || []);
    setPhotosAfter(os.photosAfter || []);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files) return;

    // Fix: Explicitly type the file as File to avoid 'unknown' type error on line 72 when using readAsDataURL
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'before') setPhotosBefore(prev => [...prev, base64]);
        else setPhotosAfter(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') setPhotosBefore(prev => prev.filter((_, i) => i !== index));
    else setPhotosAfter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Math.floor(1000 + Math.random() * 9000)}`,
      type: formData.get('type') as OSType,
      status: editingOS?.status || OSStatus.OPEN,
      condoId: formData.get('condoId') as string,
      equipmentId: assignmentType === 'equipment' ? (formData.get('equipmentId') as string) : undefined,
      systemId: assignmentType === 'system' ? (formData.get('systemId') as string) : undefined,
      problemDescription: formData.get('description') as string,
      actionsPerformed: (formData.get('actions') as string) || editingOS?.actionsPerformed || '',
      partsReplaced: editingOS?.partsReplaced || [],
      photosBefore: photosBefore,
      photosAfter: photosAfter,
      technicianId: editingOS?.technicianId || data.currentUser?.id || 'unknown',
      createdAt: editingOS?.createdAt || new Date().toISOString(),
      completedAt: editingOS?.completedAt,
    };

    if (editingOS) {
      updateData({
        ...data,
        serviceOrders: data.serviceOrders.map((os: ServiceOrder) => os.id === editingOS.id ? osData : os)
      });
    } else {
      updateData({
        ...data,
        serviceOrders: [osData, ...data.serviceOrders]
      });
    }
    
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOS(null);
    setPhotosBefore([]);
    setPhotosAfter([]);
    setAssignmentType('general');
    setSelectedCondoId('');
  };

  const updateOSStatus = (id: string, newStatus: OSStatus) => {
    updateData({
      ...data,
      serviceOrders: data.serviceOrders.map((os: ServiceOrder) => 
        os.id === id ? { 
          ...os, 
          status: newStatus, 
          completedAt: newStatus === OSStatus.COMPLETED ? new Date().toISOString() : os.completedAt 
        } : os
      )
    });
  };

  const deleteOS = (id: string) => {
    if (confirm('Deseja excluir permanentemente este registro de OS?')) {
      updateData({
        ...data,
        serviceOrders: data.serviceOrders.filter((os: ServiceOrder) => os.id !== id)
      });
    }
  };

  const StatusIcon = ({ status }: { status: OSStatus }) => {
    switch (status) {
      case OSStatus.COMPLETED: return <CheckCircle2 size={16} className="text-emerald-500" />;
      case OSStatus.OPEN: return <Clock size={16} className="text-blue-500" />;
      case OSStatus.IN_PROGRESS: return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => 
    filterStatus === 'all' ? true : os.status === filterStatus
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500">Gestão técnica de chamados e manutenções.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-4 pr-10 py-3 md:py-2 bg-white border border-slate-200 rounded-xl appearance-none font-bold text-xs text-slate-700 outline-none"
            >
              <option value="all">Todos os Status</option>
              {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={() => { setEditingOS(null); setIsModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-4 md:py-2 rounded-xl flex items-center justify-center space-x-2 font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            <Plus size={20} />
            <span className="uppercase text-[10px] tracking-widest">Novo Registro</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOS.map((os: ServiceOrder) => {
          const condo = data.condos.find((c: Condo) => c.id === os.condoId);
          const equipment = os.equipmentId ? data.equipments.find((e: Equipment) => e.id === os.equipmentId) : null;
          const system = os.systemId ? data.systems.find((s: System) => s.id === os.systemId) : null;
          const isExpanded = expandedOS === os.id;
          
          return (
            <div key={os.id} className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'border-blue-400 shadow-lg' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
              <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1 min-w-0" onClick={() => setExpandedOS(isExpanded ? null : os.id)}>
                  <div className={`p-3 rounded-xl shrink-0 cursor-pointer ${
                    os.type === OSType.PREVENTIVE ? 'bg-blue-50 text-blue-600' : 
                    os.type === OSType.CORRECTIVE ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-black text-slate-900 text-xs">{os.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        os.type === OSType.PREVENTIVE ? 'bg-blue-100 text-blue-700' : 
                        os.type === OSType.CORRECTIVE ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {os.type}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-800 truncate leading-tight">{condo?.name || 'Local Não Identificado'}</p>
                    <div className="flex items-center mt-1 space-x-2">
                       {system && <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-tight flex items-center"><Settings size={10} className="mr-1" /> {system.name}</span>}
                       {equipment && <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-tight flex items-center"><Wrench size={10} className="mr-1" /> {equipment.model}</span>}
                       {(os.photosBefore?.length > 0 || os.photosAfter?.length > 0) && (
                         <span className="text-[9px] text-blue-500 font-bold flex items-center">
                           <Camera size={10} className="mr-1" /> {(os.photosBefore?.length || 0) + (os.photosAfter?.length || 0)} fotos
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto md:space-x-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50">
                  <div className="flex items-center space-x-2">
                    <StatusIcon status={os.status} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{os.status}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button onClick={() => handleEditOS(os)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    {data.currentUser?.role === UserRole.ADMIN && (
                      <button onClick={() => deleteOS(os.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button onClick={() => setExpandedOS(isExpanded ? null : os.id)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detalhes Expandidos (Histórico e Fotos) */}
              {isExpanded && (
                <div className="px-5 pb-6 border-t border-slate-50 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Relato da Ocorrência</h4>
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                        {os.problemDescription}
                      </p>
                      
                      {os.actionsPerformed && (
                        <div className="mt-4">
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Ações Executadas</h4>
                          <p className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-100 leading-relaxed font-medium">
                            {os.actionsPerformed}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Evidências Técnicas</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {os.photosBefore?.map((img: string, i: number) => (
                            <div key={`b-${i}`} className="aspect-square rounded-lg bg-slate-100 overflow-hidden border border-slate-200 group relative">
                              <img src={img} alt="Antes" className="w-full h-full object-cover" />
                              <div className="absolute top-1 left-1 bg-slate-900/60 text-white text-[7px] px-1 rounded font-black uppercase">Antes</div>
                            </div>
                          ))}
                          {os.photosAfter?.map((img: string, i: number) => (
                            <div key={`a-${i}`} className="aspect-square rounded-lg bg-slate-100 overflow-hidden border border-slate-200 relative">
                              <img src={img} alt="Depois" className="w-full h-full object-cover" />
                              <div className="absolute top-1 left-1 bg-emerald-600/80 text-white text-[7px] px-1 rounded font-black uppercase">Depois</div>
                            </div>
                          ))}
                          {(!os.photosBefore?.length && !os.photosAfter?.length) && (
                            <div className="col-span-4 py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300">
                              <Camera size={24} />
                              <p className="text-[8px] font-bold mt-2 uppercase tracking-widest">Nenhuma foto registrada</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {os.status === OSStatus.OPEN && (
                          <button onClick={() => updateOSStatus(os.id, OSStatus.IN_PROGRESS)} className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                            Iniciar Atendimento
                          </button>
                        )}
                        {os.status === OSStatus.IN_PROGRESS && (
                          <button onClick={() => updateOSStatus(os.id, OSStatus.COMPLETED)} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                            Finalizar OS
                          </button>
                        )}
                        <button className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase active:scale-95">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal OS (Criação e Edição Completa) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white">
                  <Wrench size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingOS ? `Editando ${editingOS.id}` : 'Nova Ordem de Serviço'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preencha todos os dados técnicos</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6 overflow-y-auto flex-1 scroll-touch">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Chamado</label>
                  <select required name="type" defaultValue={editingOS?.type} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10">
                    {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condomínio / Cliente</label>
                  <select required name="condoId" value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
                    <option value="">Selecione o local...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {selectedCondoId && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button type="button" onClick={() => setAssignmentType('general')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${assignmentType === 'general' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Infra Geral</button>
                    <button type="button" onClick={() => setAssignmentType('system')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${assignmentType === 'system' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Sistema</button>
                    <button type="button" onClick={() => setAssignmentType('equipment')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${assignmentType === 'equipment' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Equipamento</button>
                  </div>

                  {assignmentType === 'system' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vincular a Sistema</label>
                      <select required name="systemId" defaultValue={editingOS?.systemId} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-blue-900 outline-none">
                        <option value="">Escolha o sistema...</option>
                        {data.systems.filter((s: any) => s.condoId === selectedCondoId).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

                  {assignmentType === 'equipment' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vincular a Ativo</label>
                      <select required name="equipmentId" defaultValue={editingOS?.equipmentId} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-blue-900 outline-none">
                        <option value="">Escolha o equipamento...</option>
                        {data.equipments.filter((e: any) => e.condoId === selectedCondoId).map((e: any) => <option key={e.id} value={e.id}>{e.manufacturer} - {e.model}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição da Patologia / Solicitação</label>
                <textarea required name="description" defaultValue={editingOS?.problemDescription} rows={3} placeholder="Descreva detalhadamente o problema observado..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"></textarea>
              </div>

              {editingOS && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ações Executadas (Histórico)</label>
                  <textarea name="actions" defaultValue={editingOS?.actionsPerformed} rows={3} placeholder="O que foi feito para solucionar?" className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-xl font-medium outline-none text-emerald-900"></textarea>
                </div>
              )}

              {/* Seção de Fotos Antes/Depois */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fotos (Antes)</label>
                    <button type="button" onClick={() => fileInputBeforeRef.current?.click()} className="flex items-center space-x-1 text-blue-600 font-black text-[9px] uppercase hover:underline">
                      <Plus size={14} /> <span>Adicionar</span>
                    </button>
                    <input type="file" ref={fileInputBeforeRef} multiple accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, 'before')} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {photosBefore.map((img, i) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-xl border border-slate-200 relative group overflow-hidden">
                        <img src={img} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i, 'before')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                    {photosBefore.length === 0 && (
                      <div onClick={() => fileInputBeforeRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 cursor-pointer hover:border-blue-200 hover:text-blue-300 transition-all">
                        <Camera size={20} />
                        <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">Câmera</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Fotos (Depois)</label>
                    <button type="button" onClick={() => fileInputAfterRef.current?.click()} className="flex items-center space-x-1 text-emerald-600 font-black text-[9px] uppercase hover:underline">
                      <Plus size={14} /> <span>Adicionar</span>
                    </button>
                    <input type="file" ref={fileInputAfterRef} multiple accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'after')} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {photosAfter.map((img, i) => (
                      <div key={i} className="aspect-square bg-emerald-50 rounded-xl border border-emerald-100 relative group overflow-hidden">
                        <img src={img} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i, 'after')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                    {photosAfter.length === 0 && (
                      <div onClick={() => fileInputAfterRef.current?.click()} className="aspect-square border-2 border-dashed border-emerald-50 rounded-xl flex flex-col items-center justify-center text-emerald-200 cursor-pointer hover:border-emerald-200 hover:text-emerald-300 transition-all">
                        <ImageIcon size={20} />
                        <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">Evidência</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col-reverse md:flex-row gap-4 shrink-0">
                <button type="button" onClick={closeModal} className="w-full px-6 py-4 border-2 border-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs active:bg-slate-50">Descartar</button>
                <button type="submit" className="w-full px-6 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                  {editingOS ? 'Atualizar Registro' : 'Salvar Ordem de Serviço'}
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
