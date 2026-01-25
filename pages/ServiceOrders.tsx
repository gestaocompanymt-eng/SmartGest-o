
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Calculator, Printer, MessageCircle, Edit2, Share2, Wrench
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, System, UserRole } from '../types';

const ServiceOrders: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [quoteOS, setQuoteOS] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOS, setExpandedOS] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const [selectedCondoId, setSelectedCondoId] = useState(isCondoUser ? (user?.condo_id || '') : '');
  const [assignmentType, setAssignmentType] = useState<'equipment' | 'system' | 'general'>('general');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const systemId = params.get('systemId');
    if (systemId) {
      const sys = data.systems.find((s: System) => s.id === systemId);
      if (sys) openNewOSWithSystem(sys);
    }
  }, [location.search, data.systems]);

  const openNewOSWithSystem = (sys: System) => {
    setSelectedCondoId(sys.condo_id);
    setAssignmentType('system');
    setEditingOS(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    const formData = new FormData(e.currentTarget);
    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Math.floor(1000 + Math.random() * 9000)}`,
      type: formData.get('type') as OSType,
      status: editingOS?.status || OSStatus.OPEN,
      condo_id: isCondoUser ? (user?.condo_id || '') : (formData.get('condo_id') as string),
      equipment_id: assignmentType === 'equipment' ? (formData.get('equipment_id') as string) : undefined,
      system_id: assignmentType === 'system' ? (formData.get('system_id') as string) : undefined,
      problem_description: formData.get('description') as string,
      actions_performed: (formData.get('actions') as string) || editingOS?.actions_performed || '',
      parts_replaced: editingOS?.parts_replaced || [],
      photos_before: editingOS?.photos_before || [],
      photos_after: editingOS?.photos_after || [],
      technician_id: editingOS?.technician_id || user?.id || 'unknown',
      created_at: editingOS?.created_at || new Date().toISOString(),
      service_value: Number(formData.get('service_value')) || 0,
      material_value: Number(formData.get('material_value')) || 0,
    };
    await updateData({ ...data, serviceOrders: editingOS ? data.serviceOrders.map((o: any) => o.id === editingOS.id ? osData : o) : [osData, ...data.serviceOrders] });
    setSaveStatus('success');
    setTimeout(closeModal, 800);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOS(null);
    setAssignmentType('general');
    setSelectedCondoId(isCondoUser ? (user?.condo_id || '') : '');
    setSaveStatus('idle');
  };

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => {
    const matchStatus = filterStatus === 'all' || os.status === filterStatus;
    const matchCondo = !isCondoUser || os.condo_id === user?.condo_id;
    return matchStatus && matchCondo;
  });

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const WHATSAPP_LINK = "https://wa.me/5565996995600?text=Quero%20saber%20mais%20sobre%20o%20or%C3%A7amento";

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500">{isCondoUser ? 'Chamados do seu condomínio.' : 'Gestão técnica de chamados.'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none flex-1 md:flex-none">
            <option value="all">Todos</option>
            {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 flex-1 md:flex-none">
            <Plus size={16} className="inline mr-1" /> Novo Chamado
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOS.map((os: ServiceOrder) => {
          const condo = data.condos.find((c: Condo) => c.id === os.condo_id);
          const isExpanded = expandedOS === os.id;
          return (
            <div key={os.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedOS(isExpanded ? null : os.id)}>
                <div className="flex items-center space-x-4 min-w-0">
                  <div className={`p-2.5 rounded-xl ${os.type === OSType.CORRECTIVE ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{condo?.name || 'Condomínio'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{os.id} • {os.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${os.status === OSStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {os.status}
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Descrição</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl italic">{os.problem_description}</p>
                    </div>
                    {os.actions_performed && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Ações Executadas</p>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{os.actions_performed}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {isAdminOrTech && (
                      <button 
                        onClick={() => { setEditingOS(os); setIsModalOpen(true); }} 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center transition-colors"
                      >
                        <Edit2 size={14} className="mr-1.5" /> Editar Dados
                      </button>
                    )}
                    {isAdminOrTech && (
                      <button 
                        onClick={() => { setQuoteOS(os); setIsQuoteModalOpen(true); }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center transition-colors"
                      >
                        <Calculator size={14} className="mr-1.5" /> Gerar Orçamento
                      </button>
                    )}
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center transition-colors">
                      <Share2 size={14} className="mr-1.5" /> Compartilhar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingOS ? 'Atualizar OS' : 'Novo Chamado'}</h2>
              <button onClick={closeModal} className="p-2 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Condomínio</label>
                  <select 
                    disabled={isCondoUser || !!editingOS}
                    required 
                    name="condo_id" 
                    value={selectedCondoId} 
                    onChange={(e) => setSelectedCondoId(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Intervenção</label>
                  <select required name="type" defaultValue={editingOS?.type} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs">
                    {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Descrição</label>
                <textarea required name="description" defaultValue={editingOS?.problem_description} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"></textarea>
              </div>

              {isAdminOrTech && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 uppercase">Ações Técnicas</label>
                  <textarea name="actions" defaultValue={editingOS?.actions_performed} rows={3} className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-medium"></textarea>
                </div>
              )}

              {isAdminOrTech && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Valor Mão de Obra (R$)</label>
                    <input type="number" step="0.01" name="service_value" defaultValue={editingOS?.service_value} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Valor Materiais (R$)</label>
                    <input type="number" step="0.01" name="material_value" defaultValue={editingOS?.material_value} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border rounded-2xl font-black text-xs uppercase">Descartar</button>
                <button type="submit" disabled={saveStatus === 'saving'} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95">
                  {saveStatus === 'saving' ? 'Gravando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuoteModalOpen && quoteOS && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 md:p-6 overflow-hidden">
          <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[95vh] md:max-w-3xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center no-print">
              <h3 className="font-black uppercase text-xs tracking-widest">Orçamento</h3>
              <div className="flex space-x-2">
                 <button onClick={() => window.print()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                   <Printer size={16} className="mr-2" /> Gerar PDF / Imprimir
                 </button>
                 <button onClick={() => setIsQuoteModalOpen(false)} className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 print:p-0" id="quote-document">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                <div>
                   <div className="flex items-center space-x-2 mb-4">
                     <Wrench size={32} className="text-blue-600" />
                     <span className="font-black text-2xl uppercase tracking-tighter text-slate-900">SmartGestão</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sistemas de Manutenção e Gestão Predial</p>
                   <div className="space-y-1">
                      <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Contato: (65) 99699-5600</p>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-600 font-black flex items-center no-print hover:underline">
                        <MessageCircle size={12} className="mr-1" /> CLIQUE AQUI PARA FALAR NO WHATSAPP
                      </a>
                   </div>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-black uppercase text-slate-900 leading-none mb-1">Orçamento</h1>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">REF: {quoteOS.id}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase">{new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'})}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Destinatário</h4>
                  <p className="font-black text-slate-900 text-sm mb-1">{data.condos.find((c:any)=>c.id===quoteOS.condo_id)?.name}</p>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{data.condos.find((c:any)=>c.id===quoteOS.condo_id)?.address}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Resumo</h4>
                  <p className="font-black text-slate-900 text-sm uppercase">{quoteOS.type}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Diagnóstico / Problema</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium italic">{quoteOS.problem_description}</p>
                </div>
              </div>

              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase text-[9px] tracking-widest font-black">
                    <tr>
                      <th className="px-6 py-4">Serviço / Material</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-600">Mão de Obra Técnica</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(quoteOS.service_value)}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-600">Peças e Materiais</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(quoteOS.material_value)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-blue-50">
                    <tr>
                      <td className="px-6 py-5 font-black uppercase text-[10px] text-blue-900 tracking-widest">Total</td>
                      <td className="px-6 py-5 text-right text-xl font-black text-blue-900">
                        {formatCurrency((quoteOS.service_value || 0) + (quoteOS.material_value || 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          #quote-document { position: absolute; top: 0; left: 0; width: 100%; padding: 2cm !important; }
          .bg-slate-900 { background-color: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-blue-50 { background-color: #eff6ff !important; -webkit-print-color-adjust: exact; }
          .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default ServiceOrders;
