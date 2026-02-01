
import React, { useState } from 'react';
import { Plus, Search, Building2, MapPin, User, Calendar, Edit2, Trash2, X, FileText, Cpu, Droplets } from 'lucide-react';
import { Condo, ContractType, MonitoringPoint } from '../types';
import { generateTechnicalSummary } from '../geminiService';

const Condos: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportCondo, setReportCondo] = useState<Condo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCondo, setEditingCondo] = useState<Condo | null>(null);
  const [points, setPoints] = useState<MonitoringPoint[]>([]);

  const filteredCondos = data.condos.filter((c: Condo) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (condo: Condo | null) => {
    setEditingCondo(condo);
    setPoints(condo?.monitoring_points || []);
    setIsModalOpen(true);
  };

  const addPoint = () => {
    setPoints([...points, { id: Math.random().toString(36).substr(2, 5), name: '', device_id: '' }]);
  };

  const removePoint = (idx: number) => {
    setPoints(points.filter((_, i) => i !== idx));
  };

  const updatePoint = (idx: number, field: keyof MonitoringPoint, value: string) => {
    const newPoints = [...points];
    newPoints[idx] = { ...newPoints[idx], [field]: value };
    setPoints(newPoints);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const condoData: Condo = {
      id: editingCondo?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      manager: formData.get('manager') as string,
      contract_type: formData.get('contract_type') as ContractType,
      start_date: formData.get('start_date') as string,
      monitoring_points: points.filter(p => p.name && p.device_id),
    };

    if (editingCondo) {
      updateData({ ...data, condos: data.condos.map((c: Condo) => c.id === editingCondo.id ? condoData : c) });
    } else {
      updateData({ ...data, condos: [...data.condos, condoData] });
    }
    setIsModalOpen(false);
    setEditingCondo(null);
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
          <p className="text-slate-500 text-sm">Controle de clientes.</p>
        </div>
        <button onClick={() => openEditModal(null)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95">
          <Plus size={20} className="inline mr-1" /> Novo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCondos.map((condo: Condo) => (
          <div key={condo.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Building2 size={22} /></div>
                <div className="flex space-x-1">
                  <button onClick={() => openEditModal(condo)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => deleteCondo(condo.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{condo.name}</h3>
              <p className="text-xs text-slate-500 flex items-start mb-4"><MapPin size={14} className="mr-1.5" /> {condo.address}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {condo.monitoring_points?.map((p, i) => (
                  <div key={i} className="flex items-center space-x-1.5 bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                    <Droplets size={10} className="text-blue-500" />
                    <span className="text-[9px] font-black uppercase">{p.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <p className="text-xs font-medium text-slate-500">Gestor: <span className="text-slate-900 font-bold">{condo.manager}</span></p>
                <p className="text-xs font-medium text-slate-500">Início: <span className="text-slate-900 font-bold">{new Date(condo.start_date).toLocaleDateString()}</span></p>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-slate-500">{condo.contract_type}</span>
              <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center">
                <FileText size={14} className="mr-1.5" /> Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase">{editingCondo ? 'Editar' : 'Novo'} Condomínio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Informações Gerais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Nome Comercial</label>
                      <input required name="name" defaultValue={editingCondo?.name} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" />
                   </div>
                   <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Endereço Completo</label>
                      <input required name="address" defaultValue={editingCondo?.address} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Síndico / Gestor</label>
                      <input required name="manager" defaultValue={editingCondo?.manager} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Início Contrato</label>
                      <input required type="date" name="start_date" defaultValue={editingCondo?.start_date} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                   <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Telemetria (ESP32)</h4>
                   <button type="button" onClick={addPoint} className="text-xs font-black text-blue-600 flex items-center hover:bg-blue-50 px-2 py-1 rounded-lg">
                     <Plus size={14} className="mr-1" /> Adicionar Ponto
                   </button>
                </div>
                
                <div className="space-y-3">
                  {points.map((point, idx) => (
                    <div key={idx} className="flex gap-2 items-end bg-blue-50/30 p-3 rounded-2xl border border-blue-100">
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Nome (ex: Superior)</label>
                        <input value={point.name} onChange={(e) => updatePoint(idx, 'name', e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg text-xs font-bold" placeholder="Superior" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">ID do Dispositivo</label>
                        <input value={point.device_id} onChange={(e) => updatePoint(idx, 'device_id', e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg text-xs font-black text-blue-600" placeholder="box_001" />
                      </div>
                      <button type="button" onClick={() => removePoint(idx)} className="p-2 text-red-400 hover:text-red-600 bg-white rounded-lg border border-red-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {points.length === 0 && (
                    <p className="text-[10px] text-center text-slate-400 py-4 border-2 border-dashed rounded-2xl font-medium">Nenhum ponto de monitoramento vinculado.</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Contrato</label>
                <select name="contract_type" defaultValue={editingCondo?.contract_type} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold">
                  {Object.values(ContractType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black uppercase text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Condos;
