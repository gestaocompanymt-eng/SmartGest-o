
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
  Plus
} from 'lucide-react';
import { AppData, Equipment, UserRole, Condo, MonitoringAlert, OSType } from '../types';
import { useNavigate } from 'react-router-dom';

const Monitoring: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;

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
    // Simular chamada ao Supabase Edge Function que conecta na Tuya
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.map(alert => {
              const eq = data.equipments.find(e => e.id === alert.equipment_id);
              return (
                <div key={alert.id} className="bg-white border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-center justify-between animate-in slide-in-from-left">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase">{eq?.manufacturer} {eq?.model}</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{alert.message}</p>
                    <p className="text-[10px] text-red-600 font-black uppercase mt-1">Lido: {alert.value}</p>
                  </div>
                  <button 
                    onClick={() => handleCreateOSFromAlert(alert)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Abrir OS Corretiva"
                  >
                    <Plus size={18} />
                  </button>
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
            <div key={eq.id} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${isCritical ? 'border-red-500 shadow-red-100' : 'border-slate-100'}`}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${eq.is_online ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    {eq.is_online ? <Wifi size={18} /> : <WifiOff size={18} />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{condo?.name}</p>
                    <p className="text-sm font-black text-slate-900">{eq.manufacturer} {eq.model}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  eq.monitoring_status === 'normal' ? 'bg-emerald-500' :
                  eq.monitoring_status === 'atencao' ? 'bg-amber-500' : 'bg-red-500'
                } animate-pulse`}></div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.1em] mb-1">Consumo Atual</p>
                    <div className="flex items-end space-x-1">
                      <Zap size={14} className="text-blue-600 mb-1" />
                      <span className="text-xl font-black text-slate-900">{eq.last_reading?.power || 0}</span>
                      <span className="text-[10px] text-slate-400 font-bold mb-1">W</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Corrente (Tuya)</p>
                    <div className="flex items-end space-x-1">
                      <Activity size={14} className="text-slate-400 mb-1" />
                      <span className="text-xl font-black text-slate-900">{eq.last_reading?.current || 0}</span>
                      <span className="text-[10px] text-slate-400 font-bold mb-1">A</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-blue-400 uppercase">Tensão Rede</span>
                      <span className="text-xs font-black text-white">{eq.last_reading?.voltage || 0}V</span>
                   </div>
                   <div className="text-right flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Última Atualização</span>
                      <span className="text-[9px] font-bold text-white/60">
                        {eq.last_reading ? new Date(eq.last_reading.timestamp).toLocaleTimeString() : '---'}
                      </span>
                   </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t flex justify-between items-center">
                 <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center">
                   Ver Gráficos <ChevronRight size={12} className="ml-1" />
                 </button>
                 <button onClick={() => navigate('/equipment')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                   Dados Cadastrais <ExternalLink size={12} className="ml-1" />
                 </button>
              </div>
            </div>
          );
        })}

        {monitoredEquipments.length === 0 && (
          <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center">
            <Activity size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum equipamento monitorado via Tuya.</p>
            <p className="text-slate-400 text-[10px] mt-2 italic">Configure o ID do Dispositivo no cadastro do ativo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;
