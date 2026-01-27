
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, AlertTriangle, CheckCircle2, Clock, TrendingUp, Wrench, Calendar, Plus, Edit2, Trash2, X, MapPin, User as UserIcon } from 'lucide-react';
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

  const filteredEquipList = useMemo(() => isCondoUser
    ? data.equipments.filter(eq => eq.condo_id === user?.condo_id)
    : data.equipments, [data.equipments, isCondoUser, user?.condo_id]);

  const filteredAppointments = useMemo(() => {
    let appts = data.appointments || [];
    if (isCondoUser) {
      return appts.filter(a => a.condo_id === user?.condo_id);
    }
    return [...appts].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [data.appointments, isCondoUser, user?.condo_id]);

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

  const handleAppointmentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const apptData: Appointment = {
      id: editingAppointment?.id || Math.random().toString(36).substr(2, 9),
      condo_id: formData.get('condo_id') as string,
      technician_id: formData.get('technician_id') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      description: formData.get('description') as string,
      status: (formData.get('status') as any) || 'Pendente',
    };

    const newAppts = editingAppointment 
      ? data.appointments.map(a => a.id === editingAppointment.id ? apptData : a)
      : [...(data.appointments || []), apptData];

    updateData({ ...data, appointments: newAppts });
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
  };

  const deleteAppointment = (id: string) => {
    if (confirm('Deseja cancelar/excluir este agendamento?')) {
      updateData({ ...data, appointments: data.appointments.filter(a => a.id !== id) });
    }
  };

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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel Operacional</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            {isCondoUser ? `Status do seu condomínio.` : `Gestão Técnica Integrada.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Ativos Críticos" value={criticalEquip} icon={AlertTriangle} color="bg-red-500" trend={criticalEquip > 0 ? "Atenção" : "OK"} />
        <StatCard title="OS Aberta" value={openOS} icon={Clock} color="bg-blue-600" trend="HOJE" />
        <StatCard title="OS Finalizada" value={completedOS} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Agenda" value={data.appointments.length} icon={Calendar} color="bg-slate-700" />
      </div>

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

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b bg-slate-900 text-white flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center"><Calendar size={16} className="mr-2 text-blue-400" /> Agenda de Visitas Técnicas</h3>
          {isAdminOrTech && (
            <button 
              onClick={() => { setEditingAppointment(null); setIsAppointmentModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus size={14} className="mr-1" /> Agendar Visita
            </button>
          )}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
          {filteredAppointments.length > 0 ? filteredAppointments.map((appt) => {
            const condo = data.condos.find(c => c.id === appt.condo_id);
            const tech = data.users.find(u => u.id === appt.technician_id);
            return (
              <div key={appt.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-300 transition-colors group">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        appt.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' : 
                        appt.status === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {appt.status}
                    </span>
                    {isAdminOrTech && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingAppointment(appt); setIsAppointmentModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => deleteAppointment(appt.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-white rounded-lg shadow-sm border">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900 leading-tight">{condo?.name || 'Condomínio não encontrado'}</p>
                    <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                      <Clock size={12} className="mr-1 text-blue-500" /> {new Date(appt.date).toLocaleDateString()} às {appt.time}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
              Nenhum agendamento futuro.
            </div>
          )}
        </div>
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

      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingAppointment ? 'Editar Visita' : 'Nova Visita Técnica'}</h2>
              <button onClick={() => setIsAppointmentModalOpen(false)} className="p-2 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleAppointmentSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Condomínio</label>
                  <select required name="condo_id" defaultValue={editingAppointment?.condo_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Técnico Responsável</label>
                  <select required name="technician_id" defaultValue={editingAppointment?.technician_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs">
                    <option value="">Selecione...</option>
                    {data.users.filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN).map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Data</label>
                  <input required type="date" name="date" defaultValue={editingAppointment?.date} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Horário</label>
                  <input required type="time" name="time" defaultValue={editingAppointment?.time} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Descrição da Visita</label>
                <textarea required name="description" defaultValue={editingAppointment?.description} rows={2} placeholder="Ex: Manutenção preventiva..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"></textarea>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Status</label>
                <select name="status" defaultValue={editingAppointment?.status || 'Pendente'} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs">
                  <option value="Pendente">Pendente</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAppointmentModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-xs uppercase">Sair</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95">
                  Salvar Visita
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
