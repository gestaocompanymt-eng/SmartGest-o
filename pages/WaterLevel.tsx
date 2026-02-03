
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Activity,
  X,
  Search,
  Wifi,
  Cpu
} from 'lucide-react';
import { AppData, UserRole, MonitoringPoint, WaterLevel as WaterLevelType } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  // Lista de IDs cadastrados em todos os sistemas do app (Normalizado para comparação)
  const registeredDeviceIds = useMemo(() => {
    const ids = new Set<string>();
    data.systems.forEach(s => {
      s.monitoring_points?.forEach(p => {
        if (p.device_id) ids.add(p.device_id.trim().toLowerCase());
      });
    });
    return ids;
  }, [data.systems]);

  // Identifica sinais que estão chegando no banco mas não estão vinculados a nenhum sistema
  const orphanedSensors = useMemo(() => {
    const orphans = new Map<string, WaterLevelType>();
    data.waterLevels.forEach(level => {
      const id = String(level.condominio_id || '').trim().toLowerCase();
      if (id && !registeredDeviceIds.has(id)) {
        if (!orphans.has(id)) {
          orphans.set(id, level);
        }
      }
    });
    return Array.from(orphans.values());
  }, [data.waterLevels, registeredDeviceIds]);

  const monitoringData = useMemo(() => {
    const condosMap = new Map();
    // Filtra sistemas de monitoramento (tipo 7)
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
      .filter(l => String(l.condominio_id || '').trim().toLowerCase() === deviceId.trim().toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Monitoramento Hidráulico</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Sinais IoT via Nuvem</p>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          {isAdminOrTech && orphanedSensors.length > 0 && (
            <button 
              onClick={() => setShowDiscovery(!showDiscovery)}
              className={`flex-1 md:flex-none px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${showDiscovery ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white border text-amber-600 border-amber-200'}`}
            >
              <Search size={16} />
              <span>{showDiscovery ? 'Fechar Busca' : `Detectados (${orphanedSensors.length})`}</span>
            </button>
          )}
          <button 
            onClick={handleManualRefresh}
            className="flex-1 md:flex-none p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sincronizar</span>
          </button>
        </div>
      </div>

      {showDiscovery && isAdminOrTech && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 animate-in zoom-in-95 duration-200">
           <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg"><Wifi size={24} /></div>
              <div>
                 <h3 className="text-sm font-black text-amber-900 uppercase">Radar de Novos Dispositivos</h3>
                 <p className="text-[10px] font-bold text-amber-700 uppercase">Atenção: Estes IDs enviaram sinal, mas não estão vinculados em nenhum sistema.</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orphanedSensors.map(sensor => (
                <div key={sensor.id} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
                   <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">ID Captado</span>
                   <p className="text-lg font-black text-slate-900 select-all font-mono">{sensor.condominio_id}</p>
                   <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase">Último Sinal</span>
                         <span className="text-[10px] font-bold text-slate-700">{new Date(sensor.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-xl font-black text-amber-600">{sensor.percentual}%</span>
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
            <div className="flex items-center space-x-3 px-2 border-l-4 border-blue-600 py-1">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{entry.condo.name}</h2>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 block">Rede de Reservatórios Ativa</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entry.points.map((point: MonitoringPoint) => {
                const latest = getLatestReading(point.device_id);
                const percent = latest ? Math.min(100, Math.max(0, latest.percentual)) : 0;

                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:border-blue-400 transition-all group">
                    <div className="p-7">
                      <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">ID: {point.device_id}</span>
                          <h3 className="font-black text-slate-800 text-lg uppercase leading-tight mt-1 truncate">{point.name}</h3>
                        </div>
                        {latest && (
                           <div className={`p-2 rounded-xl ${percent < 25 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                             <Activity size={18} />
                           </div>
                        )}
                      </div>

                      {latest ? (
                        <>
                          <div className="relative h-44 w-full bg-slate-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-inner mb-6">
                             <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${percent > 25 ? 'from-blue-600 to-blue-400 shadow-[0_-10px_30px_rgba(59,130,246,0.4)]' : 'from-red-600 to-red-400 shadow-[0_-10px_30px_rgba(239,68,68,0.4)]'} transition-all duration-1000 z-10`} style={{ height: `${percent}%` }}>
                               <div className="absolute top-0 left-0 w-full h-2 bg-white/20 animate-pulse"></div>
                             </div>
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                <div className="bg-white/95 backdrop-blur shadow-2xl px-6 py-3 rounded-3xl border border-white text-center">
                                   <span className="block text-4xl font-black text-slate-900 leading-none">{percent}%</span>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{latest.nivel_cm}cm</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                                <span className={`text-[10px] font-black uppercase ${percent < 25 ? 'text-red-600' : 'text-emerald-600'}`}>{latest.status || (percent < 25 ? 'Crítico' : 'Normal')}</span>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-right">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Visto às</span>
                                <span className="text-[10px] font-black text-slate-700">{new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                          <div className="p-4 bg-white rounded-3xl shadow-sm"><Cpu size={32} className="text-amber-400 animate-pulse" /></div>
                          <div className="px-8">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Aguardando sinal do sensor:</p>
                             <p className="text-xs font-black text-amber-600 font-mono mt-1">{point.device_id}</p>
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
          <div className="py-32 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center px-12">
            <Droplets size={64} className="text-slate-100 mb-6" />
            <h3 className="text-lg font-black text-slate-900 uppercase">Sem Pontos de Medição</h3>
            <p className="text-xs font-medium text-slate-500 max-w-xs mt-2">Cadastre um "Sistema de Monitoramento" (Tipo 7) e adicione o ID do ESP32 para visualizar os níveis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
