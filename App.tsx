
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Wrench, Layers, FileText, Settings, LogOut, Menu, X,
  RefreshCcw, CheckCircle2, FileBarChart, Database, Activity, ShieldAlert
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData } from './types';
import { supabase, isSupabaseActive } from './supabase';

import Dashboard from './pages/Dashboard';
import Condos from './pages/Condos';
import EquipmentPage from './pages/Equipment';
import SystemsPage from './pages/Systems';
import ServiceOrders from './pages/ServiceOrders';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import Reports from './pages/Reports';
import DatabaseSetup from './pages/DatabaseSetup';

const AppContent: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  const isSyncingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive || isSyncingRef.current || !currentLocalData.currentUser) {
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      return currentLocalData;
    }
    
    setSyncStatus('syncing');
    isSyncingRef.current = true;

    try {
      const queries = [
        supabase.from('users').select('id, name, email, role, condo_id'),
        supabase.from('condos').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('equipment_types').select('*'),
        supabase.from('system_types').select('*')
      ];

      const res = await Promise.all(queries);
      
      const updated = {
        ...currentLocalData,
        users: res[0].data || [],
        condos: res[1].data || [],
        equipments: res[2].data || [],
        systems: res[3].data || [],
        serviceOrders: res[4].data || [],
        equipmentTypes: res[5].data || [],
        systemTypes: res[6].data || []
      };

      setSyncStatus('synced');
      return updated;
    } catch (error) {
      console.error("Erro na sincronização:", error);
      setSyncStatus('offline');
      return currentLocalData;
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const local = getStore();
      setData(local);
      
      if (local.currentUser) {
        const updated = await fetchAllData(local);
        setData(updated);
        saveStore(updated);
      }
    };
    init();
  }, [fetchAllData]);

  const updateData = (newData: AppData) => {
    setData(newData);
    saveStore(newData);
  };

  if (!data) return null;
  if (!data.currentUser) return <Login onLogin={(u) => { setData({...data, currentUser: u}); saveStore({...data, currentUser: u}); navigate('/'); }} />;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print shadow-2xl">
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Wrench size={20} className="text-white" /></div>
              <span className="font-black text-lg tracking-tighter uppercase text-white">SmartGestão</span>
            </div>
            {syncStatus === 'syncing' && <RefreshCcw size={14} className="text-blue-400 animate-spin" />}
          </div>
          
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {data.currentUser.role === UserRole.ADMIN && (
              <>
                <div className="py-2 text-[10px] font-black text-amber-500 uppercase tracking-widest px-4">Painel de Controle</div>
                <Link to="/admin" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/admin') ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <Settings size={18} /> <span>ADMINISTRAÇÃO</span>
                </Link>
                <Link to="/database" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/database') ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <Database size={18} /> <span>BANCO DE DADOS</span>
                </Link>
                <div className="py-2"><hr className="border-slate-800" /></div>
              </>
            )}

            <Link to="/" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard size={18} /> <span>DASHBOARD</span>
            </Link>
            
            <div className="py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Operação</div>
            
            <Link to="/condos" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/condos') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Building2 size={18} /> <span>CONDOMÍNIOS</span>
            </Link>
            <Link to="/equipment" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/equipment') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Wrench size={18} /> <span>EQUIPAMENTOS</span>
            </Link>
            <Link to="/systems" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/systems') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Layers size={18} /> <span>SISTEMAS</span>
            </Link>
            <Link to="/os" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/os') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <FileText size={18} /> <span>ORDENS DE SERVIÇO</span>
            </Link>
            <Link to="/reports" className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${isActive('/reports') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <FileBarChart size={18} /> <span>RELATÓRIOS</span>
            </Link>
          </nav>
          
          <div className="mt-auto pt-4 border-t border-slate-800">
             <button onClick={() => { setData({...data, currentUser: null}); saveStore({...data, currentUser: null}); navigate('/login'); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-500 font-bold text-xs transition-all">
              <LogOut size={18} /> <span>SAIR DO SISTEMA</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50">
        <Routes>
          <Route path="/" element={<Dashboard data={data} updateData={updateData} onSync={async () => { const fresh = await fetchAllData(data); setData(fresh); saveStore(fresh); }} />} />
          <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />
          <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
          <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
          <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
          <Route path="/reports" element={<Reports data={data} />} />
          <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
          <Route path="/database" element={<DatabaseSetup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
