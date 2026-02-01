
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
  Cloud,
  Droplets,
  Activity,
  // Added RefreshCw to imports to fix "Cannot find name 'RefreshCw'" error
  RefreshCw
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData, WaterLevel as WaterLevelType } from './types';
import { supabase, isSupabaseActive, subscribeToChanges } from './supabase';
import { sendLocalNotification } from './notificationService';

import Dashboard from './pages/Dashboard';
import Condos from './pages/Condos';
import EquipmentPage from './pages/Equipment';
import SystemsPage from './pages/Systems';
import ServiceOrders from './pages/ServiceOrders';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import WaterLevel from './pages/WaterLevel';
import Monitoring from './pages/Monitoring';

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

  const detectAnomaly = (newLevel: WaterLevelType, lastLevel?: WaterLevelType) => {
    if (!newLevel) return;

    if (newLevel.percentual <= 20) {
      sendLocalNotification(
        "🚨 Nível Crítico!",
        `O reservatório ${newLevel.condominio_id} está com apenas ${newLevel.percentual}%. Risco de falta d'água.`
      );
    }

    if (newLevel.percentual >= 98) {
      sendLocalNotification(
        "⚠️ Risco de Transbordamento",
        `O reservatório ${newLevel.condominio_id} atingiu ${newLevel.percentual}%. Verifique as boias.`
      );
    }

    if (lastLevel && (lastLevel.percentual - newLevel.percentual) > 10) {
      sendLocalNotification(
        "💧 Queda Brusca de Nível",
        `Detectada redução de ${(lastLevel.percentual - newLevel.percentual).toFixed(1)}% no reservatório ${newLevel.condominio_id} em curto período.`
      );
    }
  };

  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive) return currentLocalData;
    setSyncStatus('syncing');
    try {
      const [resUsers, resCondos, resEquips, resSystems, resOS, resAppts, resLevels, resAlerts] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('condos').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('nivel_caixa').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('monitoring_alerts').select('*')
      ]);

      const cloudData: AppData = {
        ...currentLocalData,
        users: resUsers.data || currentLocalData.users,
        condos: resCondos.data || currentLocalData.condos,
        equipments: resEquips.data || currentLocalData.equipments,
        systems: resSystems.data || currentLocalData.systems,
        serviceOrders: (resOS.data || []).sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
        appointments: resAppts.data || [],
        waterLevels: resLevels.data || [],
        monitoringAlerts: resAlerts.data || [],
      };
      
      setSyncStatus('synced');
      return cloudData;
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setSyncStatus('error');
      return currentLocalData;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const local = getStore();
      setData(local);
      const updated = await fetchAllData(local);
      setData(updated);
      saveStore(updated);
      setTimeout(() => setIsInitialSyncing(false), 800);
    };
    init();

    let subscription: any = null;
    if (isSupabaseActive) {
      subscription = subscribeToChanges('nivel_caixa', (payload) => {
        if (payload.eventType === 'INSERT' && dataRef.current) {
          const newLevel = payload.new as WaterLevelType;
          const lastLevelForDevice = dataRef.current.waterLevels.find(l => l.condominio_id === newLevel.condominio_id);
          
          detectAnomaly(newLevel, lastLevelForDevice);

          setData(prev => {
            if (!prev) return prev;
            const updated = { ...prev, waterLevels: [newLevel, ...prev.waterLevels].slice(0, 100) };
            saveStore(updated);
            return updated;
          });
        }
      });
    }

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
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchAllData]);

  const updateData = async (newData: AppData) => {
    // Atualiza local imediatamente para fluidez da UI
    setData(newData);
    saveStore(newData);

    if (isOnline && isSupabaseActive) {
      setSyncStatus('syncing');
      try {
        // Realiza upsert das tabelas críticas
        // Importante: tratamos erros individualmente para não quebrar todo o fluxo
        const results = await Promise.all([
          newData.systems.length > 0 ? supabase.from('systems').upsert(newData.systems) : Promise.resolve({ error: null }),
          newData.equipments.length > 0 ? supabase.from('equipments').upsert(newData.equipments) : Promise.resolve({ error: null }),
          newData.condos.length > 0 ? supabase.from('condos').upsert(newData.condos) : Promise.resolve({ error: null }),
          newData.serviceOrders.length > 0 ? supabase.from('service_orders').upsert(newData.serviceOrders) : Promise.resolve({ error: null })
        ]);

        const firstError = results.find(r => r.error);
        if (firstError) {
          console.error("Erro na sincronização Cloud:", firstError.error);
          setSyncStatus('error');
          // Lançamos o erro para ser capturado pela página que chamou o updateData
          throw new Error(firstError.error.message);
        } else {
          setSyncStatus('synced');
        }
      } catch (err) {
        setSyncStatus('error');
        console.error("Erro crítico de sincronização:", err);
        throw err; // Repassa para o componente (ex: SystemsPage)
      }
    }
  };

  if (!data) return null;
  if (isInitialSyncing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <Wrench size={48} className="text-blue-500 animate-bounce mb-6" />
        <h2 className="text-white font-black uppercase tracking-widest text-lg mb-2">SmartGestão</h2>
        <p className="text-slate-400 text-sm font-bold animate-pulse">Sincronizando Nuvem...</p>
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
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center space-x-2 mb-8">
            <Wrench size={24} className="text-blue-500" />
            <span className="font-bold text-xl uppercase tracking-tighter">SmartGestão</span>
          </div>
        </div>
        <nav className="px-4 space-y-1.5">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/reservatorios" icon={Droplets} label="Reservatórios" />
          <NavItem to="/monitoramento" icon={Activity} label="Telemetria Tuya" />
          <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
          <NavItem to="/equipamentos" icon={Layers} label="Equipamentos" />
          <NavItem to="/sistemas" icon={Settings} label="Sistemas" />
          <NavItem to="/condominios" icon={Building2} label="Condomínios" />
          <NavItem to="/admin" icon={Settings} label="Administração" />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 hidden md:flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-emerald-500">
            {syncStatus === 'syncing' ? (
              <RefreshCw size={14} className="mr-2 animate-spin text-blue-500" />
            ) : (
              <Cloud size={14} className={`mr-2 ${syncStatus === 'error' ? 'text-red-500' : 'text-emerald-500'}`} />
            )}
            <span className={syncStatus === 'error' ? 'text-red-500' : 'text-emerald-500'}>
              {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'error' ? 'Erro ao Sincronizar' : 'Cloud OK'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
             {isOnline ? (
               <span className="text-emerald-600 font-bold text-xs uppercase flex items-center">
                 <Wifi size={14} className="mr-1" /> Online
               </span>
             ) : (
               <span className="text-amber-600 font-bold text-xs uppercase flex items-center">
                 <WifiOff size={14} className="mr-1" /> Offline
               </span>
             )}
             <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
             <button 
               onClick={() => {
                 const newData = { ...data, currentUser: null };
                 setData(newData);
                 saveStore(newData);
                 navigate('/login');
               }}
               className="text-slate-400 hover:text-red-500 transition-colors"
               title="Sair"
             >
               <LogOut size={18} />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard data={data} updateData={updateData} />} />
            <Route path="/reservatorios" element={<WaterLevel data={data} updateData={updateData} />} />
            <Route path="/monitoramento" element={<Monitoring data={data} updateData={updateData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
            <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
            <Route path="/condominios" element={<Condos data={data} updateData={updateData} />} />
            <Route path="/equipamentos" element={<EquipmentPage data={data} updateData={updateData} />} />
            <Route path="/sistemas" element={<SystemsPage data={data} updateData={updateData} />} />
            <Route path="/equipment" element={<Navigate to="/equipamentos" />} />
            <Route path="/systems" element={<Navigate to="/sistemas" />} />
            <Route path="/login" element={<Navigate to="/" />} />
          </Routes>
        </div>
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
