
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
  Activity,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole, Appointment, ServiceOrder, Condo, Equipment, System } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'general' | 'equipment' | 'system'>('general');
  const [showAlertsList, setShowAlertsList] = useState(false);
  
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const condoId = user?.condo_id;

  // Permissão estendida para agendamento: Admin, Tech ou Síndico
  const canSchedule = isAdminOrTech || isSindicoAdmin;

  // Filtro centralizado por condomínio (Isolamento de dados)
  const filteredOSList = useMemo(() => (condoId)
    ? data.serviceOrders.filter(os => os.condo_id === condoId)
    : data.serviceOrders, [data.serviceOrders, condoId]);

  const totalCost = useMemo(() => {
    return filteredOSList
      .filter(os => os.status === OSStatus.COMPLETED)
      .reduce((acc, curr) => acc + (curr.service_value || 0) + (curr.material_value || 0), 0);
  }, [filteredOSList]);

  useEffect(() => {
    if (!canSchedule) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const pendingToOpen = data.appointments.filter(a => 
      a.date <= todayStr && 
      a.status === 'Pendente' && 
      !a.service_order_id &&
      (!condoId || a.condo_id === condoId)
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
  }, [data.appointments, canSchedule, condoId]);

  const periodicAlerts = useMemo(() => {
    const alerts: any[] = [];
    const today = new Date();

    const relevantEquips = (condoId)
      ? data.equipments.filter(e => e.condo_id === condoId)
      : data.equipments;

    relevantEquips.forEach(eq => {
      if (eq.maintenance_period && eq.last_maintenance) {
        const last = new Date(eq.last_maintenance);
        const next = new Date(last);
        next.setDate(last.getDate() + eq.maintenance_period);
        
        const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          alerts.push({ 
            id: eq.id, 
            name: `${eq.manufacturer} ${eq.model}`, 
            days: diffDays, 
            type: 'Equipamento', 
            condo: data.condos.find(c => c.id === eq.condo_id)?.name,
            location: eq.location
          });
        }
      }
    });

    return alerts.sort((a, b) => a.days - b.days);
  }, [data.equipments, data.condos, condoId]);

  const filteredAppointments = useMemo(() => (condoId)
    ? data.appointments.filter(a => a.condo_id === condoId)
    : data.appointments,
  [data.appointments, condoId]);

  const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const condoIdToSave = condoId || (formData.get('condo_id') as string);
    
    const newAppt: Appointment = {
      id: `APT-${Date.now()}`,
      condo_id: condoIdToSave,
      technician_id: user?.id || 'admin',
      equipment_id: formData.get('equipment_id') as string || undefined,
      system_id: formData.get('system_id') as string || undefined,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      description: formData.get('description') as string,
      status: 'Pendente',
      updated_at: new Date().toISOString()
    };

    updateData({
      ...data,
      appointments: [newAppt, ...data.appointments]
    });
    setIsScheduleModalOpen(false);
  };

  const StatCard = ({ title, value, icon: Icon, color, subValue, onClick }: any) => (
    <button 
      onClick={onClick}
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
        {canSchedule && (
          <button 
            onClick={() => {
              setSelectedCondoId(condoId || '');
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
        <StatCard 
          title="Urgências" 
          value={periodicAlerts.length} 
          icon={AlertTriangle} 
          color="bg-red-500" 
          subValue="Vencendo agora" 
          onClick={() => setShowAlertsList(!showAlertsList)}
        />
        <StatCard 
          title="Agenda Ativa" 
          value={filteredAppointments.filter(a => a.status === 'Pendente').length} 
          icon={Calendar} 
          color="bg-blue-600" 
          subValue="A executar" 
          onClick={() => { /* Navegação ou Scroll */ }}
        />
        {isSindicoAdmin ? (
          <StatCard 
            title="Investimento" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)} 
            icon={DollarSign} 
            color="bg-emerald-500" 
            subValue="Custo Acumulado" 
          />
        ) : (
          <StatCard 
            title="OS Abertas" 
            value={filteredOSList.filter(o => o.status === OSStatus.OPEN).length} 
            icon={PlayCircle} 
            color="bg-emerald-500" 
            subValue="Pendentes" 
            onClick={() => navigate('/os?status=Aberta')}
          />
        )}
      </div>

      {showAlertsList && periodicAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center">
              <AlertTriangle size={16} className="mr-2" /> Ativos com manutenção vencida ou próxima
            </h4>
            <button onClick={() => setShowAlertsList(false)} className="text-red-400 hover:text-red-600"><X size={18}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {periodicAlerts.map(alert => (
              <div key={alert.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">{alert.condo}</p>
                  <p className="text-xs font-bold text-slate-900">{alert.name}</p>
                  <p className={`text-[10px] font-black uppercase mt-1 ${alert.days < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {alert.days < 0 ? `Atrasado há ${Math.abs(alert.days)} dias` : `Vence em ${alert.days} dias`}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/os?equipmentId=${alert.id}&description=Preventiva vencida conforme periodicidade.`)}
                  className="bg-red-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-lg"
                >
                  Abrir OS
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                  <Activity size={16} className="mr-2 text-blue-600" /> Atividade Recente
                </h3>
                <button onClick={() => navigate('/os')} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Ver todas</button>
              </div>
              <div className="space-y-4">
                 {filteredOSList.slice(0, 5).map(os => (
                   <div key={os.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors cursor-pointer" onClick={() => navigate(`/os?id=${os.id}`)}>
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <ClipboardCheck size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{os.type}: {os.problem_description.substring(0, 40)}...</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(os.created_at).toLocaleDateString()} • {data.condos.find(c => c.id === os.condo_id)?.name}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                   </div>
                 ))}
                 {filteredOSList.length === 0 && (
                   <p className="text-center py-10 text-slate-400 text-xs font-medium">Nenhuma atividade registrada.</p>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Wrench size={80} /></div>
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Agenda de Hoje</h3>
            <div className="space-y-4 relative z-10">
              {filteredAppointments.filter(a => a.date === new Date().toISOString().split('T')[0]).map(appt => (
                <div key={appt.id} className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                   <p className="text-[8px] font-black text-blue-300 uppercase">{appt.time}</p>
                   <p className="text-xs font-bold mt-1">{appt.description}</p>
                   <p className="text-[9px] text-white/50 font-medium mt-1 uppercase tracking-tighter">
                     {data.condos.find(c => c.id === appt.condo_id)?.name}
                   </p>
                </div>
              ))}
              {filteredAppointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length === 0 && (
                <p className="text-xs text-white/40 italic">Sem compromissos para hoje.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Programar Preventiva</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                <select 
                  required 
                  name="condo_id" 
                  value={condoId || selectedCondoId} 
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
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data</label>
                    <input required type="date" name="date" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Hora</label>
                    <input required type="time" name="time" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Vincular a:</label>
                <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value as any)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                   <option value="general">Geral / Descritivo</option>
                   <option value="equipment">Equipamento</option>
                   <option value="system">Sistema Predial</option>
                </select>
              </div>

              {assignmentType === 'equipment' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Equipamento</label>
                  <select name="equipment_id" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                    <option value="">Selecionar...</option>
                    {data.equipments.filter(e => e.condo_id === (condoId || selectedCondoId)).map(e => <option key={e.id} value={e.id}>{e.manufacturer} {e.model}</option>)}
                  </select>
                </div>
              )}

              {assignmentType === 'system' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Sistema</label>
                  <select name="system_id" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                    <option value="">Selecionar...</option>
                    {data.systems.filter(s => s.condo_id === (condoId || selectedCondoId)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição da Tarefa</label>
                <textarea required name="description" rows={3} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none resize-none" placeholder="O que deve ser feito?" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Agendar Tarefa
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
