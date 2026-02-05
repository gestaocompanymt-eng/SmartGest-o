
import React, { useState, useMemo, useEffect } from 'react';
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
  Info,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { AppData, UserRole, WaterLevel as WaterLevelType } from '../types';
import { analyzeWaterLevelHistory } from '../geminiService';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iaAnalysis, setIaAnalysis] = useState<Record<string, {text: string, loading: boolean}>>({});
  const [showStatusHint, setShowStatusHint] = useState(true);
  
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
    if (!deviceId) return null;
    const searchId = deviceId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    return data.waterLevels
      .filter(l => {
        const entryId = String(l.condominio_id || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        return entryId === searchId;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
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
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Referência (GND)</span>
              <span className="text-[10px] font-black text-slate-400">Pino Fundo</span>
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
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Telemetria via Eletrodos (ESP32)</p>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-300 transition-all group"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} text-blue-600 transition-transform duration-500`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Atualizar Agora</span>
        </button>
      </div>

      {showStatusHint && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Otimização Ativa</p>
              <p className="text-[10px] text-slate-400 font-bold">O sistema registra novos dados apenas quando há alteração no nível de água, economizando recursos.</p>
            </div>
          </div>
          <button onClick={() => setShowStatusHint(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <CheckCircle2 size={18} />
          </button>
        </div>
      )}

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
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {entry.points.map((point: any) => {
                const latest = getLatestReading(point.device_id);
                const percent = latest ? latest.percentual : 0;
                const analysis = iaAnalysis[point.device_id];
                const isAnomaly = analysis?.text.toUpperCase().includes('ANOMALIA');

                return (
                  <div key={point.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden p-8 flex flex-col hover:shadow-2xl transition-all relative">
                    <div className="flex flex-col md:flex-row gap-10">
                      <div className="md:w-1/2 space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p>
                          <h3 className="text-xl font-black text-slate-900 leading-tight mb-4">{point.name}</h3>
                          <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-3xl ${percent === 0 ? 'bg-red-600' : 'bg-slate-900'} text-white shadow-xl relative overflow-hidden group`}>
                             <div className="absolute inset-0 bg-blue-500/10 scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full"></div>
                             <Droplets size={24} className={percent > 0 ? 'animate-bounce relative z-10' : 'relative z-10'} />
                             <span className="text-4xl font-black relative z-10">{percent}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                             <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Aguardando Mudança</span>
                          </div>
                          
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Estado do Sensor</span>
                                <span className="text-[9px] font-black text-slate-900 uppercase">ONLINE</span>
                             </div>
                             <div className="flex items-center space-x-2 text-slate-600">
                                <Clock size={12} />
                                <span className="text-[9px] font-bold">Último Registro: {latest ? new Date(latest.created_at).toLocaleTimeString() : 'Buscando...'}</span>
                             </div>
                          </div>
                          <p className="text-[9px] font-bold text-slate-300 italic uppercase ml-1">Serial: {point.device_id}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 space-y-4">
                          <button 
                            onClick={() => handleIaAnalysis(point.device_id)}
                            disabled={analysis?.loading}
                            className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            {analysis?.loading ? <RefreshCw size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                            <span>Gerar Diagnóstico IA</span>
                          </button>
                        </div>
                      </div>

                      <div className="md:w-1/2 bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100 flex items-center justify-center">
                         <ElectrodeVisual percent={percent} />
                      </div>
                    </div>
                    
                    {analysis && !analysis.loading && (
                      <div className={`mt-6 p-5 rounded-2xl border-2 animate-in zoom-in-95 ${isAnomaly ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                         <div className="flex items-center space-x-2 mb-2">
                           <Activity size={14} className={isAnomaly ? 'text-red-600' : 'text-blue-600'} />
                           <span className={`text-[10px] font-black uppercase ${isAnomaly ? 'text-red-700' : 'text-blue-700'}`}>Parecer Técnico Automático</span>
                         </div>
                         <p className="text-xs font-bold text-slate-700 leading-relaxed">{analysis.text}</p>
                      </div>
                    )}
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
