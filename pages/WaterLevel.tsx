
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Activity,
  X,
  Wifi,
  BrainCircuit,
  AlertOctagon,
  Sparkles,
  Zap
} from 'lucide-react';
import { AppData, UserRole, MonitoringPoint, WaterLevel as WaterLevelType } from '../types';
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

  const getHistoryForDevice = (deviceId: string) => {
    return data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toUpperCase() === deviceId.trim().toUpperCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const handleIaAnalysis = async (deviceId: string) => {
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: '', loading: true } }));
    const history = getHistoryForDevice(deviceId);
    const result = await analyzeWaterLevelHistory(history);
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: result || 'Análise concluída sem observações.', loading: false } }));
  };

  const TankVisual = ({ percent }: { percent: number }) => {
    const stages = [0, 25, 50, 75, 100];
    return (
      <div className="relative w-full h-48 bg-slate-100 rounded-3xl border-4 border-slate-200 overflow-hidden shadow-inner">
        {/* Camadas de Água */}
        <div 
          className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out bg-gradient-to-t from-blue-600 to-blue-400"
          style={{ height: `${percent}%` }}
        >
          {percent > 0 && (
            <div className="absolute top-0 left-0 w-full h-2 bg-white/30 animate-pulse"></div>
          )}
        </div>

        {/* Marcadores de Estágio */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
          {stages.reverse().map((s) => (
            <div key={s} className="flex items-center justify-between">
              <div className={`h-[1px] flex-1 border-t border-dashed ${percent >= s ? 'border-white/50' : 'border-slate-300'}`}></div>
              <span className={`text-[9px] font-black ml-2 px-2 py-0.5 rounded ${percent >= s ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {s}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel de Reservatórios</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Sincronização IOT em Tempo Real</p>
        </div>
        <button 
          onClick={handleManualRefresh}
          className="w-full md:w-auto p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-300 transition-all flex items-center justify-center space-x-3"
        >
          <RefreshCw size={20} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Forçar Atualização</span>
        </button>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center space-x-3 px-6 py-4 bg-white rounded-3xl shadow-sm border border-slate-100">
              <Building2 size={24} className="text-blue-600" />
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{entry.condo.name}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {entry.points.map((point: MonitoringPoint) => {
                const latest = getLatestReading(point.device_id);
                const percent = latest ? latest.percentual : 0;
                const lastSeen = latest ? new Date(latest.created_at) : null;
                const isOffline = !lastSeen || (new Date().getTime() - lastSeen.getTime() > 300000); // 5 min
                const analysis = iaAnalysis[point.device_id];
                const hasAnomaly = analysis?.text.toUpperCase().includes('ANOMALIA');

                return (
                  <div key={point.id} className={`bg-white rounded-[3rem] border-4 overflow-hidden shadow-xl transition-all ${isOffline ? 'border-slate-100 opacity-80' : 'border-white hover:scale-[1.01]'}`}>
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center space-x-4">
                          <div className={`p-4 rounded-2xl ${isOffline ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'}`}>
                            <Zap size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local: {point.name}</p>
                            <h3 className="font-black text-slate-900 text-3xl leading-none mt-1">{percent}%</h3>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${isOffline ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                              <Wifi size={14} className={`mr-2 ${!isOffline && 'animate-pulse'}`} />
                              <span className="text-[9px] font-black uppercase tracking-widest">{isOffline ? 'Sem Sinal' : 'Online'}</span>
                           </div>
                        </div>
                      </div>

                      <TankVisual percent={percent} />

                      {/* Card de Análise de IA */}
                      <div className="mt-8">
                        {!analysis ? (
                          <button 
                            onClick={() => handleIaAnalysis(point.device_id)}
                            className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center space-x-2"
                          >
                            <BrainCircuit size={16} />
                            <span>Solicitar Análise Gemini IA</span>
                          </button>
                        ) : (
                          <div className={`p-6 rounded-[2rem] border-2 transition-all ${hasAnomaly ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                {hasAnomaly ? <AlertOctagon size={20} className="text-red-600" /> : <Sparkles size={20} className="text-blue-600" />}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${hasAnomaly ? 'text-red-700' : 'text-blue-700'}`}>
                                  {hasAnomaly ? 'Alerta de Anomalia' : 'Inteligência Artificial'}
                                </span>
                              </div>
                              <button onClick={() => handleIaAnalysis(point.device_id)} className="text-slate-400 hover:text-slate-600">
                                <RefreshCw size={14} className={analysis.loading ? 'animate-spin' : ''} />
                              </button>
                            </div>
                            <p className={`text-xs font-bold leading-relaxed ${hasAnomaly ? 'text-red-800' : 'text-slate-700'}`}>
                              {analysis.loading ? 'Processando dados...' : analysis.text}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <Clock size={16} className="text-slate-300" />
                           <span className="text-[10px] font-bold text-slate-400 italic">
                             Último sinal: {lastSeen ? lastSeen.toLocaleTimeString() : 'Nunca'}
                           </span>
                         </div>
                         <span className="text-[9px] font-black text-slate-300 uppercase font-mono">ID: {point.device_id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {monitoringData.length === 0 && (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center text-center">
            <Droplets size={64} className="text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-900">Nenhum Sistema IOT Detectado</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm font-medium">Cadastre um novo Sistema com o tipo "Monitoramento de Nível IOT" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
