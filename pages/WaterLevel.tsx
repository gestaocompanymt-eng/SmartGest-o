
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  Building2,
  ChevronRight
} from 'lucide-react';
import { AppData, UserRole, WaterLevel as WaterLevelType, Condo, MonitoringPoint } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, updateData, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  // Filtramos os condomínios que têm pontos de monitoramento
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status de todos os pontos ativos</p>
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
          <div key={condo.id} className="space-y-4">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{condo.name}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{condo.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {condo.monitoring_points.map((point) => {
                // Buscamos a última leitura para este ID de dispositivo específico
                const level = data.waterLevels.find(l => String(l.condominio_id) === String(point.device_id));
                const percent = level ? Math.min(100, Math.max(0, level.percentual)) : 0;
                
                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-400 transition-all duration-300">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Local</p>
                          <h3 className="font-black text-slate-800 text-base uppercase leading-tight">{point.name}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl border ${level ? getStatusColor(level.status) : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                          <Droplets size={20} />
                        </div>
                      </div>

                      {level ? (
                        <>
                          <div className="relative h-48 w-full bg-slate-50 rounded-3xl overflow-hidden border-4 border-white shadow-inner mb-6">
                             <div 
                              className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getWaterColor(percent)} transition-all duration-1000 ease-in-out`}
                              style={{ height: `${percent}%` }}
                             >
                               <div className="absolute top-0 left-0 w-full h-4 bg-white/20 -translate-y-2 animate-pulse"></div>
                             </div>
                             
                             <div className="absolute inset-0 flex items-center justify-center">
                               <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border border-white/50 text-center">
                                  <span className="block text-4xl font-black text-slate-900 leading-none">{percent}%</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm</span>
                               </div>
                             </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Status</span>
                                <span className={`text-[10px] font-black uppercase ${getStatusColor(level.status).split(' ')[0]}`}>{level.status}</span>
                             </div>
                             <div className="text-right flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Última Atualização</span>
                                <span className="text-[10px] font-bold text-slate-600 flex items-center justify-end">
                                  <Clock size={10} className="mr-1 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-3xl border border-dashed">
                          <AlertTriangle size={32} className="text-amber-400" />
                          <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase">Sem Dados Recentes</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 px-4">Aguardando telemetria do ID: {point.device_id}</p>
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
            <div className="py-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center px-6">
                <div className="p-6 bg-slate-50 rounded-full mb-4 text-slate-300">
                    <Droplets size={48} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Nenhum Ponto Configurado</h3>
                <p className="text-xs text-slate-500 font-medium max-w-xs mt-2">
                    Cadastre os IDs dos reservatórios (ESP32) na página de Condomínios para começar a monitorar.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default WaterLevel;
