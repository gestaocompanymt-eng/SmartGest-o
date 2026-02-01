
import React, { useState, useMemo } from 'react';
// Added missing WifiOff import from lucide-react
import { Building2, AlertTriangle, CheckCircle2, Clock, Calendar, Plus, Edit2, Trash2, X, Droplets, Activity, WifiOff } from 'lucide-react';
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
      appts = appts.filter(a => a.condo_id === user?.condo_id);
    }
    return [...appts].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [data.appointments, isCondoUser, user?.condo_id]);

  // Telemetria rápida para o Dashboard
  const latestWaterLevel = useMemo(() => {
    if (!data.waterLevels || data.waterLevels.length === 0) return null;
    if (isCondoUser) {
      return data.waterLevels.find(l => String(l.condominio_id) === String(user?.condo_id));
    }
    return data.waterLevels[0];
  }, [data.waterLevels, isCondoUser, user?.condo_id]);

  const openOS = filteredOSList.filter((os: any) => os.status === OSStatus.OPEN).length;
  const criticalEquip = filteredEquipList.filter((eq: any) => eq.electrical_state === 'Crítico').length;
  const completedOS = filteredOSList.filter((os: any) => os.status === OSStatus.COMPLETED).length;

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
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${color} text-white shadow-lg shadow-current/10`}><Icon size={20} /></div>
        {trend && <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{trend}</span>}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-600 transition-colors">{title}</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center"><Clock size={14} className="mr-2 text-blue-600" /> Atividades Recentes</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredOSList.slice(0, 5).map((os: any) => (
                <div key={os.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/os')}>
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className={`w-1 h-10 rounded-full shrink-0 ${os.type === OSType.CORRECTIVE ? 'bg-red-50' : 'bg-blue-500'}`}></div>
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

        <div className="space-y-6">
          {/* Widget de Telemetria IoT */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={80} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Telemetria Live</h4>
                   <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                </div>
                
                {latestWaterLevel ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-3xl font-black">{latestWaterLevel.percentual}%</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Nível do Reservatório</p>
                       </div>
                       <div className="p-3 bg-blue-600 rounded-2xl">
                          <Droplets size={24} />
                       </div>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                       <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${latestWaterLevel.percentual}%` }}></div>
                    </div>
                    <button onClick={() => navigate('/reservatorios')} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                       Ver Detalhes IoT
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                     <WifiOff size={32} className="mx-auto text-slate-600" />
                     <p className="text-xs font-bold text-slate-500 uppercase">Aguardando Conexão ESP32</p>
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center"><Calendar size={14} className="mr-2 text-blue-400" /> Agenda</h3>
              {isAdminOrTech && (
                <button 
                  onClick={() => { setEditingAppointment(null); setIsAppointmentModalOpen(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg active:scale-95 transition-all"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {filteredAppointments.length > 0 ? filteredAppointments.slice(0, 3).map((appt) => {
                const condo = data.condos.find(c => c.id === appt.condo_id);
                return (
                  <div key={appt.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-[10px] font-black text-slate-900 truncate uppercase">{condo?.name || '---'}</p>
                    <div className="flex items-center text-[9px] text-slate-500 font-bold uppercase mt-1">
                      <Clock size={10} className="mr-1 text-blue-500" /> {new Date(appt.date).toLocaleDateString()} • {appt.time}
                    </div>
                  </div>
                );
              }) : (
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase py-4">Vazio</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                {editingAppointment ? 'Editar Visita' : 'Agendar Nova Visita'}
              </h2>
              <button 
                onClick={() => { setIsAppointmentModalOpen(false); setEditingAppointment(null); }} 
                className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAppointmentSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                <select 
                  required 
                  name="condo_id" 
                  defaultValue={editingAppointment?.condo_id} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="">Selecione...</option>
                  {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Técnico Responsável</label>
                <select 
                  required 
                  name="technician_id" 
                  defaultValue={editingAppointment?.technician_id} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="">Selecione...</option>
                  {data.users.filter((u: User) => u.role !== UserRole.CONDO_USER).map((u: User) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <input 
                    required 
                    type="date" 
                    name="date" 
                    defaultValue={editingAppointment?.date} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hora</label>
                  <input 
                    required 
                    type="time" 
                    name="time" 
                    defaultValue={editingAppointment?.time} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Objetivo da Visita</label>
                <textarea 
                  required 
                  name="description" 
                  defaultValue={editingAppointment?.description} 
                  rows={3} 
                  placeholder="Ex: Manutenção preventiva bombas recalque..." 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                <select 
                  name="status" 
                  defaultValue={editingAppointment?.status || 'Pendente'} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-blue-600"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsAppointmentModalOpen(false); setEditingAppointment(null); }} 
                  className="flex-1 py-4 border rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                >
                  Salvar Agenda
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
