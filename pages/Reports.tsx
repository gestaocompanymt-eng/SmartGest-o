
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
  Layers,
  Zap,
  Droplets,
  Search,
  ArrowLeft
} from 'lucide-react';
import { AppData, UserRole, Condo, Equipment, System, ServiceOrder, OSStatus, OSType, MonitoringAlert } from '../types';

type ReportType = 'os' | 'equipment' | 'system' | 'monitoring';

const Reports: React.FC<{ data: AppData }> = ({ data }) => {
  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSindico = user?.role === UserRole.SINDICO_ADMIN;
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
    let alertList = data.monitoringAlerts.filter(a => {
      const eq = data.equipments.find(e => e.id === a.equipment_id);
      return eq?.condo_id === condoId;
    });

    // Filtro de Data (Aplicável a OS e Alertas)
    if (dateStart) {
      osList = osList.filter(os => os.created_at >= dateStart);
      alertList = alertList.filter(a => a.created_at >= dateStart);
    }
    if (dateEnd) {
      osList = osList.filter(os => os.created_at <= dateEnd + 'T23:59:59');
      alertList = alertList.filter(a => a.created_at <= dateEnd + 'T23:59:59');
    }

    // Filtro de Categoria
    if (categoryFilter !== 'all') {
      if (reportType === 'os') osList = osList.filter(os => os.type === categoryFilter);
      if (reportType === 'equipment') eqList = eqList.filter(eq => eq.type_id === categoryFilter);
      if (reportType === 'system') sysList = sysList.filter(sys => sys.type_id === categoryFilter);
    }

    return { condo, osList, eqList, sysList, alertList };
  }, [data, selectedCondoId, userCondoId, reportType, categoryFilter, dateStart, dateEnd]);

  const handlePrint = () => window.print();

  if (showPrintView) {
    return (
      <div className="bg-white text-slate-900 p-0 md:p-10 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header do Relatório */}
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6">
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                  Relatório: {
                    reportType === 'os' ? 'Ordens de Serviço' : 
                    reportType === 'equipment' ? 'Inventário de Ativos' : 
                    reportType === 'system' ? 'Sistemas Prediais' : 'Anomalias de Monitoramento'
                  }
                </h1>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">SmartGestão | Gestão Profissional de Manutenção</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emissão</p>
                <p className="text-xs font-bold">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
             </div>
          </div>

          {/* Info do Condomínio */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <div>
                <h2 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Unidade Gerencial</h2>
                <p className="text-lg font-black text-slate-900">{reportData.condo?.name || '---'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{reportData.condo?.address}</p>
             </div>
             <div className="text-right border-l border-slate-200 pl-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável Legal</p>
                <p className="text-sm font-bold text-slate-800">{reportData.condo?.manager || '---'}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Contrato: {reportData.condo?.contract_type}</p>
             </div>
          </div>

          {/* Conteúdo Dinâmico conforme ReportType */}
          <div className="space-y-6">
            {reportType === 'os' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 flex items-center text-slate-400">
                   <ClipboardList size={14} className="mr-2" /> Registros de Manutenção
                </h3>
                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-3 border-b font-black uppercase text-slate-500">Data</th>
                        <th className="p-3 border-b font-black uppercase text-slate-500">Tipo</th>
                        <th className="p-3 border-b font-black uppercase text-slate-500">Descrição / Ocorrência</th>
                        <th className="p-3 border-b font-black uppercase text-slate-500 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.osList.map(os => (
                        <tr key={os.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold whitespace-nowrap">{new Date(os.created_at).toLocaleDateString()}</td>
                          <td className="p-3 font-black uppercase text-blue-600">{os.type}</td>
                          <td className="p-3 text-slate-600 leading-tight">
                            <p className="font-bold text-slate-900">{os.problem_description}</p>
                            {os.actions_performed && <p className="mt-1 opacity-70 italic">Ação: {os.actions_performed.substring(0, 100)}...</p>}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
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

            {reportType === 'equipment' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 flex items-center text-slate-400">
                   <Layers size={14} className="mr-2" /> Inventário de Equipamentos
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {reportData.eqList.map(eq => {
                    const type = data.equipmentTypes.find(t => t.id === eq.type_id);
                    return (
                      <div key={eq.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                             <Zap size={20} />
                           </div>
                           <div>
                             <p className="text-[10px] font-black text-slate-900 uppercase">{type?.name} | {eq.manufacturer}</p>
                             <p className="text-xs font-medium text-slate-500">{eq.model} - Local: {eq.location}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase">Período de Manut.</p>
                           <p className="text-xs font-bold text-slate-800">{eq.maintenance_period} Dias</p>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reportType === 'monitoring' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 flex items-center text-red-500">
                   <AlertCircle size={14} className="mr-2" /> Histórico de Anomalias e Alertas IOT
                </h3>
                <div className="overflow-hidden border border-red-100 rounded-xl">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="p-3 border-b border-red-100 font-black uppercase text-red-600">Timestamp</th>
                        <th className="p-3 border-b border-red-100 font-black uppercase text-red-600">Equipamento</th>
                        <th className="p-3 border-b border-red-100 font-black uppercase text-red-600">Mensagem do Alerta</th>
                        <th className="p-3 border-b border-red-100 font-black uppercase text-red-600 text-right">Valor Lido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50">
                      {reportData.alertList.map(alert => {
                        const eq = data.equipments.find(e => e.id === alert.equipment_id);
                        return (
                          <tr key={alert.id} className="hover:bg-red-50/30">
                            <td className="p-3 font-bold whitespace-nowrap">{new Date(alert.created_at).toLocaleString()}</td>
                            <td className="p-3 font-black uppercase">{eq?.manufacturer} {eq?.model}</td>
                            <td className="p-3 text-red-700 font-medium">{alert.message}</td>
                            <td className="p-3 text-right font-black">{alert.value}</td>
                          </tr>
                        );
                      })}
                      {reportData.alertList.length === 0 && (
                        <tr><td colSpan={4} className="p-10 text-center italic text-slate-400">Nenhuma anomalia crítica registrada para este período.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'system' && (
               <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 flex items-center text-slate-400">
                    <Wrench size={14} className="mr-2" /> Integridade de Sistemas Prediais
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                   {reportData.sysList.map(sys => (
                     <div key={sys.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{sys.name}</p>
                        <p className="text-[11px] font-medium text-slate-700 mb-3">{sys.parameters || 'Parâmetros normais de operação.'}</p>
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                           <span>Local: {sys.location}</span>
                           <span>Revisão: {sys.maintenance_period}d</span>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            )}
          </div>

          {/* Rodapé de Assinaturas */}
          <div className="pt-20 grid grid-cols-2 gap-20">
             <div className="border-t border-slate-400 pt-4 text-center">
                <p className="text-xs font-black uppercase">{reportData.condo?.manager}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Responsável Legal / Gestor</p>
             </div>
             <div className="border-t border-slate-400 pt-4 text-center">
                <p className="text-xs font-black uppercase">Responsável Técnico</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SmartGestão Engenharia</p>
             </div>
          </div>

          <div className="fixed bottom-8 right-8 no-print flex gap-3">
             <button onClick={() => setShowPrintView(false)} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center">
               <ArrowLeft size={16} className="mr-2" /> Voltar ao Editor
             </button>
             <button onClick={handlePrint} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center">
               <Printer size={18} className="mr-2" /> Imprimir Documento
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
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel de Relatórios</h1>
          <p className="text-sm text-slate-500 font-medium">Extração técnica de dados para auditoria e gestão.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Sidebar de Configuração */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center mb-4">
              <Filter size={16} className="mr-2 text-blue-600" /> Parâmetros de Busca
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Módulo do Relatório</label>
                <select 
                  value={reportType} 
                  onChange={(e) => {
                    setReportType(e.target.value as ReportType);
                    setCategoryFilter('all');
                  }} 
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none"
                >
                  <option value="os">Ordens de Serviço</option>
                  <option value="equipment">Inventário de Equipamentos</option>
                  <option value="system">Sistemas Prediais</option>
                  <option value="monitoring">Anomalias de Monitoramento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Condomínio</label>
                <select 
                  value={selectedCondoId} 
                  onChange={(e) => setSelectedCondoId(e.target.value)} 
                  disabled={!!userCondoId} 
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none disabled:opacity-60"
                >
                  <option value="">Selecione...</option>
                  {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Filtrar por Categoria</label>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none"
                >
                  <option value="all">Geral (Tudo)</option>
                  {reportType === 'os' && Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                  {reportType === 'equipment' && data.equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  {reportType === 'system' && data.systemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Início</label>
                    <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-[10px]" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fim</label>
                    <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-[10px]" />
                 </div>
              </div>

              <button 
                onClick={() => setShowPrintView(true)} 
                disabled={!selectedCondoId} 
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <TrendingUp size={16} />
                <span>Gerar Relatório Profissional</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview / Resumo */}
        <div className="xl:col-span-3 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-6 rounded-[2rem] mb-6">
                <FileCheck size={48} className="text-blue-600" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-2">Editor de Documentos Ativo</h4>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                Utilize a barra lateral para filtrar os registros desejados. O relatório gerado obedece as normas de manutenção predial e está pronto para impressão ou envio digital ao síndico.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-12">
                 {[
                   { label: 'O.S Localizadas', val: reportData.osList.length, color: 'text-blue-600' },
                   { label: 'Ativos em Lista', val: reportData.eqList.length, color: 'text-slate-900' },
                   { label: 'Sistemas', val: reportData.sysList.length, color: 'text-emerald-600' },
                   { label: 'Anomalias', val: reportData.alertList.length, color: 'text-red-500' }
                 ].map((stat, i) => (
                   <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
