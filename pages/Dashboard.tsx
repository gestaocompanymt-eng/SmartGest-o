
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Building2, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  LayoutGrid,
  // Fix: Added missing FileText import from lucide-react
  FileText
} from 'lucide-react';
import { AppData, OSStatus, OSType } from '../types';

const Dashboard: React.FC<{ data: AppData }> = ({ data }) => {
  const openOS = data.serviceOrders.filter((os: any) => os.status === OSStatus.OPEN).length;
  const criticalEquip = data.equipments.filter((eq: any) => eq.electricalState === 'Crítico').length;
  const completedOS = data.serviceOrders.filter((os: any) => os.status === OSStatus.COMPLETED).length;

  const chartData = [
    { name: 'Prev.', value: data.serviceOrders.filter((os: any) => os.type === OSType.PREVENTIVE).length },
    { name: 'Corr.', value: data.serviceOrders.filter((os: any) => os.type === OSType.CORRECTIVE).length },
    { name: 'Avulso', value: data.serviceOrders.filter((os: any) => os.type === OSType.SERVICE).length },
  ];

  const statusData = [
    { name: 'Aberta', value: openOS, color: '#3b82f6' },
    { name: 'Concluída', value: completedOS, color: '#10b981' },
    { name: 'Progresso', value: data.serviceOrders.filter((os: any) => os.status === OSStatus.IN_PROGRESS).length, color: '#f59e0b' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${color} shadow-sm`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span className="flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex items-center space-x-3">
        <div className="bg-slate-900 p-2 rounded-lg text-white md:hidden">
          <LayoutGrid size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel Executivo</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Status operacional de toda a rede.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="Condomínios" 
          value={data.condos.length} 
          icon={Building2} 
          color="bg-slate-800" 
        />
        <StatCard 
          title="OS Aberta" 
          value={openOS} 
          icon={Clock} 
          color="bg-blue-600" 
          trend="HOJE"
        />
        <StatCard 
          title="Ativos Críticos" 
          value={criticalEquip} 
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
        <StatCard 
          title="OS Finalizada" 
          value={completedOS} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center text-slate-400">
            <Wrench size={14} className="mr-2" /> Demanda por Tipo
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center text-slate-400">
            <TrendingUp size={14} className="mr-2" /> Saúde Operacional
          </h3>
          <div className="h-48 md:h-64 flex flex-col md:flex-row items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 md:flex md:flex-col justify-center gap-2 md:space-y-3 w-full md:w-auto md:pr-4 mt-4 md:mt-0">
              {statusData.map((s) => (
                <div key={s.name} className="flex flex-col md:flex-row items-center md:items-center space-y-1 md:space-y-0 md:space-x-2 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}></div>
                  <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center md:text-left">{s.name}</span>
                  <span className="text-xs font-black text-slate-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center">
            <Clock size={14} className="mr-2 text-blue-600" /> Ordens Recentes
          </h3>
          <button className="text-[10px] text-blue-600 font-black hover:underline uppercase tracking-widest">VER TODAS</button>
        </div>
        <div className="divide-y divide-slate-100">
          {data.serviceOrders.slice(0, 5).map((os: any) => (
            <div key={os.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors active:bg-slate-100">
              <div className="flex items-center space-x-4 min-w-0">
                <div className={`w-1 h-10 rounded-full shrink-0 ${os.type === OSType.CORRECTIVE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{data.condos.find((c: any) => c.id === os.condoId)?.name || 'Condomínio'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{os.type} • {new Date(os.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 ml-2 ${
                os.status === OSStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {os.status}
              </span>
            </div>
          ))}
          {data.serviceOrders.length === 0 && (
            <div className="px-6 py-16 text-center text-slate-400 flex flex-col items-center">
              <FileText size={40} className="text-slate-200 mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">Sem atividades no período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
