
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Wifi,
  BrainCircuit,
  Zap,
  Activity,
  CheckCircle2,
  TrendingUp,
  History
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
import { AppData, UserRole, WaterLevel as WaterLevelType } from '../types';
import { analyzeWaterLevelHistory } from '../geminiService';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iaAnalysis, setIaAnalysis] = useState<Record<string, {text: string, loading: boolean}>>({});
  const [showStatusHint, setShowStatusHint] = useState(true);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.SINDICO_ADMIN || user?.role === UserRole.RONDA;

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
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getPointsHistory = (deviceId: string) => {
    if (!deviceId) return [];
    // Normalização agressiva para garantir match entre Arduino e App
    const searchId = deviceId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    return data.waterLevels
      .filter(l => {
        const entryId = String(l.condominio_id || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        return entryId === searchId;
      })
      // Garantimos que o array retornado esteja ordenado por data crescente
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-50)
      .map(l => ({
        time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        level: Number(l.percentual) || 0,
        rawDate: l.created_at
      }));
  };

  const handleIaAnalysis = async (deviceId: string) => {
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: '', loading: true } }));
    const searchId = deviceId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const history = data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === searchId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const result = await analyzeWaterLevelHistory(history);
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: result || 'Análise concluída.', loading: false } }));
  };

  const ElectrodeVisual = ({ percent }: { percent: number }) => {
    const levels = [
      { val: 100, label: 'Eletrodo Superior' },
      { val: 75,  label: 'Eletrodo Médio Alto' },
      { val: 50,  label: 'Eletrodo Médio Baixo' },
      { val: 25,  label: 'Eletrodo Inferior' }
    ];

    return (
      <div className="flex flex-col space-y-3 w-full">
        {levels.map((l) => (
          <div key={l.val} className="flex items-center space-x-3">
             <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${percent >= l.val ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-200'}`}></div>
             <div className={`flex-1 h-10 rounded-xl border flex items-center px-4 justify-between transition-all duration-500 ${
               percent >= l.val 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-slate-50 border-slate-100 opacity-50'
             }`}>
               <span className={`text-[9px] font-black uppercase tracking-widest ${percent >= l.val ? 'text-blue-700' : 'text-slate-400'}`}>
                 {l.label}
               </span>
               <span className={`text-xs font-black ${percent >= l.val ? 'text-blue-600' : 'text-slate-300'}`}>{l.val}%</span>
             </div>
          </div>
        ))}
        <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
           <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
           <div className="flex-1 h-10 rounded-xl bg-slate-900 flex items-center px-4 justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-white">Referência (GND)</span>
              <span className="text-[9px] font-black text-slate-400">Pino Fundo</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Monitoramento IOT</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Telemetria de Reservatórios</p>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-300 transition-all group"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} text-blue-600 transition-transform duration-500`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Atualizar Sensores</span>
        </button>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center justify-between px-8 py-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-4">
                <Building2 size={24} className="text-blue-600" />
                <h2 className="font-black text-slate-800 uppercase tracking-tight">{entry.condo.name}</h2>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Activity size={14} className="text-emerald-500 animate-pulse" />
                <span>Link IOT Ativo</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {entry.points.map((point: any) => {
                const history = getPointsHistory(point.device_id);
                // Pegamos SEMPRE o último elemento do array ordenado para o visual principal
                const latest = history.length > 0 ? history[history.length - 1] : null;
                const percent = latest ? latest.level : 0;
                const analysis = iaAnalysis[point.device_id];
                const isAnomaly = analysis?.text.toUpperCase().includes('ANOMALIA');

                return (
                  <div key={point.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden p-8 flex flex-col hover:shadow-2xl transition-all relative">
                    <div className="flex flex-col xl:flex-row gap-10">
                      
                      <div className="xl:w-1/3 space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ponto de Monitoramento</p>
                          <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4">{point.name}</h3>
                          <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-3xl ${percent === 0 ? 'bg-red-600' : 'bg-slate-900'} text-white shadow-xl transition-colors duration-500`}>
                             <Droplets size={24} className={percent > 0 ? 'animate-bounce' : ''} />
                             <span className="text-4xl font-black">{percent}%</span>
                          </div>
                        </div>
                        
                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                           <ElectrodeVisual percent={percent} />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                             <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sinal Online</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-400">
                             <Clock size={12} />
                             <span className="text-[9px] font-bold uppercase tracking-tight">Variação: {latest ? latest.time : 'Aguardando pino...'}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleIaAnalysis(point.device_id)}
                          disabled={analysis?.loading}
                          className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          {analysis?.loading ? <RefreshCw size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                          <span>Diagnóstico Inteligente</span>
                        </button>
                      </div>

                      <div className="xl:w-2/3 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center space-x-2">
                              <History size={16} className="text-slate-400" />
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tempo Real x Comportamento</span>
                           </div>
                           <span className="text-[9px] font-black text-blue-500 uppercase">Sincronizado com Arduino</span>
                        </div>
                        
                        <div className="h-[300px] w-full bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                              <defs>
                                <linearGradient id={`colorLevel-${point.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="time" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                                minTickGap={30}
                              />
                              <YAxis 
                                domain={[0, 100]} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                                ticks={[0, 25, 50, 75, 100]}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}
                                itemStyle={{ color: '#3b82f6' }}
                              />
                              <Area 
                                type="stepAfter" 
                                dataKey="level" 
                                stroke="#3b82f6" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill={`url(#colorLevel-${point.id})`} 
                                animationDuration={1500}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaterLevel;
