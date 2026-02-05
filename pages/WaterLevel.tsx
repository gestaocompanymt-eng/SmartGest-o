
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Activity,
  X,
  Search,
  Wifi,
  Cpu,
  AlertTriangle,
  Copy,
  Check,
  BrainCircuit,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { AppData, UserRole, MonitoringPoint, WaterLevel as WaterLevelType } from '../types';
import { analyzeWaterLevelHistory } from '../geminiService';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [iaAnalysis, setIaAnalysis] = useState<Record<string, {text: string, loading: boolean}>>({});
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.SINDICO_ADMIN;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  const registeredDeviceIds = useMemo(() => {
    const ids = new Set<string>();
    data.systems.forEach(s => {
      s.monitoring_points?.forEach(p => {
        if (p.device_id) ids.add(p.device_id.trim().toUpperCase());
      });
    });
    return ids;
  }, [data.systems]);

  const orphanedSensors = useMemo(() => {
    const orphans = new Map<string, WaterLevelType>();
    data.waterLevels.forEach(level => {
      const id = String(level.condominio_id || '').trim().toUpperCase();
      if (id && !registeredDeviceIds.has(id)) {
        if (!orphans.has(id)) {
          orphans.set(id, level);
        }
      }
    });
    return Array.from(orphans.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data.waterLevels, registeredDeviceIds]);

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
    setIaAnalysis(prev => ({ ...prev, [deviceId]: { text: result || 'Análise falhou.', loading: false } }));
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const StageIndicator = ({ percent }: { percent: number }) => {
    const stages = [0, 25, 50, 75, 100];
    return (
      <div className="flex justify-between items-end h-24 gap-3">
        {stages.map((s) => (
          <div key={s} className="flex-1 flex flex-col items-center">
            <div 
              className={`w-full rounded-t-xl transition-all duration-1000 ${
                percent >= s 
                  ? (s === 0 ? 'bg-red-500' : s <= 25 ? 'bg-orange-500' : s <= 50 ? 'bg-amber-400' : 'bg-blue-500') 
                  : 'bg-slate-100'
              }`}
              style={{ height: `${s === 0 ? 15 : s}%` }}
            ></div>
            <span className={`text-[8px] font-black mt-2 ${percent >= s ? 'text-slate-900' : 'text-slate-300'}`}>{s}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Monitoramento Hidráulico</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Escala de 5 Estágios</p>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <button 
            onClick={handleManualRefresh}
            className="flex-1 md:flex-none p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Atualizar</span>
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center space-x-3 px-4 py-2 border-l-4 border-blue-600 bg-white rounded-r-2xl shadow-sm">
              <Building2 size={20} className="text-blue-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">{entry.condo.name}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {entry.points.map((point: MonitoringPoint) => {
                const latest = getLatestReading(point.device_id);
                const percent = latest ? latest.percentual : 0;
                const isOffline = latest ? (new Date().getTime() - new Date(latest.created_at).getTime() > 600000) : true; 
                const analysis = iaAnalysis[point.device_id];

                return (
                  <div key={point.id} className={`bg-white rounded-[2.5rem] border-2 overflow-hidden shadow-sm transition-all ${isOffline ? 'border-slate-100 opacity-90' : 'border-slate-100 hover:border-blue-200'}`}>
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ponto: {point.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                             <h3 className="font-black text-slate-900 text-2xl">{percent}%</h3>
                             {isOffline && <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[8px] font-black uppercase rounded-full">Offline</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleIaAnalysis(point.device_id)}
                          disabled={analysis?.loading}
                          className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                        >
                          {analysis?.loading ? <RefreshCw size={12} className="animate-spin" /> : <BrainCircuit size={12} />}
                          <span>Análise IA</span>
                        </button>
                      </div>

                      <div className="mb-10 px-4">
                        <StageIndicator percent={percent} />
                      </div>

                      {analysis && (
                        <div className={`p-6 rounded-3xl border-2 mb-6 animate-in slide-in-from-top ${analysis.text.includes('ANOMALIA') ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                           <div className="flex items-center space-x-2 mb-3">
                              {analysis.text.includes('ANOMALIA') ? <AlertOctagon size={16} className="text-red-500" /> : <Sparkles size={16} className="text-blue-500" />}
                              <span className={`text-[10px] font-black uppercase tracking-widest ${analysis.text.includes('ANOMALIA') ? 'text-red-600' : 'text-blue-600'}`}>
                                {analysis.text.includes('ANOMALIA') ? 'Anomalia Detectada' : 'Parecer da Inteligência'}
                              </span>
                           </div>
                           <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                             {analysis.loading ? 'Processando histórico...' : analysis.text}
                           </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                        <div className="flex items-center space-x-2">
                           <Clock size={14} className="text-slate-300" />
                           <span className="text-[10px] font-bold text-slate-400">
                             {latest ? new Date(latest.created_at).toLocaleTimeString() : 'Sem dados'}
                           </span>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-black text-slate-300 uppercase">ID: {point.device_id}</span>
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
