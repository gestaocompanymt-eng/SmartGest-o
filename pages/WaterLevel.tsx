
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Building2,
  Wifi,
  Activity,
  AlertTriangle,
  Info,
  Terminal,
  CheckCircle2,
  Radio
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

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [showRawData, setShowRawData] = useState(false);
  const [lastUpdatePulse, setLastUpdatePulse] = useState(false);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.SINDICO_ADMIN || user?.role === UserRole.RONDA;

  // Efeito visual de pulso quando novos dados chegam
  useEffect(() => {
    setLastUpdatePulse(true);
    const timer = setTimeout(() => setLastUpdatePulse(false), 800);
    return () => clearTimeout(timer);
  }, [data.waterLevels.length]);

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
        time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-50);
  };

  const ElectrodeVisual = ({ percent }: { percent: number }) => {
    const levels = [
      { val: 100, label: 'Tanque Cheio (100%)', activeColor: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
      { val: 75,  label: 'Nível Alto (75%)',  activeColor: 'bg-blue-500', glow: 'shadow-blue-500/50' },
      { val: 50,  label: 'Nível Médio (50%)',  activeColor: 'bg-blue-500', glow: 'shadow-blue-500/50' },
      { val: 25,  label: 'Nível Reserva (25%)',  activeColor: 'bg-amber-500', glow: 'shadow-amber-500/50' }
    ];

    return (
      <div className="flex flex-col space-y-3 w-full">
        {levels.map((l) => {
          const isActive = percent >= l.val;
          return (
            <div key={l.val} className="flex items-center space-x-3">
               <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isActive ? `${l.activeColor} ${l.glow} shadow-lg` : 'bg-slate-200'}`}></div>
               <div className={`flex-1 h-12 rounded-2xl border flex items-center px-4 justify-between transition-all duration-300 ${
                 isActive 
                  ? 'bg-slate-900 border-slate-700 text-white shadow-xl' 
                  : 'bg-white border-slate-100 text-slate-300 opacity-40'
               }`}>
                 <span className="text-[9px] font-black uppercase tracking-widest">{l.label}</span>
                 <div className="flex items-center space-x-2">
                   {isActive && <CheckCircle2 size={12} className="text-emerald-400" />}
                   <span className="text-xs font-black">{isActive ? l.val : '--'}%</span>
                 </div>
               </div>
            </div>
          );
        })}
        
        {/* Visual de 0% - TRATAMENTO EXPLÍCITO V9.2 */}
        <div className={`mt-2 p-4 rounded-2xl flex items-center justify-between transition-all duration-500 border-2 ${
          percent <= 0 
            ? 'bg-red-600 border-red-400 shadow-2xl shadow-red-500/40 animate-pulse text-white scale-[1.02]' 
            : 'bg-slate-100 border-transparent text-slate-400 opacity-20'
        }`}>
          <div className="flex items-center space-x-3">
            <AlertTriangle size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Alerta Crítico: Tanque Vazio (0%)</span>
          </div>
          <span className="text-xs font-black">{percent <= 0 ? '0%' : '--'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Telemetria Realtime V9.2</h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Sincronismo Preciso IOT</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl flex items-center space-x-2 border transition-all duration-500 ${lastUpdatePulse ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
            <Radio size={14} className={lastUpdatePulse ? 'animate-ping' : ''} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{lastUpdatePulse ? 'Dado Recebido!' : 'Aguardando ESP32'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRawData(!showRawData)} className={`p-3 rounded-2xl border transition-all ${showRawData ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>
            <Terminal size={18} />
          </button>
          <button onClick={onRefresh} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 text-blue-600 active:scale-95 transition-all">
            <RefreshCw size={18} />
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
              <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                <Activity size={14} className="animate-pulse" />
                <span>IOT Ativo</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {entry.points.map((point: any) => {
                const history = getPointsHistory(point.device_id);
                // Ordena para pegar o dado mais recente do histórico filtrado
                const actualHistory = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const current = actualHistory.length > 0 ? actualHistory[actualHistory.length - 1] : null;
                const percent = current ? Number(current.percentual) : 0;
                
                return (
                  <div key={point.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden p-8 flex flex-col hover:shadow-2xl transition-all border-slate-100">
                    <div className="flex flex-col xl:flex-row gap-10">
                      <div className="xl:w-1/3 space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                            <Wifi size={12} className="mr-1" /> Serial: {point.device_id}
                          </p>
                          <h3 className="text-2xl font-black text-slate-900 mb-6">{point.name}</h3>
                          
                          <div className={`inline-flex items-center space-x-6 px-10 py-8 rounded-[2.5rem] transition-all duration-500 shadow-2xl border-4 ${
                            percent >= 100 ? 'bg-emerald-600 border-emerald-400' : 
                            percent <= 0 ? 'bg-red-600 border-red-400' :
                            percent <= 25 ? 'bg-amber-600 border-amber-400' : 
                            'bg-slate-900 border-slate-800'
                          } text-white`}>
                             <Droplets size={40} className={percent > 0 ? 'animate-bounce' : ''} />
                             <span className="text-6xl font-black tracking-tighter">{percent}%</span>
                          </div>
                        </div>
                        
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                           <ElectrodeVisual percent={percent} />
                        </div>

                        {showRawData && (
                          <div className="bg-slate-900 text-emerald-400 p-5 rounded-3xl font-mono text-[9px] max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
                            <p className="border-b border-emerald-900/50 pb-2 mb-2 font-black uppercase text-blue-400">Log IOT Master V9.2:</p>
                            {actualHistory.length === 0 ? <p className="opacity-40 italic">Aguardando telemetria inicial...</p> : actualHistory.slice(-10).reverse().map((h, i) => (
                              <div key={i} className="flex justify-between border-b border-emerald-900/10 py-1">
                                <span>{new Date(h.created_at).toLocaleTimeString()}</span>
                                <span className="font-black text-white">{h.percentual}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="xl:w-2/3 flex flex-col">
                        <div className="h-[450px] w-full bg-slate-50/50 rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={actualHistory}>
                              <defs>
                                <linearGradient id={`colorLevel-${point.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={percent <= 0 ? '#ef4444' : '#2563eb'} stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor={percent <= 0 ? '#ef4444' : '#2563eb'} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} ticks={[0, 25, 50, 75, 100]} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px' }}
                                itemStyle={{ fontWeight: '900', fontSize: '14px', color: '#2563eb' }}
                              />
                              <Area 
                                type="stepAfter" 
                                dataKey="percentual" 
                                stroke={percent <= 0 ? '#ef4444' : '#2563eb'} 
                                strokeWidth={5} 
                                fillOpacity={1} 
                                fill={`url(#colorLevel-${point.id})`} 
                                animationDuration={800} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-6 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start space-x-4">
                           <Info size={20} className="text-blue-500 shrink-0 mt-1" />
                           <div className="space-y-1">
                             <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Status de Sincronia V9.2</p>
                             <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                               O gráfico utiliza <b>Step After</b> para capturar mudanças instantâneas nos eletrodos. O pulso azul no topo da página confirma a recepção de cada pacote de dados.
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
