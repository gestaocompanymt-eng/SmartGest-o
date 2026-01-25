
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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
  Zap,
  CloudUpload
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData, ServiceOrder } from './types';
import { supabase, isSupabaseActive } from './supabase';
import { sendLocalNotification } from './notificationService';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const prevOrdersRef = useRef<ServiceOrder[]>([]);
  const isFirstLoad = useRef(true);

  // 1. Carregamento Inicial do LocalStorage
  useEffect(() => {
    const localData = getStore();
    setData(localData);
    prevOrdersRef.current = localData.serviceOrders;
  }, []);

  // 2. Monitoramento de Mudanças para Notificações
  useEffect(() => {
    if (!data || isFirstLoad.current) {
      if (data) {
        prevOrdersRef.current = data.serviceOrders;
        isFirstLoad.current = false;
      }
      return;
    }

    const currentOrders = data.serviceOrders;
    const prevOrders = prevOrdersRef.current;

    // Detectar Novas Ordens de Serviço
    const newOrders = currentOrders.filter(
      curr => !prevOrders.some(prev => prev.id === curr.id)
    );

    newOrders.forEach(os => {
      const condo = data.condos.find(c => c.id === os.condoId);
      sendLocalNotification(
        'Nova Ordem de Serviço 🛠️',
        `A OS ${os.id} foi aberta para o condomínio ${condo?.name || 'Não identificado'}.`
      );
    });

    // Detectar Mudanças de Status
    currentOrders.forEach(curr => {
      const prev = prevOrders.find(p => p.id === curr.id);
      if (prev && prev.status !== curr.status) {
        const condo = data.condos.find(c => c.id === curr.condoId);
        sendLocalNotification(
          'Status Atualizado 🔄',
          `A OS ${curr.id} (${condo?.name}) mudou para: ${curr.status}.`
        );
      }
    });

    prevOrdersRef.current = [...currentOrders];
  }, [data?.serviceOrders]);

  // 3. Sincronização: Busca do Supabase (Cloud -> Local)
  const syncWithCloud = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive) return;
    
    setIsSyncing(true);
    try {
      const [resCondos, resUsers, resEquips, resSystems, resOS, resEqTypes, resSysTypes] = await Promise.all([
        supabase.from('condos').select('*'),
        supabase.from('users').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*'),
        supabase.from('equipment_types').select('*'),
        supabase.from('system_types').select('*')
      ]);

      const cloudIsEmpty = (!resCondos.data?.length && !resOS.data?.length && !resEquips.data?.length);
      const localHasData = (currentLocalData.condos.length > 0 || currentLocalData.serviceOrders.length > 0);

      if (cloudIsEmpty && localHasData) {
        await pushToCloud(currentLocalData);
        setIsSyncing(false);
        return;
      }

      const syncedData: AppData = {
        ...currentLocalData,
        condos: resCondos.data || currentLocalData.condos,
        users: resUsers.data || currentLocalData.users,
        equipments: resEquips.data || currentLocalData.equipments,
        systems: resSystems.data || currentLocalData.systems,
        serviceOrders: (resOS.data || currentLocalData.serviceOrders).sort((a: any, b: any) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ),
        equipmentTypes: resEqTypes.data?.length ? resEqTypes.data : currentLocalData.equipmentTypes,
        systemTypes: resSysTypes.data?.length ? resSysTypes.data : currentLocalData.systemTypes,
      };

      setData(syncedData);
      saveStore(syncedData);
    } catch (error) {
      console.error('SmartGestão: Erro crítico na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 4. Push para Cloud (Local -> Cloud)
  const pushToCloud = async (newData: AppData) => {
    if (!isSupabaseActive || !navigator.onLine) return;
    
    try {
      await Promise.all([
        newData.condos.length > 0 && supabase.from('condos').upsert(newData.condos),
        newData.users.length > 0 && supabase.from('users').upsert(newData.users),
        newData.equipments.length > 0 && supabase.from('equipments').upsert(newData.equipments),
        newData.systems.length > 0 && supabase.from('systems').upsert(newData.systems),
        newData.serviceOrders.length > 0 && supabase.from('service_orders').upsert(newData.serviceOrders),
        newData.equipmentTypes.length > 0 && supabase.from('equipment_types').upsert(newData.equipmentTypes),
        newData.systemTypes.length > 0 && supabase.from('system_types').upsert(newData.systemTypes)
      ].filter(Boolean));
    } catch (err) {
      console.error("SmartGestão: Erro ao enviar para Cloud:", err);
    }
  };

  useEffect(() => {
    if (data) syncWithCloud(data);
    
    const handleOnline = () => { setIsOnline(true); if(data) syncWithCloud(data); };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithCloud, !!data]);

  useEffect(() => {
    if (!isSupabaseActive || !isOnline) return;

    const channel = supabase.channel('db-changes-global')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        if(data) syncWithCloud(data);
      })
      .subscribe((status: string) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [isOnline, syncWithCloud, !!data]);

  const updateData = async (newData: AppData) => {
    setData(newData);
    saveStore(newData);
    
    if (navigator.onLine && isSupabaseActive) {
      setIsSyncing(true);
      await pushToCloud(newData);
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    if (!data) return;
    const newData = { ...data, currentUser: null };
    setData(newData);
    saveStore(newData);
    navigate('/login');
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
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg h-16">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Wrench size={18} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight uppercase">SmartGestão</span>
        </div>
        <div className="flex items-center space-x-3">
           {isSyncing && <Zap size={16} className="text-blue-400 animate-pulse" />}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg"><Wrench size={24} className="text-white" /></div>
            <span className="font-bold text-xl tracking-tight uppercase">SmartGestão</span>
          </div>
        </div>
        <nav className="px-4 py-6 md:py-0 space-y-1.5 md:space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/condos" icon={Building2} label="Condomínios" />
          <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
          <NavItem to="/systems" icon={Settings} label="Sistemas" />
          <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
          {isAdmin && <NavItem to="/admin" icon={Settings} label="Administração" />}
        </nav>
        <div className="absolute bottom-0 w-full p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white uppercase">{data.currentUser?.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate mb-1">{data.currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{data.currentUser?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 hidden md:flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-400 italic">Central de Manutenção Inteligente</span>
            {isSyncing && (
              <div className="flex items-center space-x-2 text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full animate-pulse font-bold tracking-widest uppercase border border-blue-100">
                <CloudUpload size={12} /> <span>Sincronizando Nuvem...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-3">
                {isRealtimeActive && <span className="flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"><Zap size={10} className="mr-1" /> Cloud Live</span>}
                <div className="flex items-center space-x-2 text-xs font-medium">
                  {isOnline ? <span className="flex items-center text-emerald-600 font-bold"><Wifi size={14} className="mr-1.5" /> ONLINE</span> : <span className="flex items-center text-amber-600 font-bold"><WifiOff size={14} className="mr-1.5" /> OFFLINE</span>}
                </div>
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard data={data} />} />
              <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />
              <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
              <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
              <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
              <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => <HashRouter><AppContent /></HashRouter>;
export default App;
