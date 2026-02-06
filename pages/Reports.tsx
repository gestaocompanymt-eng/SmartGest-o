
import React, { useState, useMemo } from 'react';
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
  const [reportType, setReportType] = useState<'condo' | 'equipment' | 'system' | 'os'>('condo');
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);

  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSindico = user?.role === UserRole.SINDICO_ADMIN;
  const userCondoId = user?.condo_id;

  // Filtragem de condomínios por acesso
  const accessibleCondos = useMemo(() => {
    return isSindico 
      ? data.condos.filter(c => c.id === userCondoId) 
      : data.condos;
  }, [data.condos, isSindico, userCondoId]);

  // Alvos secundários baseados no condomínio selecionado
  const targets = useMemo(() => {
    const condoId = isSindico ? userCondoId : selectedCondoId;
    if (!condoId) return [];
    
    if (reportType === 'equipment') return data.equipments.filter(e => e.condo_id === condoId);
    if (reportType === 'system') return data.systems.filter(s => s.condo_id === condoId);
    return [];
  }, [reportType, selectedCondoId, userCondoId, isSindico, data.equipments, data.systems]);

  const generateReportData = () => {
    const condoId = isSindico ? userCondoId : selectedCondoId;
    const condo = data.condos.find(c => c.id === condoId);
    
    let filteredOS = data.serviceOrders.filter(os => os.condo_id === condoId);
    
    if (dateStart) filteredOS = filteredOS.filter(os => os.created_at >= dateStart);
    if (dateEnd) filteredOS = filteredOS.filter(os => os.created_at <= dateEnd + 'T23:59:59');

    if (reportType === 'equipment' && selectedTargetId) {
      filteredOS = filteredOS.filter(os => os.equipment_id === selectedTargetId);
    } else if (reportType === 'system' && selectedTargetId) {
      filteredOS = filteredOS.filter(os => os.system_id === selectedTargetId);
    }

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

  const handlePrint = () => {
    window.print();
  };

  if (showPrintView) {
    return (
      <div className="bg-white text-slate-900 p-0 md:p-10 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-10 border-slate-200">
          {/* Cabeçalho ABNT */}
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

          {/* Dados da Edificação */}
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

          {/* Resumo Executivo / KPIs */}
          <section className="grid grid-cols-4 gap-4">
             <div className="border border-slate-100 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Total Ocorrências</p>
                <p className="text-2xl font-black">{report.stats.total}</p>
             </div>
             <div className="border border-slate-100 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Conclusão %</p>
                <p className="text-2xl font-black">{report.stats.total > 0 ? Math.round((report.stats.completed / report.stats.total) * 100) : 0}%</p>
             </div>
             <div className="border border-slate-100 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Investimento Total</p>
                <p className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(report.stats.totalCost)}</p>
             </div>
             <div className="border border-slate-100 p-4 rounded-2xl bg-slate-900 text-white">
                <p className="text-[8px] font-black text-white/40 uppercase mb-2">Preventivas</p>
                <p className="text-2xl font-black">{report.stats.preventive}</p>
             </div>
          </section>

          {/* Listagem de Manutenções */}
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

          {/* Rodapé e Assinaturas */}
          <div className="pt-20 grid grid-cols-2 gap-20">
             <div className="border-t border-slate-400 pt-4 text-center">
                <p className="text-xs font-black uppercase">{report.condo?.manager}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Representante Legal / Síndico</p>
             </div>
             <div className="border-t border-slate-400 pt-4 text-center">
                <p className="text-xs font-black uppercase">SmartGestão Tecnologia</p>
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
          <p className="text-sm text-slate-500 font-medium">Geração de documentos técnicos para auditoria e prestação de contas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Configuração do Relatório */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center mb-4">
              <Filter size={16} className="mr-2 text-blue-600" /> Configuração do Escopo
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Condomínio</label>
                <select 
                  value={selectedCondoId} 
                  onChange={(e) => setSelectedCondoId(e.target.value)}
                  disabled={!!userCondoId}
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none"
                >
                  <option value="">Selecione...</option>
                  {accessibleCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo de Relatório</label>
                <select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none"
                >
                  <option value="condo">Geral do Condomínio</option>
                  <option value="equipment">Por Equipamento</option>
                  <option value="system">Por Sistema Predial</option>
                  <option value="os">Histórico de Ordens de Serviço</option>
                </select>
              </div>

              {(reportType === 'equipment' || reportType === 'system') && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    {reportType === 'equipment' ? 'Equipamento' : 'Sistema'}
                  </label>
                  <select 
                    value={selectedTargetId} 
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none"
                  >
                    <option value="">Todos...</option>
                    {targets.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.manufacturer ? `${t.manufacturer} ${t.model}` : t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Início</label>
                  <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fim</label>
                  <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" />
                </div>
              </div>

              <button 
                onClick={() => setShowPrintView(true)}
                disabled={!selectedCondoId && !isSindico}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <TrendingUp size={16} />
                <span>Gerar Relatório Profissional</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dicas e Normas */}
        <div className="xl:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Layers size={80} /></div>
                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Visão Administrativa</h4>
                 <p className="text-xs text-white/60 leading-relaxed font-medium">
                   Nossos relatórios consolidam indicadores de performance (KPIs) para facilitar a tomada de decisão do conselho e síndicos. 
                   Utilizamos o histórico de preventivas para prever vida útil de ativos.
                 </p>
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><FileCheck size={80} /></div>
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Norma NBR 5674</h4>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium">
                   A estrutura gerada segue as recomendações da ABNT para Manutenção de Edificações, incluindo registros detalhados de manutenções periódicas e vistorias cautelares de rotina.
                 </p>
              </div>
           </div>

           <div className="bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] p-10 flex items-start space-x-6">
              <div className="p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-500/20 text-white">
                 <AlertCircle size={32} />
              </div>
              <div>
                 <h4 className="text-lg font-black text-slate-900 leading-none mb-2">Pronto para Auditoria</h4>
                 <p className="text-sm text-slate-600 font-medium leading-relaxed">
                   Todos os relatórios incluem carimbo de data, identificação técnica e filtros por condomínio. Ao salvar em PDF, você gera um documento imutável ideal para assembleias e apresentações de gestão.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
