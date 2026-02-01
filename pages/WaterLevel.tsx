
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
  Minus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AppData, UserRole, MonitoringPoint } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void; onRefresh?: () => Promise<void> }> = ({ data, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyDeviceId, setHistoryDeviceId] = useState<string | null>(null);
  
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

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
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getDeviceHistory = (deviceId: string) => {
    return data.waterLevels
      .filter(l => String(l.condominio_id || '').trim().toLowerCase() === deviceId.trim().toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Nível de Reservatórios</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Sinal em Tempo Real</p>
        </div>
        <button 
          onClick={handleManualRefresh}
          className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center space-x-2"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sync</span>
        </button>
      </div>

      <div className="space-y-12">
        {monitoringData.map((entry) => (
          <div key={entry.condo.id} className="space-y-6">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-3 bg-slate-900 text-white rounded-2xl">
                <Building2 size={22} />
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{entry.condo.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entry.points.map((point: MonitoringPoint) => {
                const levels = getDeviceHistory(point.device_id);
                const level = levels[0];
                const percent = level ? Math.min(100, Math.max(0, level.percentual)) : 0;

                return (
                  <div key={point.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:border-blue-400 transition-all">
                    <div className="p-7">
                      <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">ID: {point.device_id}</span>
                          <h3 className="font-black text-slate-800 text-lg uppercase leading-tight mt-1 truncate">{point.name}</h3>
                        </div>
                      </div>

                      {level ? (
                        <>
                          <div className="relative h-40 w-full bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner mb-6">
                             <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${percent > 30 ? 'from-blue-600 to-blue-400' : 'from-red-600 to-orange-400'} transition-all duration-1000 z-10`} style={{ height: `${percent}%` }}></div>
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="bg-white/90 backdrop-blur-xl px-5 py-2 rounded-2xl shadow-xl text-center">
                                  <span className="block text-3xl font-black text-slate-900 leading-none">{percent}%</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm</span>
                               </div>
                             </div>
                          </div>
                          
                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Situação</span>
                                <span className="text-[10px] font-black uppercase text-slate-900">{level.status}</span>
                             </div>
                             <div className="text-right flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leitura</span>
                                <span className="text-[9px] font-bold text-slate-600 flex items-center justify-end mt-0.5">
                                  <Clock size={12} className="mr-1 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                          <Activity size={32} className="text-amber-400 animate-pulse" />
                          <p className="text-[9px] font-black text-slate-400 uppercase px-8">Aguardando sinal: {point.device_id}</p>
                        </div>
                      )}
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
