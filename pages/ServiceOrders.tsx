
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Filter, FileText, CheckCircle2, Clock, AlertCircle, Share2, Edit2, Trash2, X, User as UserIcon, Settings, Wrench } from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, Equipment, System, UserRole } from '../types';

const ServiceOrders: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Estados para o formulário dinâmico
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'equipment' | 'system' | 'general'>('general');

  // Verifica se veio de um link "Abrir OS" em outra página
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const systemId = params.get('systemId');
    const equipmentId = params.get('equipmentId');

    if (systemId) {
      const sys = data.systems.find((s: System) => s.id === systemId);
      if (sys) {
        setSelectedCondoId(sys.condoId);
        setAssignmentType('system');
        setEditingOS(null);
        setIsModalOpen(true);
        // Pequeno delay para garantir que o DOM renderize os campos dependentes
        setTimeout(() => {
          const select = document.querySelector('select[name="systemId"]') as HTMLSelectElement;
          if (select) select.value = systemId;
        }, 100);
      }
    }
  }, [location.search, data.systems]);

  const isAdmin = data.currentUser?.role === UserRole.ADMIN;

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => 
    filterStatus === 'all' ? true : os.status === filterStatus
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Math.floor(Math.random() * 10000)}`,
      type: formData.get('type') as OSType,
      status: editingOS?.status || OSStatus.OPEN,
      condoId: formData.get('condoId') as string,
      equipmentId: assignmentType === 'equipment' ? (formData.get('equipmentId') as string) : undefined,
      systemId: assignmentType === 'system' ? (formData.get('systemId') as string) : undefined,
      problemDescription: formData.get('description') as string,
      actionsPerformed: editingOS?.actionsPerformed || '',
      partsReplaced: editingOS?.partsReplaced || [],
      photosBefore: editingOS?.photosBefore || [],
      photosAfter: editingOS?.photosAfter || [],
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
    setIsModalOpen(false);
    setEditingOS(null);
    setAssignmentType('general');
    setSelectedCondoId('');
  };

  const updateOSStatus = (id: string, newStatus: OSStatus) => {
    updateData({
      ...data,
      serviceOrders: data.serviceOrders.map((os: ServiceOrder) => 
        os.id === id ? { ...os, status: newStatus, completedAt: newStatus === OSStatus.COMPLETED ? new Date().toISOString() : undefined } : os
      )
    });
  };

  const StatusIcon = ({ status }: { status: OSStatus }) => {
    switch (status) {
      case OSStatus.COMPLETED: return <CheckCircle2 size={16} className="text-emerald-500" />;
      case OSStatus.OPEN: return <Clock size={16} className="text-blue-500" />;
      case OSStatus.IN_PROGRESS: return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500">Fluxo de atendimentos técnicos em campo.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-4 pr-10 py-3 md:py-2 bg-white border border-slate-200 rounded-xl appearance-none font-bold text-xs text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none"
            >
              <option value="all">Filtrar por Status</option>
              {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={() => { setEditingOS(null); setIsModalOpen(true); setAssignmentType('general'); }} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-4 md:py-2 rounded-xl flex items-center justify-center space-x-2 font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            <Plus size={20} />
            <span className="uppercase text-[10px] tracking-widest">Nova Demanda</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOS.map((os: ServiceOrder) => {
          const condo = data.condos.find((c: Condo) => c.id === os.condoId);
          const equipment = os.equipmentId ? data.equipments.find((e: Equipment) => e.id === os.equipmentId) : null;
          const system = os.systemId ? data.systems.find((s: System) => s.id === os.systemId) : null;
          
          return (
            <div key={os.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-400 transition-all active:scale-[0.99]">
              <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    os.type === OSType.PREVENTIVE ? 'bg-blue-50 text-blue-600' : 
                    os.type === OSType.CORRECTIVE ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-black text-slate-900 text-xs md:text-sm">{os.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        os.type === OSType.PREVENTIVE ? 'bg-blue-100 text-blue-700' : 
                        os.type === OSType.CORRECTIVE ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {os.type}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-800 truncate leading-tight">{condo?.name || 'Inespecífico'}</p>
                    <div className="flex items-center mt-0.5 space-x-2">
                       {system && (
                         <span className="flex items-center text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                           <Settings size={10} className="mr-1" /> {system.name}
                         </span>
                       )}
                       {equipment && (
                         <span className="flex items-center text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                           {/* Fix: Wrench icon was missing from imports */}
                           <Wrench size={10} className="mr-1" /> {equipment.manufacturer} {equipment.model}
                         </span>
                       )}
                       {!system && !equipment && (
                         <p className="text-[11px] text-slate-500 font-medium line-clamp-1 italic">{os.problemDescription}</p>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto px-1 md:px-0">
                  <div className="flex items-center space-x-1.5">
                    <StatusIcon status={os.status} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{os.status}</span>
                  </div>
                  <div className="flex items-center text-[9px] text-slate-400 font-black uppercase tracking-wider md:mt-1">
                    {new Date(os.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0">
                  {os.status === OSStatus.OPEN && (
                    <button 
                      onClick={() => updateOSStatus(os.id, OSStatus.IN_PROGRESS)}
                      className="flex-1 md:flex-none px-5 py-3 md:py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-800 uppercase tracking-widest active:scale-95 transition-transform"
                    >
                      INICIAR
                    </button>
                  )}
                  {os.status === OSStatus.IN_PROGRESS && (
                    <button 
                      onClick={() => updateOSStatus(os.id, OSStatus.COMPLETED)}
                      className="flex-1 md:flex-none px-5 py-3 md:py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-700 uppercase tracking-widest active:scale-95 transition-transform"
                    >
                      CONCLUIR
                    </button>
                  )}
                  <div className="flex space-x-1 md:space-x-2 ml-auto md:ml-0">
                    <button className="p-2.5 text-slate-400 hover:text-blue-600 active:bg-blue-50 rounded-xl">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OS Modal - Enhanced for Systems */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white md:rounded-2xl w-full h-full md:h-auto md:max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingOS ? 'Editar Chamado' : 'Abertura de OS'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingOS(null); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-5 overflow-y-auto flex-1 scroll-touch">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Atendimento</label>
                <select required name="type" defaultValue={editingOS?.type} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                  {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente / Condomínio</label>
                <select 
                  required 
                  name="condoId" 
                  value={selectedCondoId || editingOS?.condoId} 
                  onChange={(e) => setSelectedCondoId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  <option value="">Selecione o local...</option>
                  {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedCondoId && (
                <div className="space-y-4 pt-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setAssignmentType('general')}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${assignmentType === 'general' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                      Geral
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAssignmentType('system')}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${assignmentType === 'system' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                      Sistema
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAssignmentType('equipment')}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${assignmentType === 'equipment' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                      Equipamento
                    </button>
                  </div>

                  {assignmentType === 'system' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione o Sistema</label>
                      <select required name="systemId" defaultValue={editingOS?.systemId} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-blue-900">
                        <option value="">Escolha um sistema operacional...</option>
                        {data.systems.filter((s: System) => s.condoId === selectedCondoId).map((s: System) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {assignmentType === 'equipment' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione o Ativo</label>
                      <select required name="equipmentId" defaultValue={editingOS?.equipmentId} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-blue-900">
                        <option value="">Escolha um equipamento...</option>
                        {data.equipments.filter((e: Equipment) => e.condoId === selectedCondoId).map((e: Equipment) => (
                          <option key={e.id} value={e.id}>{e.manufacturer} - {e.model}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalhamento da Solicitação</label>
                <textarea required name="description" defaultValue={editingOS?.problemDescription} rows={4} placeholder="O que precisa ser feito ou qual o defeito observado?" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"></textarea>
              </div>

              <div className="pt-6 flex flex-col-reverse md:flex-row gap-4 shrink-0">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingOS(null); }} className="w-full px-6 py-4 border-2 border-slate-100 text-slate-500 font-black rounded-xl uppercase text-xs">Cancelar</button>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                   {editingOS ? 'Salvar Alterações' : 'Registrar Chamado'}
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
