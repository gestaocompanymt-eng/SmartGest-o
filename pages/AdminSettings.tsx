
import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  UserPlus, User, Trash2, Edit2, X, Save, Building2, LayoutList, RotateCcw, Printer, Filter, Calendar, Calculator, Settings2, Plus, Layers, Monitor
} from 'lucide-react';
import { UserRole, User as UserType, ServiceOrder, Condo, OSStatus, EquipmentType, SystemType } from '../types';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  
  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TECHNICIAN);

  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [selectedTechId, setSelectedTechId] = useState('all');

  const [newEqType, setNewEqType] = useState('');
  const [newSysType, setNewSysType] = useState('');

  const filteredReportOrders = useMemo(() => {
    return data.serviceOrders.filter((os: ServiceOrder) => {
      const date = new Date(os.created_at).toISOString().split('T')[0];
      const matchStart = reportStartDate ? date >= reportStartDate : true;
      const matchEnd = reportEndDate ? date <= reportEndDate : true;
      const matchCondo = selectedCondoId === 'all' ? true : os.condo_id === selectedCondoId;
      const matchTech = selectedTechId === 'all' ? true : os.technician_id === selectedTechId;
      return matchStart && matchEnd && matchCondo && matchTech;
    });
  }, [data.serviceOrders, reportStartDate, reportEndDate, selectedCondoId, selectedTechId]);

  const totals = useMemo(() => {
    return filteredReportOrders.reduce((acc: any, curr: ServiceOrder) => ({
      services: acc.services + (curr.service_value || 0),
      materials: acc.materials + (curr.material_value || 0),
      count: acc.count + 1
    }), { services: 0, materials: 0, count: 0 });
  }, [filteredReportOrders]);

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    
    // Gerar ID se for novo
    const userId = editingUser?.id || `user-${Date.now()}`;
    
    const userData: UserType = {
      id: userId,
      name: formData.get('name') as string,
      email: (formData.get('email') as string).trim().toLowerCase(),
      role: role,
      password: (formData.get('password') as string).trim(),
      condo_id: role === UserRole.CONDO_USER ? (formData.get('condoId') as string) : undefined
    };

    const newUsersList = editingUser 
      ? data.users.map((u: UserType) => u.id === editingUser.id ? userData : u) 
      : [...data.users, userData];

    // Aqui o updateData no App.tsx cuidará do upsert no Supabase
    await updateData({ ...data, users: newUsersList });
    
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (confirm('Deseja remover o acesso deste colaborador permanentemente?')) {
      updateData({ ...data, users: data.users.filter((u: any) => u.id !== id) });
    }
  };

  const handleAddEquipmentType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqType.trim()) return;
    const newType: EquipmentType = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEqType.trim()
    };
    updateData({ ...data, equipmentTypes: [...data.equipmentTypes, newType] });
    setNewEqType('');
  };

  const handleAddSystemType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSysType.trim()) return;
    const newType: SystemType = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSysType.trim()
    };
    updateData({ ...data, systemTypes: [...data.systemTypes, newType] });
    setNewSysType('');
  };

  const removeEquipmentType = (id: string) => {
    if (confirm('Remover esta categoria de equipamento?')) {
      updateData({ ...data, equipmentTypes: data.equipmentTypes.filter((t: any) => t.id !== id) });
    }
  };

  const removeSystemType = (id: string) => {
    if (confirm('Remover este tipo de sistema?')) {
      updateData({ ...data, systemTypes: data.systemTypes.filter((t: any) => t.id !== id) });
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 pb-12">
      <div className="no-print">
        <h1 className="text-2xl font-black text-slate-900 leading-tight">Administração</h1>
        <p className="text-sm text-slate-500 font-medium">Gestão técnica, equipe e controle de acessos.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 no-print">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-xs">
                <LayoutList size={18} className="mr-2 text-blue-600" /> Relatórios Operacionais
              </h3>
              <div className="flex items-center space-x-2">
                 <button 
                  onClick={() => { setReportStartDate(''); setReportEndDate(''); setSelectedCondoId('all'); setSelectedTechId('all'); }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                  title="Limpar Filtros"
                 >
                   <RotateCcw size={16} />
                 </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Data Início</label>
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Data Fim</label>
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Condomínio</label>
                  <select value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                    <option value="all">Todos</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Técnico</label>
                  <select value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                    <option value="all">Todos</option>
                    {data.users.filter((u:any) => u.role !== UserRole.CONDO_USER).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {filteredReportOrders.length > 0 ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Total de Atendimentos</p>
                        <p className="text-xl font-black text-blue-900">{totals.count}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Mão de Obra Total</p>
                        <p className="text-xl font-black text-emerald-900">{formatCurrency(totals.services)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Materiais Totais</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(totals.materials)}</p>
                      </div>
                   </div>

                   <div className="flex justify-end">
                      <button 
                        onClick={() => window.print()}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                      >
                        <Printer size={16} className="mr-2" /> Gerar Relatório Consolidado
                      </button>
                   </div>
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                   <Filter size={40} className="mb-2 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Nenhum dado para os filtros selecionados</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-xs">
                <User size={18} className="mr-2 text-blue-600" /> Colaboradores e Síndicos
              </h3>
              <button onClick={() => { setEditingUser(null); setSelectedRole(UserRole.TECHNICIAN); setIsUserModalOpen(true); }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Novo Membro</button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.users.map((user: UserType) => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${user.role === UserRole.ADMIN ? 'bg-slate-900' : user.role === UserRole.CONDO_USER ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-100 text-slate-500">{user.role}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {user.email} {user.condo_id && `• ${data.condos.find((c:any)=>c.id===user.condo_id)?.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => { setEditingUser(user); setSelectedRole(user.role); setIsUserModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                    <button onClick={() => deleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-6 border-b bg-slate-900 text-white">
                <h3 className="font-black flex items-center uppercase tracking-widest text-[10px]">
                  <Settings2 size={16} className="mr-2 text-blue-400" /> Configurações Técnicas
                </h3>
             </div>
             
             <div className="p-6 space-y-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                     <Layers size={14} className="mr-2" /> Categorias de Ativos
                   </h4>
                   <form onSubmit={handleAddEquipmentType} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newEqType} 
                        onChange={(e) => setNewEqType(e.target.value)} 
                        placeholder="Ex: Geradores" 
                        className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus size={16} />
                      </button>
                   </form>
                   <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {data.equipmentTypes.map((t: EquipmentType) => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl group">
                           <span className="text-xs font-bold text-slate-700">{t.name}</span>
                           <button onClick={() => removeEquipmentType(t.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                     <Monitor size={14} className="mr-2" /> Tipos de Sistemas
                   </h4>
                   <form onSubmit={handleAddSystemType} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newSysType} 
                        onChange={(e) => setNewSysType(e.target.value)} 
                        placeholder="Ex: Ar Condicionado Central" 
                        className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus size={16} />
                      </button>
                   </form>
                   <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {data.systemTypes.map((t: SystemType) => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl group">
                           <span className="text-xs font-bold text-slate-700">{t.name}</span>
                           <button onClick={() => removeSystemType(t.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="hidden print:block p-8" id="print-report">
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Relatório Consolidado</h1>
            <p className="text-sm font-bold text-slate-500 uppercase">SmartGestão - Sistemas de Manutenção</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-900 uppercase">Período: {reportStartDate || 'Início'} até {reportEndDate || 'Fim'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Gerado em: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="border-2 border-slate-100 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total OS</p>
            <p className="text-3xl font-black text-slate-900">{totals.count}</p>
          </div>
          <div className="border-2 border-slate-100 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mão de Obra</p>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(totals.services)}</p>
          </div>
          <div className="border-2 border-slate-100 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Materiais</p>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(totals.materials)}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-4 text-[10px] font-black uppercase tracking-widest">ID / Data</th>
              <th className="py-4 text-[10px] font-black uppercase tracking-widest">Condomínio</th>
              <th className="py-4 text-[10px] font-black uppercase tracking-widest">Descrição do Serviço</th>
              <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReportOrders.map((os: ServiceOrder) => (
              <tr key={os.id}>
                <td className="py-4">
                  <p className="text-xs font-black text-slate-900">{os.id}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(os.created_at).toLocaleDateString()}</p>
                </td>
                <td className="py-4">
                  <p className="text-xs font-bold text-slate-700">{data.condos.find((c:any)=>c.id===os.condo_id)?.name}</p>
                  <p className="text-[9px] font-bold text-blue-600 uppercase">{os.type}</p>
                </td>
                <td className="py-4 text-xs text-slate-600 italic max-w-xs">{os.problem_description}</td>
                <td className="py-4 text-right font-black text-slate-900 text-xs">
                  {formatCurrency((os.service_value || 0) + (os.material_value || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td colSpan={3} className="py-6 text-right font-black uppercase text-sm">Total Geral:</td>
              <td className="py-6 text-right font-black text-blue-600 text-lg">{formatCurrency(totals.services + totals.materials)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-20">
           <div className="text-center">
              <div className="border-b border-slate-400 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-slate-500">Responsável Técnico</p>
           </div>
           <div className="text-center">
              <div className="border-b border-slate-400 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-slate-500">Gestão / Condomínio</p>
           </div>
        </div>
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingUser ? 'Editar Acesso' : 'Novo Acesso'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input required name="name" defaultValue={editingUser?.name} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail / Login</label>
                <input required name="email" defaultValue={editingUser?.email} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha de Acesso</label>
                <input required name="password" type="text" defaultValue={editingUser?.password} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargo / Permissão</label>
                <select name="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold">
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.TECHNICIAN}>Técnico de Campo</option>
                  <option value={UserRole.CONDO_USER}>Usuário de Condomínio (Síndico)</option>
                </select>
              </div>
              {selectedRole === UserRole.CONDO_USER && (
                <div className="space-y-1 animate-in fade-in">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Condomínio Atrelado</label>
                  <select required name="condoId" defaultValue={editingUser?.condo_id} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-xs uppercase transition-all active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-slate-900/20 transition-all active:scale-95">Salvar Acesso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; overflow: visible !important; }
          main { overflow: visible !important; }
          #root { display: block !important; }
          header, aside { display: none !important; }
          .print-block { display: block !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
