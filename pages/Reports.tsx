
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Filter, 
  Building2, 
  Wrench, 
  Calendar, 
  Download, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  ClipboardList,
  Layers
} from 'lucide-react';
import { AppData, UserRole, Condo, Equipment, System, ServiceOrder, OSStatus, OSType } from '../types';

const Reports: React.FC<{ data: AppData }> = ({ data }) => {
  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSindico = user?.role === UserRole.SINDICO_ADMIN;
  const userCondoId = user?.condo_id;

  const [reportType, setReportType] = useState<'condo' | 'equipment' | 'system' | 'os'>('condo');
  const [selectedCondoId, setSelectedCondoId] = useState(userCondoId || '');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    if (userCondoId) setSelectedCondoId(userCondoId);
  }, [userCondoId]);

  const accessibleCondos = useMemo(() => {
    return userCondoId ? data.condos.filter(c => c.id === userCondoId) : data.condos;
  }, [data.condos, userCondoId]);

  const generateReportData = () => {
    const condoId = userCondoId || selectedCondoId;
    const condo = data.condos.find(c => c.id === condoId);
    let filteredOS = data.serviceOrders.filter(os => os.condo_id === condoId);
    if (dateStart) filteredOS = filteredOS.filter(os => os.created_at >= dateStart);
    if (dateEnd) filteredOS = filteredOS.filter(os => os.created_at <= dateEnd + 'T23:59:59');

    const stats = {
      total: filteredOS.length,
      completed: filteredOS.filter(o => o.status === OSStatus.COMPLETED).length,
      pending: filteredOS.filter(o => o.status === OSStatus.OPEN || o.status === OSStatus.IN_PROGRESS).length,
      preventive: filteredOS.filter(o => o.type === OSType.PREVENTIVE).length,
      corretive: filteredOS.filter(o => o.type === OSType.CORRETIVE).length,
      vistorias: filteredOS.filter(o => o.type === OSType.VISTORIA).length,
      totalCost: filteredOS.reduce((acc, curr) => acc + (curr.service_value || 0) + (curr.material_value || 0), 0)
    };
    return { condo, filteredOS, stats };
  };

  const report = generateReportData();
  const handlePrint = () => window.print();

  if (showPrintView) {
    return (
      <div className="bg-white text-slate-900 p-0 md:p-10 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-10 border-slate-200">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Relatório Técnico de Gestão</h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">SmartGestão | NBR 5674 e NBR 14037</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Emissão em:</p>
                <p className="text-xs font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
             </div>
          </div>
          <section className="space-y-4">
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Unidade Gerencial</h2>
                   <p className="text-xl font-black text-slate-900">{report.condo?.name || 'Não Selecionado'}</p>
                   <p className="text-xs text-slate-500 font-medium">{report.condo?.address}</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Gestor Responsável</p>
                   <p className="text-sm font-bold text-slate-800">{report.condo?.manager}</p>
                </div>
             </div>
          </section>
          
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest border-b pb-2 flex items-center">
               <ClipboardList size={16} className="mr-2" /> Histórico de Intervenções Técnicas
            </h3>
            <div className="overflow-hidden border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 border-b font-black uppercase text-[9px] text-slate-500">Data</th>
                    <th className="p-4 border-b font-black uppercase text-[9px] text-slate-500">Tipo</th>
                    <th className="p-4 border-b font-black uppercase text-[9px] text-slate-500">Descrição Técnica / Ocorrência</th>
                    <th className="p-4 border-b font-black uppercase text-[9px] text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.filteredOS.map(os => (
                    <tr key={os.id}>
                      <td className="p-4 font-bold">{new Date(os.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-black uppercase text-[9px]">{os.type}</td>
                      <td className="p-4 text-slate-600 font-medium">{os.problem_description}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {os.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {report.filteredOS.length === 0 && (
                    <tr><td colSpan={4} className="p-10 text-center italic text-slate-400">Nenhum dado registrado para o período e filtros selecionados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="pt-20 grid grid-cols-2 gap-20">
             <div className="border-t border-slate-400 pt-4 text-center">
                <p className="text-xs font-black uppercase">{report.condo?.manager}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Representante Legal / Síndico</p>
             </div>
             <div className="border-t border-slate-400 pt-4 text-center">
                <p className="text-xs font-black uppercase">Eng. Adriano Pantaroto</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Responsável Técnico / Auditor</p>
             </div>
          </div>
          <div className="fixed bottom-8 right-8 no-print flex gap-3">
             <button onClick={() => setShowPrintView(false)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">Voltar ao Editor</button>
             <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center">
               <Printer size={16} className="mr-2" /> Imprimir / PDF
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Módulo de Relatórios</h1>
          <p className="text-sm text-slate-500 font-medium">Documentos técnicos para auditoria e prestação de contas.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center mb-4">
              <Filter size={16} className="mr-2 text-blue-600" /> Configuração do Escopo
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Condomínio</label>
                <select value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} disabled={!!userCondoId} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-60">
                  <option value="">Selecione...</option>
                  {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={() => setShowPrintView(true)} disabled={!selectedCondoId && !userCondoId} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all">
                <TrendingUp size={16} />
                <span>Gerar Relatório Profissional</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
