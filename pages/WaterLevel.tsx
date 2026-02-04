
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
  Check
} from 'lucide-react';
import { AppData, UserRole, MonitoringPoint, WaterLevel as WaterLevelType } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  // Lista de IDs cadastrados (Normalizado)
  const registeredDeviceIds = useMemo(() => {
    const ids = new Set<string>();
    data.systems.forEach(s => {
      s.monitoring_points?.forEach(p => {
        if (p.device_id) ids.add(p.device_id.trim().toUpperCase());
      });
    });
    return ids;
  }, [data.systems]);

  // Identifica sinais órfãos (Dispositivos enviando sinal sem estar no cadastro)
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

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Monitoramento Hidráulico</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Sinais IoT em Tempo Real</p>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          {isAdminOrTech && orphanedSensors.length > 0 && (
            <button 
              onClick={() => setShowDiscovery(!showDiscovery)}
              className={`flex-1 md:flex-none px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2 relative overflow-hidden ${showDiscovery ? 'bg-amber-500 text-white shadow-lg' : 'bg-amber-50 border-2 text-amber-600 border-amber-200 animate-pulse'}`}
            >
              <Search size={16} />
              <span>Novas Placas ({orphanedSensors.length})</span>
            </button>
          )}
          <button 
            onClick={handleManualRefresh}
            className="flex-1 md:flex-none p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 tracking-tighter">Atualizar</span>
          </button>
        </div>
      </div>

      {showDiscovery && isAdminOrTech && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200 shadow-2xl shadow-amber-500/10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-amber-500 text-white rounded-[1.5rem] shadow-xl shadow-amber-500/20"><Wifi size={24} /></div>
                <div>
                   <h3 className="text-lg font-black text-amber-900 uppercase leading-none">Novas Placas Detectadas</h3>
                   <p className="text-[10px] font-bold text-amber-700 uppercase mt-1 italic">Vincule estes IDs aos seus sistemas na aba "Sistemas".</p>
                </div>
              </div>
              <button onClick={() => setShowDiscovery(false)} className="p-2 text-amber-800 hover:bg-amber-100 rounded-full transition-colors self-start md:self-center"><X size={20} /></button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orphanedSensors.map(sensor => (
                <div key={sensor.id} className="bg-white p-6 rounded-[2rem] border-2 border-amber-100 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Cpu size={60} /></div>
                   <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Sensor Encontrado</span>
                   
                   <div className="flex items-center justify-between mt-3 mb-4">
                      <p className="text-xl font-black text-slate-900 font-mono select-all">{sensor.condominio_id}</p>
                      <button 
                        onClick={() => copyToClipboard(sensor.condominio_id)}
                        className={`p-2 rounded-lg transition-all ${copiedId === sensor.condominio_id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-blue-600'}`}
                        title="Copiar ID"
                      >
                        {copiedId === sensor.condominio_id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                   </div>

                   <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase">Sinal Recebido</span>
                         <span className="text-[10px] font-bold text-slate-700">{new Date(sensor.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-black text-amber-500">{sensor.percentual}%</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center space-x-3 px-4 py-2 border-l-4 border-blue-600 bg-white rounded-r-2xl shadow-sm">
              <Building2 size={20} className="text-blue-600" />
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{entry.condo.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {entry.points.map((point: MonitoringPoint) => {
                const latest = getLatestReading(point.device_id);
                const percent = latest ? Math.min(100, Math.max(0, latest.percentual)) : 0;
                const isOffline = latest ? (new Date().getTime() - new Date(latest.created_at).getTime() > 300000) : true; 

                return (
                  <div key={point.id} className={`bg-white rounded-[3rem] border-2 overflow-hidden shadow-xl transition-all group ${isOffline ? 'border-slate-100 opacity-80' : 'border-slate-100 hover:border-blue-400 shadow-blue-500/5'}`}>
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest border border-blue-100">ID: {point.device_id}</span>
                          <h3 className="font-black text-slate-800 text-xl uppercase leading-tight mt-2 truncate">{point.name}</h3>
                        </div>
                        {latest && (
                           <div className={`p-3 rounded-2xl shadow-lg ${percent < 25 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-emerald-50 text-emerald-600 shadow-emerald-500/10'}`}>
                             {isOffline ? <Wifi size={20} className="text-slate-300" /> : <Activity size={20} />}
                           </div>
                        )}
                      </div>

                      {latest ? (
                        <>
                          <div className="relative h-56 w-full bg-slate-50 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl mb-8">
                             <div className={`absolute bottom-0 left-0 w-full transition-all duration-[2000ms] ease-in-out z-10 
                                ${percent <= 25 ? 'bg-gradient-to-t from-red-600 to-red-400' : 'bg-gradient-to-t from-blue-600 to-blue-400'}`} 
                                style={{ height: `${percent}%` }}>
                               <div className="absolute top-0 left-0 w-full h-4 bg-white/20 animate-pulse blur-sm"></div>
                               <div className="absolute top-2 left-0 w-full h-1 bg-white/10"></div>
                             </div>
                             
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                                <div className="bg-white/90 backdrop-blur-md shadow-2xl px-8 py-4 rounded-[2rem] border border-white text-center transform group-hover:scale-110 transition-transform">
                                   <span className="block text-5xl font-black text-slate-900 leading-none tracking-tighter">{percent}%</span>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 block">Capacidade</span>
                                </div>
                             </div>

                             {isOffline && (
                               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 flex items-center justify-center p-6 text-center">
                                  <div className="bg-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-xl">
                                    <AlertTriangle size={16} className="text-amber-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-800">Sem Sinal Recente</span>
                                  </div>
                               </div>
                             )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Nível Bruto</span>
                                <span className="text-xs font-black text-slate-700">{latest.nivel_cm} cm</span>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-right">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Última Leitura</span>
                                <span className="text-xs font-black text-slate-700">{new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-5 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
                          <div className="p-5 bg-white rounded-[1.5rem] shadow-xl"><Cpu size={36} className="text-amber-400 animate-bounce" /></div>
                          <div className="px-10">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Vínculo Criado. Aguardando sinal do sensor:</p>
                             <div className="flex items-center justify-center space-x-2 mt-2">
                                <p className="text-sm font-black text-amber-600 font-mono bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{point.device_id}</p>
                                <button onClick={() => copyToClipboard(point.device_id)} className="p-1.5 bg-white border rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                  {copiedId === point.device_id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {monitoringData.length === 0 && (
          <div className="py-32 bg-white border-2 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center text-center px-12 shadow-inner">
            <Droplets size={64} className="text-blue-100 mb-6" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sem Reservatórios Conectados</h3>
            <p className="text-sm font-medium text-slate-400 max-w-xs mt-3 leading-relaxed">Adicione um Ponto de Monitoramento em um Sistema e coloque o ID Serial da placa ESP32.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
