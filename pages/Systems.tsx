
import React, { useState } from 'react';
import { Plus, Settings, Monitor, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { System, SystemType, Condo, Equipment } from '../types';

const SystemsPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSys: System = {
      id: Math.random().toString(36).substr(2, 9),
      condoId: formData.get('condoId') as string,
      typeId: formData.get('typeId') as string,
      name: formData.get('name') as string,
      equipmentIds: [], // Would typically pick from a multi-select
      parameters: formData.get('parameters') as string,
      observations: formData.get('observations') as string,
    };

    updateData({
      ...data,
      systems: [...data.systems, newSys]
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sistemas</h1>
          <p className="text-slate-500">Conjuntos de equipamentos e parâmetros de automação.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium hover:bg-slate-800 transition-colors">
          <Plus size={20} />
          <span>Novo Sistema</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.systems.map((sys: System) => {
          const condo = data.condos.find((c: Condo) => c.id === sys.condoId);
          const type = data.systemTypes.find((t: SystemType) => t.id === sys.typeId);
          
          return (
            <div key={sys.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/3 bg-slate-900 p-8 flex flex-col items-center justify-center text-white space-y-4">
                <div className="p-4 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/40">
                  <Monitor size={32} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Status do Sistema</p>
                  <div className="flex items-center justify-center space-x-1.5 text-emerald-400">
                    <Activity size={14} className="animate-pulse" />
                    <span className="text-sm font-bold uppercase">Operacional</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 flex flex-col">
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    {type?.name || 'Sistema'}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">{sys.name}</h3>
                  <p className="text-xs font-semibold text-blue-600 uppercase">{condo?.name}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                    <Cpu size={14} className="mr-1" /> Parâmetros de Controle
                  </div>
                  <p className="text-sm text-slate-700">{sys.parameters || 'Não definidos'}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                        EQ
                      </div>
                    ))}
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">GERENCIAR</button>
                </div>
              </div>
            </div>
          );
        })}
        {data.systems.length === 0 && (
          <div className="col-span-full py-20 bg-white border border-dashed rounded-2xl flex flex-col items-center">
            <Settings size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500">Nenhum sistema operacional cadastrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Novo Sistema</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Condomínio</label>
                <select required name="condoId" className="w-full p-2 border border-slate-200 rounded-lg">
                  <option value="">Selecione...</option>
                  {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Tipo de Sistema</label>
                <select required name="typeId" className="w-full p-2 border border-slate-200 rounded-lg">
                  <option value="">Selecione...</option>
                  {data.systemTypes.map((t: SystemType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Nome do Sistema</label>
                <input required name="name" placeholder="Ex: Central de Água Quente - Bloco A" className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Parâmetros de Controle</label>
                <textarea name="parameters" rows={2} placeholder="Ex: Temp. Setpoint: 45°C, Pressão: 2.5 bar" className="w-full p-2 border border-slate-200 rounded-lg"></textarea>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg font-bold">CANCELAR</button>
                <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemsPage;
