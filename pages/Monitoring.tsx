
import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Zap, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  ChevronRight, 
  RefreshCcw, 
  Filter, 
  ExternalLink,
  Plus,
  BrainCircuit,
  X,
  Sparkles
} from 'lucide-react';
import { AppData, Equipment, UserRole, MonitoringAlert } from '../types';
import { useNavigate } from 'react-router-dom';
import { diagnoseMonitoringAlert } from '../geminiService';

const Monitoring: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertAnalyses, setAlertAnalyses] = useState<Record<string, { text: string; loading: boolean }>>({});

  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.SINDICO_ADMIN;

  const monitoredEquipments = useMemo(() => {
    return data.equipments.filter(eq => {
      const matchTuya = !!eq.tuya_device_id;
      const matchCondo = isCondoUser ? eq.condo_id === user?.condo_id : (selectedCondoId === 'all' || eq.condo_id === selectedCondoId);
      return matchTuya && matchCondo;
    });
  }, [data.equipments, selectedCondoId, isCondoUser, user?.condo_id]);

  const activeAlerts = useMemo(() => {
    return data.monitoringAlerts.filter(a => !a.is_resolved && monitoredEquipments.some(eq => eq.id === a.equipment_id));
  }, [data.monitoringAlerts, monitoredEquipments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleAnalyzeAlert = async (alert: MonitoringAlert) => {
    const eq = data.equipments.find(e => e.id === alert.equipment_id);
    if (!eq) return;

    setAlertAnalyses(prev => ({ ...prev, [alert.id]: { text: '', loading: true } }));
    
    const result = await diagnoseMonitoringAlert(alert, eq);
    
    setAlertAnalyses(prev => ({ 
      ...prev, 
      [alert.id]: { text: result || 'Análise inconclusiva.', loading: false } 
    }));
  };

  const handleCreateOSFromAlert = (alert: MonitoringAlert) => {
    const eq = data.equipments.find(e => e.id === alert.equipment_id);
    if (!eq) return;
    navigate(`/os?equipmentId=${eq.id}&description=${encodeURIComponent(`ALERTA TUYA: ${alert.message} (Valor: ${alert.value})`)}`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Monitoramento Tuya Cloud</h1>
          <p className="text-sm text-slate-500 font-medium italic">Telemetria de ativos em tempo real.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {!isCondoUser && (
            <select 
              value={selectedCondoId} 
              onChange={(e) => setSelectedCondoId(e.target.value)}
              className="px-4 py-2 bg-white border rounded-xl text-xs font-bold outline-none flex-1 md:flex-none"
            >
              <option value="all">Todos Condomínios</option>
              {data.condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {/* Fix: Changed RefreshCw to RefreshCcw to match imported icon name */}
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alertas Ativos */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center">
            <AlertCircle size={14} className="mr-2" /> Alertas Críticos de Telemetria
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map(alert => {
              const eq = data.equipments.find(e => e.id === alert.equipment_id);
              const analysis = alertAnalyses[alert.id];

              return (
                <div key={alert.id} className="group relative">
                  <div className="bg-white border-l-4 border-red-500 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{eq?.manufacturer} {eq?.model}</p>
                        <p className="text-sm font-black text-slate-900 truncate mt-0.5">{alert.message}</p>
                        <div className="flex items-center space-x-2 mt-2">
                           <span className="text-[10px] bg-red-50 text-red-600 font-black px-2 py-0.5 rounded uppercase">Valor: {alert.value}</span>
                           <span className="text-[8px] text-slate-400 font-bold">{new Date(alert.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-1 shrink-0">
                        <button 
                          onClick={() => handleAnalyzeAlert(alert)}
                          className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                            analysis ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Análise IA Master"
                        >
                          {/* Fix: Changed RefreshCw to RefreshCcw to match imported icon name */}
                          {analysis?.loading ? <RefreshCcw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                        </button>
                        <button 
                          onClick={() => handleCreateOSFromAlert(alert)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          title="Gerar OS Corretiva"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Diagnóstico IA Exibido abaixo do alerta se carregado */}
                    {analysis && !analysis.loading && (
                      <div className="bg-slate-900 rounded-xl p-4 text-white animate-in slide-in-from-top-2 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Sparkles size={40} className="text-blue-400" />
                        </div>
                        <div className="flex justify-between items-start mb-2 relative z-10">
                           <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Diagnóstico Inteligente SmartGestão</span>
                           <button onClick={() => setAlertAnalyses(prev => {
                             const n = {...prev};
                             delete n[alert.id];
                             return n;
                           })} className="text-white/40 hover:text-white"><X size={12} /></button>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed text-blue-50 relative z-10 italic">
                          "{analysis.text}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de Dispositivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {monitoredEquipments.map((eq) => {
          const condo = data.condos.find(c => c.id === eq.condo_id);
          const isCritical = eq.monitoring_status === 'critico';
          
          return (
            <div key={eq.id} className={`bg-white rounded-[2.5rem] border-2 transition-all overflow-hidden ${isCritical ? 'border-red-500 shadow-xl shadow-red-500/10' : 'border-slate-100 shadow-sm'}`}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-2xl ${eq.is_online ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                    {eq.is_online ? <Wifi size={20} /> : <WifiOff size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{condo?.name}</p>
                    <p className="text-sm font-black text-slate-900 truncate">{eq.manufacturer} {eq.model}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  eq.monitoring_status === 'normal' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                  eq.monitoring_status === 'atencao' ? 'bg-amber-500' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                } animate-pulse`}></div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 transition-all hover:bg-white hover:shadow-inner">
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Consumo Real</p>
                    <div className="flex items-end space-x-1">
                      <Zap size={16} className="text-blue-600 mb-1" />
                      <span className="text-2xl font-black text-slate-900 leading-none">{eq.last_reading?.power || 0}</span>
                      <span className="text-[10px] text-slate-400 font-bold mb-0.5">W</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-inner">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Amperagem</p>
                    <div className="flex items-end space-x-1">
                      <Activity size={16} className="text-slate-400 mb-1" />
                      <span className="text-2xl font-black text-slate-900 leading-none">{eq.last_reading?.current || 0}</span>
                      <span className="text-[10px] text-slate-400 font-bold mb-0.5">A</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between p-4 bg-slate-900 rounded-[1.5rem] shadow-xl">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Tensão Rede</span>
                      <span className="text-xs font-black text-white">{eq.last_reading?.voltage || 0}V</span>
                   </div>
                   <div className="text-right flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Feed</span>
                      <span className="text-[9px] font-bold text-white/40">
                        {eq.last_reading ? new Date(eq.last_reading.timestamp).toLocaleTimeString() : '---'}
                      </span>
                   </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-between items-center bg-slate-50/20">
                 <button className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-800 flex items-center transition-colors">
                   Análise Histórica <ChevronRight size={14} className="ml-1" />
                 </button>
                 <button onClick={() => navigate('/equipment')} className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center hover:text-slate-600 transition-colors">
                   Config <ExternalLink size={12} className="ml-1.5" />
                 </button>
              </div>
            </div>
          );
        })}

        {monitoredEquipments.length === 0 && (
          <div className="col-span-full py-24 bg-white border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40">
            <Activity size={64} className="text-slate-200 mb-6" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Rede Tuya Offline</p>
            <p className="text-slate-400 text-[10px] mt-2 font-bold max-w-xs mx-auto">Vincule o ID do dispositivo no cadastro do ativo para ativar a telemetria preditiva.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;
