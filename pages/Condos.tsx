
import React, { useState } from 'react';
import { 
  Plus, Search, Building2, MapPin, User, Calendar, 
  Edit2, Trash2, X, FileText, Printer, Sparkles, 
  Activity, CheckCircle2, AlertTriangle, Download
} from 'lucide-react';
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
    if (confirm('Tem certeza que deseja excluir este condomínio?')) {
      updateData({
        ...data,
        condos: data.condos.filter((c: Condo) => c.id !== id)
      });
    }
  };

  const handleOpenReport = async (condo: Condo) => {
    setReportCondo(condo);
    setAiSummary('');
    setLoadingSummary(true);
    
    const recentOS = data.serviceOrders.filter((os: ServiceOrder) => os.condoId === condo.id).slice(0, 5);
    const summary = await generateTechnicalSummary(condo.name, recentOS);
    setAiSummary(summary || 'Resumo técnico indisponível no momento.');
    setLoadingSummary(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Condomínios</h1>
          <p className="text-slate-500 text-sm">Controle de clientes e contratos ativos.</p>
        </div>
        <button 
          onClick={() => { setEditingCondo(null); setIsModalOpen(true); }}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:py-2 rounded-xl transition-all font-bold shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={20} />
          <span className="uppercase text-xs tracking-wider">Novo Condomínio</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredCondos.map((condo: Condo) => (
          <div key={condo.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Building2 size={22} />
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditingCondo(condo); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg active:bg-blue-100 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteCondo(condo.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg active:bg-red-100 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{condo.name}</h3>
              <p className="text-xs text-slate-500 flex items-start mb-4">
                <MapPin size={14} className="mr-1.5 mt-0.5 shrink-0" /> {condo.address}
              </p>
              
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center text-xs">
                  <User size={14} className="text-slate-400 mr-2" />
                  <span className="text-slate-500 font-medium">Gestor:</span>
                  <span className="ml-1.5 text-slate-900 font-bold">{condo.manager}</span>
                </div>
                <div className="flex items-center text-xs">
                  <Calendar size={14} className="text-slate-400 mr-2" />
                  <span className="text-slate-500 font-medium">Contrato:</span>
                  <span className="ml-1.5 text-slate-900 font-bold">{new Date(condo.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className={`px-5 py-4 border-t flex flex-wrap gap-4 justify-between items-center ${
              condo.contractType === ContractType.CONTINUOUS ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                condo.contractType === ContractType.CONTINUOUS ? 'text-emerald-700' : 'text-slate-600'
              }`}>
                {condo.contractType}
              </span>
              <div className="flex items-center space-x-4">
                 <button 
                  onClick={() => handleOpenReport(condo)}
                  className="text-slate-700 text-[10px] font-black hover:text-blue-600 uppercase tracking-widest flex items-center active:scale-95 transition-transform"
                 >
                   <FileText size={14} className="mr-1.5" /> Relatório
                 </button>
              </div>
            </div>
          </div>
        ))}
        {filteredCondos.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Nenhum resultado para a busca.</p>
          </div>
        )}
      </div>

      {/* Report Modal - Full Screen Mobile */}
      {reportCondo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 p-2 rounded-lg text-white">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm md:text-lg font-bold text-slate-900 truncate">{reportCondo.name}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Relatório Mensal</p>
                </div>
              </div>
              <div className="flex space-x-2 no-print shrink-0">
                <button onClick={() => window.print()} className="p-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors border hidden md:block">
                  <Printer size={20} />
                </button>
                <button onClick={() => setReportCondo(null)} className="p-2.5 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl active:bg-slate-200">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-touch" id="printable-report">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Responsável</p>
                  <p className="text-xs md:text-sm font-bold text-slate-800">{reportCondo.manager}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Contrato</p>
                  <p className="text-xs md:text-sm font-bold text-slate-800">{reportCondo.contractType}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Referência</p>
                  <p className="text-xs md:text-sm font-bold text-slate-800">{new Date().toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</p>
                </div>
              </div>

              {/* Technical Summary AI */}
              <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
                <Sparkles className="absolute -bottom-4 -right-4 opacity-10" size={100} />
                <h3 className="text-sm font-black mb-3 flex items-center uppercase tracking-widest">
                  <Activity size={18} className="mr-2 text-blue-300" /> Parecer Inteligente (IA)
                </h3>
                {loadingSummary ? (
                   <div className="animate-pulse space-y-3">
                     <div className="h-3 bg-white/20 rounded w-full"></div>
                     <div className="h-3 bg-white/20 rounded w-5/6"></div>
                     <div className="h-3 bg-white/20 rounded w-4/6"></div>
                   </div>
                ) : (
                  <p className="text-xs md:text-sm leading-relaxed text-blue-50 font-medium">
                    {aiSummary}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                 <div className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:space-x-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600 w-fit mb-3 md:mb-0 shrink-0">
                      <Download size={20} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 leading-none">
                        {data.equipments.filter((e: Equipment) => e.condoId === reportCondo.id).length}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Ativos</p>
                    </div>
                 </div>
                 <div className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:space-x-4">
                    <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-600 w-fit mb-3 md:mb-0 shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 leading-none">
                        {data.serviceOrders.filter((os: ServiceOrder) => os.condoId === reportCondo.id && os.status === OSStatus.COMPLETED).length}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Concluídas</p>
                    </div>
                 </div>
                 <div className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:space-x-4 col-span-2 md:col-span-1">
                    <div className="bg-red-100 p-2.5 rounded-lg text-red-600 w-fit mb-3 md:mb-0 shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 leading-none">
                        {data.equipments.filter((e: Equipment) => e.condoId === reportCondo.id && e.electricalState === 'Crítico').length}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Críticos</p>
                    </div>
                 </div>
              </div>

              {/* Equipment Table - Scrollable Mobile */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 flex items-center uppercase tracking-[0.2em]">
                   <Activity size={16} className="mr-2 text-blue-600" /> Saúde dos Ativos
                </h3>
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto scroll-touch">
                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[9px] tracking-widest border-b">
                        <tr>
                          <th className="px-5 py-4">Equipamento</th>
                          <th className="px-4 py-4 text-center">Saúde</th>
                          <th className="px-4 py-4 text-center">Temp.</th>
                          <th className="px-4 py-4 text-center">Corr. (A)</th>
                          <th className="px-5 py-4">Local</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.equipments.filter((e: Equipment) => e.condoId === reportCondo.id).map((eq: Equipment) => (
                          <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-800">{eq.manufacturer} - {eq.model}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                                eq.electricalState === 'Bom' ? 'bg-emerald-100 text-emerald-700' :
                                eq.electricalState === 'Regular' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {eq.electricalState}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center font-medium text-slate-600">{eq.temperature}°C</td>
                            <td className="px-4 py-4 text-center font-medium text-slate-600">{eq.measuredCurrent}/{eq.nominalCurrent}</td>
                            <td className="px-5 py-4 text-slate-500 font-medium">{eq.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-6 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-widest gap-2">
              <div>SmartGestão v2.4.0 • Gerado: {new Date().toLocaleString()}</div>
              <div className="hidden md:block">Página 1 de 1</div>
            </div>
          </div>
        </div>
      )}

      {/* Cadastro Modal - Mobile Full Screen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white md:rounded-2xl w-full h-full md:h-auto md:max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{editingCondo ? 'Editar' : 'Novo'} Condomínio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Empreendimento</label>
                <input required name="name" defaultValue={editingCondo?.name} placeholder="Ex: Residencial Jardins" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Endereço Completo</label>
                <input required name="address" defaultValue={editingCondo?.address} placeholder="Rua, Número, Bairro, Cidade" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-medium" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gestor / Síndico</label>
                  <input required name="manager" defaultValue={editingCondo?.manager} placeholder="Nome do responsável" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Início do Contrato</label>
                  <input required type="date" name="startDate" defaultValue={editingCondo?.startDate} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-medium" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modelo de Manutenção</label>
                <select name="contractType" defaultValue={editingCondo?.contractType} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none font-bold text-slate-700">
                  {Object.values(ContractType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="pt-6 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full px-6 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-transform uppercase text-xs">Descartar</button>
                <button type="submit" className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-transform uppercase text-xs tracking-widest">Confirmar e Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #printable-report { height: auto !important; overflow: visible !important; }
          .fixed { position: static !important; background: white !important; }
          .modal-full-mobile { position: static !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
};

export default Condos;
