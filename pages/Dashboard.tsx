
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, AlertTriangle, CheckCircle2, Clock, TrendingUp, Wrench, Calendar, Plus, Edit2, Trash2, X, MapPin, User as UserIcon, Activity } from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole, Appointment, Condo, User } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const filteredOSList = useMemo(() => isCondoUser 
    ? data.serviceOrders.filter(os => os.condo_id === user?.condo_id)
    : data.serviceOrders, [data.serviceOrders, isCondoUser, user?.condo_id]);

  const monitoredCritCount = useMemo(() => {
    return data.equipments.filter(e => e.tuya_device_id && e.monitoring_status === 'critico' && (!isCondoUser || e.condo_id === user?.condo_id)).length;
  }, [data.equipments, isCondoUser, user?.condo_id]);

  const openOS = filteredOSList.filter((os: any) => os.status === OSStatus.OPEN).length;
  const completedOS = filteredOSList.filter((os: any) => os.status === OSStatus.COMPLETED).length;

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }: any) => (
    <div onClick={onClick} className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer hover:border-blue-300 transition-all' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${color} text-white`}><Icon size={20} /></div>
        {trend && <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{trend}</span>}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel Operacional</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            {isCondoUser ? `Status do seu condomínio.` : `Gestão Técnica Integrada.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Monitoramento" value={monitoredCritCount} icon={Activity} color={monitoredCritCount > 0 ? "bg-red-500" : "bg-slate-800"} trend={monitoredCritCount > 0 ? "ALERTA" : "OK"} onClick={() => navigate('/monitoring')} />
        <StatCard title="OS Aberta" value={openOS} icon={Clock} color="bg-blue-600" trend="HOJE" />
        <StatCard title="OS Finalizada" value={completedOS} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Agenda" value={data.appointments.length} icon={Calendar} color="bg-slate-700" />
      </div>

      {/* Alertas Críticos Tuya na Home */}
      {monitoredCritCount > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center justify-between">
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500 text-white rounded-xl animate-pulse"><AlertTriangle size={24} /></div>
              <div>
                 <p className="text-sm font-black text-red-900">EQUIPAMENTOS EM ESTADO CRÍTICO</p>
                 <p className="text-xs text-red-700 font-medium">Foram detectadas anomalias em {monitoredCritCount} ativos monitorados.</p>
              </div>
           </div>
           <button onClick={() => navigate('/monitoring')} className="px-6 py-2.5 bg-red-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all">
             Resolver Agora
           </button>
        </div>
      )}

      {/* Atividades Recentes (Original) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center"><Clock size={14} className="mr-2 text-blue-600" /> Atividades Recentes</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredOSList.slice(0, 5).map((os: any) => (
            <div key={os.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4 min-w-0">
                <div className={`w-1 h-10 rounded-full shrink-0 ${os.type === OSType.CORRECTIVE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{data.condos.find((c: any) => c.id === os.condo_id)?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{os.type} • {new Date(os.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${os.status === OSStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{os.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
