
import React, { useMemo } from 'react';
import { AlertTriangle, Clock, Calendar, FileText, ChevronRight } from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data }) => {
  const navigate = useNavigate();
  const user = data.currentUser;
  const isRestricted = user?.role === UserRole.CONDO_USER;
  const condoId = user?.condo_id;

  const filteredOSList = useMemo(() => isRestricted 
    ? data.serviceOrders.filter(os => os.condo_id === condoId)
    : data.serviceOrders, [data.serviceOrders, isRestricted, condoId]);

  const criticalEquipments = useMemo(() => isRestricted
    ? data.equipments.filter(e => e.condo_id === condoId && e.electrical_state === 'Crítico')
    : data.equipments.filter(e => e.electrical_state === 'Crítico'),
  [data.equipments, isRestricted, condoId]);

  const filteredAppointments = useMemo(() => isRestricted
    ? data.appointments.filter(a => a.condo_id === condoId)
    : data.appointments,
  [data.appointments, isRestricted, condoId]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${color} text-white shadow-lg shadow-current/10`}><Icon size={20} /></div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-600 transition-colors">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel Operacional</h1>
        <p className="text-sm text-slate-500 font-medium">
          {isRestricted ? `Gestão técnica do condomínio ${data.condos.find(c => c.id === condoId)?.name || ''}` : `Gestão Técnica Centralizada.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Ativos Críticos" value={criticalEquipments.length} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="OS Aberta" value={filteredOSList.filter(o => o.status === OSStatus.OPEN).length} icon={Clock} color="bg-blue-600" />
        <StatCard title="Agenda Ativa" value={filteredAppointments.length} icon={Calendar} color="bg-slate-700" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><FileText size={14} className="mr-2 text-blue-600" /> Atividades Recentes</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredOSList.slice(0, 8).length > 0 ? (
            filteredOSList.slice(0, 8).map((os: any) => (
              <div key={os.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/os')}>
                <div className="flex items-center space-x-4 min-w-0">
                  <div className={`w-1 h-10 rounded-full shrink-0 ${os.type === OSType.CORRETIVE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{data.condos.find((c: any) => c.id === os.condo_id)?.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{os.type} • {new Date(os.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase whitespace-nowrap ${os.status === OSStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{os.status}</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma atividade recente registrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
