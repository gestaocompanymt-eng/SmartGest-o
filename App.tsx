
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
  Wifi,
  WifiOff,
  RefreshCw,
  CloudCheck,
  Zap,
  AlertTriangle
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData, ServiceOrder } from './types';
import { supabase, isSupabaseActive } from './supabase';

// Pages
import Dashboard from './pages/Dashboard';
import Condos from './pages/Condos';
import EquipmentPage from './pages/Equipment';
import SystemsPage from './pages/Systems';
import ServiceOrders from './pages/ServiceOrders';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';

const AppContent: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  
  const navigate = useNavigate();
  const location = useLocation();
  const dataRef = useRef<AppData | null>(null);

  // Sincroniza o Ref com o State para uso em callbacks de eventos
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Função para mesclar dados Locais e da Nuvem (União por ID)
  const mergeData = useCallback((localItems: any[], cloudItems: any[]) => {
    const map = new Map();
    // Primeiro coloca os locais (preserva o que o usuário acabou de digitar)
    localItems.forEach(item => map.set(item.id, item));
    // Depois mescla os da nuvem (nuvem sobrescreve se existir, garantindo integridade global)
    cloudItems.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  }, []);

  // Busca inicial e Refresh manual
  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive) return currentLocalData;
    setSyncStatus('syncing');
    try {
      const [resCondos, resEquips, resSystems, resOS, resAppts] = await Promise.all([
        supabase.from('condos').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*'),
        supabase.from('appointments').select('*')
      ]);

      const mergedOS = mergeData(currentLocalData.serviceOrders, resOS.data || []);
      
      const cloudData: AppData = {
        ...currentLocalData,
        condos: mergeData(currentLocalData.condos, resCondos.data || []),
        equipments: mergeData(currentLocalData.equipments, resEquips.data || []),
        systems: mergeData(currentLocalData.systems, resSystems.data || []),
        serviceOrders: mergedOS.sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
        appointments: resAppts.data || currentLocalData.appointments || [],
      };
      
      setSyncStatus('synced');
      return cloudData;
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncStatus('error');
      return currentLocalData;
    }
  }, [mergeData]);

  const refreshDataSilently = useCallback(async () => {
    if (!dataRef.current || !navigator.onLine) return;
    const fresh = await fetchAllData(dataRef.current);
    setData(fresh);
    saveStore(fresh);
  }, [fetchAllData]);

  // Sincronização automática ao retornar para o app (celular ou aba)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("App visível, sincronizando...");
        refreshDataSilently();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshDataSilently]);

  // Configuração de REALTIME - Ouve mudanças no banco e atualiza na hora
  useEffect(() => {
    if (!isSupabaseActive) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => refreshDataSilently())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'condos' }, () => refreshDataSilently())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, () => refreshDataSilently())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshDataSilently]);

  // Inicialização
  useEffect(() => {
    const init = async () => {
      const local = getStore();
      const updated = await fetchAllData(local);
      setData(updated);
      saveStore(updated);
    };
    init();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchAllData]);

  // Função central de atualização: PUSH imediato e Automático
  const updateData = async (newData: AppData) => {
    setData(newData);
    saveStore(newData);

    if (navigator.onLine && isSupabaseActive) {
      setSyncStatus('syncing');
      try {
        const results = await Promise.allSettled([
          supabase.from('service_orders').upsert(newData.serviceOrders),
          supabase.from('condos').upsert(newData.condos),
          supabase.from('equipments').upsert(newData.equipments),
          supabase.from('systems').upsert(newData.systems)
        ]);

        const hasError = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as any).error));
        if (hasError) {
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
        }
      } catch (e) {
        console.error("Erro no Push automático:", e);
        setSyncStatus('error');
      }
    } else {
      setSyncStatus('offline');
    }
  };

  const handleManualSync = async () => {
    if (!data) return;
    setSyncStatus('syncing');

    if (navigator.onLine && isSupabaseActive) {
      try {
        await supabase.from('service_orders').upsert(data.serviceOrders);
      } catch (err) {}
    }

    const freshData = await fetchAllData(data);
    setData(freshData);
    saveStore(freshData);
  };

  if (!data) return null;

  if (!data.currentUser && location.pathname !== '/login') {
    return <Login onLogin={(user) => {
      const newData = { ...data, currentUser: user };
      setData(newData);
      saveStore(newData);
      navigate('/');
    }} />;
  }

  const isAdmin = data.currentUser?.role === UserRole.ADMIN;
  const isTech = data.currentUser?.role === UserRole.TECHNICIAN;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center space-x-3 px-4 py-4 md:py-3 rounded-xl transition-all ${
        location.pathname === to 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={22} />
      <span className="font-semibold text-base md:text-sm">{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 h-16">
        <div className="flex items-center space-x-3">
          <Wrench size={18} className="text-blue-500" />
          <span className="font-bold text-base tracking-tight uppercase">SmartGestão</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {syncStatus === 'syncing' ? (
              <RefreshCw size={16} className="text-blue-400 animate-spin" />
            ) : syncStatus === 'error' ? (
              <AlertTriangle size={16} className="text-red-500" />
            ) : (
              <Zap size={16} className="text-emerald-400" title="Sincronizado em Tempo Real" />
            )}
          </div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center space-x-2 mb-8">
            <Wrench size={24} className="text-blue-500" />
            <span className="font-bold text-xl uppercase">SmartGestão</span>
          </div>
        </div>
        <nav className="px-4 space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          {(isAdmin || isTech) && <NavItem to="/condos" icon={Building2} label="Condomínios" />}
          <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
          <NavItem to="/systems" icon={Settings} label="Sistemas" />
          <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
          {isAdmin && <NavItem to="/admin" icon={Settings} label="Administração" />}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">{data.currentUser?.name.charAt(0)}</div>
            <div className="truncate">
              <p className="text-sm font-bold">{data.currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase">{data.currentUser?.role}</p>
            </div>
          </div>
          <button onClick={() => { setData({...data, currentUser: null}); navigate('/login'); }} className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-bold uppercase">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 hidden md:flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-400 italic">Central de Manutenção Inteligente</span>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              syncStatus === 'synced' ? 'text-emerald-500' : 
              syncStatus === 'syncing' ? 'text-blue-500' : 'text-amber-500'
            }`}>
              {syncStatus === 'synced' ? <Zap size={14} className="animate-pulse" /> : <RefreshCw size={14} className="animate-spin" />}
              <span>{syncStatus === 'synced' ? 'Conectado em Tempo Real' : 'Sincronizando Nuvem...'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={handleManualSync} className="p-2 text-slate-400 hover:text-blue-600" title="Forçar Atualização">
               <RefreshCw size={18} />
             </button>
             <div className="h-4 w-px bg-slate-200"></div>
             {isOnline ? (
               <span className="text-emerald-600 font-bold text-xs flex items-center">
                 <Wifi size={14} className="mr-1.5" /> ONLINE
               </span>
             ) : (
               <span className="text-amber-600 font-bold text-xs flex items-center">
                 <WifiOff size={14} className="mr-1.5" /> OFFLINE (Local)
               </span>
             )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard data={data} updateData={updateData} />} />
            {(isAdmin || isTech) && <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />}
            <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
            <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
            {isAdmin && <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />}
            <Route path="/login" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
