
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Printer, Filter, Building2, Wrench, Calendar, Download, ChevronRight,
  TrendingUp, CheckCircle2, FileCheck, ClipboardList, Layers, Zap, Search, ArrowLeft
} from 'lucide-react';
import { AppData, UserRole, Condo, Equipment, System, ServiceOrder, OSStatus, OSType } from '../types';

type ReportType = 'os' | 'equipment' | 'system';

const Reports: React.FC<{ data: AppData }> = ({ data }) => {
  const user = data.currentUser;
  const userCondoId = user?.condo_id;

  const [reportType, setReportType] = useState<ReportType>('os');
  const [selectedCondoId, setSelectedCondoId] = useState(userCondoId || '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    if (userCondoId) setSelectedCondoId(userCondoId);
  }, [userCondoId]);

  const accessibleCondos = useMemo(() => {
    return userCondoId ? data.condos.filter(c => c.id === userCondoId) : data.condos;
  }, [data.condos, userCondoId]);

  const reportData = useMemo(() => {
    const condoId = userCondoId || selectedCondoId;
    const condo = data.condos.find(c => c.id === condoId);
    
    let osList = data.serviceOrders.filter(os => os.condo_id === condoId);
    let eqList = data.equipments.filter(eq => eq.condo_id === condoId);
    let sysList = data.systems.filter(sys => sys.condo_id === condoId);

    if (dateStart) osList = osList.filter(os => os.created_at >= dateStart);
    if (dateEnd) osList = osList.filter(os => os.created_at <= dateEnd + 'T23:59:59');

    if (categoryFilter !== 'all') {
      if (reportType === 'os') osList = osList.filter(os => os.type === categoryFilter);
      if (reportType === 'equipment') eqList = eqList.filter(eq => eq.type_id === categoryFilter);
      if (reportType === 'system') sysList = sysList.filter(sys => sys.type_id === categoryFilter);
    }

    return { condo, osList, eqList, sysList };
  }, [data, selectedCondoId, userCondoId, reportType, categoryFilter, dateStart, dateEnd]);

  const getUserNameWithRole = (id?: string) => {
    if (!id) return '---';
    const found = data.users.find(u => u.id === id);
    if (!found) return 'Removido';
    return `${found.name} (${found.role})`;
  };

  if (showPrintView) {
    return (
      <div className="bg-white text-slate-900 p-0 md:p-10 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6">
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                  Relatório: {
                    reportType === 'os' ? 'Ordens de Serviço' : 
                    reportType === 'equipment' ? 'Inventário de Ativos' : 'Sistemas Prediais'
                  }
                </h1>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">SmartGestão | Gestão Profissional de Manutenção</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emissão</p>
                <p className="text-xs font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <div>
                <h2 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Unidade Gerencial</h2>
                <p className="text-lg font-black text-slate-900">{reportData.condo?.name || '---'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{reportData.condo?.address}</p>
             </div>
          </div>

          <div className="space-y-6">
            {reportType === 'os' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 flex items-center text-slate-400">
                   <ClipboardList size={14} className="mr-2" /> Histórico de Manutenção
                </h3>
                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-3 border-b font-black uppercase">Data</th>
                        <th className="p-3 border-b font-black uppercase">Tipo</th>
                        <th className="p-3 border-b font-black uppercase">Responsável</th>
                        <th className="p-3 border-b font-black uppercase">Descrição</th>
                        <th className="p-3 border-b font-black uppercase text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.osList.map(os => (
                        <tr key={os.id}>
                          <td className="p-3">{new Date(os.created_at).toLocaleDateString()}</td>
                          <td className="p-3 font-black text-blue-600">{os.type}</td>
                          <td className="p-3">{getUserNameWithRole(os.technician_id)}</td>
                          <td className="p-3">{os.problem_description}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-100">
                              {os.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="fixed bottom-8 right-8 no-print flex gap-3">
             <button onClick={() => setShowPrintView(false)} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">Voltar</button>
             <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center">
               <Printer size={18} className="mr-2" /> Imprimir
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 leading-tight">Relatórios de Gestão</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Módulo</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                <option value="os">Ordens de Serviço</option>
                <option value="equipment">Equipamentos</option>
                <option value="system">Sistemas</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Condomínio</label>
              <select value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} disabled={!!userCondoId} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs">
                {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={() => setShowPrintView(true)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest">Gerar Relatório</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
