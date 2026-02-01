
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Activity,
  ChevronRight,
  TrendingUp,
  X,
  ArrowDown,
  ArrowUp,
  Minus,
  Search,
  Wifi,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { AppData, UserRole, MonitoringPoint, WaterLevel as WaterLevelType } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  // Lista de IDs cadastrados em todos os sistemas do app
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
      const id = String(level.condominio_id || '').trim();
      if (id && !registeredDeviceIds.has(id.toLowerCase())) {
        // Mantém apenas a leitura mais recente de cada ID órfão
        if (!orphans.has(id.toLowerCase())) {
          orphans.set(id.toLowerCase(), level);
        }
      }
    });
    return Array.from(orphans.values());
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
    // Pequeno delay para garantir que o Supabase respondeu
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getDeviceHistory = (deviceId: string) => {
    return data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toLowerCase() === deviceId.trim().toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Nível de Reservatórios</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Sinal em Tempo Real</p>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          {isAdminOrTech && orphanedSensors.length > 0 && (
            <button 
              onClick={() => setShowDiscovery(!showDiscovery)}
              className={`flex-1 md:flex-none px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${showDiscovery ? 'bg-amber-500 text-white' : 'bg-white border text-amber-600 border-amber-200'}`}
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
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Painel de Descoberta de IDs (Apenas para Admin/Téc) */}
      {showDiscovery && isAdminOrTech && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 animate-in zoom-in-95 duration-200">
           <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-amber-500 text-white rounded-xl"><Wifi size={20} /></div>
              <div>
                 <h3 className="text-sm font-black text-amber-900 uppercase">Detector de Sensores</h3>
                 <p className="text-[10px] font-bold text-amber-700 uppercase">Estes IDs estão enviando sinal, mas não estão vinculados a nenhum condomínio.</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orphanedSensors.map(sensor => (
                <div key={sensor.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
                   <div>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">ID do Hardware</span>
                      <p className="text-sm font-black text-slate-900 select-all cursor-pointer" title="Clique para selecionar e copiar">{sensor.condominio_id}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase flex items-center">
                        <Clock size={10} className="mr-1" /> Visto às {new Date(sensor.created_at).toLocaleTimeString()}
                      </p>
                   </div>
                   <div className="text-right">
                      <span className="text-xs font-black text-amber-600">{sensor.percentual}%</span>
                      <div className="text-[8px] font-black text-slate-300 uppercase mt-1">Sinal Ativo</div>
                   </div>
                </div>
              ))}
           </div>
           <p className="mt-4 text-[9px] font-bold text-amber-600 uppercase bg-white/50 p-2 rounded-lg border border-amber-100 italic">
             Dica: Se o ID do seu sensor aparecer acima, copie-o e cole no campo "ID ESP32" do Sistema correspondente.
           </p>
        </div>
      )}

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{entry.condo.name}</h2>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 block">Sensores IoT de Nível</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entry.points.map((point: MonitoringPoint) => {
                const levels = getDeviceHistory(point.device_id);
                const level = levels[0];
                const percent = level ? Math.min(100, Math.max(0, level.percentual)) : 0;

                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:border-blue-400 transition-all group">
                    <div className="p-7">
                      <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">ID: {point.device_id}</span>
                          <h3 className="font-black text-slate-800 text-lg uppercase leading-tight mt-1 truncate">{point.name}</h3>
                        </div>
                        {level && (
                           <div className={`p-2 rounded-xl ${percent < 20 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                             <Activity size={16} className={percent > 0 ? 'animate-pulse' : ''} />
                           </div>
                        )}
                      </div>

                      {level ? (
                        <>
                          <div className="relative h-40 w-full bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner mb-6">
                             <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${percent > 30 ? 'from-blue-600 to-blue-400 shadow-[0_-10px_20px_rgba(59,130,246,0.3)]' : 'from-red-600 to-orange-400 shadow-[0_-10px_20px_rgba(239,68,68,0.3)]'} transition-all duration-1000 z-10`} style={{ height: `${percent}%` }}>
                               <div className="absolute top-0 left-0 w-full h-1 bg-white/30 animate-pulse"></div>
                             </div>
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="bg-white/90 backdrop-blur-xl px-5 py-2 rounded-2xl shadow-xl text-center border border-white">
                                  <span className="block text-3xl font-black text-slate-900 leading-none">{percent}%</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm</span>
                               </div>
                             </div>
                          </div>
                          
                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Situação</span>
                                <span className={`text-[10px] font-black uppercase ${percent < 20 ? 'text-red-600' : 'text-slate-900'}`}>{level.status}</span>
                             </div>
                             <div className="text-right flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Último Sinal</span>
                                <span className="text-[9px] font-bold text-slate-600 flex items-center justify-end mt-0.5">
                                  <Clock size={12} className="mr-1 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                          <div className="p-4 bg-white rounded-2xl shadow-sm">
                            <Cpu size={32} className="text-amber-400 animate-bounce" />
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase px-8 leading-relaxed">
                            Buscando sinal do hardware:<br/>
                            <span className="text-amber-600 font-black">{point.device_id}</span>
                          </p>
                          {isAdminOrTech && (
                            <button 
                              onClick={() => setShowDiscovery(true)}
                              className="text-[8px] font-black text-blue-600 underline uppercase mt-2"
                            >
                              O ID está correto? Verificar sinais
                            </button>
                          )}
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
            <h3 className="text-lg font-black text-slate-900 uppercase">Nenhum Monitoramento Ativo</h3>
            <p className="text-xs font-medium text-slate-500 max-w-xs mt-2">Cadastre um novo sistema do tipo "Sistema de Monitoramento" para começar a visualizar os níveis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
