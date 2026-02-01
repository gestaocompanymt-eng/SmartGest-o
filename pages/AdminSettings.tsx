
import React, { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  UserPlus, User, Trash2, Edit2, X, Save, Building2, LayoutList, RotateCcw, Printer, Filter, Calendar, Calculator, Settings2, Plus, Layers, Monitor, Database, CheckCircle, AlertTriangle, RefreshCw, Cpu, Copy, Check
} from 'lucide-react';
import { UserRole, User as UserType, ServiceOrder, Condo, OSStatus, EquipmentType, SystemType } from '../types';
import { supabase } from '../supabase';

const AdminSettings: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const [copied, setCopied] = useState(false);
  
  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TECHNICIAN);
  const [tableStatus, setTableStatus] = useState<Record<string, 'checking' | 'ok' | 'error'>>({});

  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [selectedCondoId, setSelectedCondoId] = useState('all');
  const [selectedTechId, setSelectedTechId] = useState('all');

  const checkDatabaseHealth = async () => {
    const tables = ['users', 'condos', 'equipments', 'systems', 'service_orders', 'appointments', 'nivel_caixa', 'monitoring_alerts'];
    const newStatus: any = {};
    for (const table of tables) {
      newStatus[table] = 'checking';
      setTableStatus({ ...newStatus });
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        newStatus[table] = error ? 'error' : 'ok';
      } catch {
        newStatus[table] = 'error';
      }
      setTableStatus({ ...newStatus });
    }
  };

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

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
    await updateData({ ...data, users: newUsersList });
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (confirm('Deseja remover o acesso deste colaborador permanentemente?')) {
      updateData({ ...data, users: data.users.filter((u: any) => u.id !== id) });
    }
  };

  // SQL OTIMIZADO PARA REGISTRAR APENAS MUDANÇAS
  const sqlOptimizer = `
-- SMARTGESTÃO: GATILHO DE ECONOMIA E HISTÓRICO
-- Execute este código no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION filter_unchanged_levels()
RETURNS TRIGGER AS $$
DECLARE
  last_val INTEGER;
BEGIN
  -- Busca o último nível registrado para este dispositivo específico
  SELECT nivel_cm INTO last_val 
  FROM nivel_caixa
  WHERE condominio_id = NEW.condominio_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se o nível atual for igual ao último, aborte a inserção (retorna NULL)
  -- Isso garante que o banco só registre quando houver ALTERAÇÃO.
  IF last_val IS NOT NULL AND last_val = NEW.nivel_cm THEN
    RETURN NULL; 
  END IF;
  
  -- Se for diferente, permite salvar e gera o registro no histórico
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica o filtro na tabela de telemetria
DROP TRIGGER IF EXISTS tr_filter_levels ON nivel_caixa;
CREATE TRIGGER tr_filter_levels
BEFORE INSERT ON nivel_caixa
FOR EACH ROW EXECUTE FUNCTION filter_unchanged_levels();
  `.trim();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlOptimizer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          
          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20">
             <div className="flex items-center space-x-3 mb-4">
                <Cpu className="text-blue-200" size={24} />
                <h3 className="font-black uppercase text-xs tracking-widest">Otimizador de Telemetria</h3>
             </div>
             <p className="text-sm font-medium text-blue-100 mb-6 leading-relaxed">
               Este script garante que o banco registre dados <b>apenas quando o nível mudar</b>. Copie e cole no SQL Editor do Supabase.
             </p>
             <div className="bg-slate-900/50 rounded-2xl p-4 relative group">
                <pre className="text-[9px] font-mono text-blue-200 overflow-x-auto whitespace-pre">
                  {sqlOptimizer.substring(0, 180)}...
                </pre>
                <button 
                  onClick={handleCopySql}
                  className="absolute top-4 right-4 bg-white text-blue-600 p-2 rounded-xl shadow-lg hover:bg-blue-50 transition-all flex items-center space-x-2"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-[10px]">
                <Database size={16} className="mr-2 text-blue-600" /> Status do Banco de Dados
              </h3>
              <button onClick={checkDatabaseHealth} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
               {Object.entries(tableStatus).map(([table, status]) => (
                 <div key={table} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">{table}</span>
                    <div className="flex items-center space-x-2">
                      {status === 'checking' && <RefreshCw size={12} className="text-blue-500 animate-spin" />}
                      {status === 'ok' && <CheckCircle size={12} className="text-emerald-500" />}
                      {status === 'error' && <AlertTriangle size={12} className="text-red-500" />}
                      <span className={`text-[10px] font-bold uppercase ${status === 'ok' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                        {status === 'ok' ? 'OK' : status === 'error' ? 'Erro' : '...'}
                      </span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center uppercase tracking-widest text-xs">
                <User size={18} className="mr-2 text-blue-600" /> Colaboradores
              </h3>
              <button onClick={() => { setEditingUser(null); setSelectedRole(UserRole.TECHNICIAN); setIsUserModalOpen(true); }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Novo</button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.users.map((user: UserType) => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${user.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-blue-600'}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{user.role} • {user.email}</p>
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
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl w-full max-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingUser ? 'Editar' : 'Novo'} Acesso</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
              <input required name="name" defaultValue={editingUser?.name} placeholder="Nome" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              <input required name="email" defaultValue={editingUser?.email} placeholder="Email" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              <input required name="password" defaultValue={editingUser?.password} placeholder="Senha" className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold" />
              <select name="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold">
                <option value={UserRole.ADMIN}>Administrador</option>
                <option value={UserRole.TECHNICIAN}>Técnico</option>
                <option value={UserRole.CONDO_USER}>Síndico</option>
              </select>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black text-xs uppercase">Voltar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
