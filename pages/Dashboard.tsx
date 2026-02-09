
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
  Edit2,
  Search,
  ListFilter
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
  const [viewAllRoutines, setViewAllRoutines] = useState(false);
  
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRonda = user?.role === UserRole.RONDA;
  const userCondoId = user?.condo_id;

  // REGRAS DE ACESSO: Síndico e Admin gerenciam a agenda
  const canManageSchedule = isAdmin || isSindicoAdmin;

  const filteredOSList = useMemo(() => {
    let list = userCondoId 
      ? data.serviceOrders.filter(os => os.condo_id === userCondoId)
      : data.serviceOrders;
    
    if (isRonda) {
      list = list.filter(os => os.type === OSType.VISTORIA);
    }
    
    return list;
  }, [data.serviceOrders, userCondoId, isRonda]);

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

  // MOTOR DE AUTOMAÇÃO: Gera OS baseado nas rotinas
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const newOSs: ServiceOrder[] = [];
    const updatedAppts = [...data.appointments];
    let hasChanges = false;

    const pendingToOpen = data.appointments.filter(a => {
      if (a.status === 'Cancelada' as any) return false;
      
      // Filtro de segurança: se for síndico, só processa as dele ou as sem ID (legado)
      if (userCondoId && a.condo_id && a.condo_id !== userCondoId) return false;

      const isOneTimePending = !a.is_recurring && a.date <= todayStr && a.status === 'Pendente' && !a.service_order_id;
      
      let isRecurringDue = false;
      if (a.is_recurring && a.date <= todayStr) {
        const alreadyCreatedToday = data.serviceOrders.some(os => 
          os.condo_id === (a.condo_id || userCondoId) && 
          os.problem_description.includes(`[ID:${a.id}]`) && 
          os.created_at.startsWith(todayStr) &&
          os.status !== OSStatus.CANCELLED
        );
        isRecurringDue = !alreadyCreatedToday;
      }
      return isOneTimePending || isRecurringDue;
    });

    pendingToOpen.forEach(appt => {
      const osId = `OS-AUTO-${Date.now()}-${appt.id}`;
      const isRondaRoutine = appt.description.toLowerCase().includes('ronda') || appt.description.toLowerCase().includes('vistoria');
      
      newOSs.push({
        id: osId,
        type: isRondaRoutine ? OSType.VISTORIA : OSType.PREVENTIVE,
        status: OSStatus.OPEN,
        condo_id: appt.condo_id || userCondoId || '',
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

    if (hasChanges) {
      updateData({
        ...data,
        serviceOrders: [...newOSs, ...data.serviceOrders],
        appointments: updatedAppts
      });
    }
  }, [data.appointments, data.serviceOrders, userCondoId]);

  const allAppointments = useMemo(() => {
    // CORREÇÃO: Síndico vê as rotinas dele OU rotinas sem condomínio (legado)
    const base = userCondoId 
      ? data.appointments.filter(a => !a.condo_id || a.condo_id === userCondoId) 
      : data.appointments;
    return [...base].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [data.appointments, userCondoId]);

  const activeAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return allAppointments.filter(a => {
      if (a.status === 'Cancelada' as any) return false;
      
      const hasCompletedOS = data.serviceOrders.some(os => 
        os.status === OSStatus.COMPLETED && 
        (os.id === a.service_order_id || (a.is_recurring && os.problem_description.includes(`[ID:${a.id}]`) && os.created_at.startsWith(todayStr)))
      );
      return !hasCompletedOS;
    });
  }, [allAppointments, data.serviceOrders]);

  const handleAppointmentClick = (appt: Appointment) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const linkedOS = data.serviceOrders.find(os => 
      os.id === appt.service_order_id || (appt.is_recurring && os.problem_description.includes(`[ID:${appt.id}]`) && os.created_at.startsWith(todayStr))
    );
    if (linkedOS) {
      navigate(`/os?id=${linkedOS.id}`);
    } else {
      navigate(`/os?condoId=${appt.condo_id || userCondoId}`);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageSchedule) return;

    const formData = new FormData(e.currentTarget);
    // CORREÇÃO: Força o condo_id do usuário se ele for Síndico
    const condoIdToSave = userCondoId || (formData.get('condo_id') as string);
    
    if (!condoIdToSave) {
      alert("Erro: Selecione um condomínio.");
      return;
    }

    const apptData: Appointment = {
      id: editingAppt?.id || `APT-${Date.now()}`,
      condo_id: condoIdToSave,
      technician_id: editingAppt?.technician_id || user?.id || 'admin',
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      description: (formData.get('description') as string) || '',
      status: editingAppt?.status || 'Pendente',
      is_recurring: isRecurring,
      updated_at: new Date().toISOString()
    };

    const newAppts = editingAppt 
      ? data.appointments.map(a => a.id === editingAppt.id ? apptData : a)
      : [apptData, ...data.appointments];

    await updateData({...data, appointments: newAppts});
    setIsScheduleModalOpen(false);
    setEditingAppt(null);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!canManageSchedule) return;
    if (window.confirm('Excluir esta rotina definitivamente? As ordens automáticas não serão mais geradas.')) {
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
    setSelectedCondoId(appt.condo_id || userCondoId || '');
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
          <p className="text-sm text-slate-500 font-medium italic">
            {userCondoId 
              ? `Administração: ${data.condos.find(c => c.id === userCondoId)?.name || 'Unidade Gestora'}` 
              : "Visão consolidada da operação técnica."}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin text-blue-600' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
          
          {canManageSchedule && (
            <button 
              onClick={() => {
                setEditingAppt(null);
                setSelectedCondoId(userCondoId || '');
                setIsRecurring(false);
                setIsScheduleModalOpen(true);
              }}
              className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
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
          value={data.equipments.filter(e => (!userCondoId || e.condo_id === userCondoId) && e.maintenance_period).length} 
          icon={AlertTriangle} 
          color="bg-red-500" 
          subValue="Equipamentos" 
          onClick={() => navigate('/equipment')}
        />
        <StatCard 
          title="Agenda Ativa" 
          value={activeAppointments.length} 
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
           <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm p-8 h-full flex flex-col">
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
              <div className="space-y-4 flex-1">
                 {filteredOSList.slice(0, 5).map(os => (
                   <div 
                    key={os.id} 
                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all cursor-pointer group"
                    onClick={() => navigate(`/os?id=${os.id}`)}
                   >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <ClipboardCheck size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{os.type}: {os.problem_description.substring(0, 50)}...</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            {new Date(os.created_at).toLocaleDateString()} • {data.condos.find(c => c.id === os.condo_id)?.name || 'Geral'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-all" />
                   </div>
                 ))}
                 {filteredOSList.length === 0 && (
                   <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-30">
                     <FileText size={32} className="mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-center">Nenhum registro encontrado</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-6" ref={agendaRef}>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden h-full flex flex-col min-h-[500px]">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Settings size={80} /></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
               <div>
                 <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Gestão de Rotinas</h3>
                 <p className="text-[9px] text-white/40 font-bold mt-1 uppercase">Controle de Automação</p>
               </div>
               {canManageSchedule && (
                 <button 
                   onClick={() => setViewAllRoutines(!viewAllRoutines)}
                   className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all ${viewAllRoutines ? 'bg-blue-600 border-blue-600' : 'border-white/20 hover:bg-white/10'}`}
                 >
                   {viewAllRoutines ? 'Ver Ativas' : 'Ver Todas'}
                 </button>
               )}
            </div>

            <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {(viewAllRoutines ? allAppointments : activeAppointments).map(appt => (
                <div 
                  key={appt.id} 
                  className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                    appt.status === 'Cancelada' as any 
                      ? 'bg-red-500/5 border-red-500/20 grayscale opacity-60' 
                      : 'bg-white/10 border-white/10 hover:bg-white/15'
                  }`}
                >
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <p className={`text-[8px] font-black uppercase ${appt.status === 'Cancelada' as any ? 'text-red-400' : 'text-blue-300'}`}>
                          {appt.date.split('-').reverse().join('/')} - {appt.time}
                        </p>
                        {appt.is_recurring && <RefreshCw size={10} className="text-emerald-400 animate-spin-slow" />}
                      </div>
                      
                      {canManageSchedule && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleEditAppt(appt)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteAppointment(appt.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={12} /></button>
                        </div>
                      )}
                   </div>
                   
                   <div className="cursor-pointer" onClick={() => handleAppointmentClick(appt)}>
                     <p className="text-xs font-bold leading-tight">{appt.description}</p>
                     <div className="flex items-center justify-between mt-2">
                       <span className="text-[9px] text-white/40 font-black uppercase">{data.condos.find(c => c.id === appt.condo_id)?.name || 'Geral'}</span>
                       <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                         appt.status === 'Cancelada' as any ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                       }`}>
                         {appt.status}
                       </span>
                     </div>
                   </div>
                </div>
              ))}
              
              {(viewAllRoutines ? allAppointments : activeAppointments).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Activity size={48} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Nenhuma rotina configurada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                {editingAppt ? 'Editar Programação' : 'Nova Programação de Rotina'}
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
                  disabled={!!userCondoId}
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-60"
                >
                  <option value="">Selecione...</option>
                  {data.condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data Início</label>
                    <input required type="date" name="date" defaultValue={editingAppt?.date} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Horário</label>
                    <input required type="time" name="time" defaultValue={editingAppt?.time} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição do Atendimento</label>
                <textarea required name="description" defaultValue={editingAppt?.description} rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none resize-none" placeholder="Ex: Ronda perimetral e verificação de dreno no subsolo." />
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <RefreshCw size={18} className={`text-emerald-600 ${isRecurring ? 'animate-spin-slow' : ''}`} />
                    <div>
                       <p className="text-[10px] font-black text-emerald-800 uppercase leading-none">Manutenção Recorrente</p>
                       <p className="text-[9px] text-emerald-600 font-bold mt-1">Repetir automaticamente todos os dias.</p>
                    </div>
                 </div>
                 <button 
                  type="button" 
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-12 h-6 rounded-full relative transition-all ${isRecurring ? 'bg-emerald-500' : 'bg-slate-300'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setIsScheduleModalOpen(false); setEditingAppt(null); }} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center active:scale-95 transition-all">
                  <Save size={16} className="mr-2" /> {editingAppt ? 'Gravar Alterações' : 'Confirmar Programação'}
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
