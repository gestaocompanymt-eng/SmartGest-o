
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Wrench, 
  Layers, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Droplets
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData, User } from './types';
import { supabase, isSupabaseActive } from './supabase';

import Dashboard from './pages/Dashboard';
import Condos from './pages/Condos';
import EquipmentPage from './pages/Equipment';
import SystemsPage from './pages/Systems';
import ServiceOrders from './pages/ServiceOrders';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import WaterLevel from './pages/WaterLevel';

const AppContent: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  
  const isSyncingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dataRef = useRef<AppData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const smartUnion = (local: any[], cloud: any[] | null) => {
    if (!cloud || cloud.length === 0) return local;
    const map = new Map();
    cloud.forEach(item => map.set(item.id, item));
    local.forEach(item => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      } else {
        const cloudItem = map.get(item.id);
        const localDate = new Date(item.updated_at || 0).getTime();
        const cloudDate = new Date(cloudItem.updated_at || 0).getTime();
        if (localDate > cloudDate) {
          map.set(item.id, item);
        }
      }
    });
    return Array.from(map.values());
  };

  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive || isSyncingRef.current || !currentLocalData.currentUser) return currentLocalData;
    
    setSyncStatus('syncing');
    const user = currentLocalData.currentUser;
    // REGRA: Somente CONDO_USER é restrito. ADMIN e TECHNICIAN são globais.
    const isRestricted = user.role === UserRole.CONDO_USER;
    const condoId = user.condo_id;

    try {
      let qUsers = supabase.from('users').select('*');
      let qCondos = supabase.from('condos').select('*');
      let qEquips = supabase.from('equipments').select('*');
      let qSystems = supabase.from('systems').select('*');
      let qOS = supabase.from('service_orders').select('*');
      let qAppts = supabase.from('appointments').select('*');
      let qLevels = supabase.from('nivel_caixa').select('*').order('created_at', { ascending: false }).limit(300);

      if (isRestricted && condoId) {
        qUsers = qUsers.eq('condo_id', condoId);
        qCondos = qCondos.eq('id', condoId);
        qEquips = qEquips.eq('condo_id', condoId);
        qSystems = qSystems.eq('condo_id', condoId);
        qOS = qOS.eq('condo_id', condoId);
        qAppts = qAppts.eq('condo_id', condoId);
      }

      const [resUsers, resCondos, resEquips, resSystems, resOS, resAppts, resLevels] = await Promise.all([
        qUsers, qCondos, qEquips, qSystems, qOS, qAppts, qLevels
      ]);

      const cloudData: AppData = {
        ...currentLocalData,
        users: smartUnion(currentLocalData.users, resUsers.data),
        condos: smartUnion(currentLocalData.condos, resCondos.data),
        equipments: smartUnion(currentLocalData.equipments, resEquips.data),
        systems: smartUnion(currentLocalData.systems, resSystems.data),
        serviceOrders: smartUnion(currentLocalData.serviceOrders, resOS.data).sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
        appointments: smartUnion(currentLocalData.appointments, resAppts.data),
        waterLevels: resLevels.data || currentLocalData.waterLevels,
        monitoringAlerts: currentLocalData.monitoringAlerts || []
      };
      
      setSyncStatus('synced');
      return cloudData;
    } catch (error) {
      console.error("Erro na sincronização Cloud:", error);
      setSyncStatus('error');
      return currentLocalData;
    }
  }, []);

  useEffect(() => {
    let interval: any;
    
    if (data?.currentUser && navigator.onLine) {
      interval = setInterval(async () => {
        if (dataRef.current && !isSyncingRef.current) {
          const updated = await fetchAllData(dataRef.current);
          setData(updated);
          saveStore(updated);
        }
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchAllData, !!data?.currentUser]);

  useEffect(() => {
    const init = async () => {
      const local = getStore();
      setData(local);
      setIsInitialSyncing(false); 
      
      if (navigator.onLine && local.currentUser) {
        const updated = await fetchAllData(local);
        setData(updated);
        saveStore(updated);
      }
    };
    init();

    const handleOnline = () => {
      setSyncStatus('syncing');
      if (dataRef.current && dataRef.current.currentUser) {
        fetchAllData(dataRef.current).then(updated => {
          setData(updated);
          saveStore(updated);
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setSyncStatus('offline'));
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => setSyncStatus('offline'));
    };
  }, [fetchAllData]);

  const updateData = async (newData: AppData) => {
    setData(newData);
    saveStore(newData);

    if (navigator.onLine && isSupabaseActive) {
      isSyncingRef.current = true;
      setSyncStatus('syncing');
      
      try {
        const syncPromises = [];
        if (newData.systems.length > 0) syncPromises.push(supabase.from('systems').upsert(newData.systems));
        if (newData.equipments.length > 0) syncPromises.push(supabase.from('equipments').upsert(newData.equipments));
        if (newData.condos.length > 0) syncPromises.push(supabase.from('condos').upsert(newData.condos));
        if (newData.serviceOrders.length > 0) syncPromises.push(supabase.from('service_orders').upsert(newData.serviceOrders));
        if (newData.users.length > 0) syncPromises.push(supabase.from('users').upsert(newData.users.map(u => ({...u, password: u.password || ''}))));

        await Promise.all(syncPromises);
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
        console.error("Erro ao subir dados para nuvem:", err);
      } finally {
        isSyncingRef.current = false;
      }
    }
  };

  if (!data) return null;
  if (isInitialSyncing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <Wrench size={48} className="text-blue-500 animate-bounce mb-6" />
        <h2 className="text-white font-black uppercase tracking-widest text-lg mb-2">SmartGestão</h2>
        <p className="text-slate-400 text-sm font-bold animate-pulse">Protegendo sua conexão...</p>
      </div>
    );
  }

  if (!data.currentUser && location.pathname !== '/login') {
    return <Login onLogin={(user) => {
      const newData = { ...data, currentUser: user };
      setData(newData);
      saveStore(newData);
      navigate('/');
    }} />;
  }

  // Define user for use in navigation items
  const user = data.currentUser;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
        location.pathname === to 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 h-16 shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <Wrench size={18} className="text-blue-500" />
          <span className="font-black text-lg uppercase tracking-tight">SmartGestão</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6 overflow-hidden">
          <div className="hidden md:flex items-center space-x-3 mb-10 px-2">
            <Wrench size={24} className="text-blue-500" />
            <span className="font-black text-xl tracking-tighter uppercase">SmartGestão</span>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            {/* Fix: use the local 'user' constant or data.currentUser instead of an undefined 'user' */}
            <NavItem to="/condos" icon={Building2} label={user?.role === UserRole.CONDO_USER ? 'Meu Condomínio' : 'Condomínios'} />
            <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
            <NavItem to="/systems" icon={Wrench} label="Sistemas" />
            <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
            <NavItem to="/reservatorios" icon={Droplets} label="Reservatórios" />
            {data.currentUser?.role === UserRole.ADMIN && (
              <NavItem to="/admin" icon={Settings} label="Administração" />
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
             <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 mb-4 px-2">
                <span>Nuvem:</span>
                <span className={`font-black ${syncStatus === 'error' ? 'text-red-500' : syncStatus === 'offline' ? 'text-amber-500' : 'text-emerald-500'}`}>
                   {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'error' ? 'Erro Conexão' : syncStatus === 'offline' ? 'Offline' : 'Sincronizado'}
                </span>
             </div>
            <button 
              onClick={() => {
                const newData = { ...data!, currentUser: null };
                setData(newData);
                saveStore(newData);
                navigate('/login');
              }}
              className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-sm"
            >
              <LogOut size={20} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard data={data} updateData={updateData} />} />
            <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />
            <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
            <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
            <Route path="/reservatorios" element={<WaterLevel data={data} updateData={updateData} onRefresh={async () => {
               const updated = await fetchAllData(data);
               setData(updated);
               saveStore(updated);
            }} />} />
            <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
            <Route path="/login" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
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
