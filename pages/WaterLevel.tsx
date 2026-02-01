
import React, { useState, useMemo } from 'react';
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
  TrendingUp
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

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, updateData, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyDeviceId, setHistoryDeviceId] = useState<string | null>(null);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

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

  const deviceHistory = useMemo(() => {
    if (!historyDeviceId) return [];
    return data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toLowerCase() === historyDeviceId.trim().toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data.waterLevels, historyDeviceId]);

  // Dados formatados para o gráfico (ordem cronológica - antiga para nova)
  const chartData = useMemo(() => {
    return [...deviceHistory]
      .reverse()
      .map(h => ({
        time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDate: new Date(h.created_at).toLocaleString(),
        percent: h.percentual,
        cm: h.nivel_cm
      }));
  }, [deviceHistory]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Telemetria Integrada</h1>
          <div className="flex items-center mt-1">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitoramento Profissional ESP32</p>
          </div>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center space-x-2"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sync Nuvem</span>
        </button>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{entry.condo.name}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                   Monitoramento via Sensores Ultrassônicos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entry.points.map((point: MonitoringPoint) => {
                const levelsForPoint = data.waterLevels.filter(l => 
                  String(l.condominio_id || '').trim().toLowerCase() === String(point.device_id || '').trim().toLowerCase()
                );
                const level = levelsForPoint[0]; 
                const percent = level ? Math.min(100, Math.max(0, level.percentual)) : 0;
                
                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-400 transition-all duration-300">
                    <div className="p-7">
                      <div className="flex justify-between items-center mb-6">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">ID: {point.device_id}</span>
                          <h3 className="font-black text-slate-800 text-lg uppercase leading-tight mt-1 truncate">{point.name}</h3>
                        </div>
                        <div className={`p-3.5 rounded-2xl border ${level ? getStatusColor(level.status) : 'bg-slate-50 border-slate-100 text-slate-300 animate-pulse'}`}>
                          <Droplets size={22} />
                        </div>
                      </div>

                      {level ? (
                        <>
                          <div className="relative h-48 w-full bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner mb-6">
                             <div 
                              className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getWaterColor(percent)} transition-all duration-1000 ease-in-out z-10`}
                              style={{ height: `${percent}%` }}
                             >
                               <div className="absolute top-0 left-0 w-full h-4 bg-white/20 -translate-y-2 animate-pulse"></div>
                             </div>
                             
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="bg-white/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-xl border border-white/50 text-center">
                                  <span className="block text-4xl font-black text-slate-900 leading-none">{percent}%</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm</span>
                               </div>
                             </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Atual</span>
                                  <span className={`text-[10px] font-black uppercase ${getStatusColor(level.status).split(' ')[0]}`}>{level.status}</span>
                               </div>
                               <div className="text-right flex flex-col">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Última Mudança</span>
                                  <span className="text-[9px] font-bold text-slate-600 flex items-center justify-end mt-0.5">
                                    <Clock size={12} className="mr-1 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                               </div>
                            </div>
                            <button 
                              onClick={() => setHistoryDeviceId(point.device_id)}
                              className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                            >
                               <History size={14} />
                               <span>Análise de Histórico</span>
                            </button>
                            <div className="flex items-center justify-center space-x-2 py-2 bg-emerald-50 border border-dashed border-emerald-200 rounded-xl">
                               <ShieldCheck size={12} className="text-emerald-500" />
                               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Filtro de Mudanças Ativo</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                          <Activity size={24} className="text-amber-400 animate-pulse" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4">Aguardando telemetria inicial do dispositivo {point.device_id}</p>
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

      {/* Modal de Histórico com Gráfico */}
      {historyDeviceId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh]">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                 <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20"><TrendingUp size={20} /></div>
                    <div>
                       <h2 className="text-lg font-black uppercase tracking-tight leading-none">Análise de Tendência</h2>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sensor: {historyDeviceId}</p>
                    </div>
                 </div>
                 <button onClick={() => setHistoryDeviceId(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm border">
                   <X size={24} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                 
                 {/* Seção do Gráfico */}
                 <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                       <Droplets size={12} className="mr-2 text-blue-500" /> Variação do Nível (%)
                    </p>
                    <div className="h-64 w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="time" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                              minTickGap={30}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}
                              formatter={(value: any) => [`${value}%`, 'Nível']}
                              labelFormatter={(label) => `Hora: ${label}`}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="percent" 
                              stroke="#2563eb" 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill="url(#colorLevel)" 
                              animationDuration={1500}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 italic text-xs">
                           Sem dados suficientes para o gráfico.
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Lista de Mudanças abaixo do gráfico */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center">
                       <Clock size={12} className="mr-2" /> Timeline Detalhada
                    </p>
                    
                    {deviceHistory.length > 0 ? deviceHistory.map((h, i) => {
                       const nextItem = deviceHistory[i + 1];
                       const diff = nextItem ? h.nivel_cm - nextItem.nivel_cm : 0;
                       
                       return (
                         <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                            <div className="flex items-center space-x-4">
                               <div className={`p-2 rounded-xl transition-colors ${diff > 0 ? 'bg-emerald-50 text-emerald-600' : diff < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-400'}`}>
                                  {diff > 0 ? <ArrowUp size={16} /> : diff < 0 ? <ArrowDown size={16} /> : <Activity size={16} />}
                               </div>
                               <div>
                                  <div className="flex items-center space-x-2">
                                     <p className="text-sm font-black text-slate-900">{h.nivel_cm} cm</p>
                                     <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shadow-sm">{h.percentual}%</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                    {new Date(h.created_at).toLocaleDateString()} • {new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                               </div>
                            </div>
                            <div className="text-right">
                               <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${getStatusColor(h.status)}`}>
                                  {h.status}
                               </span>
                            </div>
                         </div>
                       );
                    }) : (
                      <div className="py-12 text-center text-slate-300 italic flex flex-col items-center">
                         <Droplets size={40} className="mb-2 opacity-20" />
                         <p className="text-sm font-bold uppercase tracking-widest">Aguardando mudanças...</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-6 border-t bg-slate-50 flex gap-3">
                 <button 
                  onClick={() => window.print()} 
                  className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center shadow-sm active:scale-95"
                 >
                   Imprimir
                 </button>
                 <button 
                  onClick={() => setHistoryDeviceId(null)} 
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                 >
                   Fechar Painel
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WaterLevel;
