
import React, { useState, useEffect, useCallback } from 'react';
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
  Plus,
  Wifi,
  WifiOff,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, User, AppData } from './types';
import { supabase } from './supabase';

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
  const [data, setData] = useState<AppData>(getStore());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchFromSupabase = useCallback(async () => {
    if (!navigator.onLine) return;
    
    setIsSyncing(true);
    try {
      const [
        { data: condos },
        { data: equipments },
        { data: systems },
        { data: serviceOrders },
        { data: users },
        { data: equipmentTypes },
        { data: systemTypes }
      ] = await Promise.all([
        supabase.from('condos').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*'),
        supabase.from('users').select('*'),
        supabase.from('equipment_types').select('*'),
        supabase.from('system_types').select('*')
      ]);

      setData(prev => {
        const newData: AppData = {
          ...prev,
          condos: condos && condos.length > 0 ? condos : prev.condos,
          equipments: equipments && equipments.length > 0 ? equipments : prev.equipments,
          systems: systems && systems.length > 0 ? systems : prev.systems,
          serviceOrders: serviceOrders && serviceOrders.length > 0 ? serviceOrders : prev.serviceOrders,
          users: users && users.length > 0 ? users : prev.users,
          equipmentTypes: equipmentTypes && equipmentTypes.length > 0 ? equipmentTypes : prev.equipmentTypes,
          systemTypes: systemTypes && systemTypes.length > 0 ? systemTypes : prev.systemTypes,
        };
        saveStore(newData);
        return newData;
      });
    } catch (error) {
      console.error('Erro ao sincronizar com Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchFromSupabase();
    
    const handleOnline = () => {
      setIsOnline(true);
      fetchFromSupabase();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchFromSupabase]);

  const updateData = async (newData: AppData) => {
    setData(newData);
    saveStore(newData);

    if (navigator.onLine) {
      try {
        // Upsert sincronizado para todas as tabelas
        await Promise.all([
          newData.condos.length > 0 && supabase.from('condos').upsert(newData.condos),
          newData.equipments.length > 0 && supabase.from('equipments').upsert(newData.equipments),
          newData.systems.length > 0 && supabase.from('systems').upsert(newData.systems),
          newData.serviceOrders.length > 0 && supabase.from('service_orders').upsert(newData.serviceOrders),
          newData.users.length > 0 && supabase.from('users').upsert(newData.users),
          newData.equipmentTypes.length > 0 && supabase.from('equipment_types').upsert(newData.equipmentTypes),
          newData.systemTypes.length > 0 && supabase.from('system_types').upsert(newData.systemTypes)
        ].filter(Boolean));
      } catch (error) {
        console.error('Erro ao fazer push para Supabase:', error);
      }
    }
  };

  const handleLogout = () => {
    const newData = { ...data, currentUser: null };
    setData(newData);
    saveStore(newData);
    navigate('/login');
  };

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
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        location.pathname === to 
          ? 'bg-blue-600 text-white' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <Wrench className="text-blue-500" />
          <span className="font-bold text-lg tracking-tight">SMARTGESTÃO</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Wrench size={24} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">SMARTGESTÃO</span>
          </div>
        </div>

        <nav className="px-4 space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/condos" icon={Building2} label="Condomínios" />
          <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
          <NavItem to="/systems" icon={Settings} label="Sistemas" />
          <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
          {isAdmin && <NavItem to="/admin" icon={Settings} label="Administração" />}
        </nav>

        <div className="absolute bottom-0 w-full p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
              {data.currentUser?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{data.currentUser?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{data.currentUser?.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 hidden md:flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-400">Área do {data.currentUser?.role === 'ADMIN' ? 'Administrador' : 'Técnico'}</span>
            {isSyncing && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full animate-pulse font-bold">SINCRONIZANDO...</span>}
          </div>
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-2 text-xs font-medium">
                {isOnline ? (
                  <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <Wifi size={14} className="mr-1" /> Online
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <WifiOff size={14} className="mr-1" /> Offline
                  </span>
                )}
             </div>
             <button className="text-slate-400 hover:text-slate-600 relative">
               <Bell size={20} />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-auto max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard data={data} />} />
            <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />
            <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
            <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
            <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
            <Route path="/login" element={<Login onLogin={(user) => {
              const newData = { ...data, currentUser: user };
              setData(newData);
              saveStore(newData);
            }} />} />
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
