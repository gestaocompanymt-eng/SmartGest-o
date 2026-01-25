
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
  WifiOff
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const prevOrdersRef = useRef<ServiceOrder[]>([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const localData = getStore();
    setData(localData);
    prevOrdersRef.current = localData.serviceOrders;
  }, []);

  useEffect(() => {
    if (!data) return;
    if (isFirstLoad.current) {
      prevOrdersRef.current = data.serviceOrders;
      isFirstLoad.current = false;
      return;
    }
    const currentOrders = data.serviceOrders;
    const prevOrders = prevOrdersRef.current;
    const newOrders = currentOrders.filter(curr => !prevOrders.some(prev => prev.id === curr.id));

    newOrders.forEach(os => {
      if (data.currentUser?.role !== UserRole.CONDO_USER || data.currentUser?.condo_id === os.condo_id) {
        const condo = data.condos.find(c => c.id === os.condo_id);
        sendLocalNotification('Nova Ordem de Serviço 🛠️', `A OS ${os.id} foi aberta para ${condo?.name}.`);
      }
    });

    currentOrders.forEach(curr => {
      const prev = prevOrders.find(p => p.id === curr.id);
      if (prev && prev.status !== curr.status) {
        if (data.currentUser?.role !== UserRole.CONDO_USER || data.currentUser?.condo_id === curr.condo_id) {
          const condo = data.condos.find(c => c.id === curr.condo_id);
          sendLocalNotification('Status Atualizado 🔄', `A OS ${curr.id} (${condo?.name}) mudou para: ${curr.status}.`);
        }
      }
    });

    prevOrdersRef.current = [...currentOrders];
  }, [data?.serviceOrders]);

  const syncWithCloud = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive) return;
    setIsSyncing(true);
    try {
      const [resCondos, resUsers, resEquips, resSystems, resOS] = await Promise.all([
        supabase.from('condos').select('*'),
        supabase.from('users').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*')
      ]);
      const syncedData: AppData = {
        ...currentLocalData,
        condos: resCondos.data || currentLocalData.condos,
        users: resUsers.data || currentLocalData.users,
        equipments: resEquips.data || currentLocalData.equipments,
        systems: resSystems.data || currentLocalData.systems,
        serviceOrders: (resOS.data || currentLocalData.serviceOrders).sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
      };
      setData(syncedData);
      saveStore(syncedData);
    } catch (error) { console.error(error); } finally { setIsSyncing(false); }
  }, []);

  const pushToCloud = async (newData: AppData) => {
    if (!isSupabaseActive || !navigator.onLine) return;
    try {
      await Promise.all([
        supabase.from('condos').upsert(newData.condos),
        supabase.from('users').upsert(newData.users),
        supabase.from('equipments').upsert(newData.equipments),
        supabase.from('systems').upsert(newData.systems),
        supabase.from('service_orders').upsert(newData.serviceOrders),
      ].filter(Boolean));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (data) syncWithCloud(data);
    const handleOnline = () => { setIsOnline(true); if(data) syncWithCloud(data); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [syncWithCloud, !!data]);

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

  const role = data.currentUser?.role;
  const isAdmin = role === UserRole.ADMIN;
  const isTech = role === UserRole.TECHNICIAN;

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
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 h-16">
        <div className="flex items-center space-x-3">
          <Wrench size={18} className="text-blue-500" />
          <span className="font-bold text-base tracking-tight uppercase">SmartGestão</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
          <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-bold uppercase">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 hidden md:flex items-center justify-between px-8 shrink-0">
          <span className="text-sm font-medium text-slate-400 italic">Central de Manutenção Inteligente</span>
          <div className="flex items-center space-x-3">
             {isOnline ? <span className="text-emerald-600 font-bold text-xs"><Wifi size={14} className="inline mr-1" /> ONLINE</span> : <span className="text-amber-600 font-bold text-xs"><WifiOff size={14} className="inline mr-1" /> OFFLINE</span>}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard data={data} />} />
            {(isAdmin || isTech) && <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />}
            <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
            <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
            {isAdmin && <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />}
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
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
