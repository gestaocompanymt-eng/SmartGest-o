
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserPlus, User, Mail, Shield, Plus, Settings2, Trash2, Edit2, X, Key, 
  CheckCircle2, Save, FileSearch, Calendar, Building2, Wrench, Settings, 
  Download, Printer, FileText, UserCheck, LayoutList, RotateCcw, AlertCircle,
  Bell, BellRing, Smartphone, Info
} from 'lucide-react';
import { UserRole, User as UserType, ServiceOrder, Condo, System, Equipment } from '../types';
import { requestNotificationPermission, sendLocalNotification, checkNotificationSupport } from '../notificationService';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  // Estados para Gestão de Usuários
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Estados para Relatórios
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [selectedTechId, setSelectedTechId] = useState('all');
  const [selectedSystemId, setSelectedSystemId] = useState('all');
  const [selectedEquipId, setSelectedEquipId] = useState('all');
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);

  // Estados de Notificação
  const [notifStatus, setNotifStatus] = useState(checkNotificationSupport());

  // Lógica de Filtragem de Relatórios
  const filteredOrders = useMemo(() => {
    return data.serviceOrders.filter((os: ServiceOrder) => {
      const osDateObj = new Date(os.createdAt);
      if (isNaN(osDateObj.getTime())) return false;
      const osDate = osDateObj.toISOString().split('T')[0];
      
      const matchDate = (!reportStartDate || osDate >= reportStartDate) && 
                        (!reportEndDate || osDate <= reportEndDate);
      const matchCondo = selectedCondoId === 'all' || os.condoId === selectedCondoId;
      const matchTech = selectedTechId === 'all' || os.technicianId === selectedTechId;
      const matchSystem = selectedSystemId === 'all' || os.systemId === selectedSystemId;
      const matchEquip = selectedEquipId === 'all' || os.equipmentId === selectedEquipId;

      return matchDate && matchCondo && matchTech && matchSystem && matchEquip;
    });
  }, [data.serviceOrders, reportStartDate, reportEndDate, selectedCondoId, selectedTechId, selectedSystemId, selectedEquipId]);

  const availableSystems = useMemo(() => {
    if (selectedCondoId === 'all') return [];
    return data.systems.filter((s: System) => s.condoId === selectedCondoId);
  }, [data.systems, selectedCondoId]);

  const availableEquipments = useMemo(() => {
    if (selectedCondoId === 'all') return [];
    return data.equipments.filter((e: Equipment) => e.condoId === selectedCondoId);
  }, [data.equipments, selectedCondoId]);

  const clearFilters = () => {
    setReportStartDate('');
    setReportEndDate('');
    setSelectedCondoId('all');
    setSelectedTechId('all');
    setSelectedSystemId('all');
    setSelectedEquipId('all');
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(checkNotificationSupport());
    if (granted) {
      sendLocalNotification("Notificações Ativas! ✅", "Você agora receberá alertas de novas OS e mudanças de status.");
    }
  };

  const sendTestNotification = () => {
    sendLocalNotification("Teste de Sistema 🛠️", "Esta é uma notificação de teste do SmartGestão para validar seu celular.");
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: UserType = {
      id: editingUser?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as UserRole,
      password: formData.get('password') as string,
    };

    if (editingUser) {
      updateData({
        ...data,
        users: data.users.map((u: UserType) => u.id === editingUser.id ? userData : u)
      });
    } else {
      updateData({
        ...data,
        users: [...data.users, userData]
      });
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (data.users.length <= 1) {
      alert("Não é possível remover o único usuário do sistema.");
      return;
    }
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      updateData({
        ...data,
        users: data.users.filter((u: UserType) => u.id !== id)
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Painel de Controle</h1>
          <p className="text-sm text-slate-500">Gestão operacional, equipe e notificações.</p>
        </div>
        <button 
          onClick={clearFilters}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >
          <RotateCcw size={14} />
          <span>Limpar Filtros</span>
        </button>
      </div>

      {/* SEÇÃO DE NOTIFICAÇÕES - NOVO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-black text-slate-900 flex items-center uppercase tracking-widest text-xs">
            <Bell size={18} className="mr-2 text-blue-600" /> Configurações de Notificação
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl ${notifStatus.permission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {notifStatus.permission === 'granted' ? <BellRing size={24} /> : <Bell size={24} />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Status das Notificações</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    {notifStatus.permission === 'granted' ? 'Permitidas neste dispositivo' : 
                     notifStatus.permission === 'denied' ? 'Bloqueadas pelo navegador' : 'Aguardando autorização'}
                  </p>
                </div>
              </div>

              {!notifStatus.isPWA && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3">
                  <Smartphone size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Dica para iPhone/Android</p>
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      Para receber notificações com o app fechado, clique no botão de "Compartilhar" do navegador e selecione <b>"Adicionar à Tela de Início"</b>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {notifStatus.permission !== 'granted' ? (
                <button 
                  onClick={handleEnableNotifications}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Ativar Notificações
                </button>
              ) : (
                <button 
                  onClick={sendTestNotification}
                  className="flex-1 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Enviar Notificação de Teste
                </button>
              )}
              <div className="hidden sm:block w-px bg-slate-100 h-10 self-center"></div>
              <div className="flex-1 flex items-center space-x-2 text-slate-400">
                <Info size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight">As notificações são locais e dependem da sincronização em tempo real.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE RELATÓRIOS E AUDITORIA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-black text-slate-900 flex items-center uppercase tracking-widest text-xs">
            <FileSearch size={18} className="mr-2 text-blue-600" /> Centro de Relatórios e Auditoria
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <Calendar size={12} className="mr-1" /> Período Inicial
              </label>
              <input 
                type="date" 
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <Calendar size={12} className="mr-1" /> Período Final
              </label>
              <input 
                type="date" 
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <Building2 size={12} className="mr-1" /> Selecionar Condomínio
              </label>
              <select 
                value={selectedCondoId}
                onChange={(e) => { 
                  setSelectedCondoId(e.target.value); 
                  setSelectedSystemId('all'); 
                  setSelectedEquipId('all'); 
                }}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="all">Todos os Condomínios</option>
                {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <UserCheck size={12} className="mr-1" /> Filtrar por Técnico
              </label>
              <select 
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="all">Todos os Técnicos</option>
                {data.users.map((u: UserType) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest flex items-center ${selectedCondoId === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                <Settings size={12} className="mr-1" /> Filtrar por Sistema
              </label>
              <select 
                disabled={selectedCondoId === 'all'}
                value={selectedSystemId}
                onChange={(e) => setSelectedSystemId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none disabled:opacity-50"
              >
                <option value="all">Todos os Sistemas</option>
                {availableSystems.map((s: System) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest flex items-center ${selectedCondoId === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                <Wrench size={12} className="mr-1" /> Filtrar por Equipamento
              </label>
              <select 
                disabled={selectedCondoId === 'all'}
                value={selectedEquipId}
                onChange={(e) => setSelectedEquipId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none disabled:opacity-50"
              >
                <option value="all">Todos os Equipamentos</option>
                {availableEquipments.map((e: Equipment) => <option key={e.id} value={e.id}>{e.manufacturer} - {e.model}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2.5 rounded-xl shadow-sm">
                <LayoutList size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-black text-blue-900">{filteredOrders.length} Ordens de Serviço encontradas</p>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Baseado nos filtros atuais</p>
              </div>
            </div>
            <button 
              onClick={() => setIsReportViewOpen(true)}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
            >
              <Printer size={16} className="mr-2" /> Gerar Relatório Consolidado
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-xs">
              <User size={18} className="mr-2 text-blue-600" /> Equipe Técnica
            </h3>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="text-[10px] font-black text-blue-600 flex items-center hover:underline uppercase tracking-widest"
            >
              <UserPlus size={14} className="mr-1" /> Adicionar Técnico
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {data.users.map((user: UserType) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                    user.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-blue-600'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        user.role === UserRole.ADMIN ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center font-bold uppercase tracking-tight">
                      <Mail size={10} className="mr-1" /> {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteUser(user.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE RELATÓRIO PARA IMPRESSÃO */}
      {isReportViewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[95vh] md:max-w-5xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Relatório de Atividades</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Consolidado Técnico</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center">
                  <Printer size={16} className="mr-2" /> Imprimir / PDF
                </button>
                <button onClick={() => setIsReportViewOpen(false)} className="p-2.5 bg-white text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl active:bg-slate-100">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10" id="printable-admin-report">
              <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-8 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-600 p-2 rounded-lg text-white"><Wrench size={24} /></div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">SMARTGESTÃO</h1>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Relatório Técnico de Auditoria</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emissão</p>
                  <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Condomínio</p>
                  <p className="text-xs font-black text-slate-800">{selectedCondoId === 'all' ? 'Rede Global' : data.condos.find((c: any) => c.id === selectedCondoId)?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Período</p>
                  <p className="text-xs font-black text-slate-800">{reportStartDate || 'Início'} — {reportEndDate || 'Hoje'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total de OS</p>
                  <p className="text-xs font-black text-slate-800">{filteredOrders.length} chamados</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auditor</p>
                  <p className="text-xs font-black text-slate-800">{data.currentUser?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center">
                  <LayoutList size={16} className="mr-2 text-blue-600" /> Detalhamento de Ocorrências
                </h2>
                
                {filteredOrders.length > 0 ? (
                  <div className="divide-y divide-slate-100 border rounded-3xl overflow-hidden bg-white shadow-sm">
                    {filteredOrders.map((os: ServiceOrder) => {
                      const condo = data.condos.find((c: any) => c.id === os.condoId);
                      const tech = data.users.find((u: any) => u.id === os.technicianId);
                      const sys = os.systemId ? data.systems.find((s: any) => s.id === os.systemId) : null;
                      const eq = os.equipmentId ? data.equipments.find((e: any) => e.id === os.equipmentId) : null;

                      return (
                        <div key={os.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{os.id}</span>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                                os.type === 'Preventiva' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                              }`}>{os.type}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{new Date(os.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <User size={12} className="mr-1.5" /> Resp: {tech?.name || 'Não identificado'}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Local / Objeto</p>
                                  <p className="text-xs font-bold text-slate-800">
                                    {condo?.name} {sys ? `• Sistema: ${sys.name}` : ''} {eq ? `• Ativo: ${eq.manufacturer} ${eq.model}` : ''}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição</p>
                                  <p className="text-xs text-slate-600 leading-relaxed italic">{os.problemDescription}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ações e Diagnóstico</p>
                                  <p className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-medium">{os.actionsPerformed || 'Atendimento em andamento...'}</p>
                                </div>
                                {os.photosAfter && os.photosAfter.length > 0 && (
                                  <div className="flex gap-2">
                                    {os.photosAfter.slice(0, 3).map((img, idx) => (
                                      <img key={idx} src={img} className="w-12 h-12 rounded-lg object-cover border border-slate-200" alt="Evidência" />
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50 flex flex-col items-center">
                    <AlertCircle size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma Ordem de Serviço encontrada para os filtros aplicados.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] shrink-0 no-print">
              <span>SmartGestão Intelligence v2.4.0</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingUser ? 'Editar Usuário' : 'Novo Técnico/Admin'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 md:p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required name="name" defaultValue={editingUser?.name} placeholder="Ex: João Silva" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Login / E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required name="email" defaultValue={editingUser?.email} placeholder="Ex: joao@empresa.com" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha de Acesso</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required name="password" type="text" defaultValue={editingUser?.password} placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Papel / Nível de Acesso</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select name="role" defaultValue={editingUser?.role || UserRole.TECHNICIAN} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none font-bold text-xs">
                    <option value={UserRole.ADMIN}>Administrador (Acesso Total)</option>
                    <option value={UserRole.TECHNICIAN}>Técnico (Operacional)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-4 py-4 border-2 border-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs active:scale-95 transition-all">Descartar</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center">
                  <Save size={18} className="mr-2" /> Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #printable-admin-report { height: auto !important; overflow: visible !important; position: absolute; top: 0; left: 0; width: 100%; padding: 0 !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .fixed { position: static !important; }
          .rounded-3xl { border-radius: 0 !important; }
          .shadow-sm, .shadow-2xl { box-shadow: none !important; }
          .bg-slate-50 { background-color: transparent !important; }
          .border { border-color: #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
