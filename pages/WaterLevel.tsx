
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Wifi,
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { AppData, UserRole, WaterLevel as WaterLevelType } from '../types';
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

  const ElectrodeVisual = ({ percent }: { percent: number }) => {
    const levels = [
      { val: 100, label: 'Eletrodo Superior' },
      { val: 75,  label: 'Eletrodo Médio Alto' },
      { val: 50,  label: 'Eletrodo Médio Baixo' },
      { val: 25,  label: 'Eletrodo Inferior' }
    ];

    return (
      <div className="flex flex-col space-y-4 w-full">
        {levels.map((l) => (
          <div key={l.val} className="flex items-center space-x-4">
             <div className={`w-3 h-3 rounded-full transition-all duration-500 ${percent >= l.val ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-200'}`}></div>
             <div className={`flex-1 h-12 rounded-2xl border-2 flex items-center px-4 justify-between transition-all duration-500 ${
               percent >= l.val 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-slate-50 border-slate-100 opacity-50'
             }`}>
               <span className={`text-[10px] font-black uppercase tracking-widest ${percent >= l.val ? 'text-blue-700' : 'text-slate-400'}`}>
                 {l.label}
               </span>
               <span className={`text-xs font-black ${percent >= l.val ? 'text-blue-600' : 'text-slate-300'}`}>{l.val}%</span>
             </div>
          </div>
        ))}
        <div className="flex items-center space-x-4 pt-2 border-t border-slate-100">
           <div className="w-3 h-3 rounded-full bg-slate-900"></div>
           <div className="flex-1 h-12 rounded-2xl bg-slate-900 flex items-center px-4 justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Eletrodo Comum (Referência)</span>
              <span className="text-[10px] font-black text-slate-400">GND</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Monitoramento por Eletrodos</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Condução Elétrica em Tempo Real</p>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-300 transition-all"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizar Dados</span>
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
              <div className="hidden md:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl">
                 <Info size={14} className="text-blue-500" />
                 <span className="text-[9px] font-black text-blue-700 uppercase">Sistema de 4 Pontos de Contato</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {entry.points.map((point: any) => {
                const latest = getLatestReading(point.device_id);
                const percent = latest ? latest.percentual : 0;
                const analysis = iaAnalysis[point.device_id];
                const isAnomaly = analysis?.text.toUpperCase().includes('ANOMALIA');

                return (
                  <div key={point.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden p-8 flex flex-col hover:shadow-2xl transition-all">
                    <div className="flex flex-col md:flex-row gap-10">
                      <div className="md:w-1/2 space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p>
                          <h3 className="text-xl font-black text-slate-900 leading-tight mb-4">{point.name}</h3>
                          <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-3xl ${percent === 0 ? 'bg-red-600' : 'bg-slate-900'} text-white`}>
                             <Droplets size={24} className={percent > 0 ? 'animate-bounce' : ''} />
                             <span className="text-4xl font-black">{percent}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-emerald-500 space-x-2">
                             <Wifi size={14} className="animate-pulse" />
                             <span className="text-[9px] font-black uppercase tracking-widest">ESP32 Online</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-300 italic uppercase">Dispositivo: {point.device_id}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 space-y-4">
                          <button 
                            onClick={() => handleIaAnalysis(point.device_id)}
                            disabled={analysis?.loading}
                            className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            {analysis?.loading ? <RefreshCw size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                            <span>Análise do Engenheiro IA</span>
                          </button>

                          <div className="flex items-center space-x-3 text-slate-400">
                             <Clock size={14} />
                             <span className="text-[10px] font-bold">Lido às: {latest ? new Date(latest.created_at).toLocaleTimeString() : 'Sem dados'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-1/2 bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100 flex items-center justify-center">
                         <ElectrodeVisual percent={percent} />
                      </div>
                    </div>

                    {analysis && !analysis.loading && (
                      <div className={`mt-8 p-6 rounded-3xl border-2 animate-in slide-in-from-bottom ${isAnomaly ? 'bg-red-50 border-red-300 shadow-lg shadow-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                         <div className="flex items-center space-x-3 mb-3">
                            {isAnomaly ? <ShieldAlert size={20} className="text-red-600 animate-pulse" /> : <Sparkles size={20} className="text-emerald-600" />}
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isAnomaly ? 'text-red-700' : 'text-emerald-700'}`}>
                              {isAnomaly ? 'Relatório de Falha Crítica' : 'Status Técnico Gemini'}
                            </span>
                         </div>
                         <p className={`text-xs font-bold leading-relaxed ${isAnomaly ? 'text-red-900' : 'text-slate-600'}`}>
                           {analysis.text}
                         </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {monitoringData.length === 0 && (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center text-center">
            <Droplets size={64} className="text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-900 uppercase">Nenhum Sistema de Telemetria</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm font-medium italic">Cadastre um Sistema do tipo "Monitoramento de Nível IOT" e vincule os Serial IDs das suas placas ESP32.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
