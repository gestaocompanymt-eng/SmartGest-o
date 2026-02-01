
import React, { useMemo } from 'react';
import { AlertTriangle, Clock, Calendar, Droplets, Activity, WifiOff, ChevronRight } from 'lucide-react';
import { AppData, OSStatus, OSType, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data }) => {
  const navigate = useNavigate();
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  const filteredOSList = useMemo(() => isCondoUser 
    ? data.serviceOrders.filter(os => os.condo_id === user?.condo_id)
    : data.serviceOrders, [data.serviceOrders, isCondoUser, user?.condo_id]);

  const telemetrySummary = useMemo(() => {
    const levels = data.waterLevels || [];
    const criticalPoints = [];
    
    // CORREÇÃO: Busca IDs dos sensores nos SISTEMAS (tipo 7) e não nos condomínios
    const allowedDeviceIds = new Set<string>();
    data.systems.forEach(s => {
      if (s.type_id === '7' && (!isCondoUser || s.condo_id === user?.condo_id)) {
        s.monitoring_points?.forEach(p => {
          if (p.device_id) {
            allowedDeviceIds.add(p.device_id.trim().toLowerCase());
          }
        });
      }
    });

    const processedIds = new Set();
    // Pegamos a última leitura de cada sensor
    for(const l of levels) {
      const devId = String(l.condominio_id || '').trim().toLowerCase();
      
      if (allowedDeviceIds.has(devId) && !processedIds.has(devId)) {
        // Se o nível for menor que 30, é crítico
        if (l.percentual < 30) {
          criticalPoints.push(l);
        }
        processedIds.add(devId);
      }
    }

    return {
      criticalCount: criticalPoints.length,
      latest: levels.length > 0 ? levels.find(l => allowedDeviceIds.has(String(l.condominio_id).trim().toLowerCase())) : null
    };
  }, [data.waterLevels, data.systems, isCondoUser, user?.condo_id]);

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-xl md:p-2.5 ${color} text-white shadow-lg shadow-current/10`}><Icon size={18} className="md:w-5 md:h-5" /></div>
        {trend && <span className="text-[9px] md:text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{trend}</span>}
      </div>
      <div>
        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-600 transition-colors">{title}</p>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">Painel Operacional</h1>
          <p className="text-[10px] md:text-sm text-slate-500 font-medium italic">
            {isCondoUser ? `Status do seu condomínio.` : `Gestão Técnica Integrada.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="Ativos Críticos" value={data.equipments.filter(e => e.electrical_state === 'Crítico').length} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="OS Aberta" value={filteredOSList.filter(o => o.status === OSStatus.OPEN).length} icon={Clock} color="bg-blue-600" />
        <StatCard title="Agenda" value={data.appointments.length} icon={Calendar} color="bg-slate-700" />
        <StatCard 
          title="Reservatórios" 
          value={telemetrySummary.criticalCount > 0 ? `ALERTA (${telemetrySummary.criticalCount})` : 'ESTÁVEL'} 
          icon={Droplets} 
          color={telemetrySummary.criticalCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center"><Clock size={14} className="mr-2 text-blue-600" /> Atividades Recentes</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredOSList.slice(0, 5).length > 0 ? (
                filteredOSList.slice(0, 5).map((os: any) => (
                  <div key={os.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/os')}>
                    <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                      <div className={`w-1 h-8 md:h-10 rounded-full shrink-0 ${os.type === OSType.CORRETIVE ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs md:text-sm truncate">{data.condos.find((c: any) => c.id === os.condo_id)?.name}</p>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">{os.type} • {new Date(os.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[8px] md:text-[9px] font-black uppercase whitespace-nowrap ${os.status === OSStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{os.status}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={80} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                   <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Live Telemetria</h4>
                   <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                </div>
                
                {telemetrySummary.latest ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-3xl md:text-4xl font-black">{telemetrySummary.latest.percentual}%</p>
                          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Status Geral</p>
                       </div>
                       <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl ${telemetrySummary.latest.percentual < 30 ? 'bg-red-500 animate-pulse' : 'bg-blue-600 shadow-lg shadow-blue-600/30'}`}>
                          <Droplets size={24} className="md:w-7 md:h-7" />
                       </div>
                    </div>

                    {telemetrySummary.latest.percentual < 30 && (
                      <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center space-x-2">
                        <AlertTriangle size={14} className="text-red-400 shrink-0" />
                        <span className="text-[8px] md:text-[9px] font-black uppercase text-red-100">Nível Crítico Detectado!</span>
                      </div>
                    )}

                    <div className="w-full bg-white/10 h-2 md:h-2.5 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${telemetrySummary.latest.percentual < 30 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${telemetrySummary.latest.percentual}%` }}></div>
                    </div>
                    <button onClick={() => navigate('/reservatorios')} className="w-full py-3 md:py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center group">
                       Monitorar Todos <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ) : (
                  <div className="py-8 md:py-12 text-center space-y-4">
                     <WifiOff size={32} className="mx-auto text-slate-600 md:w-10 md:h-10" />
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aguardando Sinais IoT...</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
