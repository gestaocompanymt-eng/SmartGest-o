
import React, { useMemo, useState } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole, Appointment, ServiceOrder, Condo, Equipment, System } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  const user = data.currentUser;
  const isRestricted = user?.role === UserRole.CONDO_USER;
  const condoId = user?.condo_id;

  // Filtragem de dados baseada no perfil
  const filteredOSList = useMemo(() => isRestricted 
    ? data.serviceOrders.filter(os => os.condo_id === condoId)
    : data.serviceOrders, [data.serviceOrders, isRestricted, condoId]);

  const filteredAppointments = useMemo(() => isRestricted
    ? data.appointments.filter(a => a.condo_id === condoId)
    : data.appointments,
  [data.appointments, isRestricted, condoId]);

  const criticalEquipments = useMemo(() => isRestricted
    ? data.equipments.filter(e => e.condo_id === condoId && e.electrical_state === 'Crítico')
    : data.equipments.filter(e => e.electrical_state === 'Crítico'),
  [data.equipments, isRestricted, condoId]);

  // Lógica da Agenda (Próximos 7 dias)
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

  const handleCompleteAppointment = async (appt: Appointment) => {
    if (!window.confirm('Deseja marcar esta vistoría/manutenção como REALIZADA? Isso gerará um histórico na lista de Ordens de Serviço.')) return;

    // 1. Criar a OS baseada no agendamento
    const newOS: ServiceOrder = {
      id: `OS-PREV-${Date.now()}`,
      type: OSType.PREVENTIVE,
      status: OSStatus.COMPLETED,
      condo_id: appt.condo_id,
      problem_description: `Manutenção Preventiva Programada: ${appt.description}`,
      actions_performed: 'Vistoria periódica realizada conforme cronograma. Sistemas operando dentro da normalidade.',
      parts_replaced: [],
      photos_before: [],
      photos_after: [],
      technician_id: user?.id || 'admin',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 2. Remover o agendamento ou marcar como realizado
    const updatedAppointments = data.appointments.filter(a => a.id !== appt.id);
    const updatedOS = [newOS, ...data.serviceOrders];

    updateData({
      ...data,
      appointments: updatedAppointments,
      serviceOrders: updatedOS
    });
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
        <button 
          onClick={() => setIsScheduleModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 flex items-center space-x-2 active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Programar Preventiva</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Ativos Críticos" value={criticalEquipments.length} icon={AlertTriangle} color="bg-red-500" subValue="Risco de Parada" />
        <StatCard title="Agenda Ativa" value={filteredAppointments.length} icon={Calendar} color="bg-blue-600" subValue="Esta Semana" />
        <StatCard title="Preventivas/Mês" value={filteredOSList.filter(o => o.type === OSType.PREVENTIVE).length} icon={ClipboardCheck} color="bg-emerald-500" subValue="Concluídas" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Coluna Principal: Agenda */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                <Calendar size={16} className="mr-2 text-blue-600" /> Cronograma Semanal de Vistorias
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
                                <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><Wrench size={18} /></div>
                                <div>
                                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tight">{appt.time} • Manutenção Preventiva</p>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{appt.description}</p>
                                  {!isRestricted && (
                                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                                      {data.condos.find(c => c.id === appt.condo_id)?.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleCompleteAppointment(appt)}
                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-white"
                                title="Concluir Vistoria"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex items-center border-b border-slate-50 pb-4">
                            <span className="text-[10px] font-bold text-slate-300 italic">Nenhuma atividade programada</span>
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

        {/* Coluna Lateral: Histórico e Ações */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldCheck size={120} /></div>
             <div className="relative z-10">
               <h3 className="text-lg font-black uppercase tracking-tight leading-tight">Plano de Manutenção</h3>
               <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">Preventivas em dia garantem a valorização do patrimônio e economia de até 40% em reparos.</p>
               <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-black uppercase text-slate-400">Status Geral</span>
                    <span className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1 rounded-lg uppercase">Excelente</span>
                  </div>
                  <button 
                    onClick={() => navigate('/os')}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xl"
                  >
                    <span>Ver Histórico OS</span>
                    <ChevronRight size={14} />
                  </button>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                <Clock size={16} className="mr-2 text-blue-600" /> Últimas OS
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredOSList.slice(0, 5).map(os => (
                <div key={os.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">
                    {os.type} • {new Date(os.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{os.problem_description}</p>
                </div>
              ))}
              {filteredOSList.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic text-[10px]">Sem registros recentes.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento de Preventiva */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Programar Manutenção / Vistoria</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newAppt: Appointment = {
                id: `APPT-${Date.now()}`,
                condo_id: isRestricted ? (condoId || '') : (formData.get('condo_id') as string),
                technician_id: user?.id || 'admin',
                date: formData.get('date') as string,
                time: formData.get('time') as string,
                description: formData.get('description') as string,
                status: 'Pendente'
              };
              updateData({ ...data, appointments: [newAppt, ...data.appointments] });
              setIsScheduleModalOpen(false);
            }} className="p-8 space-y-5">
              
              {!isRestricted && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                  <select required name="condo_id" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none">
                    <option value="">Selecione o Condomínio...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <input required type="date" name="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Horário</label>
                  <input required type="time" name="time" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição / Equipamento</label>
                <textarea required name="description" placeholder="Ex: Vistoria mensal nas bombas de recalque do Bloco A" rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none resize-none"></textarea>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  <Save size={16} className="inline mr-2" /> Salvar na Agenda
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
