
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  Building2,
  ChevronRight,
  Activity,
  Wifi
} from 'lucide-react';
import { AppData, UserRole, WaterLevel as WaterLevelType, Condo, MonitoringPoint } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, updateData, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  // Filtramos os condomínios que têm pontos de monitoramento configurados
  const condosWithTelemetry = useMemo(() => {
    let baseCondos = data.condos.filter(c => (c.monitoring_points || []).length > 0);
    if (isCondoUser) {
      baseCondos = baseCondos.filter(c => c.id === user?.condo_id);
    }
    return baseCondos;
  }, [data.condos, isCondoUser, user?.condo_id]);

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
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Telemetria de Reservatórios</h1>
          <div className="flex items-center mt-1">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitoramento Multi-Ponto em Tempo Real</p>
          </div>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sincronizar</span>
        </button>
      </div>

      <div className="space-y-12">
        {condosWithTelemetry.map((condo) => (
          <div key={condo.id} className="space-y-5 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{condo.name}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center italic">
                   Localizado em: {condo.address}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {condo.monitoring_points.map((point) => {
                // Buscamos a última leitura comparando de forma robusta (trim e lowercase)
                const level = data.waterLevels.find(l => 
                  String(l.condominio_id || '').trim().toLowerCase() === String(point.device_id || '').trim().toLowerCase()
                );
                
                const percent = level ? Math.min(100, Math.max(0, level.percentual)) : 0;
                
                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-400 hover:shadow-xl transition-all duration-300">
                    <div className="p-7">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">ID: {point.device_id}</span>
                          </div>
                          <h3 className="font-black text-slate-800 text-lg uppercase leading-tight group-hover:text-blue-600 transition-colors">{point.name}</h3>
                        </div>
                        <div className={`p-3.5 rounded-2xl border ${level ? getStatusColor(level.status) : 'bg-slate-50 border-slate-100 text-slate-300 animate-pulse'}`}>
                          <Droplets size={22} />
                        </div>
                      </div>

                      {level ? (
                        <>
                          <div className="relative h-52 w-full bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner mb-6">
                             <div className="absolute inset-0 bg-gradient-to-b from-slate-200/20 to-transparent z-0"></div>
                             <div 
                              className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getWaterColor(percent)} transition-all duration-1000 ease-in-out z-10`}
                              style={{ height: `${percent}%` }}
                             >
                               <div className="absolute top-0 left-0 w-full h-5 bg-white/20 -translate-y-2 animate-pulse"></div>
                               <div className="absolute inset-0 bg-white/5 skew-x-12 translate-x-10"></div>
                             </div>
                             
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="bg-white/80 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-white/50 text-center transform group-hover:scale-110 transition-transform">
                                  <span className="block text-5xl font-black text-slate-900 leading-none">{percent}%</span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 block">{level.nivel_cm} cm</span>
                               </div>
                             </div>

                             <div className="absolute top-4 right-4 flex items-center space-x-1.5 z-30">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Transmissão OK</span>
                             </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                             <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</span>
                                <span className={`text-[11px] font-black uppercase ${getStatusColor(level.status).split(' ')[0]}`}>{level.status}</span>
                             </div>
                             <div className="text-right flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronismo</span>
                                <span className="text-[10px] font-bold text-slate-600 flex items-center justify-end mt-0.5">
                                  <Clock size={12} className="mr-1.5 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 group-hover:border-blue-200 transition-colors">
                          <div className="p-4 bg-white rounded-full shadow-sm">
                            <Activity size={32} className="text-amber-400 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Aguardando Conexão</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 px-8 leading-relaxed italic">
                              Dispositivo {point.device_id} não detectado. Verifique se o ESP32 está online.
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 px-3 py-1 bg-white rounded-full border border-slate-100">
                             <Wifi size={10} className="text-slate-300" />
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">OFFLINE</span>
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

        {condosWithTelemetry.length === 0 && (
            <div className="py-24 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center px-10 shadow-sm animate-in zoom-in-95">
                <div className="p-8 bg-slate-50 rounded-full mb-6 text-slate-300 shadow-inner">
                    <Droplets size={56} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhuma Telemetria Ativa</h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm mt-3 leading-relaxed">
                    Você ainda não cadastrou os IDs dos reservatórios (ESP32) nos condomínios. 
                </p>
                <div className="mt-8 flex gap-3">
                   <button 
                    onClick={() => window.location.hash = '#/condos'}
                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                   >
                     Configurar Agora
                   </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
