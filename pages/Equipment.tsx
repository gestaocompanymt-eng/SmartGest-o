
import React, { useState } from 'react';
import { Plus, Search, Layers, ShieldCheck, Thermometer, Zap, AlertCircle, Sparkles, Trash2, Camera } from 'lucide-react';
import { Equipment, EquipmentType, Condo } from '../types';
import { analyzeEquipmentState } from '../geminiService';

const EquipmentPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});

  const handleGeminiAnalysis = async (eq: Equipment) => {
    setAnalyzingId(eq.id);
    const result = await analyzeEquipmentState(eq);
    setAiAnalysis(prev => ({ ...prev, [eq.id]: result || 'Sem análise' }));
    setAnalyzingId(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEq: Equipment = {
      id: Math.random().toString(36).substr(2, 9),
      condoId: formData.get('condoId') as string,
      typeId: formData.get('typeId') as string,
      manufacturer: formData.get('manufacturer') as string,
      model: formData.get('model') as string,
      power: formData.get('power') as string,
      voltage: formData.get('voltage') as string,
      nominalCurrent: Number(formData.get('nominalCurrent')),
      measuredCurrent: Number(formData.get('measuredCurrent')),
      temperature: Number(formData.get('temperature')),
      noise: formData.get('noise') as any,
      electricalState: formData.get('electricalState') as any,
      location: formData.get('location') as string,
      observations: formData.get('observations') as string,
      photos: [],
      lastMaintenance: new Date().toISOString(),
    };

    updateData({
      ...data,
      equipments: [...data.equipments, newEq]
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipamentos</h1>
          <p className="text-slate-500">Controle técnico e histórico de ativos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Novo Equipamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.equipments.map((eq: Equipment) => {
          const condo = data.condos.find((c: Condo) => c.id === eq.condoId);
          const type = data.equipmentTypes.find((t: EquipmentType) => t.id === eq.typeId);
          
          return (
            <div key={eq.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">
                    {type?.name || 'Tipo'}
                  </span>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    eq.electricalState === 'Bom' ? 'bg-emerald-50 text-emerald-600' :
                    eq.electricalState === 'Regular' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <ShieldCheck size={12} />
                    <span>{eq.electricalState}</span>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{eq.manufacturer} - {eq.model}</h3>
                <p className="text-xs text-slate-500 mb-4 font-medium uppercase">{condo?.name || 'Condomínio não vinculado'}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Corrente</p>
                    <div className="flex items-center text-slate-700">
                      <Zap size={14} className="mr-1 text-blue-500" />
                      <span className="text-sm font-semibold">{eq.measuredCurrent}A</span>
                      <span className="text-[10px] text-slate-400 ml-1">/ {eq.nominalCurrent}A</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Temperatura</p>
                    <div className="flex items-center text-slate-700">
                      <Thermometer size={14} className="mr-1 text-orange-500" />
                      <span className="text-sm font-semibold">{eq.temperature}°C</span>
                    </div>
                  </div>
                </div>

                {aiAnalysis[eq.id] ? (
                  <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mb-4 border border-blue-100 italic relative group">
                    <Sparkles size={12} className="absolute -top-1.5 -right-1.5 text-blue-500 animate-pulse" />
                    {aiAnalysis[eq.id]}
                  </div>
                ) : (
                  <button 
                    disabled={analyzingId === eq.id}
                    onClick={() => handleGeminiAnalysis(eq)}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 mb-4 disabled:opacity-50"
                  >
                    {analyzingId === eq.id ? (
                      <span className="animate-pulse">Analisando...</span>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Análise Técnica Inteligente</span>
                      </>
                    )}
                  </button>
                )}

                <p className="text-xs text-slate-600 line-clamp-2 italic">"{eq.observations}"</p>
              </div>
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase">
                  <AlertCircle size={14} className="mr-1" />
                  Ruído: <span className={eq.noise === 'Normal' ? 'text-emerald-600 ml-1' : 'text-red-500 ml-1'}>{eq.noise}</span>
                </div>
                <button className="text-blue-600 text-xs font-bold hover:underline">DETALHES</button>
              </div>
            </div>
          );
        })}
        {data.equipments.length === 0 && (
          <div className="col-span-full py-20 bg-white border border-dashed rounded-xl flex flex-col items-center">
            <Layers size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500">Nenhum equipamento cadastrado ainda.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Novo Equipamento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <Trash2 size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Condomínio</label>
                  <select required name="condoId" className="w-full p-2 border border-slate-200 rounded-lg">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Tipo</label>
                  <select required name="typeId" className="w-full p-2 border border-slate-200 rounded-lg">
                    <option value="">Selecione...</option>
                    {data.equipmentTypes.map((t: EquipmentType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Fabricante</label>
                  <input required name="manufacturer" className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Modelo</label>
                  <input required name="model" className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Potência</label>
                  <input required name="power" placeholder="Ex: 5CV" className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Tensão</label>
                  <input required name="voltage" placeholder="220V" className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Corr. Nom. (A)</label>
                  <input required type="number" step="0.1" name="nominalCurrent" className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Corr. Med. (A)</label>
                  <input required type="number" step="0.1" name="measuredCurrent" className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Temp. Trabalho (°C)</label>
                  <input required type="number" name="temperature" className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Ruído</label>
                  <select required name="noise" className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                    <option value="Normal">Normal</option>
                    <option value="Anormal">Anormal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Estado Elétrico</label>
                  <select required name="electricalState" className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                    <option value="Bom">Bom</option>
                    <option value="Regular">Regular</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Localização / Observações</label>
                <textarea name="observations" rows={3} className="w-full p-2 border border-slate-200 rounded-lg"></textarea>
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600">CANCELAR</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">SALVAR EQUIPAMENTO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
