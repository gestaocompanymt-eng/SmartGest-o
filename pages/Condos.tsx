
import React, { useState } from 'react';
import { Plus, Search, Building2, MapPin, User, Calendar, Edit2, Trash2, X, FileText, Cpu, Droplets, Save } from 'lucide-react';
import { Condo, ContractType, MonitoringPoint } from '../types';
import { generateTechnicalSummary } from '../geminiService';

const Condos: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCondo, setEditingCondo] = useState<Condo | null>(null);
  const [points, setPoints] = useState<MonitoringPoint[]>([]);

  const filteredCondos = data.condos.filter((c: Condo) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (condo: Condo | null) => {
    setEditingCondo(condo);
    // Garantir que carregamos os pontos existentes ou começamos com array vazio
    setPoints(condo?.monitoring_points || []);
    setIsModalOpen(true);
  };

  const addPoint = () => {
    const nextNum = points.length + 1;
    setPoints([...points, { 
      id: Math.random().toString(36).substr(2, 5), 
      name: `Reservatório ${nextNum}`, 
      device_id: '' 
    }]);
  };

  const removePoint = (idx: number) => {
    setPoints(points.filter((_, i) => i !== idx));
  };

  const updatePoint = (idx: number, field: keyof MonitoringPoint, value: string) => {
    const newPoints = [...points];
    newPoints[idx] = { ...newPoints[idx], [field]: value };
    setPoints(newPoints);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Filtramos apenas pontos que tenham o Device ID preenchido
    const validPoints = points.filter(p => p.device_id && p.device_id.trim() !== "");

    const condoData: Condo = {
      id: editingCondo?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      manager: formData.get('manager') as string,
      contract_type: formData.get('contract_type') as ContractType,
      start_date: formData.get('start_date') as string,
      monitoring_points: validPoints,
    };

    const newCondos = editingCondo 
      ? data.condos.map((c: Condo) => c.id === editingCondo.id ? condoData : c)
      : [condoData, ...data.condos];

    // Atualizamos os dados e fechamos o modal
    await updateData({ ...data, condos: newCondos });
    
    setIsModalOpen(false);
    setEditingCondo(null);
    setPoints([]);
  };

  const deleteCondo = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este condomínio?')) {
      updateData({ ...data, condos: data.condos.filter((c: Condo) => c.id !== id) });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Condomínios</h1>
          <p className="text-slate-500 text-sm font-medium">Controle de clientes e dispositivos IoT.</p>
        </div>
        <button onClick={() => openEditModal(null)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
          <Plus size={20} className="inline mr-1" /> Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Buscar por nome ou endereço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none shadow-sm font-medium" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCondos.map((condo: Condo) => (
          <div key={condo.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Building2 size={22} /></div>
                <div className="flex space-x-1">
                  <button onClick={() => openEditModal(condo)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => deleteCondo(condo.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{condo.name}</h3>
              <p className="text-xs text-slate-500 flex items-start mb-4"><MapPin size={14} className="mr-1.5 shrink-0 mt-0.5" /> {condo.address}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {condo.monitoring_points?.length > 0 ? (
                  condo.monitoring_points.map((p, i) => (
                    <div key={i} className="flex items-center space-x-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">
                      <Droplets size={10} className="text-blue-500" />
                      <span className="text-[9px] font-black uppercase tracking-tight">{p.name} ({p.device_id})</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[9px] font-bold text-slate-400 italic">Sem telemetria configurada</span>
                )}
              </div>
              
              <div className="space-y-2 pt-4 border-t border-slate-50">
                <p className="text-xs font-medium text-slate-500">Gestor: <span className="text-slate-900 font-bold">{condo.manager}</span></p>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{condo.contract_type}</span>
              <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center hover:underline">
                <FileText size={14} className="mr-1.5" /> Ficha Técnica
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">{editingCondo ? 'Editar Condomínio' : 'Novo Condomínio'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Informações Gerais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Condomínio</label>
                      <input required name="name" defaultValue={editingCondo?.name} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Ex: Edifício Esmeralda" />
                   </div>
                   <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Endereço</label>
                      <input required name="address" defaultValue={editingCondo?.address} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Rua, Número, Bairro" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gestor / Síndico</label>
                      <input required name="manager" defaultValue={editingCondo?.manager} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Nome do responsável" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Início da Gestão</label>
                      <input required type="date" name="start_date" defaultValue={editingCondo?.start_date} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none" />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                   <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center">
                     <Cpu size={14} className="mr-2" /> Monitoramento IoT (ESP32)
                   </h4>
                   <button type="button" onClick={addPoint} className="text-[10px] font-black text-blue-600 flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-all active:scale-95">
                     <Plus size={14} className="mr-1" /> Adicionar Ponto
                   </button>
                </div>
                
                <div className="space-y-3">
                  {points.map((point, idx) => (
                    <div key={idx} className="flex gap-3 items-end bg-blue-50/20 p-4 rounded-2xl border border-blue-100 animate-in slide-in-from-top duration-200">
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Local</label>
                        <input 
                          value={point.name} 
                          onChange={(e) => updatePoint(idx, 'name', e.target.value)} 
                          className="w-full px-3 py-2 bg-white border border-blue-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" 
                          placeholder="Ex: Superior, Inferior, Torre A" 
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">ID na Placa (Device ID)</label>
                        <input 
                          value={point.device_id} 
                          onChange={(e) => updatePoint(idx, 'device_id', e.target.value)} 
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-black text-blue-600 placeholder:text-blue-200 focus:ring-2 focus:ring-blue-500/20 outline-none" 
                          placeholder="Ex: box_001" 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removePoint(idx)} 
                        className="p-2.5 text-red-400 hover:text-red-600 bg-white rounded-xl border border-red-50 hover:border-red-100 transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {points.length === 0 && (
                    <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nenhuma telemetria associada</p>
                      <p className="text-[9px] text-slate-300 mt-1 italic">Clique em "Adicionar Ponto" para configurar as placas IoT.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Manutenção</label>
                <select name="contract_type" defaultValue={editingCondo?.contract_type} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none">
                  {Object.values(ContractType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-6 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border-2 border-slate-50 rounded-2xl font-black uppercase text-xs text-slate-400 tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Condos;
