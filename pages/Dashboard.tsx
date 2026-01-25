
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, AlertTriangle, CheckCircle2, Clock, TrendingUp, Wrench } from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole } from '../types';

const Dashboard: React.FC<{ data: AppData }> = ({ data }) => {
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  const filteredOSList = isCondoUser 
    ? data.serviceOrders.filter(os => os.condo_id === user?.condo_id)
    : data.serviceOrders;

  const filteredEquipList = isCondoUser
    ? data.equipments.filter(eq => eq.condo_id === user?.condo_id)
    : data.equipments;

  const openOS = filteredOSList.filter((os: any) => os.status === OSStatus.OPEN).length;
  const criticalEquip = filteredEquipList.filter((eq: any) => eq.electrical_state === 'Crítico').length;
  const completedOS = filteredOSList.filter((os: any) => os.status === OSStatus.COMPLETED).length;

  const chartData = [
    { name: 'Prev.', value: filteredOSList.filter((os: any) => os.type === OSType.PREVENTIVE).length },
    { name: 'Corr.', value: filteredOSList.filter((os: any) => os.type === OSType.CORRECTIVE).length },
    { name: 'Avulso', value: filteredOSList.filter((os: any) => os.type === OSType.SERVICE).length },
  ];

  const statusData = [
    { name: 'Aberta', value: openOS, color: '#3b82f6' },
    { name: 'Concluída', value: completedOS, color: '#10b981' },
    { name: 'Progresso', value: filteredOSList.filter((os: any) => os.status === OSStatus.IN_PROGRESS).length, color: '#f59e0b' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel Executivo</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          {isCondoUser ? `Status do seu condomínio.` : `Status de toda a rede.`}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {!isCondoUser && <StatCard title="Condomínios" value={data.condos.length} icon={Building2} color="bg-slate-800" />}
        <StatCard title="OS Aberta" value={openOS} icon={Clock} color="bg-blue-600" trend="HOJE" />
        <StatCard title="Ativos Críticos" value={criticalEquip} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="OS Finalizada" value={completedOS} icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center text-slate-400"><Wrench size={14} className="mr-2" /> Demanda por Tipo</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center text-slate-400"><TrendingUp size={14} className="mr-2" /> Saúde Operacional</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center"><Clock size={14} className="mr-2 text-blue-600" /> Atividades Recentes</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredOSList.slice(0, 5).map((os: any) => (
            <div key={os.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className={`w-1 h-10 rounded-full shrink-0 ${os.type === OSType.CORRECTIVE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{data.condos.find((c: any) => c.id === os.condo_id)?.name}</p>
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
