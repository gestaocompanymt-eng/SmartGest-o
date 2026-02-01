
import React, { useState, useMemo, useEffect } from 'react';
// Import useNavigate to fix navigation error
import { useNavigate } from 'react-router-dom';
import { Droplets, Activity, RefreshCw, Clock, Wifi, ShieldCheck, ChevronRight } from 'lucide-react';
import { AppData, UserRole, WaterLevel as WaterLevelType } from '../types';

const WaterLevel: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  // Initialize navigate hook to handle page transitions
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);

  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

  // Pegar a última leitura de cada condomínio para os cards principais
  const latestLevels = useMemo(() => {
    const levels = data.waterLevels || [];
    const latestMap = new Map<string, WaterLevelType>();
    
    // Como os dados vêm ordenados por created_at desc do App.tsx, a primeira ocorrência é a mais recente
    levels.forEach(level => {
      if (!latestMap.has(level.condominio_id)) {
        latestMap.set(level.condominio_id, level);
      }
    });

    const result = Array.from(latestMap.values());
    return isCondoUser 
      ? result.filter(l => l.condominio_id === user?.condo_id)
      : result;
  }, [data.waterLevels, isCondoUser, user?.condo_id]);

  // Efeito visual de pulsação quando um novo ID chega (Realtime)
  useEffect(() => {
    if (data.waterLevels.length > 0) {
      const currentLatestId = data.waterLevels[0].id;
      if (lastId !== null && currentLatestId !== lastId) {
        // Notificar visualmente ou via console que algo mudou
        console.log("SmartGestão: Nova leitura recebida em Realtime.");
      }
      setLastId(currentLatestId);
    }
  }, [data.waterLevels, lastId]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Simulação de delay para feedback visual
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
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
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitoramento Live via Supabase</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <div className="hidden md:flex items-center bg-white px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              <Wifi size={12} className="mr-2" /> Link IoT Ativo
           </div>
           <button 
            onClick={handleManualRefresh}
            className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw size={20} className={`${isRefreshing ? 'animate-spin' : ''} text-blue-600`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestLevels.map((level) => {
          const condo = data.condos.find(c => c.id === level.condominio_id);
          const percent = Math.min(100, Math.max(0, level.percentual));
          const isPulse = level.id === lastId;
          
          return (
            <div key={level.id} className={`bg-white rounded-[2rem] border-2 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group ${isPulse ? 'border-blue-400' : 'border-slate-100'}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase leading-tight group-hover:text-blue-600 transition-colors">{condo?.name || 'Reservatório Central'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">{condo?.address || 'Localização Não Cadastrada'}</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${getStatusColor(level.status)}`}>
                    <Droplets size={24} />
                  </div>
                </div>

                <div className="relative h-56 w-full bg-slate-50 rounded-3xl overflow-hidden border-4 border-white shadow-inner mb-6">
                   {/* Simulação visual do tanque */}
                   <div className="absolute inset-0 bg-gradient-to-b from-slate-200/20 to-transparent"></div>
                   
                   {/* Água Animada */}
                   <div 
                    className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${getWaterColor(percent)} transition-all duration-1000 ease-in-out`}
                    style={{ height: `${percent}%` }}
                   >
                     {/* Efeito de Reflexo / Vidro */}
                     <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-12 translate-x-10 pointer-events-none"></div>
                     {/* Onda Topo */}
                     <div className="absolute top-0 left-0 w-full h-4 bg-white/20 -translate-y-2 animate-pulse"></div>
                   </div>
                   
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="bg-white/80 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-white/50 text-center transform group-hover:scale-110 transition-transform">
                        <span className="block text-5xl font-black text-slate-900 leading-none">{percent}%</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{level.nivel_cm} cm reais</span>
                     </div>
                   </div>

                   {/* Indicador de Sensor */}
                   <div className="absolute top-4 right-4 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">Live ESP32</span>
                   </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Estado Atual</span>
                      <span className={`text-xs font-black uppercase ${getStatusColor(level.status).split(' ')[0]}`}>{level.status}</span>
                   </div>
                   <div className="text-right flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Sincronizado há</span>
                      <span className="text-[10px] font-bold text-slate-600 flex items-center justify-end">
                        <Clock size={12} className="mr-1 text-blue-500" /> Agora
                      </span>
                   </div>
                </div>
              </div>
            </div>
          );
        })}

        {latestLevels.length === 0 && (
          <div className="col-span-full py-24 bg-white border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-4">
            <div className="bg-blue-50 p-6 rounded-full mb-6">
              <Droplets size={64} className="text-blue-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Aguardando Sinal IoT</h3>
            <p className="text-slate-400 font-bold text-xs tracking-widest max-w-sm">
              Certifique-se que o dispositivo ESP32 está conectado ao Wi-Fi e enviando dados para a tabela <code className="bg-slate-100 px-2 py-1 rounded">nivel_caixa</code>.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Activity size={24} className="text-blue-400" />
              <h4 className="text-sm font-black uppercase tracking-widest">Logs de Telemetria (Supabase)</h4>
            </div>
            <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">SQL LIVE</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {data.waterLevels.slice(0, 10).map((l, i) => {
              const condo = data.condos.find(c=>c.id===l.condominio_id);
              return (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 group hover:bg-white/5 transition-colors p-2 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black">
                      {l.percentual}%
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white leading-none">{condo?.name || 'ID: ' + l.condominio_id}</p>
                      <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Status: {l.status} • {l.nivel_cm}cm</p>
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
              <p className="text-slate-500 text-[10px] font-bold uppercase italic">Ouvindo porta 443 do Supabase para novos pacotes...</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
           <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <ShieldCheck size={24} className="text-emerald-500" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Integridade IoT</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Protocolo de Comunicação</span>
                    <span className="text-xs font-black text-slate-900">REST API / HTTPS</span>
                 </div>
                 <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Segurança de Dados</span>
                    <span className="text-xs font-black text-emerald-600 flex items-center"><ShieldCheck size={14} className="mr-1" /> RLS ACTIVE</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Latência de Nuvem</span>
                    <span className="text-xs font-black text-slate-900">&lt; 150ms</span>
                 </div>
              </div>
           </div>
           
           <button 
            onClick={() => navigate('/admin')}
            className="mt-8 w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center"
           >
             Configurar Thresholds de Alerta <ChevronRight size={14} className="ml-1" />
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
