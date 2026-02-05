
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Wifi,
  BrainCircuit,
  AlertOctagon,
  Sparkles,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { AppData, UserRole, MonitoringPoint } from '../types';
import { analyzeWaterLevelHistory } from '../geminiService';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iaAnalysis, setIaAnalysis] = useState<Record<string, {text: string, loading: boolean}>>({});
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.SINDICO_ADMIN;

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

  const getLatestReading = (deviceId: string) => {
    return data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toUpperCase() === deviceId.trim().toUpperCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const handleIaAnalysis = async (deviceId: string) => {
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: '', loading: true } }));
    const history = data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toUpperCase() === deviceId.trim().toUpperCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const result = await analyzeWaterLevelHistory(history);
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: result || 'Análise concluída.', loading: false } }));
  };

  const StageVisual = ({ percent }: { percent: number }) => {
    const stages = [100, 75, 50, 25, 0];
    return (
      <div className="flex flex-col space-y-3 w-full max-w-[220px]">
        {stages.map((s) => (
          <div key={s} className="flex items-center space-x-4">
            <div className={`flex-1 h-10 rounded-2xl border-4 transition-all duration-700 shadow-sm ${
              percent >= s 
                ? (s >= 75 ? 'bg-blue-500 border-blue-600' : s >= 50 ? 'bg-blue-400 border-blue-500' : s >= 25 ? 'bg-amber-400 border-amber-500' : 'bg-red-500 border-red-600')
                : 'bg-slate-50 border-slate-100 opacity-30'
            }`}>
              {percent >= s && s > 0 && <div className="w-full h-1 bg-white/20 rounded-full mt-1 mx-auto max-w-[80%]"></div>}
            </div>
            <span className={`text-xs font-black w-10 ${percent >= s ? 'text-slate-900' : 'text-slate-200'}`}>{s}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Telemetria de Nível</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Escala Técnica de 5 Estágios</p>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-300 transition-all"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Atualizar Agora</span>
        </button>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center space-x-3 px-6 py-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Building2 size={20} className="text-blue-600" />
              <h2 className="font-black text-slate-800 uppercase tracking-tight text-sm">{entry.condo.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {entry.points.map((point: any) => {
                const latest = getLatestReading(point.device_id);
                const percent = latest ? latest.percentual : 0;
                const analysis = iaAnalysis[point.device_id];
                const isAnomaly = analysis?.text.toUpperCase().includes('ANOMALIA');

                return (
                  <div key={point.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden p-8 flex flex-col md:flex-row gap-10 hover:shadow-2xl transition-all">
                    <div className="space-y-6">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reservatório</p>
                        <h3 className="text-xl font-black text-slate-900 leading-tight mb-4">{point.name}</h3>
                        <div className="inline-flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl w-fit">
                           <Zap size={14} className="text-blue-400" />
                           <span className="text-2xl font-black">{percent}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-emerald-500 space-x-2">
                           <Wifi size={14} className="animate-pulse" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Sinal Ativo</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 italic">Serial: {point.device_id}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-50">
                        <button 
                          onClick={() => handleIaAnalysis(point.device_id)}
                          disabled={analysis?.loading}
                          className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          {analysis?.loading ? <RefreshCw size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                          <span>Consultar Engenheiro IA</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100">
                       <StageVisual percent={percent} />
                       
                       {analysis && !analysis.loading && (
                         <div className={`mt-6 p-5 rounded-3xl border-2 w-full animate-in slide-in-from-bottom ${isAnomaly ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-blue-100 shadow-sm'}`}>
                            <div className="flex items-center space-x-2 mb-2">
                               {isAnomaly ? <ShieldAlert size={16} className="text-red-600" /> : <Sparkles size={16} className="text-blue-600" />}
                               <span className={`text-[10px] font-black uppercase tracking-widest ${isAnomaly ? 'text-red-700' : 'text-blue-700'}`}>
                                 {isAnomaly ? 'Alerta Crítico' : 'Parecer Técnico'}
                               </span>
                            </div>
                            <p className={`text-xs font-bold leading-relaxed ${isAnomaly ? 'text-red-900' : 'text-slate-600'}`}>
                              {analysis.text}
                            </p>
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
    </div>
  );
};

export default WaterLevel;
