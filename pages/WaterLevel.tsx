
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  Building2,
  Activity,
  Wifi,
  ChevronRight
} from 'lucide-react';
import { AppData, UserRole, WaterLevel as WaterLevelType, Condo, System, MonitoringPoint } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, updateData, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  // Organiza os dados para exibição baseada nos Sistemas de Monitoramento
  const monitoringData = useMemo(() => {
    const condosMap = new Map();

    // Filtramos sistemas do tipo 'Monitoramento' (ID 7) que tenham pontos cadastrados
    const monitoringSystems = data.systems.filter(s => 
      s.type_id === '7' && 
      (s.monitoring_points || []).length > 0 &&
      (!isCondoUser || s.condo_id === user?.condo_id)
    );

    monitoringSystems.forEach(sys => {
      const condo = data.condos.find(c => c.id === sys.condo_id);
      if (!condo) return;

      if (!condosMap.has(condo.id)) {
        condosMap.set(condo.id, {
          condo,
          points: []
        });
      }

      const entry = condosMap.get(condo.id);
      // Mesclamos os pontos deste sistema à lista do condomínio
      if (sys.monitoring_points) {
        entry.points.push(...sys.monitoring_points);
      }
    });

    return Array.from(condosMap.values());
  }, [data.systems, data.condos, isCondoUser, user?.condo_id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusColor = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('cheio') || s.includes('alto')) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (s.includes('médio')) return 'text-amber-500 bg-amber-50 border-amber-100';
    if (s.includes('baixo') || s.includes('crítico')) return 'text-red-500 bg-red-50 border-red-100';
    return 'text-blue-500 bg-blue-50 border-blue-100';
  };

  const getWaterColor = (percent: number) => {
    if (percent > 70) return 'from-blue-600 to-blue-400';
    if (percent > 30) return 'from-blue-500 to-sky-400';
    return 'from-red-600 to-orange-400';
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Telemetria Integrada</h1>
          <div className="flex items-center mt-1">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitoramento via Sistemas de Automação</p>
          </div>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center space-x-2"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sync Nuvem</span>
        </button>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{entry.condo.name}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                   Configurado via Sistemas de Monitoramento
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entry.points.map((point: MonitoringPoint) => {
                const level = data.waterLevels.find(l => 
                  String(l.condominio_id || '').trim().toLowerCase() === String(point.device_id || '').trim().toLowerCase()
                );
                const percent = level ? Math.min(100, Math.max(0, level.percentual)) : 0;
                
                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-400 transition-all duration-300">
                    <div className="p-7">
                      <div className="flex justify-between items-center mb-6">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">ID: {point.device_id}</span>
                          <h3 className="font-black text-slate-800 text-lg uppercase leading-tight mt-1 truncate">{point.name}</h3>
                        </div>
                        <div className={`p-3.5 rounded-2xl border ${level ? getStatusColor(level.status) : 'bg-slate-50 border-slate-100 text-slate-300 animate-pulse'}`}>
                          <Droplets size={22} />
                        </div>
                      </div>

                      {level ? (
                        <>
                          <div className="relative h-48 w-full bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner mb-6">
                             <div 
                              className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getWaterColor(percent)} transition-all duration-1000 ease-in-out z-10`}
                              style={{ height: `${percent}%` }}
                             >
                               <div className="absolute top-0 left-0 w-full h-4 bg-white/20 -translate-y-2 animate-pulse"></div>
                             </div>
                             
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="bg-white/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-xl border border-white/50 text-center">
                                  <span className="block text-4xl font-black text-slate-900 leading-none">{percent}%</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm</span>
                               </div>
                             </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                <span className={`text-[10px] font-black uppercase ${getStatusColor(level.status).split(' ')[0]}`}>{level.status}</span>
                             </div>
                             <div className="text-right flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Última Leitura</span>
                                <span className="text-[9px] font-bold text-slate-600 flex items-center justify-end mt-0.5">
                                  <Clock size={12} className="mr-1 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                          <Activity size={24} className="text-amber-400 animate-pulse" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4">Aguardando telemetria do dispositivo {point.device_id}</p>
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
            <div className="py-24 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center px-10 shadow-sm">
                <div className="p-8 bg-slate-50 rounded-full mb-6 text-slate-300">
                    <Droplets size={48} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sem Sistemas de Monitoramento</h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm mt-3 leading-relaxed">
                    Cadastre um novo sistema do tipo "Monitoramento" e adicione os IDs das placas ESP32 para visualizar os níveis aqui.
                </p>
                <button 
                  onClick={() => window.location.hash = '#/systems'}
                  className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20"
                >
                  Configurar em Sistemas
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
