
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
  Activity
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData, WaterLevel as WaterLevelType } from './types';
import { supabase, isSupabaseActive, subscribeToChanges } from './supabase';

// Pages
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

  // Lógica de Mesclagem Inteligente: Protege campos locais que podem não existir na nuvem
  const mergeData = useCallback((localItems: any[] = [], cloudItems: any[] = []) => {
    const map = new Map();
    
    // Primeiro, carregamos tudo o que está local
    localItems.forEach(item => { 
      if(item?.id) map.set(String(item.id), { ...item });
    });

    // Depois, sobrepomos com os dados da nuvem, mas preservando campos críticos
    cloudItems.forEach(cloudItem => {
      if(cloudItem?.id) {
        const id = String(cloudItem.id);
        const localItem = map.get(id);
        
        map.set(id, {
          ...localItem, // Mantém dados locais como fallback
          ...cloudItem, // Sobrescreve com dados da nuvem
          // REGRA DE OURO: Se a nuvem não tem pontos de monitoramento mas o local tem, MANTÉM O LOCAL
          monitoring_points: (cloudItem.monitoring_points && cloudItem.monitoring_points.length > 0) 
            ? cloudItem.monitoring_points 
            : (localItem?.monitoring_points || [])
        });
      }
    });
    
    return Array.from(map.values());
  }, []);

  const syncLocalToCloud = async (currentData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive) return;
    try {
      const syncConfig = [
        { table: 'users', key: 'users' },
        { table: 'condos', key: 'condos' },
        { table: 'equipments', key: 'equipments' },
        { table: 'systems', key: 'systems' },
        { table: 'service_orders', key: 'serviceOrders' },
        { table: 'appointments', key: 'appointments' },
        { table: 'monitoring_alerts', key: 'monitoringAlerts' }
      ];
      
      for (const config of syncConfig) {
        const items = (currentData as any)[config.key];
        if (items && items.length > 0) {
          const cleanItems = items.map((item: any) => ({
             ...item,
             id: String(item.id)
          }));
          const { error } = await supabase.from(config.table).upsert(cleanItems);
          if (error) console.warn(`Erro no sync da tabela ${config.table}:`, error);
        }
      }
    } catch (e) {
      console.warn("Falha no push automático:", e);
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
        users: mergeData(currentLocalData.users, resUsers.data || []),
        condos: mergeData(currentLocalData.condos, resCondos.data || []),
        equipments: mergeData(currentLocalData.equipments, resEquips.data || []),
        systems: mergeData(currentLocalData.systems, resSystems.data || []),
        serviceOrders: mergeData(currentLocalData.serviceOrders, resOS.data || []).sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
        appointments: mergeData(currentLocalData.appointments || [], resAppts.data || []),
        waterLevels: resLevels.data || [],
        monitoringAlerts: mergeData(currentLocalData.monitoringAlerts || [], resAlerts.data || []),
        equipmentTypes: currentLocalData.equipmentTypes,
        systemTypes: currentLocalData.systemTypes
      };
      
      setSyncStatus('synced');
      return cloudData;
    } catch (error) {
      console.error("Erro fatal de sincronização:", error);
      setSyncStatus('error');
      return currentLocalData;
    }
  }, [mergeData]);

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
          setData(prev => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              waterLevels: [newLevel, ...prev.waterLevels].slice(0, 100)
            };
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
    
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchAllData]);

  const updateData = async (newData: AppData) => {
    // Primeiro atualizamos o estado local e o cache para resposta imediata
    setData(newData);
    saveStore(newData);

    // Depois tentamos sincronizar com a nuvem em background
    if (navigator.onLine && isSupabaseActive) {
      setSyncStatus('syncing');
      try {
        await syncLocalToCloud(newData);
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
          {(isAdmin || isTech) && <NavItem to="/condos" icon={Building2} label="Condomínios" />}
          <NavItem to="/reservatorios" icon={Droplets} label="Reservatórios" />
          {(isAdmin || isTech) && <NavItem to="/monitoramento" icon={Activity} label="Monitoramento IoT" />}
          <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
          <NavItem to="/systems" icon={Settings} label="Sistemas" />
          <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
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
            <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${
              syncStatus === 'synced' ? 'text-emerald-500' : 
              syncStatus === 'error' ? 'text-red-500' : 'text-blue-500'
            }`}>
              <Cloud size={14} />
              <span>{syncStatus === 'synced' ? 'Banco de Dados OK' : 'Sincronizando...'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {isOnline ? <span className="text-emerald-600 font-bold text-xs uppercase"><Wifi size={14} className="inline mr-1" /> Servidor Ativo</span> : <span className="text-amber-600 font-bold text-xs uppercase"><WifiOff size={14} className="inline mr-1" /> Offline</span>}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard data={data} updateData={updateData} />} />
            {(isAdmin || isTech) && <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />}
            <Route path="/reservatorios" element={<WaterLevel data={data} updateData={updateData} onRefresh={() => fetchAllData(data).then(d => { setData(d); saveStore(d); })} />} />
            {(isAdmin || isTech) && <Route path="/monitoramento" element={<Monitoring data={data} updateData={updateData} />} />}
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
