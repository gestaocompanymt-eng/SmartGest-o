
import React, { useState } from 'react';
import { Plus, Search, Building2, MapPin, Edit2, Trash2, X, FileText, Save, Calendar, User } from 'lucide-react';
import { Condo, ContractType } from '../types';

const Condos: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCondo, setEditingCondo] = useState<Condo | null>(null);

  const filteredCondos = data.condos.filter((c: Condo) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (condo: Condo | null) => {
    setEditingCondo(condo);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const condoData: Condo = {
      id: editingCondo?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      manager: formData.get('manager') as string,
      contract_type: formData.get('contract_type') as ContractType,
      start_date: formData.get('start_date') as string,
      monitoring_points: editingCondo?.monitoring_points || [], // Preserva dados antigos
    };

    const newCondos = editingCondo 
      ? data.condos.map((c: Condo) => c.id === editingCondo.id ? condoData : c)
      : [condoData, ...data.condos];

    await updateData({ ...data, condos: newCondos });
    setIsModalOpen(false);
    setEditingCondo(null);
  };

  const deleteCondo = (id: string) => {
    if (confirm('Deseja realmente remover este condomínio?')) {
      updateData({ ...data, condos: data.condos.filter((c: Condo) => c.id !== id) });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Condomínios</h1>
          <p className="text-slate-500 text-sm font-medium">Gestão de clientes e contratos.</p>
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
              
              <div className="space-y-2 pt-4 border-t border-slate-50">
                <p className="text-xs font-medium text-slate-500 flex items-center">
                  <User size={12} className="mr-1.5" /> Gestor: <span className="text-slate-900 font-bold ml-1">{condo.manager}</span>
                </p>
                <p className="text-xs font-medium text-slate-500 flex items-center">
                  <Calendar size={12} className="mr-1.5" /> Desde: <span className="text-slate-900 font-bold ml-1">{new Date(condo.start_date).toLocaleDateString()}</span>
                </p>
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
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">{editingCondo ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Condomínio</label>
                    <input required name="name" defaultValue={editingCondo?.name} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Endereço Completo</label>
                    <input required name="address" defaultValue={editingCondo?.address} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gestor / Síndico</label>
                    <input required name="manager" defaultValue={editingCondo?.manager} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Início da Gestão</label>
                    <input required type="date" name="start_date" defaultValue={editingCondo?.start_date} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Manutenção</label>
                <select name="contract_type" defaultValue={editingCondo?.contract_type} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold outline-none">
                  {Object.values(ContractType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Salvar Cliente
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
