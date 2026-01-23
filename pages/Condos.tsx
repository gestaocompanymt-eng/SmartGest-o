
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
    if (confirm('Tem certeza que deseja excluir este condomínio? Todos os equipamentos vinculados serão mantidos, mas sem vínculo válido.')) {
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
    setAiSummary(summary || 'Resumo indisponível.');
    setLoadingSummary(false);
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
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                condo.contractType === ContractType.CONTINUOUS ? 'text-emerald-700' : 'text-slate-600'
              }`}>
                {condo.contractType}
              </span>
              <div className="flex space-x-3">
                 <button 
                  onClick={() => handleOpenReport(condo)}
                  className="text-slate-600 text-[10px] font-bold hover:text-blue-600 uppercase flex items-center"
                 >
                   <FileText size={12} className="mr-1" /> Relatório
                 </button>
                 <button className="text-blue-600 text-[10px] font-bold hover:underline uppercase">Ativos</button>
              </div>
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

      {/* Report Modal */}
      {reportCondo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 p-2 rounded-lg text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-none">Relatório Técnico Mensal</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{reportCondo.name} • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex space-x-2 no-print">
                <button onClick={() => window.print()} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border">
                  <Printer size={20} />
                </button>
                <button onClick={() => setReportCondo(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8" id="printable-report">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                  <p className="text-sm font-bold text-slate-800">{reportCondo.manager}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contrato</p>
                  <p className="text-sm font-bold text-slate-800">{reportCondo.contractType}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vigência desde</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(reportCondo.startDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Technical Summary AI */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <Sparkles className="absolute top-4 right-4 opacity-20" size={40} />
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Activity size={20} className="mr-2" /> Parecer do Especialista (IA)
                </h3>
                {loadingSummary ? (
                   <div className="animate-pulse space-y-2">
                     <div className="h-4 bg-white/20 rounded w-3/4"></div>
                     <div className="h-4 bg-white/20 rounded w-5/6"></div>
                   </div>
                ) : (
                  <p className="text-sm leading-relaxed text-blue-50 font-medium">
                    {aiSummary}
                  </p>
                )}
              </div>

              {/* Stats & Totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="border border-slate-200 rounded-2xl p-5 flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                      <Download size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {data.equipments.filter((e: Equipment) => e.condoId === reportCondo.id).length}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Ativos Cadastrados</p>
                    </div>
                 </div>
                 <div className="border border-slate-200 rounded-2xl p-5 flex items-center space-x-4">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {data.serviceOrders.filter((os: ServiceOrder) => os.condoId === reportCondo.id && os.status === OSStatus.COMPLETED).length}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase">OS Concluídas</p>
                    </div>
                 </div>
                 <div className="border border-slate-200 rounded-2xl p-5 flex items-center space-x-4">
                    <div className="bg-red-100 p-3 rounded-xl text-red-600">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {data.equipments.filter((e: Equipment) => e.condoId === reportCondo.id && e.electricalState === 'Crítico').length}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Pontos Críticos</p>
                    </div>
                 </div>
              </div>

              {/* Equipment Table */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center">
                   <Activity size={18} className="mr-2 text-blue-600" /> Inventário de Ativos
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Equipamento</th>
                        <th className="px-4 py-3 text-center">Saúde</th>
                        <th className="px-4 py-3 text-center">Temp.</th>
                        <th className="px-4 py-3 text-center">Corr. (A)</th>
                        <th className="px-4 py-3">Localização</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.equipments.filter((e: Equipment) => e.condoId === reportCondo.id).map((eq: Equipment) => (
                        <tr key={eq.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-700">{eq.manufacturer} - {eq.model}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              eq.electricalState === 'Bom' ? 'bg-emerald-100 text-emerald-700' :
                              eq.electricalState === 'Regular' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {eq.electricalState}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">{eq.temperature}°C</td>
                          <td className="px-4 py-3 text-center text-slate-600">{eq.measuredCurrent} / {eq.nominalCurrent}</td>
                          <td className="px-4 py-3 text-slate-500">{eq.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
              <div>SmartGestão v2.4.0 • Gerado em {new Date().toLocaleString()}</div>
              <div>Página 1 de 1</div>
            </div>
          </div>
        </div>
      )}

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

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #printable-report { height: auto !important; overflow: visible !important; }
          .fixed { position: static !important; background: white !important; }
          .max-h-\\[90vh\\] { max-height: none !important; }
          .shadow-2xl { shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Condos;
