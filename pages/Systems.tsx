
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Monitor, Activity, Edit2, Trash2, X, Cpu, CheckCircle2, Circle, Layers, FilePlus } from 'lucide-react';
import { System, SystemType, Condo, UserRole, Equipment } from '../types';

const SystemsPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSys, setEditingSys] = useState<System | null>(null);
  const [managingSys, setManagingSys] = useState<System | null>(null);

  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isTech = user?.role === UserRole.TECHNICIAN;
  const isCondo = user?.role === UserRole.CONDO_USER;

  // Filtrar sistemas: Se for Condo User, vê apenas os dele.
  // Fix: Updated condoId to condo_id
  const filteredSystems = isCondo
    ? data.systems.filter((s: System) => s.condo_id === user?.condo_id)
    : data.systems;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Fix: Map formData to correct snake_case properties on System interface
    const sysData: System = {
      id: editingSys?.id || Math.random().toString(36).substr(2, 9),
      condo_id: formData.get('condoId') as string,
      type_id: formData.get('typeId') as string,
      name: formData.get('name') as string,
      equipment_ids: editingSys?.equipment_ids || [], 
      parameters: formData.get('parameters') as string,
      observations: formData.get('observations') as string,
    };

    if (editingSys) {
      updateData({
        ...data,
        systems: data.systems.map((s: System) => s.id === editingSys.id ? sysData : s)
      });
    } else {
      updateData({
        ...data,
        systems: [...data.systems, sysData]
      });
    }
    setIsModalOpen(false);
    setEditingSys(null);
  };

  const deleteSystem = (id: string) => {
    if (confirm('Deseja realmente excluir este sistema?')) {
      updateData({
        ...data,
        systems: data.systems.filter((s: System) => s.id !== id)
      });
    }
  };

  const toggleEquipmentInSystem = (systemId: string, equipmentId: string) => {
    const system = data.systems.find((s: System) => s.id === systemId);
    if (!system) return;

    // Fix: Updated equipmentIds to equipment_ids
    const newEquipmentIds = system.equipment_ids.includes(equipmentId)
      ? system.equipment_ids.filter((id: string) => id !== equipmentId)
      : [...system.equipment_ids, equipmentId];

    const updatedSystem = { ...system, equipment_ids: newEquipmentIds };
    
    updateData({
      ...data,
      systems: data.systems.map((s: System) => s.id === systemId ? updatedSystem : s)
    });
    
    setManagingSys(updatedSystem);
  };

  const handleOpenOS = (systemId: string) => {
    navigate(`/os?systemId=${systemId}`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Sistemas</h1>
          <p className="text-sm text-slate-500">{isCondo ? 'Assuntos técnicos do seu condomínio.' : 'Conjuntos de equipamentos e parâmetros de automação.'}</p>
        </div>
        {(isAdmin || isTech) && (
          <button 
            onClick={() => { setEditingSys(null); setIsModalOpen(true); }} 
            className="w-full md:w-auto bg-slate-900 text-white px-6 py-4 md:py-2 rounded-xl flex items-center justify-center space-x-2 font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus size={20} />
            <span className="uppercase text-[10px] tracking-widest">Novo Sistema</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {filteredSystems.map((sys: System) => {
          // Fix: Updated condoId, typeId, and equipmentIds access
          const condo = data.condos.find((c: Condo) => c.id === sys.condo_id);
          const type = data.systemTypes.find((t: SystemType) => t.id === sys.type_id);
          const linkedEquipments = data.equipments.filter((e: Equipment) => sys.equipment_ids.includes(e.id));
          
          return (
            <div key={sys.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-blue-400 transition-all">
              <div className="md:w-1/3 bg-slate-900 p-6 md:p-8 flex flex-col items-center justify-center text-white space-y-4 shrink-0">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
                  <Monitor size={32} />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Status</p>
                  <div className="flex items-center justify-center space-x-1.5 text-emerald-400">
                    <Activity size={14} className="animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">Ativo</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-5 md:p-6 flex flex-col min-w-0">
                <div className="flex justify-between items-start mb-4">
                   <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                      {type?.name || 'Sistema Operacional'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight truncate">{sys.name}</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight truncate">{condo?.name || 'Local Indefinido'}</p>
                   </div>
                   {(isAdmin || isTech) && (
                     <div className="flex space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditingSys(sys); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteSystem(sys.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                     </div>
                   )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4 flex-1">
                  <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Cpu size={14} className="mr-1.5" /> Parâmetros de Controle
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed italic line-clamp-2">
                    {sys.parameters || 'Nenhum parâmetro configurado.'}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {linkedEquipments.length > 0 ? (
                      linkedEquipments.slice(0, 3).map((eq) => (
                        <div key={eq.id} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-blue-600 uppercase">
                          {eq.manufacturer.charAt(0)}
                        </div>
                      ))
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">?</div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleOpenOS(sys.id)}
                      className="text-[10px] font-black text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all uppercase tracking-widest active:scale-95 flex items-center"
                    >
                      <FilePlus size={14} className="mr-1.5" /> Abrir OS
                    </button>
                    {(isAdmin || isTech) && (
                      <button 
                        onClick={() => setManagingSys(sys)}
                        className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all uppercase tracking-widest active:scale-95"
                      >
                        Gerenciar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredSystems.length === 0 && (
          <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center">
            <Monitor size={50} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest text-center px-4">Não há sistemas cadastrados para seu condomínio.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white md:rounded-2xl w-full h-full md:h-auto md:max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingSys ? 'Editar Configuração' : 'Novo Sistema'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingSys(null); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6 overflow-y-auto flex-1 scroll-touch">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condomínio Vinculado</label>
                <select required name="condoId" defaultValue={editingSys?.condo_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
                  <option value="">Selecione o empreendimento...</option>
                  {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Sistema</label>
                <select required name="typeId" defaultValue={editingSys?.type_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
                  {data.systemTypes.map((t: SystemType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Sistema</label>
                <input required name="name" defaultValue={editingSys?.name} placeholder="Ex: Central de Água Quente - Bloco A" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parâmetros de Controle</label>
                <textarea name="parameters" defaultValue={editingSys?.parameters} rows={4} placeholder="Setpoints, pressões, temperaturas..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-600"></textarea>
              </div>
              <div className="pt-6 flex flex-col-reverse md:flex-row gap-4 shrink-0">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingSys(null); }} className="w-full px-6 py-4 border-2 border-slate-100 text-slate-500 font-black rounded-xl uppercase text-xs">Descartar</button>
                <button type="submit" className="w-full px-6 py-4 bg-slate-900 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                  {editingSys ? 'Atualizar Sistema' : 'Salvar Sistema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {managingSys && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-6">
          <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-1">Gerenciar Ativos</h2>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{managingSys.name}</p>
              </div>
              <button onClick={() => setManagingSys(null)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-2 scroll-touch">
              {data.equipments
                // Fix: Updated condoId to condo_id
                .filter((e: Equipment) => e.condo_id === managingSys.condo_id)
                .map((eq: Equipment) => {
                  // Fix: Updated equipmentIds to equipment_ids
                  const isLinked = managingSys.equipment_ids.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      onClick={() => toggleEquipmentInSystem(managingSys.id, eq.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] text-left ${
                        isLinked ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                         <div className={`p-2.5 rounded-xl ${isLinked ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                           {isLinked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 leading-none mb-1">{eq.manufacturer} - {eq.model}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{eq.location}</p>
                         </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="p-5 md:p-8 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {/* Fix: Updated equipmentIds to equipment_ids */}
                 {managingSys.equipment_ids.length} Ativo(s) Vinculado(s)
               </p>
               <button onClick={() => setManagingSys(null)} className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs tracking-widest active:scale-95">
                 Finalizar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemsPage;
