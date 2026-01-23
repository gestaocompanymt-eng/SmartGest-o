
import React, { useState } from 'react';
import { Plus, Search, Building2, MapPin, User, Calendar, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { Condo, ContractType } from '../types';

const Condos: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCondo, setEditingCondo] = useState<Condo | null>(null);

  const filteredCondos = data.condos.filter((c: Condo) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const condoData = {
      id: editingCondo?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      manager: formData.get('manager') as string,
      contractType: formData.get('contractType') as ContractType,
      startDate: formData.get('startDate') as string,
    };

    if (editingCondo) {
      updateData({
        ...data,
        condos: data.condos.map((c: Condo) => c.id === editingCondo.id ? condoData : c)
      });
    } else {
      updateData({
        ...data,
        condos: [...data.condos, condoData]
      });
    }
    setIsModalOpen(false);
    setEditingCondo(null);
  };

  const deleteCondo = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este condomínio? Todos os equipamentos vinculados serão mantidos, mas sem vínculo válido.')) {
      updateData({
        ...data,
        condos: data.condos.filter((c: Condo) => c.id !== id)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Condomínios</h1>
          <p className="text-slate-500">Gerencie os clientes e seus respectivos contratos.</p>
        </div>
        <button 
          onClick={() => { setEditingCondo(null); setIsModalOpen(true); }}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Novo Condomínio</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar condomínio por nome ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCondos.map((condo: Condo) => (
          <div key={condo.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-300 transition-colors">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <Building2 size={24} />
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditingCondo(condo); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteCondo(condo.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{condo.name}</h3>
              <p className="text-sm text-slate-500 flex items-center mb-4">
                <MapPin size={14} className="mr-1" /> {condo.address}
              </p>
              
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center text-sm">
                  <User size={16} className="text-slate-400 mr-2" />
                  <span className="text-slate-600 font-medium">Síndico:</span>
                  <span className="ml-2 text-slate-900">{condo.manager}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar size={16} className="text-slate-400 mr-2" />
                  <span className="text-slate-600 font-medium">Desde:</span>
                  <span className="ml-2 text-slate-900">{new Date(condo.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className={`px-6 py-3 border-t flex justify-between items-center ${
              condo.contractType === ContractType.CONTINUOUS ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                condo.contractType === ContractType.CONTINUOUS ? 'text-emerald-700' : 'text-slate-600'
              }`}>
                {condo.contractType}
              </span>
              <button className="text-blue-600 text-xs font-bold hover:underline">VER ATIVOS</button>
            </div>
          </div>
        ))}
        {filteredCondos.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-300 rounded-xl">
            <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Nenhum condomínio encontrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingCondo ? 'Editar' : 'Novo'} Condomínio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Nome do Condomínio</label>
                <input required name="name" defaultValue={editingCondo?.name} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
                <input required name="address" defaultValue={editingCondo?.address} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Responsável / Síndico</label>
                  <input required name="manager" defaultValue={editingCondo?.manager} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Início do Contrato</label>
                  <input required type="date" name="startDate" defaultValue={editingCondo?.startDate} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Tipo de Contrato</label>
                <select name="contractType" defaultValue={editingCondo?.contractType} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none bg-white">
                  {Object.values(ContractType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Condos;