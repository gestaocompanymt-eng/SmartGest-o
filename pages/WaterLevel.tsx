
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Activity,
  Wifi,
  ChevronRight,
  ShieldCheck,
  History,
  X,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  TrendingUp,
  Minus,
  Bell,
  BellOff,
  BellRing
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AppData, UserRole, WaterLevel as WaterLevelType, Condo, System, MonitoringPoint } from '../types';
import { requestNotificationPermission, checkNotificationSupport } from '../notificationService';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, updateData, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyDeviceId, setHistoryDeviceId] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<string>('default');
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  useEffect(() => {
    const checkPerm = () => {
      const support = checkNotificationSupport();
      setNotifStatus(support.permission);
    };
    checkPerm();
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) setNotifStatus('granted');
    else setNotifStatus('denied');
  };

  const monitoringData = useMemo(() => {
    const condosMap = new Map();
    const monitoringSystems = data.systems.filter(s => 
      s.type_id === '7' && 
      (s.monitoring_points || []).length > 0 &&
      (!isCondoUser || s.condo_id === user?.condo_id)
    );
    monitoringSystems.forEach(sys => {
      const condo = data.condos.find(c => c.id === sys.condo_id);
      if (!condo) return;
      if (!condosMap.has(condo.id)) {
        condosMap.set(condo.id, { condo, points: [] });
      }
      const entry = condosMap.get(condo.id);
      if (sys.monitoring_points) { entry.points.push(...sys.monitoring_points); }
    });
    return Array.from(condosMap.values());
  }, [data.systems, data.condos, isCondoUser, user?.condo_id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusColor = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('cheio') || s.includes('alto')) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (s.includes('médio')) return 'text-amber-500 bg-amber-50 border-amber-100';
    if (s.includes('baixo') || s.includes('crítico')) return 'text-red-500 bg-red-50 border-red-100';
    return 'text-blue-500 bg-blue-50 border-blue-100';
  };

  const getWaterColor = (percent: number) => {
    if (percent > 70) return 'from-blue-600 to-blue-400';
    if (percent > 30) return 'from-blue-500 to-sky-400';
    return 'from-red-600 to-orange-400';
  };

  const getDeviceHistory = (deviceId: string) => {
    return data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toLowerCase() === deviceId.trim().toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const Sparkline = ({ deviceId }: { deviceId: string }) => {
    const history = getDeviceHistory(deviceId).slice(0, 10).reverse();
    if (history.length < 2) return <div className="h-10 flex items-center justify-center text-[8px] font-black text-slate-300 uppercase">Dados Insuficientes</div>;

    const dataPoints = history.map(h => ({ val: h.percentual }));

    return (
      <div className="h-12 w-full mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataPoints}>
            <Area type="monotone" dataKey="val" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Telemetria Integrada</h1>
          <div className="flex items-center mt-1">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitoramento Profissional em Tempo Real</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex-1 md:flex-none p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sync</span>
          </button>
          <button 
            onClick={handleEnableNotifications}
            className={`p-3 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center space-x-2 ${
              notifStatus === 'granted' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
              notifStatus === 'denied' ? 'bg-red-50 border-red-200 text-red-400' :
              'bg-blue-600 text-white'
            } border`}
          >
            {notifStatus === 'granted' ? <BellRing size={18} /> : notifStatus === 'denied' ? <BellOff size={18} /> : <Bell size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{notifStatus === 'granted' ? 'Alertas OK' : 'Ativar Alertas'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Configuração de Notificação */}
      {notifStatus !== 'granted' && (
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top">
          <div className="flex items-center space-x-4">
             <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <BellRing size={24} />
             </div>
             <div>
                <p className="text-sm font-black uppercase tracking-tight">Ative as notificações do celular</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Receba alertas de anomalias e vazamentos em tempo real</p>
             </div>
          </div>
          <button 
            onClick={handleEnableNotifications}
            className="w-full md:w-auto px-8 py-3 bg-white text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Permitir Agora
          </button>
        </div>
      )}

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{entry.condo.name}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                   Sensores IoT de Nível d'Água
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entry.points.map((point: MonitoringPoint) => {
                const levels = getDeviceHistory(point.device_id);
                const level = levels[0];
                const prevLevel = levels[1];
                const percent = level ? Math.min(100, Math.max(0, level.percentual)) : 0;
                
                // Cálculo de tendência
                const diff = prevLevel ? level.percentual - prevLevel.percentual : 0;
                const trend = diff > 0 ? 'filling' : diff < 0 ? 'consuming' : 'stable';

                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-400 transition-all duration-300">
                    <div className="p-7">
                      <div className="flex justify-between items-center mb-6">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">Sensor: {point.device_id}</span>
                          <h3 className="font-black text-slate-800 text-lg uppercase leading-tight mt-1 truncate">{point.name}</h3>
                        </div>
                        {level && (
                          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                            trend === 'filling' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            trend === 'consuming' ? 'bg-red-50 text-red-600 border-red-100' : 
                            'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {trend === 'filling' ? <ArrowUp size={12} /> : trend === 'consuming' ? <ArrowDown size={12} /> : <Minus size={12} />}
                            <span>{trend === 'filling' ? 'Enchendo' : trend === 'consuming' ? 'Consumindo' : 'Estável'}</span>
                          </div>
                        )}
                      </div>

                      {level ? (
                        <>
                          <div className="relative h-44 w-full bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner mb-4">
                             <div 
                              className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getWaterColor(percent)} transition-all duration-1000 ease-in-out z-10`}
                              style={{ height: `${percent}%` }}
                             >
                               <div className="absolute top-0 left-0 w-full h-4 bg-white/20 -translate-y-2 animate-pulse"></div>
                             </div>
                             
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="bg-white/90 backdrop-blur-xl px-5 py-2 rounded-2xl shadow-xl border border-white/50 text-center">
                                  <span className="block text-3xl font-black text-slate-900 leading-none">{percent}%</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm</span>
                               </div>
                             </div>
                          </div>

                          <div className="mb-4">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1">Tendência Recente</p>
                             <Sparkline deviceId={point.device_id} />
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Situação</span>
                                  <span className={`text-[10px] font-black uppercase ${getStatusColor(level.status).split(' ')[0]}`}>{level.status}</span>
                               </div>
                               <div className="text-right flex flex-col">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronizado</span>
                                  <span className="text-[9px] font-bold text-slate-600 flex items-center justify-end mt-0.5">
                                    <Clock size={12} className="mr-1 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                               </div>
                            </div>
                            <button 
                              onClick={() => setHistoryDeviceId(point.device_id)}
                              className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                            >
                               <TrendingUp size={14} />
                               <span>Análise Gráfica Completa</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                          <Activity size={32} className="text-amber-400 animate-pulse" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-8">Aguardando sinal do dispositivo {point.device_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Histórico Gráfico */}
      {historyDeviceId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-full md:h-auto md:max-h-[95vh]">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                 <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30"><TrendingUp size={24} /></div>
                    <div>
                       <h2 className="text-xl font-black uppercase tracking-tight leading-none text-slate-900">Histórico de Telemetria</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center">
                         <ShieldCheck size={12} className="mr-1 text-emerald-500" /> Monitoramento Auditado
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setHistoryDeviceId(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-2xl shadow-sm border border-slate-200">
                   <X size={28} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10">
                 
                 {/* Gráfico Principal do Modal */}
                 <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                       <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center">
                          <Droplets size={14} className="mr-2 text-blue-500" /> Variação de Nível (%)
                       </h4>
                       <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase border border-blue-100">Sensor: {historyDeviceId}</span>
                    </div>
                    
                    <div className="h-72 w-full">
                      {getDeviceHistory(historyDeviceId).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={getDeviceHistory(historyDeviceId).slice(0, 50).reverse().map(h => ({
                            time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            val: h.percentual,
                            cm: h.nivel_cm
                          }))}>
                            <defs>
                              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="time" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                              minTickGap={20}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '20px', 
                                border: 'none', 
                                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}
                              formatter={(value: any) => [`${value}%`, 'Volume']}
                              labelFormatter={(label) => `Hora: ${label}`}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="val" 
                              stroke="#2563eb" 
                              strokeWidth={4} 
                              fillOpacity={1} 
                              fill="url(#colorLevel)" 
                              animationDuration={1500}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 italic text-sm font-bold uppercase tracking-widest">
                           Aguardando leituras...
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Tabela de Eventos */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center">
                       <Clock size={14} className="mr-2" /> Log de Eventos de Mudança
                    </h4>
                    
                    <div className="space-y-2">
                      {getDeviceHistory(historyDeviceId).map((h, i) => {
                         const historyArr = getDeviceHistory(historyDeviceId);
                         const nextItem = historyArr[i + 1];
                         const change = nextItem ? h.nivel_cm - nextItem.nivel_cm : 0;
                         
                         return (
                           <div key={h.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-lg transition-all group">
                              <div className="flex items-center space-x-5">
                                 <div className={`p-3 rounded-2xl transition-colors ${change > 0 ? 'bg-emerald-100 text-emerald-600' : change < 0 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}>
                                    {change > 0 ? <ArrowUp size={18} /> : change < 0 ? <ArrowDown size={18} /> : <Activity size={18} />}
                                 </div>
                                 <div>
                                    <div className="flex items-center space-x-3">
                                       <p className="text-base font-black text-slate-900">{h.nivel_cm} cm</p>
                                       <span className="text-[11px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg shadow-sm border border-blue-200">{h.percentual}%</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                      {new Date(h.created_at).toLocaleDateString()} • {new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                 <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border mb-1 ${getStatusColor(h.status)}`}>
                                    {h.status}
                                 </span>
                                 {change !== 0 && (
                                   <span className={`text-[8px] font-black uppercase ${change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                     {change > 0 ? `+${change}cm` : `${change}cm`}
                                   </span>
                                 )}
                              </div>
                           </div>
                         );
                      })}
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t bg-slate-50 flex gap-4 no-print">
                 <button 
                  onClick={() => window.print()} 
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center shadow-sm active:scale-95 transition-all"
                 >
                   Relatório PDF
                 </button>
                 <button 
                  onClick={() => setHistoryDeviceId(null)} 
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                 >
                   Fechar Análise
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .fixed { position: relative !important; }
        }
      `}</style>
    </div>
  );
};

export default WaterLevel;
