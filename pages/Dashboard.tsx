
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
  DollarSign
} from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole, Appointment, ServiceOrder, Condo, Equipment, System } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'general' | 'equipment' | 'system'>('general');
  
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const condoId = user?.condo_id;

  // Filtragem de dados baseada no perfil
  const filteredOSList = useMemo(() => (isSindicoAdmin || (user?.role === UserRole.TECHNICIAN && condoId))
    ? data.serviceOrders.filter(os => os.condo_id === condoId)
    : data.serviceOrders, [data.serviceOrders, isSindicoAdmin, user?.role, condoId]);

  // Cálculo de custo total para perfil administrativo
  const totalCost = useMemo(() => {
    return filteredOSList
      .filter(os => os.status === OSStatus.COMPLETED)
      .reduce((acc, curr) => acc + (curr.service_value || 0) + (curr.material_value || 0), 0);
  }, [filteredOSList]);

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

  // Alertas baseados na periodicidade
  const periodicAlerts = useMemo(() => {
    const alerts: any[] = [];
    const today = new Date();

    const relevantEquips = (isSindicoAdmin || (user?.role === UserRole.TECHNICIAN && condoId))
      ? data.equipments.filter(e => e.condo_id === condoId)
      : data.equipments;

    relevantEquips.forEach(eq => {
      if (eq.maintenance_period && eq.last_maintenance) {
        const last = new Date(eq.last_maintenance);
        const next = new Date(last);
        next.setDate(last.getDate() + eq.maintenance_period);
        
        const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          alerts.push({ id: eq.id, name: `${eq.manufacturer} ${eq.model}`, days: diffDays, type: 'Equipamento', condo: data.condos.find(c => c.id === eq.condo_id)?.name });
        }
      }
    });

    return alerts.sort((a, b) => a.days - b.days);
  }, [data.equipments, data.condos, isSindicoAdmin, user?.role, condoId]);

  const filteredAppointments = useMemo(() => (isSindicoAdmin || (user?.role === UserRole.TECHNICIAN && condoId))
    ? data.appointments.filter(a => a.condo_id === condoId)
    : data.appointments,
  [data.appointments, isSindicoAdmin, user?.role, condoId]);

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
            {isSindicoAdmin 
              ? `Administração: ${data.condos.find(c => c.id === condoId)?.name}` 
              : "Visão consolidada da operação técnica."}
          </p>
        </div>
        {isAdminOrTech && (
          <button 
            onClick={() => {
              setSelectedCondoId(isSindicoAdmin ? (condoId || '') : '');
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
        {isSindicoAdmin ? (
          <StatCard title="Investimento" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)} icon={DollarSign} color="bg-emerald-500" subValue="Manutenção Acumulada" />
        ) : (
          <StatCard title="OS Abertas" value={filteredOSList.filter(o => o.status === OSStatus.OPEN).length} icon={PlayCircle} color="bg-emerald-500" subValue="Para Execução" />
        )}
      </div>

      {/* O resto do dashboard continua aqui... adaptado conforme necessário */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
           {/* Agenda e Alertas... (conforme código anterior) */}
           <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm p-8">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
                <Activity size={16} className="mr-2 text-blue-600" /> Atividade Recente do Condomínio
              </h3>
              <div className="space-y-4">
                 {filteredOSList.slice(0, 5).map(os => (
                   <div key={os.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <ClipboardCheck size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{os.type}: {os.problem_description.substring(0, 40)}...</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(os.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
