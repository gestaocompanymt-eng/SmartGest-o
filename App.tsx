
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
import { UserRole, User } from './types';

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
  const [data, setData] = useState(getStore());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateData = (newData: any) => {
    setData(newData);
    saveStore(newData);
  };

  const handleLogout = () => {
    updateData({ ...data, currentUser: null });
    navigate('/login');
  };

  if (!data.currentUser && location.pathname !== '/login') {
    return <Login onLogin={(user) => {
      updateData({ ...data, currentUser: user });
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
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="text-sm font-medium">Área do {data.currentUser?.role === 'ADMIN' ? 'Administrador' : 'Técnico'}</span>
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
            <Route path="/login" element={<Login onLogin={(user) => updateData({ ...data, currentUser: user })} />} />
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
