
import React, { useMemo, useState, useEffect } from 'react';
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
  Save,
  Layers,
  Settings,
  PlayCircle,
  Activity
} from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole, Appointment, ServiceOrder, Condo, Equipment, System } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'general' | 'equipment' | 'system'>('general');
  
  const user = data.currentUser;
  const isRestricted = user?.role === UserRole.CONDO_USER;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const condoId = user?.condo_id;

  // Lógica de ativação automática: Transformar agendamentos do dia em OS Abertas
  useEffect(() => {
    if (!isAdminOrTech) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const pendingToOpen = data.appointments.filter(a => 
      a.date <= todayStr && 
      a.status === 'Pendente' && 
      !a.service_order_id
    );

    if (pendingToOpen.length > 0) {
      const newOSs: ServiceOrder[] = [];
      const updatedAppts = [...data.appointments];

      pendingToOpen.forEach(appt => {
        const osId = `OS-AUTO-${Date.now()}-${appt.id}`;
        const newOS: ServiceOrder = {
          id: osId,
          type: OSType.PREVENTIVE,
          status: OSStatus.OPEN,
          condo_id: appt.condo_id,
          equipment_id: appt.equipment_id,
          system_id: appt.system_id,
          problem_description: `[PREVENTIVA PROGRAMADA] ${appt.description}`,
          actions_performed: '',
          parts_replaced: [],
          photos_before: [],
          photos_after: [],
          technician_id: 'aguardando-tecnico',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        newOSs.push(newOS);
        
        const idx = updatedAppts.findIndex(a => a.id === appt.id);
        if (idx !== -1) {
          updatedAppts[idx] = { ...updatedAppts[idx], service_order_id: osId, status: 'Confirmada' };
        }
      });

      updateData({
        ...data,
        serviceOrders: [...newOSs, ...data.serviceOrders],
        appointments: updatedAppts
      });
    }
  }, [data.appointments, isAdminOrTech]);

  // Lista de ativos que precisam de revisão baseada na PERIODICIDADE
  const periodicAlerts = useMemo(() => {
    const alerts: any[] = [];
    const today = new Date();

    // Checar Equipamentos
    data.equipments.forEach(eq => {
      if (eq.maintenance_period && eq.last_maintenance) {
        const last = new Date(eq.last_maintenance);
        const next = new Date(last);
        next.setDate(last.getDate() + eq.maintenance_period);
        
        const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) { // Alerta se faltar 7 dias ou menos
          alerts.push({ id: eq.id, name: `${eq.manufacturer} ${eq.model}`, days: diffDays, type: 'Equipamento', condo: data.condos.find(c => c.id === eq.condo_id)?.name });
        }
      }
    });

    // Checar Sistemas
    data.systems.forEach(sys => {
      if (sys.maintenance_period && sys.last_maintenance) {
        const last = new Date(sys.last_maintenance);
        const next = new Date(last);
        next.setDate(last.getDate() + sys.maintenance_period);
        
        const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          alerts.push({ id: sys.id, name: sys.name, days: diffDays, type: 'Sistema', condo: data.condos.find(c => c.id === sys.condo_id)?.name });
        }
      }
    });

    return alerts.sort((a, b) => a.days - b.days);
  }, [data.equipments, data.systems, data.condos]);

  // Filtragem de dados baseada no perfil
  const filteredOSList = useMemo(() => isRestricted 
    ? data.serviceOrders.filter(os => os.condo_id === condoId)
    : data.serviceOrders, [data.serviceOrders, isRestricted, condoId]);

  const filteredAppointments = useMemo(() => isRestricted
    ? data.appointments.filter(a => a.condo_id === condoId)
    : data.appointments,
  [data.appointments, isRestricted, condoId]);

  const next7Days = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredAppointments.filter(a => a.date === dateStr);
  };

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-300 transition-all group relative overflow-hidden">
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
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel de Gestão</h1>
          <p className="text-sm text-slate-500 font-medium">
            {isRestricted 
              ? `Monitoramento técnico: ${data.condos.find(c => c.id === condoId)?.name}` 
              : "Visão consolidada de toda a operação técnica."}
          </p>
        </div>
        {isAdminOrTech && (
          <button 
            onClick={() => {
              setSelectedCondoId(isRestricted ? (condoId || '') : '');
              setIsScheduleModalOpen(true);
            }}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 flex items-center space-x-2 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>Programar Preventiva</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Urgências" value={periodicAlerts.length} icon={AlertTriangle} color="bg-red-500" subValue="Por Periodicidade" />
        <StatCard title="Agenda Ativa" value={filteredAppointments.length} icon={Calendar} color="bg-blue-600" subValue="Esta Semana" />
        <StatCard title="OS Abertas" value={filteredOSList.filter(o => o.status === OSStatus.OPEN).length} icon={PlayCircle} color="bg-emerald-500" subValue="Para Execução" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* Alertas de Periodicidade */}
          {periodicAlerts.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-6 animate-in slide-in-from-top duration-300">
               <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center">
                 <Clock size={16} className="mr-2" /> Atenção: Manutenções Perto do Vencimento
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {periodicAlerts.slice(0, 4).map(alert => (
                    <div key={alert.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm">
                       <div>
                         <p className="text-[8px] font-black text-amber-500 uppercase">{alert.type} • {alert.condo}</p>
                         <p className="text-xs font-black text-slate-800 leading-tight">{alert.name}</p>
                         <p className={`text-[10px] font-black mt-1 uppercase ${alert.days < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                           {alert.days < 0 ? `Atrasado ${Math.abs(alert.days)} dias` : alert.days === 0 ? 'Vence hoje' : `Vence em ${alert.days} dias`}
                         </p>
                       </div>
                       <button 
                        onClick={() => {
                          setSelectedCondoId(data.equipments.find(e => e.id === alert.id)?.condo_id || data.systems.find(s => s.id === alert.id)?.condo_id || '');
                          setAssignmentType(alert.type === 'Equipamento' ? 'equipment' : 'system');
                          setIsScheduleModalOpen(true);
                        }}
                        className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                       >
                         <Calendar size={18} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                <Calendar size={16} className="mr-2 text-blue-600" /> Agenda da Semana
              </h3>
            </div>
            <div className="p-4 md:p-8">
              <div className="flex flex-col space-y-8">
                {next7Days.map((day, idx) => {
                  const dayAppts = getAppointmentsForDay(day);
                  const isToday = idx === 0;
                  return (
                    <div key={idx} className={`flex gap-6 ${isToday ? 'scale-105 origin-left' : ''}`}>
                      <div className="flex flex-col items-center shrink-0 w-12">
                        <span className={`text-[10px] font-black uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm mt-1 shadow-sm border-2 ${isToday ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>
                          {day.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        {dayAppts.length > 0 ? (
                          dayAppts.map(appt => (
                            <div key={appt.id} className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 flex items-center justify-between group hover:border-blue-300 transition-all">
                              <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-xl shadow-sm ${appt.equipment_id ? 'bg-blue-100 text-blue-600' : appt.system_id ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400'}`}>
                                  {appt.equipment_id ? <Layers size={18} /> : appt.system_id ? <Settings size={18} /> : <Wrench size={18} />}
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tight">{appt.time} • {appt.equipment_id ? 'Ativo' : appt.system_id ? 'Sistema' : 'Geral'}</p>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{appt.description}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {!isRestricted && (
                                      <p className="text-[9px] font-black text-slate-400 uppercase">
                                        {data.condos.find(c => c.id === appt.condo_id)?.name}
                                      </p>
                                    )}
                                    {appt.service_order_id && (
                                      <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md uppercase">Na Lista do Técnico</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isAdminOrTech && appt.service_order_id && (
                                <button 
                                  onClick={() => navigate(`/os?id=${appt.service_order_id}`)}
                                  className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase shadow-xl active:scale-95 transition-all"
                                >
                                  <PlayCircle size={14} />
                                  <span>Dar Baixa</span>
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex items-center border-b border-slate-50 pb-4">
                            <span className="text-[10px] font-bold text-slate-300 italic">Livre</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldCheck size={120} /></div>
             <div className="relative z-10">
               <h3 className="text-lg font-black uppercase tracking-tight leading-tight">Metas de Preventiva</h3>
               <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">Periodicidades cadastradas ajudam a evitar custos emergenciais.</p>
               <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Ativos</span>
                    <span className="text-[10px] font-black text-white">{data.equipments.length + data.systems.length}</span>
                  </div>
                  <button 
                    onClick={() => navigate('/os')}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xl"
                  >
                    <span>Histórico Técnico</span>
                    <ChevronRight size={14} />
                  </button>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                <Activity size={16} className="mr-2 text-blue-600" /> Telemetria Recente
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {data.waterLevels.slice(0, 3).map(level => {
                 const condo = data.condos.find(c => c.id === level.condominio_id);
                 return (
                   <div key={level.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Reservatório</span>
                        <span className="text-[8px] font-black text-blue-600 uppercase">{new Date(level.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-end space-x-2">
                        <span className="text-2xl font-black text-slate-900 leading-none">{level.percentual}%</span>
                        <div className="flex-1 h-1 bg-slate-200 rounded-full mb-1">
                           <div className="h-full bg-blue-500 rounded-full" style={{ width: `${level.percentual}%` }}></div>
                        </div>
                      </div>
                   </div>
                 );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* O modal de agendamento permanece o mesmo, mantendo a flexibilidade de vincular equipamentos/sistemas */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Programar Preventiva</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newAppt: Appointment = {
                id: `APPT-${Date.now()}`,
                condo_id: isRestricted ? (condoId || '') : (formData.get('condo_id') as string),
                technician_id: user?.id || 'admin',
                equipment_id: assignmentType === 'equipment' ? (formData.get('equipment_id') as string) : undefined,
                system_id: assignmentType === 'system' ? (formData.get('system_id') as string) : undefined,
                date: formData.get('date') as string,
                time: formData.get('time') as string,
                description: formData.get('description') as string,
                status: 'Pendente'
              };
              updateData({ ...data, appointments: [newAppt, ...data.appointments] });
              setIsScheduleModalOpen(false);
            }} className="p-8 space-y-5 overflow-y-auto">
              
              {!isRestricted && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Condomínio</label>
                  <select required name="condo_id" value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Vincular a:</label>
                <div className="grid grid-cols-3 gap-2">
                   <button type="button" onClick={() => setAssignmentType('general')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${assignmentType === 'general' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400'}`}>Geral</button>
                   <button type="button" onClick={() => setAssignmentType('equipment')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${assignmentType === 'equipment' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>Ativo</button>
                   <button type="button" onClick={() => setAssignmentType('system')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${assignmentType === 'system' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>Sistema</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Data</label>
                  <input required type="date" name="date" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Horário</label>
                  <input required type="time" name="time" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Descrição</label>
                <textarea required name="description" placeholder="Ex: Vistoria preventiva mensal nas bombas" rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none resize-none"></textarea>
              </div>

              <div className="pt-6 flex gap-4 shrink-0">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
