
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Building2,
  Wifi,
  BrainCircuit,
  Activity,
  AlertTriangle,
  Info,
  Terminal,
  ArrowUp,
  ArrowDown
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
import { AppData, UserRole } from '../types';
import { analyzeWaterLevelHistory } from '../geminiService';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
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

  const getPointsHistory = (deviceId: string) => {
    if (!deviceId) return [];
    const cleanSearchId = deviceId.trim().toUpperCase();
    
    return data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toUpperCase() === cleanSearchId)
      .map(l => ({
        ...l,
        percentual: Number(l.percentual),
        time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-60);
  };

  const ElectrodeVisual = ({ percent }: { percent: number }) => {
    const levels = [
      { val: 100, label: 'Eletrodo 100% (Cheio)', activeColor: 'bg-emerald-500 shadow-emerald-500/50' },
      { val: 75,  label: 'Eletrodo 75%',  activeColor: 'bg-blue-500 shadow-blue-500/50' },
      { val: 50,  label: 'Eletrodo 50%',  activeColor: 'bg-blue-500 shadow-blue-500/50' },
      { val: 25,  label: 'Eletrodo 25% (Reserva)',  activeColor: 'bg-amber-500 shadow-amber-500/50' }
    ];

    return (
      <div className="flex flex-col space-y-3 w-full">
        {levels.map((l) => {
          const isActive = percent >= l.val;
          return (
            <div key={l.val} className="flex items-center space-x-3">
               <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isActive ? `${l.activeColor} shadow-lg` : 'bg-slate-200'}`}></div>
               <div className={`flex-1 h-11 rounded-2xl border flex items-center px-4 justify-between transition-all duration-300 ${
                 isActive 
                  ? 'bg-slate-900 border-slate-800 text-white shadow-lg' 
                  : 'bg-white border-slate-100 text-slate-400 opacity-60'
               }`}>
                 <span className="text-[9px] font-black uppercase tracking-widest">{l.label}</span>
                 <span className="text-xs font-black">{isActive ? l.val : '--'}%</span>
               </div>
            </div>
          );
        })}
        {percent <= 0 && (
           <div className="mt-2 p-4 bg-red-600 rounded-2xl flex items-center justify-between shadow-xl animate-pulse">
             <div className="flex items-center space-x-3 text-white">
               <AlertTriangle size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest">Tanque Vazio (0%)</span>
             </div>
             <span className="text-xs font-black text-white">0%</span>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Telemetria Realtime V8.9</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Sincronismo Direto com Arduino ESP32</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRawData(!showRawData)} className={`p-3 rounded-2xl border transition-all ${showRawData ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500'}`} title="Log de Dados">
            <Terminal size={18} />
          </button>
          <button onClick={onRefresh} className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-400 transition-all">
            <RefreshCw size={18} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizar</span>
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center justify-between px-8 py-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-4 text-slate-800">
                <Building2 size={24} className="text-blue-600" />
                <h2 className="font-black uppercase tracking-tight">{entry.condo.name}</h2>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-500 uppercase">
                <Activity size={14} className="animate-pulse" />
                <span>IOT Feed Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {entry.points.map((point: any) => {
                const history = getPointsHistory(point.device_id);
                const latest = history.length > 0 ? history[history.length - 1] : null;
                const prev = history.length > 1 ? history[history.length - 2] : null;
                const percent = latest ? Number(latest.percentual) : 0;
                const isRising = prev ? percent > Number(prev.percentual) : false;
                const isFalling = prev ? percent < Number(prev.percentual) : false;

                return (
                  <div key={point.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden p-8 flex flex-col hover:shadow-2xl transition-all relative">
                    <div className="flex flex-col xl:flex-row gap-10">
                      
                      <div className="xl:w-1/3 space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                            <Wifi size={12} className="mr-1" /> Placa: {point.device_id}
                          </p>
                          <h3 className="text-2xl font-black text-slate-900 mb-4">{point.name}</h3>
                          
                          <div className={`inline-flex items-center space-x-4 px-8 py-6 rounded-[2rem] transition-all duration-500 shadow-2xl ${
                            percent >= 100 ? 'bg-emerald-600' : 
                            percent <= 25 ? 'bg-red-600 animate-pulse' : 
                            'bg-slate-900'
                          } text-white`}>
                             <Droplets size={32} className={percent > 0 ? 'animate-bounce' : ''} />
                             <span className="text-5xl font-black">{percent}%</span>
                             <div className="flex flex-col">
                               {isRising && <ArrowUp size={20} className="text-emerald-400" />}
                               {isFalling && <ArrowDown size={20} className="text-red-400" />}
                             </div>
                          </div>
                        </div>
                        
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                           <ElectrodeVisual percent={percent} />
                        </div>

                        {showRawData && (
                          <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[9px] max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
                            <p className="border-b border-emerald-900/50 pb-1 mb-2 font-black uppercase">Debug IOT V8.9:</p>
                            {history.slice(-10).reverse().map((h, i) => (
                              <div key={i} className="flex justify-between border-b border-emerald-900/10 py-1">
                                <span>{h.time}</span>
                                <span className="font-black">{h.percentual}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="xl:w-2/3 flex flex-col">
                        <div className="h-[400px] w-full bg-slate-50/50 rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                              <defs>
                                <linearGradient id={`colorLevel-${point.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} ticks={[0, 25, 50, 75, 100]} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                itemStyle={{ fontWeight: '900', fontSize: '12px', color: '#2563eb' }}
                              />
                              <Area 
                                type="stepAfter" 
                                dataKey="percentual" 
                                stroke="#2563eb" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill={`url(#colorLevel-${point.id})`} 
                                animationDuration={500} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-6 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start space-x-4">
                           <Info size={20} className="text-blue-500 shrink-0 mt-1" />
                           <div className="space-y-1">
                             <p className="text-[10px] font-black text-blue-900 uppercase leading-none">Status de Sincronia</p>
                             <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                               O gráfico utiliza <b>stepAfter</b> para representar degraus de nível. Se o sensor oscilar entre 75 e 100, a linha subirá em ângulo reto.
                               A presença do arquivo <b>_redirects</b> garante que o Netlify mantenha a telemetria ativa após F5.
                             </p>
                           </div>
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
