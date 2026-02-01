
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Droplets, 
  Activity, 
  RefreshCw, 
  Clock, 
  Wifi, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { AppData, UserRole, WaterLevel as WaterLevelType } from '../types';

interface WaterLevelProps {
  data: AppData;
  updateData: (d: AppData) => void;
  onRefresh?: () => Promise<void>;
}

const WaterLevel: React.FC<WaterLevelProps> = ({ data, updateData, onRefresh }) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  // Filtra as leituras para o gráfico (últimas 24 horas ou últimas 50 leituras)
  const chartData = useMemo(() => {
    const levels = [...(data.waterLevels || [])].reverse(); // Ordem cronológica para o gráfico
    const filtered = isCondoUser 
      ? levels.filter(l => String(l.condominio_id) === String(user?.condo_id))
      : levels;
    
    return filtered.map(l => ({
      hora: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      nivel: l.percentual,
      cm: l.nivel_cm,
      fullDate: new Date(l.created_at).toLocaleString()
    }));
  }, [data.waterLevels, isCondoUser, user?.condo_id]);

  // Pega a última leitura de cada condomínio para os cards principais
  const latestLevels = useMemo(() => {
    const levels = data.waterLevels || [];
    const latestMap = new Map<string, WaterLevelType>();
    
    levels.forEach(level => {
      if (!latestMap.has(level.condominio_id)) {
        latestMap.set(level.condominio_id, level);
      }
    });

    const result = Array.from(latestMap.values());
    return isCondoUser 
      ? result.filter(l => String(l.condominio_id) === String(user?.condo_id))
      : result;
  }, [data.waterLevels, isCondoUser, user?.condo_id]);

  useEffect(() => {
    if (data.waterLevels.length > 0) {
      const currentLatestId = data.waterLevels[0].id;
      if (lastId !== null && currentLatestId !== lastId) {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 3000);
      }
      setLastId(currentLatestId);
    }
  }, [data.waterLevels, lastId]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusColor = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('cheio')) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (s.includes('médio')) return 'text-amber-500 bg-amber-50 border-amber-100';
    if (s.includes('baixo')) return 'text-red-500 bg-red-50 border-red-100';
    return 'text-blue-500 bg-blue-50 border-blue-100';
  };

  const getWaterColor = (percent: number) => {
    if (percent > 70) return 'from-blue-600 to-blue-400';
    if (percent > 30) return 'from-blue-500 to-sky-400';
    return 'from-red-600 to-orange-400';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Gestão de Reservatórios</h1>
          <div className="flex items-center mt-1">
            <span className={`flex h-2 w-2 rounded-full ${justUpdated ? 'bg-blue-500 scale-150' : 'bg-emerald-500'} animate-pulse mr-2 transition-all`}></span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {justUpdated ? 'Nova Leitura Recebida' : 'Monitoramento em Tempo Real'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
           <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex-1 md:flex-none p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw size={20} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
              <span className="md:hidden text-[10px] font-black uppercase tracking-widest text-slate-600">Sincronizar</span>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestLevels.map((level) => {
          const condo = data.condos.find(c => String(c.id) === String(level.condominio_id));
          const percent = Math.min(100, Math.max(0, level.percentual));
          const isPulse = level.id === lastId && justUpdated;
          
          return (
            <div key={level.id} className={`bg-white rounded-[2rem] border-2 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group ${isPulse ? 'border-blue-400 shadow-blue-100' : 'border-slate-100'}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase leading-tight group-hover:text-blue-600 transition-colors">{condo?.name || 'Reservatório Principal'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">{condo?.address || 'Condomínio Cliente'}</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${getStatusColor(level.status)}`}>
                    <Droplets size={24} />
                  </div>
                </div>

                <div className="relative h-56 w-full bg-slate-50 rounded-3xl overflow-hidden border-4 border-white shadow-inner mb-6">
                   <div className="absolute inset-0 bg-gradient-to-b from-slate-200/20 to-transparent"></div>
                   <div 
                    className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getWaterColor(percent)} transition-all duration-1000 ease-in-out`}
                    style={{ height: `${percent}%` }}
                   >
                     <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-12 translate-x-10 pointer-events-none"></div>
                     <div className="absolute top-0 left-0 w-full h-4 bg-white/20 -translate-y-2 animate-pulse"></div>
                   </div>
                   
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="bg-white/80 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-white/50 text-center transform group-hover:scale-110 transition-transform">
                        <span className="block text-5xl font-black text-slate-900 leading-none">{percent}%</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm</span>
                     </div>
                   </div>
                   <div className="absolute top-4 right-4 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Live IoT</span>
                   </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Estado Atual</span>
                      <span className={`text-xs font-black uppercase ${getStatusColor(level.status).split(' ')[0]}`}>{level.status}</span>
                   </div>
                   <div className="text-right flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Sincronismo</span>
                      <span className="text-[10px] font-bold text-slate-600 flex items-center justify-end">
                        <Clock size={12} className="mr-1 text-blue-500" /> {new Date(level.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico de Tendência */}
      {chartData.length > 2 && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <TrendingUp size={24} className="text-blue-600" />
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tendência de Nível (Histórico)</h4>
            </div>
            <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Últimas {chartData.length} Leituras
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorNivel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hora" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="nivel" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorNivel)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Activity size={24} className="text-blue-400" />
              <h4 className="text-sm font-black uppercase tracking-widest">Logs de Telemetria</h4>
            </div>
            <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-tighter">HTTPS Secured</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {data.waterLevels.slice(0, 15).map((l, i) => {
              const condo = data.condos.find(c => String(c.id) === String(l.condominio_id));
              return (
                <div key={l.id || i} className="flex items-center justify-between border-b border-white/5 pb-3 group hover:bg-white/5 transition-colors p-2 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-blue-400">
                      {l.percentual}%
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white leading-none">{condo?.name || 'Cliente Externo'}</p>
                      <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">{l.status} • {l.nivel_cm}cm</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-blue-400 uppercase">{new Date(l.created_at).toLocaleTimeString()}</p>
                    <p className="text-[7px] text-slate-600 font-bold uppercase">{new Date(l.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
            {data.waterLevels.length === 0 && (
              <p className="text-slate-500 text-[10px] font-bold uppercase italic text-center py-8">Aguardando dados de telemetria...</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
           <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <ShieldCheck size={24} className="text-emerald-500" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Status da Conexão</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Segurança (RLS)</span>
                    <span className="text-xs font-black text-emerald-600 flex items-center"><ShieldCheck size={14} className="mr-1" /> ATIVA</span>
                 </div>
                 <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tempo Real</span>
                    <span className="text-xs font-black text-blue-600">HABILITADO</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Endpoint Supabase</span>
                    <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-1 rounded uppercase tracking-tighter truncate max-w-[150px]">rlldyyipyapkehtxwvqk</span>
                 </div>
              </div>
           </div>
           
           <button 
            onClick={() => navigate('/admin')}
            className="mt-8 w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center"
           >
             Gerenciar Thresholds de Alerta <ChevronRight size={14} className="ml-1" />
           </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default WaterLevel;
