
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
  TrendingUp
} from 'lucide-react';
import { AppData, OSStatus, OSType } from '../types';

// Properly typed props using the imported AppData interface
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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <span className="flex items-center text-emerald-600 text-xs font-bold">
            <TrendingUp size={14} className="mr-1" /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
        <p className="text-slate-500">Acompanhamento técnico em tempo real dos seus ativos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Condomínios Ativos" 
          value={data.condos.length} 
          icon={Building2} 
          color="bg-slate-800" 
        />
        <StatCard 
          title="OS em Aberto" 
          value={openOS} 
          icon={Clock} 
          color="bg-blue-600" 
          trend="+2 hoje"
        />
        <StatCard 
          title="Itens Críticos" 
          value={criticalEquip} 
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Serviços Finalizados" 
          value={completedOS} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Distribuição por Tipo de OS</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Status das Manutenções</h3>
          <div className="h-64 flex">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-4 pr-8">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                  <span className="text-sm text-slate-600">{s.name}: <b>{s.value}</b></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Manutenções Recentes</h3>
          <button className="text-sm text-blue-600 font-medium hover:underline">Ver todas</button>
        </div>
        <div className="divide-y divide-slate-100">
          {data.serviceOrders.slice(0, 5).map((os: any) => (
            <div key={os.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-10 rounded-full ${os.type === OSType.CORRECTIVE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="font-medium text-slate-900">{data.condos.find((c: any) => c.id === os.condoId)?.name || 'Condomínio'}</p>
                  <p className="text-xs text-slate-500">{os.type} • {new Date(os.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {os.status}
              </span>
            </div>
          ))}
          {data.serviceOrders.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400">
              Nenhuma ordem de serviço registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;