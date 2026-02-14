
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Clock, Calendar, FileText, ChevronRight, Plus, Wrench, ShieldCheck, ArrowUpRight,
  ClipboardCheck, Building2, X, Save, Layers, Settings, PlayCircle, RefreshCw, Trash2, Edit2
} from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole, Appointment, ServiceOrder, Condo } from '../types';
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
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const userCondoId = user?.condo_id;

  const canManageSchedule = isAdmin || isSindicoAdmin;

  const filteredOSList = useMemo(() => {
    return userCondoId 
      ? data.serviceOrders.filter(os => os.condo_id === userCondoId)
      : data.serviceOrders;
  }, [data.serviceOrders, userCondoId]);

  const activeAppointments = useMemo(() => {
    return data.appointments.filter(a => a.status !== 'Cancelada' as any && a.status !== 'Realizada');
  }, [data.appointments]);

  const StatCard = ({ title, value, icon: Icon, color, subValue, onClick }: any) => (
    <button 
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-300 transition-all text-left w-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} text-white`}><Icon size={24} /></div>
        <ArrowUpRight size={16} className="text-slate-300" />
      </div>
      <div>
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
          <p className="text-sm text-slate-500 font-medium italic">Gestão operacional simplificada.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={onSync} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-600"><RefreshCw size={18} /></button>
          {canManageSchedule && (
            <button onClick={() => setIsScheduleModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center space-x-2">
              <Plus size={16} /> <span>Programar Rotina</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Ativos" value={data.equipments.length} icon={Wrench} color="bg-blue-600" onClick={() => navigate('/equipment')} />
        <StatCard title="Agenda" value={activeAppointments.length} icon={Calendar} color="bg-indigo-600" onClick={() => {}} />
        <StatCard title="OS Abertas" value={filteredOSList.filter(o => o.status === OSStatus.OPEN).length} icon={PlayCircle} color="bg-emerald-500" onClick={() => navigate('/os')} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
           <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Atividade de Manutenção</h3>
           <div className="space-y-4">
              {filteredOSList.slice(0, 5).map(os => (
                <div key={os.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white transition-all cursor-pointer" onClick={() => navigate(`/os?id=${os.id}`)}>
                   <div className="flex items-center space-x-4">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ClipboardCheck size={18} /></div>
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
  );
};

export default Dashboard;
