
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
  Zap,
  Cloud,
  AlertCircle,
  Activity
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
import Monitoring from './pages/Monitoring';
import Login from './pages/Login';

const AppContent: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dataRef = useRef<AppData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Função para mesclar dados priorizando os mais recentes ou os da nuvem em caso de conflito
  const mergeData = useCallback((localItems: any[] = [], cloudItems: any[] = []) => {
    const map = new Map();
    localItems.forEach(item => { if(item?.id) map.set(item.id, item) });
    cloudItems.forEach(item => { if(item?.id) map.set(item.id, item) });
    return Array.from(map.values());
  }, []);

  const syncLocalToCloud = async (currentData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive) return;
    try {
      // Forçamos o envio de tudo que o local tem para o Supabase
      // Isso garante que as 5 OS do celular subam para o banco
      const tables = ['condos', 'equipments', 'systems', 'service_orders', 'appointments'];
      const dataKeys = ['condos', 'equipments', 'systems', 'serviceOrders', 'appointments'];
      
      for (let i = 0; i < tables.length; i++) {
        const items = (currentData as any)[dataKeys[i]];
        if (items && items.length > 0) {
          await supabase.from(tables[i]).upsert(items);
        }
      }
    } catch (e) {
      console.warn("Falha no push de sincronização:", e);
    }
  };

  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive) return currentLocalData;
    setSyncStatus('syncing');
    
    try {
      // PASSO 1: Upload (Garantir que as 5 OS do celular cheguem na nuvem)
      await syncLocalToCloud(currentLocalData);

      // PASSO 2: Download (Baixar a verdade consolidada de todos os dispositivos)
      const [resCondos, resEquips, resSystems, resOS, resAppts, resAlerts] = await Promise.all([
        supabase.from('condos').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('monitoring_alerts').select('*')
      ]);

      const cloudData: AppData = {
        ...currentLocalData,
        condos: mergeData(currentLocalData.condos, resCondos.data || []),
        equipments: mergeData(currentLocalData.equipments, resEquips.data || []),
        systems: mergeData(currentLocalData.systems, resSystems.data || []),
        serviceOrders: mergeData(currentLocalData.serviceOrders, resOS.data || []).sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
        appointments: mergeData(currentLocalData.appointments || [], resAppts.data || []),
        monitoringAlerts: resAlerts.data || []
      };
      
      setSyncStatus('synced');
      return cloudData;
    } catch (error) {
      console.error("Erro fatal na sincronização:", error);
      setSyncStatus('error');
      return currentLocalData;
    }
  }, [mergeData]);

  useEffect(() => {
    const init = async () => {
      const local = getStore();
      setData(local);
      
      // Sincronização agressiva na inicialização
      const updated = await fetchAllData(local);
      setData(updated);
      saveStore(updated);
      
      // Delay visual para garantir que o usuário veja que a sincronização terminou
      setTimeout(() => setIsInitialSyncing(false), 1500);
    };
    init();

    const handleOnline = () => {
      setIsOnline(true);
      if (dataRef.current) fetchAllData(dataRef.current).then(updated => {
        setData(updated);
        saveStore(updated);
      });
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchAllData]);

  const updateData = async (newData: AppData) => {
    setData(newData);
    saveStore(newData);

    if (navigator.onLine && isSupabaseActive) {
      setSyncStatus('syncing');
      try {
        // Envia as alterações imediatamente para o banco
        await Promise.all([
          supabase.from('service_orders').upsert(newData.serviceOrders),
          supabase.from('appointments').upsert(newData.appointments),
          supabase.from('condos').upsert(newData.condos),
          supabase.from('equipments').upsert(newData.equipments),
          supabase.from('systems').upsert(newData.systems)
        ]);
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('error');
      }
    }
  };

  if (!data) return null;

  if (isInitialSyncing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <Wrench size={48} className="text-blue-500 animate-bounce mb-6" />
        <h2 className="text-white font-black uppercase tracking-widest text-lg mb-2">SmartGestão</h2>
        <p className="text-slate-400 text-sm font-bold animate-pulse">Equalizando dados entre dispositivos...</p>
        <div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <style>{`@keyframes loading { 0% { width: 0; } 50% { width: 100%; } 100% { width: 0; } }`}</style>
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

  const isAdmin = data.currentUser?.role === UserRole.ADMIN;
  const isTech = data.currentUser?.role === UserRole.TECHNICIAN;

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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden">
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 h-16">
        <div className="flex items-center space-x-3">
          <Wrench size={18} className="text-blue-500" />
          <span className="font-bold text-base tracking-tight uppercase">SmartGestão</span>
        </div>
        <div className="flex items-center space-x-4">
          {syncStatus === 'syncing' ? <RefreshCw size={16} className="text-blue-400 animate-spin" /> : <Zap size={16} className="text-emerald-400" />}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center space-x-2 mb-8">
            <Wrench size={24} className="text-blue-500" />
            <span className="font-bold text-xl uppercase">SmartGestão</span>
          </div>
        </div>
        <nav className="px-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)]">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          {(isAdmin || isTech) && <NavItem to="/condos" icon={Building2} label="Condomínios" />}
          <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
          <NavItem to="/systems" icon={Settings} label="Sistemas" />
          <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
          <NavItem to="/monitoring" icon={Activity} label="Monitoramento IoT" />
          {isAdmin && <NavItem to="/admin" icon={Settings} label="Administração" />}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <button onClick={() => { setData({...data, currentUser: null}); navigate('/login'); }} className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-bold uppercase">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 hidden md:flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-400">Status do Sistema:</span>
            <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${
              syncStatus === 'synced' ? 'text-emerald-500' : 
              syncStatus === 'error' ? 'text-red-500' : 'text-blue-500'
            }`}>
              {syncStatus === 'synced' ? <Cloud size={14} /> : <RefreshCw size={14} className="animate-spin" />}
              <span>{syncStatus === 'synced' ? 'Dados Sincronizados' : syncStatus === 'error' ? 'Falha na Nuvem' : 'Equalizando...'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {isOnline ? <span className="text-emerald-600 font-bold text-xs uppercase tracking-tighter"><Wifi size={14} className="inline mr-1" /> Servidor Online</span> : <span className="text-amber-600 font-bold text-xs uppercase tracking-tighter"><WifiOff size={14} className="inline mr-1" /> Modo Offline</span>}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard data={data} updateData={updateData} />} />
            {(isAdmin || isTech) && <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />}
            <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
            <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
            <Route path="/monitoring" element={<Monitoring data={data} updateData={updateData} />} />
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
