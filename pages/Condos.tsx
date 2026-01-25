
import React, { useState } from 'react';
import { Plus, Search, Building2, MapPin, User, Calendar, Edit2, Trash2, X, FileText, Printer, Sparkles, Activity, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Condo, ContractType, Equipment, ServiceOrder, OSStatus } from '../types';
import { generateTechnicalSummary } from '../geminiService';

const Condos: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportCondo, setReportCondo] = useState<Condo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCondo, setEditingCondo] = useState<Condo | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);

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
      contract_type: formData.get('contract_type') as ContractType,
      start_date: formData.get('start_date') as string,
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

  const handleOpenReport = async (condo: Condo) => {
    setReportCondo(condo);
    setAiSummary('');
    setLoadingSummary(true);
    const recentOS = data.serviceOrders.filter((os: ServiceOrder) => os.condo_id === condo.id).slice(0, 5);
    const summary = await generateTechnicalSummary(condo.name, recentOS);
    setAiSummary(summary || 'Resumo técnico indisponível.');
    setLoadingSummary(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Condomínios</h1>
          <p className="text-slate-500 text-sm">Controle de clientes.</p>
        </div>
        <button onClick={() => { setEditingCondo(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95">
          <Plus size={20} className="inline mr-1" /> Novo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCondos.map((condo: Condo) => (
          <div key={condo.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Building2 size={22} /></div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditingCondo(condo); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => deleteCondo(condo.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{condo.name}</h3>
              <p className="text-xs text-slate-500 flex items-start mb-4"><MapPin size={14} className="mr-1.5" /> {condo.address}</p>
              
              <div className="space-y-2 pt-4 border-t">
                <p className="text-xs font-medium text-slate-500">Gestor: <span className="text-slate-900 font-bold">{condo.manager}</span></p>
                <p className="text-xs font-medium text-slate-500">Início: <span className="text-slate-900 font-bold">{new Date(condo.start_date).toLocaleDateString()}</span></p>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-slate-500">{condo.contract_type}</span>
              <button onClick={() => handleOpenReport(condo)} className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center">
                <FileText size={14} className="mr-1.5" /> Relatório
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold uppercase">{editingCondo ? 'Editar' : 'Novo'} Condomínio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <input required name="name" defaultValue={editingCondo?.name} placeholder="Nome do Condomínio" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              <input required name="address" defaultValue={editingCondo?.address} placeholder="Endereço" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input required name="manager" defaultValue={editingCondo?.manager} placeholder="Gestor" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                <input required type="date" name="start_date" defaultValue={editingCondo?.start_date} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <select name="contract_type" defaultValue={editingCondo?.contract_type} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                {Object.values(ContractType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-xl font-bold uppercase text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-blue-500/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Condos;
