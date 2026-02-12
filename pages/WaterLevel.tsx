
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
  History,
  AlertTriangle,
  Info
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
    const cleanSearchId = deviceId.trim().toUpperCase();
    
    return data.waterLevels
      .filter(l => {
        const cleanEntryId = String(l.condominio_id || '').trim().toUpperCase();
        return cleanEntryId === cleanSearchId;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
      .map(l => ({
        ...l,
        percentual: Number(l.percentual), // Forçar número para o Recharts
        time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
      .reverse();
  };

  const handleIaAnalysis = async (deviceId: string) => {
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: '', loading: true } }));
    const cleanId = deviceId.trim().toUpperCase();
    const history = data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toUpperCase() === cleanId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const result = await analyzeWaterLevelHistory(history);
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: result || 'Análise concluída.', loading: false } }));
  };

  const ElectrodeVisual = ({ percent }: { percent: number }) => {
    const levels = [
      { val: 100, label: 'Nível 100% (Cheio)' },
      { val: 75,  label: 'Nível 75% (Ideal)' },
      { val: 50,  label: 'Nível 50% (Atenção)' },
      { val: 25,  label: 'Nível 25% (Reserva)' }
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
        {percent <= 0 && (
           <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-2">
             <AlertTriangle size={14} className="text-red-500 animate-pulse" />
             <span className="text-[9px] font-black text-red-600 uppercase">Tanque Vazio ou Sem Sinal</span>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Telemetria Master V8.6</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Sincronismo Direto com Arduino ESP32</p>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-300 transition-all group"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} text-blue-600 transition-transform duration-500`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Forçar Sincronismo</span>
        </button>
      </div>

      <div className="space-y-12">
        {monitoringData.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Droplets size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-xs font-black uppercase text-slate-400">Configure o ID do Arduino no cadastro de sistemas</p>
          </div>
        )}
        
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center justify-between px-8 py-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-4">
                <Building2 size={24} className="text-blue-600" />
                <h2 className="font-black text-slate-800 uppercase tracking-tight">{entry.condo.name}</h2>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Activity size={14} className="text-emerald-500 animate-pulse" />
                <span>IOT Live Feed Ativo</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {entry.points.map((point: any) => {
                const history = getPointsHistory(point.device_id);
                const latest = history.length > 0 ? history[history.length - 1] : null;
                const percent = latest ? Number(latest.percentual) : 0;
                const analysis = iaAnalysis[point.device_id];

                return (
                  <div key={point.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden p-8 flex flex-col hover:shadow-2xl transition-all relative">
                    <div className="flex flex-col xl:flex-row gap-10">
                      
                      <div className="xl:w-1/3 space-y-6">
                        <div className="relative">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                            <Wifi size={12} className="mr-1" /> ID Placa: {point.device_id}
                          </p>
                          <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4">{point.name}</h3>
                          
                          <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-3xl transition-colors duration-500 shadow-xl ${
                            percent === 100 ? 'bg-emerald-600' : 
                            percent <= 25 ? 'bg-red-600 animate-pulse' : 
                            'bg-slate-900'
                          } text-white`}>
                             <Droplets size={24} className={percent > 0 ? 'animate-bounce' : ''} />
                             <span className="text-4xl font-black">{percent}%</span>
                          </div>
                        </div>
                        
                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                           <ElectrodeVisual percent={percent} />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                             <div className={`flex h-2 w-2 rounded-full ${latest ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></div>
                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                               {latest ? 'Sinal Supabase OK' : 'Aguardando primeiro sinal...'}
                             </span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-400">
                             <Clock size={12} />
                             <span className="text-[9px] font-bold uppercase tracking-tight">Último dado: {latest ? latest.time : '---'}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleIaAnalysis(point.device_id)}
                          disabled={analysis?.loading}
                          className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          {analysis?.loading ? <RefreshCw size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                          <span>Diagnóstico IA</span>
                        </button>
                      </div>

                      <div className="xl:w-2/3 flex flex-col">
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
                              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} ticks={[0, 25, 50, 75, 100]} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                              />
                              <Area 
                                type="stepAfter" 
                                dataKey="percentual" 
                                stroke="#3b82f6" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill={`url(#colorLevel-${point.id})`} 
                                animationDuration={300} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-4 p-4 bg-slate-100/50 rounded-2xl flex items-center space-x-3">
                           <Info size={16} className="text-slate-400" />
                           <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                             Se o gráfico estiver em 0%, verifique se o DEVICE_ID no Arduino é exatamente <b>{point.device_id}</b> e se a placa está enviando o campo "percentual".
                           </p>
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
