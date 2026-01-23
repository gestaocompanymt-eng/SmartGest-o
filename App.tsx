
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
  const [data, setData] = useState<AppData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Inicialização do estado
  useEffect(() => {
    const initialData = getStore();
    setData(initialData);
  }, []);

  const fetchFromSupabase = useCallback(async () => {
    if (!navigator.onLine || !supabase) return;
    
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
        if (!prev) return prev;
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
    if (data) {
      fetchFromSupabase();
    }
    
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
  }, [fetchFromSupabase, !!data]);

  const updateData = async (newData: AppData) => {
    setData(newData);
    saveStore(newData);

    if (navigator.onLine && supabase) {
      try {
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
    if (!data) return;
    const newData = { ...data, currentUser: null };
    setData(newData);
    saveStore(newData);
    navigate('/login');
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
        INICIALIZANDO SISTEMA...
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
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg h-16">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Wrench size={18} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">SMARTGESTÃO</span>
        </div>
        <div className="flex items-center space-x-2">
           {isSyncing && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
           <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="p-2 bg-slate-800 rounded-lg active:scale-95 transition-transform"
            aria-label="Menu"
           >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>
      </div>

      {/* Sidebar Backdrop Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64
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

        <nav className="px-4 py-6 md:py-0 space-y-1.5 md:space-y-2 h-[calc(100vh-180px)] overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/condos" icon={Building2} label="Condomínios" />
          <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
          <NavItem to="/systems" icon={Settings} label="Sistemas" />
          <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
          {isAdmin && <NavItem to="/admin" icon={Settings} label="Administração" />}
        </nav>

        <div className="absolute bottom-0 w-full p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              {data.currentUser?.name.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate leading-none mb-1">{data.currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{data.currentUser?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors active:scale-[0.98]"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Sair do App</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Desktop Header */}
        <header className="bg-white border-b border-slate-200 h-16 hidden md:flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-400 italic">Central de Comando Técninca</span>
            {isSyncing && <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full animate-pulse font-bold tracking-widest uppercase border border-blue-100">Sincronizando...</span>}
          </div>
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-2 text-xs font-medium">
                {isOnline ? (
                  <span className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <Wifi size={14} className="mr-1.5" /> ONLINE
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                    <WifiOff size={14} className="mr-1.5" /> OFFLINE
                  </span>
                )}
             </div>
             <button className="text-slate-400 hover:text-blue-600 transition-colors relative p-1.5 hover:bg-slate-50 rounded-lg">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
             </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-8">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
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

      <style>{`
        /* Global Mobile Adjustments */
        input, select, textarea {
          font-size: 16px !important; /* Prevent iOS zoom */
        }
        
        .modal-full-mobile {
          @media (max-width: 768px) {
            margin: 0 !important;
            max-width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
            max-height: 100% !important;
          }
        }

        .scroll-touch {
          -webkit-overflow-scrolling: touch;
        }

        /* Hide scrollbars for a cleaner look while keeping functionality */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
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
