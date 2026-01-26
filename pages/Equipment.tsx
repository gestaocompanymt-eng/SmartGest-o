
import React, { useState } from 'react';
import { Plus, Search, Layers, ShieldCheck, Thermometer, Zap, AlertCircle, Sparkles, Trash2, Edit2, X, Camera, MapPin, Activity } from 'lucide-react';
import { Equipment, EquipmentType, Condo, UserRole } from '../types';
import { analyzeEquipmentState } from '../geminiService';

const EquipmentPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});

  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isTech = user?.role === UserRole.TECHNICIAN;
  const isCondo = user?.role === UserRole.CONDO_USER;

  const filteredEquipments = isCondo
    ? data.equipments.filter((e: Equipment) => e.condo_id === user?.condo_id)
    : data.equipments;

  const handleGeminiAnalysis = async (eq: Equipment) => {
    setAnalyzingId(eq.id);
    const result = await analyzeEquipmentState(eq);
    setAiAnalysis(prev => ({ ...prev, [eq.id]: result || 'Sem análise disponível.' }));
    setAnalyzingId(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const eqData: Equipment = {
      id: editingEq?.id || Math.random().toString(36).substr(2, 9),
      condo_id: formData.get('condoId') as string,
      type_id: formData.get('typeId') as string,
      manufacturer: formData.get('manufacturer') as string,
      model: formData.get('model') as string,
      power: formData.get('power') as string,
      voltage: formData.get('voltage') as string,
      nominal_current: Number(formData.get('nominalCurrent')),
      measured_current: Number(formData.get('measuredCurrent')),
      temperature: Number(formData.get('temperature')),
      noise: formData.get('noise') as any,
      electrical_state: formData.get('electricalState') as any,
      location: formData.get('location') as string,
      observations: formData.get('observations') as string,
      tuya_device_id: formData.get('tuya_device_id') as string || undefined,
      photos: editingEq?.photos || [],
      last_maintenance: editingEq?.last_maintenance || new Date().toISOString(),
      monitoring_status: editingEq?.monitoring_status || 'normal',
      is_online: editingEq?.is_online ?? true
    };

    if (editingEq) {
      updateData({
        ...data,
        equipments: data.equipments.map((e: Equipment) => e.id === editingEq.id ? eqData : e)
      });
    } else {
      updateData({
        ...data,
        equipments: [...data.equipments, eqData]
      });
    }
    
    setIsModalOpen(false);
    setEditingEq(null);
  };

  const deleteEquipment = (id: string) => {
    if (confirm('Excluir este equipamento permanentemente?')) {
      updateData({
        ...data,
        equipments: data.equipments.filter((e: Equipment) => e.id !== id)
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Equipamentos</h1>
          <p className="text-sm text-slate-500">{isCondo ? 'Inventário técnico do seu condomínio.' : 'Monitoramento técnico e inventário de ativos.'}</p>
        </div>
        {(isAdmin || isTech) && (
          <button 
            onClick={() => { setEditingEq(null); setIsModalOpen(true); }}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-4 md:py-2 rounded-xl flex items-center justify-center space-x-2 font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="uppercase text-xs tracking-widest">Cadastrar Ativo</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredEquipments.map((eq: Equipment) => {
          const condo = data.condos.find((c: Condo) => c.id === eq.condo_id);
          const type = data.equipmentTypes.find((t: EquipmentType) => t.id === eq.type_id);
          
          return (
            <div key={eq.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-400 transition-all">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md">
                      {type?.name || 'Inespecífico'}
                    </span>
                    {eq.tuya_device_id && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center">
                        <Activity size={10} className="mr-1" /> Tuya Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      eq.electrical_state === 'Bom' ? 'bg-emerald-50 text-emerald-600' :
                      eq.electrical_state === 'Regular' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <ShieldCheck size={12} />
                      <span>{eq.electrical_state}</span>
                    </div>
                    {(isAdmin || isTech) && (
                      <div className="flex md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingEq(eq); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 active:bg-blue-50 rounded-lg">
                           <Edit2 size={16} />
                         </button>
                         <button onClick={() => deleteEquipment(eq.id)} className="p-2 text-slate-400 hover:text-red-600 active:bg-red-50 rounded-lg">
                           <Trash2 size={16} />
                         </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{eq.manufacturer}</h3>
                <p className="text-xs font-medium text-slate-600 mb-1">{eq.model}</p>
                <div className="flex flex-col mb-4">
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest truncate">{condo?.name || 'SEM CONDOMÍNIO'}</p>
                  <p className="text-[9px] text-slate-400 font-bold flex items-center mt-1"><MapPin size={10} className="mr-1" /> {eq.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1">Medição</p>
                    <div className="flex items-center text-slate-800">
                      <Zap size={14} className="mr-1.5 text-blue-500" />
                      <span className="text-sm font-black">{eq.measured_current}</span>
                      <span className="text-[10px] text-slate-400 ml-1 font-bold">/ {eq.nominal_current}A</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1">Status Térmico</p>
                    <div className="flex items-center text-slate-800">
                      <Thermometer size={14} className="mr-1.5 text-orange-500" />
                      <span className="text-sm font-black">{eq.temperature}°C</span>
                    </div>
                  </div>
                </div>

                {aiAnalysis[eq.id] ? (
                  <div className="bg-blue-600 p-4 rounded-xl text-[11px] text-white mb-4 shadow-lg shadow-blue-500/20 leading-relaxed italic relative">
                    <Sparkles size={12} className="absolute top-2 right-2 text-blue-200 animate-pulse" />
                    {aiAnalysis[eq.id]}
                  </div>
                ) : (
                  <button 
                    disabled={analyzingId === eq.id}
                    onClick={() => handleGeminiAnalysis(eq)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center space-x-2 mb-4 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {analyzingId === eq.id ? (
                      <span className="animate-pulse">PROCESSANDO DADOS TÉCNICOS...</span>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-blue-400" />
                        <span>Diagnóstico Inteligente IA</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="bg-slate-50/80 px-5 py-3.5 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center text-[9px] font-black uppercase tracking-widest">
                  <AlertCircle size={14} className="mr-1.5 text-slate-400" />
                  Ruído: <span className={eq.noise === 'Normal' ? 'text-emerald-600 ml-1' : 'text-red-500 ml-1'}>{eq.noise}</span>
                </div>
                <button className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-widest">Histórico</button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white md:rounded-2xl w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingEq ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingEq(null); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6 overflow-y-auto flex-1 scroll-touch">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condomínio Vinculado</label>
                  <select required name="condoId" defaultValue={editingEq?.condo_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                    <option value="">Selecione um cliente...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria do Ativo</label>
                  <select required name="typeId" defaultValue={editingEq?.type_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                    {data.equipmentTypes.map((t: EquipmentType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fabricante</label>
                  <input required name="manufacturer" defaultValue={editingEq?.manufacturer} placeholder="Ex: WEG, Schneider" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modelo / Identificação</label>
                  <input required name="model" defaultValue={editingEq?.model} placeholder="Ex: W22 High Efficiency" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" />
                </div>
              </div>

              {/* Seção Tuya Monitoring */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                 <div className="flex items-center space-x-2 text-blue-600 mb-1">
                   <Activity size={16} />
                   <h3 className="text-[10px] font-black uppercase tracking-widest">Monitoramento Cloud (Opcional)</h3>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tuya Device ID</label>
                   <input 
                    name="tuya_device_id" 
                    defaultValue={editingEq?.tuya_device_id} 
                    placeholder="Cole aqui o ID do dispositivo Tuya" 
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none font-medium text-blue-900" 
                   />
                   <p className="text-[8px] text-slate-400 italic">Deixe vazio se o equipamento não possuir telemetria.</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Potência</label>
                  <input required name="power" defaultValue={editingEq?.power} placeholder="Ex: 5CV" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tensão</label>
                  <input required name="voltage" defaultValue={editingEq?.voltage} placeholder="220V/380V" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Corr. Nom.</label>
                  <input required type="number" step="0.1" name="nominalCurrent" defaultValue={editingEq?.nominal_current} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Corr. Med.</label>
                  <input required type="number" step="0.1" name="measuredCurrent" defaultValue={editingEq?.measured_current} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização (Onde se encontra?)</label>
                <input required name="location" defaultValue={editingEq?.location} placeholder="Ex: Casa de Máquinas Térreo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
              </div>

              <div className="pt-6 flex flex-col-reverse md:flex-row gap-4 shrink-0">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingEq(null); }} className="w-full px-6 py-4 border-2 border-slate-100 text-slate-500 font-black rounded-xl uppercase text-xs">Descartar</button>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                  {editingEq ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
