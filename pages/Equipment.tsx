
import React, { useState } from 'react';
import { Plus, Layers, ShieldCheck, Thermometer, Zap, AlertCircle, Trash2, Edit2, X, MapPin } from 'lucide-react';
import { Equipment, EquipmentType, Condo, UserRole } from '../types';

const EquipmentPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);

  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isTech = user?.role === UserRole.TECHNICIAN;
  const isCondo = user?.role === UserRole.CONDO_USER;

  const filteredEquipments = isCondo
    ? data.equipments.filter((e: Equipment) => e.condo_id === user?.condo_id)
    : data.equipments;

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
      photos: editingEq?.photos || [],
      last_maintenance: editingEq?.last_maintenance || new Date().toISOString()
    };

    const newEquipments = editingEq
      ? data.equipments.map((e: Equipment) => e.id === editingEq.id ? eqData : e)
      : [...data.equipments, eqData];

    updateData({ ...data, equipments: newEquipments });
    setIsModalOpen(false);
    setEditingEq(null);
  };

  const deleteEquipment = (id: string) => {
    if (confirm('Excluir este equipamento permanentemente?')) {
      updateData({ ...data, equipments: data.equipments.filter((e: Equipment) => e.id !== id) });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Equipamentos</h1>
          <p className="text-sm text-slate-500">Inventário técnico e controle de ativos.</p>
        </div>
        {(isAdmin || isTech) && (
          <button 
            onClick={() => { setEditingEq(null); setIsModalOpen(true); }}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center justify-center space-x-2 font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="uppercase text-xs tracking-widest">Cadastrar Ativo</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipments.map((eq: Equipment) => {
          const condo = data.condos.find((c: Condo) => c.id === eq.condo_id);
          const type = data.equipmentTypes.find((t: EquipmentType) => t.id === eq.type_id);
          
          return (
            <div key={eq.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md">
                    {type?.name || 'Inespecífico'}
                  </span>
                  {(isAdmin || isTech) && (
                    <div className="flex space-x-1">
                       <button onClick={() => { setEditingEq(eq); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                       <button onClick={() => deleteEquipment(eq.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg mb-1">{eq.manufacturer}</h3>
                <p className="text-xs font-medium text-slate-600 mb-2">{eq.model}</p>
                <p className="text-[10px] text-blue-600 font-black uppercase mb-4">{condo?.name || 'SEM CONDOMÍNIO'}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Corrente</p>
                    <div className="text-sm font-black text-slate-900">{eq.measured_current}A</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Temperatura</p>
                    <div className="text-sm font-black text-slate-900">{eq.temperature}°C</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/80 px-5 py-3.5 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center text-[9px] font-black uppercase tracking-widest">
                  <AlertCircle size={14} className="mr-1.5 text-slate-400" />
                  Ruído: <span className={eq.noise === 'Normal' ? 'text-emerald-600 ml-1' : 'text-red-500 ml-1'}>{eq.noise}</span>
                </div>
                <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  eq.electrical_state === 'Bom' ? 'bg-emerald-50 text-emerald-600' : 
                  eq.electrical_state === 'Regular' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                }`}>
                  Elétrica: {eq.electrical_state}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase">{editingEq ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingEq(null); }} className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Condomínio</label>
                  <select required name="condoId" defaultValue={editingEq?.condo_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Tipo</label>
                  <select required name="typeId" defaultValue={editingEq?.type_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    {data.equipmentTypes.map((t: EquipmentType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input required name="manufacturer" defaultValue={editingEq?.manufacturer} placeholder="Fabricante" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                <input required name="model" defaultValue={editingEq?.model} placeholder="Modelo / Identificação" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input required name="power" defaultValue={editingEq?.power} placeholder="Potência" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                <input required name="voltage" defaultValue={editingEq?.voltage} placeholder="Tensão" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                <input required type="number" step="0.1" name="nominalCurrent" defaultValue={editingEq?.nominal_current} placeholder="Corr. Nom." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                <input required type="number" step="0.1" name="measuredCurrent" defaultValue={editingEq?.measured_current} placeholder="Corr. Med." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Estado Elétrico</label>
                    <select name="electricalState" defaultValue={editingEq?.electrical_state} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                      <option value="Bom">Bom</option>
                      <option value="Regular">Regular</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Ruído</label>
                    <select name="noise" defaultValue={editingEq?.noise} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                      <option value="Normal">Normal</option>
                      <option value="Anormal">Anormal</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Localização</label>
                <input required name="location" defaultValue={editingEq?.location} placeholder="Ex: Casa de Máquinas" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingEq(null); }} className="flex-1 py-4 border rounded-xl font-black uppercase text-xs">Descartar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs">Gravar Ativo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
