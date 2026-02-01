
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
  
  const isSyncingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dataRef = useRef<AppData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
    // Se estivermos no meio de um updateData, não puxamos dados para não sobrescrever o que está sendo salvo
    if (!navigator.onLine || !isSupabaseActive || isSyncingRef.current) return currentLocalData;
    
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
    const oldData = dataRef.current;
    
    // 1. Atualiza local imediatamente
    setData(newData);
    saveStore(newData);

    if (isOnline && isSupabaseActive) {
      isSyncingRef.current = true; // Bloqueia fetchAllData de rodar
      setSyncStatus('syncing');
      
      try {
        const tablesToUpdate = [];
        
        // Verifica o que mudou comparando com a referência anterior
        if (JSON.stringify(newData.systems) !== JSON.stringify(oldData?.systems)) tablesToUpdate.push('systems');
        if (JSON.stringify(newData.equipments) !== JSON.stringify(oldData?.equipments)) tablesToUpdate.push('equipments');
        if (JSON.stringify(newData.condos) !== JSON.stringify(oldData?.condos)) tablesToUpdate.push('condos');
        if (JSON.stringify(newData.serviceOrders) !== JSON.stringify(oldData?.serviceOrders)) tablesToUpdate.push('service_orders');

        for (const table of tablesToUpdate) {
          const tableKey = table === 'service_orders' ? 'serviceOrders' : table as keyof AppData;
          const { error } = await supabase.from(table).upsert(newData[tableKey] as any);
          
          if (error) {
            console.error(`Erro ao sincronizar tabela ${table}:`, error);
            throw new Error(`Falha na Nuvem (${table}): ${error.message}`);
          }
        }
        
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
        console.error("Erro crítico de sincronização:", err);
        // Em caso de erro, mantemos o local mas marcamos como erro
        throw err;
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
          <span className="font-black text-lg uppercase">SmartGestão</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden md:flex items-center space-x-3 mb-10 px-2">
            <Wrench size={24} className="text-blue-500" />
            <span className="font-black text-xl tracking-tighter uppercase">SmartGestão</span>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/condos" icon={Building2} label="Condomínios" />
            <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
            <NavItem to="/systems" icon={Wrench} label="Sistemas" />
            <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
            <NavItem to="/reservatorios" icon={Droplets} label="Reservatórios" />
            <NavItem to="/monitoring" icon={Activity} label="Monitoramento Tuya" />
            {data.currentUser?.role === UserRole.ADMIN && (
              <NavItem to="/admin" icon={Settings} label="Administração" />
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
             <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 mb-4 px-2">
                <span>Status Cloud:</span>
                <span className={syncStatus === 'error' ? 'text-red-500' : 'text-emerald-500'}>
                   {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'error' ? 'Erro' : 'OK'}
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

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard data={data} updateData={updateData} />} />
          <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />
          <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
          <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
          <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
          <Route path="/reservatorios" element={<WaterLevel data={data} updateData={updateData} />} />
          <Route path="/monitoring" element={<Monitoring data={data} updateData={updateData} />} />
          <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
          <Route path="/login" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
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
