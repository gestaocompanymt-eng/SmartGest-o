
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Wrench, 
  ShieldCheck, 
  ArrowUpRight,
  ClipboardCheck,
  Building2,
  X,
  User as UserIcon,
  Save,
  Layers,
  Settings,
  PlayCircle,
  Activity,
  DollarSign,
  ChevronDown,
  Trash2,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole, Appointment, ServiceOrder, Condo, Equipment, System } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ 
  data: AppData; 
  updateData: (d: AppData) => void; 
  deleteData?: (table: string, id: string) => void;
  onSync?: () => Promise<void> 
}> = ({ data, updateData, deleteData, onSync }) => {
  const navigate = useNavigate();
  const agendaRef = useRef<HTMLDivElement>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const isRonda = user?.role === UserRole.RONDA;
  const condoId = user?.condo_id;

  // REGRAS DE NEGÓCIO: Somente Admin e Síndico/Gestão gerenciam a agenda mestre
  const canManageSchedule = isAdmin || isSindicoAdmin;

  const filteredOSList = useMemo(() => {
    let list = condoId 
      ? data.serviceOrders.filter(os => os.condo_id === condoId)
      : data.serviceOrders;
    
    if (isRonda) {
      list = list.filter(os => os.type === OSType.VISTORIA);
    }
    
    return list;
  }, [data.serviceOrders, condoId, isRonda]);

  const scrollToAgenda = () => {
    agendaRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleManualSync = async () => {
    if (onSync) {
      setIsSyncing(true);
      await onSync();
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const newOSs: ServiceOrder[] = [];
    const updatedAppts = [...data.appointments];
    let hasChanges = false;

    const pendingToOpen = data.appointments.filter(a => {
      const isOneTimePending = !a.is_recurring && a.date <= todayStr && a.status === 'Pendente' && !a.service_order_id;
      let isRecurringDue = false;
      if (a.is_recurring && a.date <= todayStr) {
        const alreadyCreatedToday = data.serviceOrders.some(os => 
          os.condo_id === a.condo_id && 
          os.problem_description.includes(`[ID:${a.id}]`) && 
          os.created_at.startsWith(todayStr)
        );
        isRecurringDue = !alreadyCreatedToday;
      }
      return (isOneTimePending || isRecurringDue) && (!condoId || a.condo_id === condoId);
    });

    pendingToOpen.forEach(appt => {
      const osId = `OS-AUTO-${Date.now()}-${appt.id}`;
      const isRondaRoutine = appt.description.toLowerCase().includes('ronda') || appt.description.toLowerCase().includes('vistoria');
      
      newOSs.push({
        id: osId,
        type: isRondaRoutine ? OSType.VISTORIA : OSType.PREVENTIVE,
        status: OSStatus.OPEN,
        condo_id: appt.condo_id,
        equipment_id: appt.equipment_id,
        system_id: appt.system_id,
        problem_description: `[ROTINA ${appt.is_recurring ? 'RECORRENTE' : 'PROGRAMADA'}][ID:${appt.id}] ${appt.description}`,
        actions_performed: '',
        parts_replaced: [],
        photos_before: [],
        photos_after: [],
        technician_id: 'aguardando-tecnico',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (!appt.is_recurring) {
        const idx = updatedAppts.findIndex(a => a.id === appt.id);
        if (idx !== -1) {
          updatedAppts[idx] = { ...updatedAppts[idx], service_order_id: osId, status: 'Confirmada', updated_at: new Date().toISOString() };
        }
      }
      hasChanges = true;
    });

    data.equipments.forEach(eq => {
      if (condoId && eq.condo_id !== condoId) return;
      if (!eq.last_maintenance || !eq.maintenance_period) return;

      const nextDate = new Date(eq.last_maintenance);
      nextDate.setDate(nextDate.getDate() + eq.maintenance_period);
      nextDate.setHours(0, 0, 0, 0);

      if (nextDate <= today) {
        const alreadyHasOS = data.serviceOrders.some(os => 
          os.equipment_id === eq.id && 
          os.type === OSType.PREVENTIVE &&
          os.status !== OSStatus.CANCELLED &&
          new Date(os.created_at).getTime() >= new Date(eq.last_maintenance).getTime()
        );

        if (!alreadyHasOS) {
          const osId = `OS-PREV-${Date.now()}-${eq.id.slice(-4)}`;
          const typeName = data.equipmentTypes.find(t => t.id === eq.type_id)?.name || 'Equipamento';

          newOSs.push({
            id: osId,
            type: OSType.PREVENTIVE,
            status: OSStatus.OPEN,
            condo_id: eq.condo_id,
            equipment_id: eq.id,
            problem_description: `[GERAÇÃO AUTOMÁTICA - CRONOGRAMA] Manutenção Preventiva Periódica: ${typeName} ${eq.manufacturer} ${eq.model}. (Periodicidade: ${eq.maintenance_period} dias)`,
            actions_performed: '',
            parts_replaced: [],
            photos_before: [],
            photos_after: [],
            technician_id: 'aguardando-tecnico',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      updateData({
        ...data,
        serviceOrders: [...newOSs, ...data.serviceOrders],
        appointments: updatedAppts
      });
    }
  }, [data.appointments, data.serviceOrders, data.equipments, isAdminOrTech, isSindicoAdmin, condoId]);

  const activeDashboardAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const base = condoId ? data.appointments.filter(a => a.condo_id === condoId) : data.appointments;
    
    return base.filter(a => {
      const hasCompletedOS = data.serviceOrders.some(os => 
        os.status === OSStatus.COMPLETED && 
        (os.id === a.service_order_id || (a.is_recurring && os.problem_description.includes(`[ID:${a.id}]`) && os.created_at.startsWith(todayStr)))
      );
      if (hasCompletedOS) return false;
      return a.status === 'Pendente' || a.is_recurring;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [data.appointments, data.serviceOrders, condoId]);

  const handleAppointmentClick = (appt: Appointment) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const linkedOS = data.serviceOrders.find(os => 
      os.id === appt.service_order_id || (appt.is_recurring && os.problem_description.includes(`[ID:${appt.id}]`) && os.created_at.startsWith(todayStr))
    );
    if (linkedOS) {
      navigate(`/os?id=${linkedOS.id}`);
    } else {
      navigate(`/os?condoId=${appt.condo_id}`);
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageSchedule) return;

    const formData = new FormData(e.currentTarget);
    const condoIdToSave = condoId || (formData.get('condo_id') as string);
    
    const apptData: Appointment = {
      id: editingAppt?.id || `APT-${Date.now()}`,
      condo_id: condoIdToSave,
      technician_id: editingAppt?.technician_id || user?.id || 'admin',
      equipment_id: formData.get('equipment_id') as string || undefined,
      system_id: formData.get('system_id') as string || undefined,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      description: formData.get('description') as string,
      status: editingAppt?.status || 'Pendente',
      is_recurring: isRecurring,
      updated_at: new Date().toISOString()
    };

    const newAppts = editingAppt 
      ? data.appointments.map(a => a.id === editingAppt.id ? apptData : a)
      : [apptData, ...data.appointments];

    updateData({...data, appointments: newAppts});
    setIsScheduleModalOpen(false);
    setEditingAppt(null);
    setIsRecurring(false);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!canManageSchedule) return;
    if (window.confirm('Excluir esta programação definitiva?')) {
      if (deleteData) {
        await deleteData('appointments', id);
      } else {
        updateData({...data, appointments: data.appointments.filter(a => a.id !== id)});
      }
    }
  };

  const handleEditAppt = (appt: Appointment) => {
    if (!canManageSchedule) return;
    setEditingAppt(appt);
    setSelectedCondoId(appt.condo_id);
    setIsRecurring(!!appt.is_recurring);
    setIsScheduleModalOpen(true);
  };

  const StatCard = ({ title, value, icon: Icon, color, subValue, onClick }: any) => (
    <button 
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden text-left w-full"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${color}`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg shadow-current/10`}><Icon size={24} /></div>
        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline space-x-2">
          <h3 className="text-3xl font-black text-slate-900 leading-none">{value}</h3>
          {subValue && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel de Gestão</h1>
          <p className="text-sm text-slate-500 font-medium">
            {condoId 
              ? `Administração: ${data.condos.find(c => c.id === condoId)?.name}` 
              : "Visão consolidada da operação técnica."}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
            title="Forçar Sincronização com Nuvem"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin text-blue-600' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
          
          {canManageSchedule && (
            <button 
              onClick={() => {
                setEditingAppt(null);
                setSelectedCondoId(condoId || '');
                setIsRecurring(false);
                setIsScheduleModalOpen(true);
              }}
              className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Programar Rotina</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Urgências" 
          value={data.equipments.filter(e => (!condoId || e.condo_id === condoId) && e.maintenance_period).length} 
          icon={AlertTriangle} 
          color="bg-red-500" 
          subValue="Equipamentos" 
          onClick={() => navigate('/equipment')}
        />
        <StatCard 
          title="Agenda Ativa" 
          value={activeDashboardAppointments.length} 
          icon={Calendar} 
          color="bg-blue-600" 
          subValue="Ações do Plantão" 
          onClick={scrollToAgenda}
        />
        <StatCard 
          title="OS Abertas" 
          value={filteredOSList.filter(o => o.status === OSStatus.OPEN).length} 
          icon={PlayCircle} 
          color="bg-emerald-500" 
          subValue="Em aberto" 
          onClick={() => navigate('/os?status=Aberta')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                  <Activity size={16} className="mr-2 text-blue-600" /> Atividade Recente
                </h3>
                <button 
                  onClick={(e) => { e.preventDefault(); navigate('/os'); }} 
                  className="text-[9px] font-black text-blue-600 uppercase hover:underline p-2"
                >
                  Ver todas
                </button>
              </div>
              <div className="space-y-4">
                 {filteredOSList.slice(0, 5).map(os => {
                   const techUser = data.users.find(u => u.id === os.technician_id);
                   return (
                     <button 
                       key={os.id} 
                       className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all cursor-pointer group active:scale-[0.98] text-left" 
                       onClick={(e) => { e.preventDefault(); navigate(`/os?id=${os.id}`); }}
                     >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            <ClipboardCheck size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{os.type}: {os.problem_description.substring(0, 40)}...</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                              {new Date(os.created_at).toLocaleDateString()} • {data.condos.find(c => c.id === os.condo_id)?.name}
                            </p>
                            {(isAdmin || isSindicoAdmin) && techUser && (
                              <p className="text-[8px] font-black text-blue-600 uppercase mt-0.5 flex items-center">
                                <UserIcon size={10} className="mr-1" /> Executor: {techUser.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                     </button>
                   );
                 })}
                 {filteredOSList.length === 0 && (
                   <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma atividade recente encontrada.</p>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-6" ref={agendaRef}>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden h-full flex flex-col min-h-[400px]">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Wrench size={80} /></div>
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Agenda / Rotinas Ativas</h3>
            <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {activeDashboardAppointments.map(appt => (
                <div 
                  key={appt.id} 
                  className="w-full text-left bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10 group hover:bg-white/20 hover:border-blue-400/50 transition-all"
                >
                   <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <p className="text-[8px] font-black text-blue-300 uppercase">{appt.date.split('-').reverse().join('/')} - {appt.time}</p>
                        {appt.is_recurring && <RefreshCw size={10} className="text-emerald-400 animate-spin-slow" />}
                      </div>
                      
                      {canManageSchedule && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditAppt(appt); }} 
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Editar Rotina"
                          >
                             <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(appt.id); }} 
                            className="text-red-400 hover:text-red-500 p-1"
                            title="Excluir Rotina"
                          >
                             <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                   </div>
                   
                   <div className="cursor-pointer" onClick={() => handleAppointmentClick(appt)}>
                     <p className="text-xs font-bold mt-1 leading-tight">{appt.description}</p>
                     <p className="text-[9px] text-white/50 font-medium mt-1 uppercase tracking-tighter flex items-center justify-between">
                       <span>{data.condos.find(c => c.id === appt.condo_id)?.name}</span>
                       <ChevronRight size={12} className="text-blue-400" />
                     </p>
                   </div>
                </div>
              ))}
              {activeDashboardAppointments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
                  <p className="text-[10px] font-black uppercase text-center">Plantão em Dia!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                {editingAppt ? 'Editar Rotina Programada' : 'Programar Rotina / Plantão'}
              </h2>
              <button onClick={() => { setIsScheduleModalOpen(false); setEditingAppt(null); }} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                <select 
                  required 
                  name="condo_id" 
                  value={selectedCondoId} 
                  onChange={(e) => setSelectedCondoId(e.target.value)} 
                  disabled={!!condoId}
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-60"
                >
                  <option value="">Selecione...</option>
                  {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Início da Rotina</label>
                    <input required type="date" name="date" defaultValue={editingAppt?.date} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Horário Previsto</label>
                    <input required type="time" name="time" defaultValue={editingAppt?.time} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição da Rotina / Ronda</label>
                <textarea required name="description" defaultValue={editingAppt?.description} rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none resize-none" placeholder="Ex: Ronda perimetral no bloco A e verificação de dreno." />
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                       <RefreshCw size={18} className={isRecurring ? 'animate-spin-slow' : ''} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-800 uppercase leading-none">Rotina Fixa de Plantão</p>
                       <p className="text-[9px] text-emerald-600 font-bold mt-1">Repetir esta ação diariamente em todo plantão.</p>
                    </div>
                 </div>
                 <button 
                  type="button" 
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-emerald-500' : 'bg-slate-300'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setIsScheduleModalOpen(false); setEditingAppt(null); }} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center">
                  <Save size={16} className="mr-2" /> {editingAppt ? 'Salvar Alterações' : 'Confirmar Programação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
