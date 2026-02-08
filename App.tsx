
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
  Droplets,
  Cloud,
  CloudOff,
  Code,
  RefreshCcw,
  CheckCircle2,
  FileBarChart,
  Database
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData, WaterLevel as WaterLevelType, ServiceOrder } from './types';
import { supabase, isSupabaseActive } from './supabase';

import Dashboard from './pages/Dashboard';
import Condos from './pages/Condos';
import EquipmentPage from './pages/Equipment';
import SystemsPage from './pages/Systems';
import ServiceOrders from './pages/ServiceOrders';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import WaterLevel from './pages/WaterLevel';
import Reports from './pages/Reports';
import DatabaseSetup from './pages/DatabaseSetup';

const AppContent: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  
  const isSyncingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dataRef = useRef<AppData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const smartUnion = (local: any[], cloud: any[] | null) => {
    if (!cloud || cloud.length === 0) return local || [];
    const map = new Map();
    (local || []).forEach(item => map.set(item.id, item));
    (cloud || []).forEach(cloudItem => {
      if (!map.has(cloudItem.id)) {
        map.set(cloudItem.id, cloudItem);
      } else {
        const localItem = map.get(cloudItem.id);
        const localDate = new Date(localItem.updated_at || 0).getTime();
        const cloudDate = new Date(cloudItem.updated_at || 0).getTime();
        // O dado da nuvem só vence se for estritamente mais recente
        if (cloudDate >= localDate) {
          map.set(cloudItem.id, cloudItem);
        }
      }
    });
    return Array.from(map.values());
  };

  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
    if (!navigator.onLine || !isSupabaseActive || isSyncingRef.current || !currentLocalData.currentUser) {
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      return currentLocalData;
    }
    
    setSyncStatus('syncing');
    try {
      const queries = [
        supabase.from('users').select('*'),
        supabase.from('condos').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('nivel_caixa').select('*').order('created_at', { ascending: false }).limit(300)
      ];

      const responses = await Promise.all(queries);

      const updated = {
        ...currentLocalData,
        users: smartUnion(currentLocalData.users, responses[0].data),
        condos: smartUnion(currentLocalData.condos, responses[1].data),
        equipments: smartUnion(currentLocalData.equipments, responses[2].data),
        systems: smartUnion(currentLocalData.systems, responses[3].data),
        serviceOrders: smartUnion(currentLocalData.serviceOrders, responses[4].data).sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
        appointments: smartUnion(currentLocalData.appointments, responses[5].data),
        waterLevels: responses[6].data || []
      };
      
      setSyncStatus('synced');
      return updated;
    } catch (error) {
      console.error("Erro na sincronização:", error);
      setSyncStatus('offline');
      return currentLocalData;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const local = getStore();
      setData(local);
      setIsInitialSyncing(false); 
      
      if (local.currentUser) {
        const updated = await fetchAllData(local);
        setData(updated);
        saveStore(updated);
        
        const channel = supabase.channel('global-sync')
          .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
             if (dataRef.current) {
               const fresh = await fetchAllData(dataRef.current);
               setData(fresh);
               saveStore(fresh);
             }
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };
    init();
  }, [fetchAllData]);

  const updateData = async (newData: AppData) => {
    // Adiciona timestamp de atualização em todos os registros que mudaram
    const timestamp = new Date().toISOString();
    
    setData(newData);
    saveStore(newData);

    if (navigator.onLine && isSupabaseActive) {
      setSyncStatus('syncing');
      try {
        const syncPromises = [
          supabase.from('condos').upsert(newData.condos.map(item => ({ ...item, updated_at: item.updated_at || timestamp }))),
          supabase.from('equipments').upsert(newData.equipments.map(item => ({ ...item, updated_at: item.updated_at || timestamp }))),
          supabase.from('systems').upsert(newData.systems.map(item => ({ ...item, updated_at: item.updated_at || timestamp }))),
          supabase.from('service_orders').upsert(newData.serviceOrders.map(item => ({ ...item, updated_at: item.updated_at || timestamp }))),
          supabase.from('appointments').upsert(newData.appointments.map(item => ({ ...item, updated_at: item.updated_at || timestamp })))
        ];
        
        const results = await Promise.all(syncPromises);
        
        results.forEach((res, index) => {
          if (res.error) {
            console.error(`Erro ao sincronizar tabela index ${index}:`, res.error.message);
          }
        });

        setSyncStatus('synced');
      } catch (err) {
        console.error("Falha crítica no upload:", err);
        setSyncStatus('offline');
      }
    }
  };

  if (!data) return null;
  if (isInitialSyncing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <Wrench size={48} className="text-blue-500 animate-bounce mb-6" />
        <h2 className="text-white font-black uppercase tracking-widest text-lg mb-2">SmartGestão</h2>
        <p className="text-slate-400 text-sm font-bold animate-pulse">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  if (!data.currentUser && location.pathname !== '/login') {
    return <Login onLogin={async (user) => {
      const baseData = { ...data, currentUser: user };
      const updatedData = await fetchAllData(baseData);
      setData(updatedData);
      saveStore(updatedData);
      navigate('/');
    }} />;
  }

  const user = data.currentUser;
  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
        location.pathname === to 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 h-16 shrink-0 shadow-lg no-print">
        <div className="flex items-center space-x-3">
          <Wrench size={18} className="text-blue-500" />
          <span className="font-black text-lg uppercase tracking-tight">SmartGestão</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden md:flex items-center justify-between mb-10 px-2">
            <div className="flex items-center space-x-3">
              <Wrench size={24} className="text-blue-500" />
              <span className="font-black text-xl tracking-tighter uppercase">SmartGestão</span>
            </div>
            {syncStatus === 'syncing' && <RefreshCcw size={16} className="text-blue-400 animate-spin" />}
            {syncStatus === 'synced' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {syncStatus === 'offline' && <CloudOff size={16} className="text-slate-600" />}
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            
            {user?.role === UserRole.RONDA ? (
               <>
                 <NavItem to="/reservatorios" icon={Droplets} label="Reservatórios" />
                 <NavItem to="/os" icon={FileText} label="Minhas Vistorias" />
               </>
            ) : (
              <>
                <NavItem to="/condos" icon={Building2} label="Condomínios" />
                <NavItem to="/reservatorios" icon={Droplets} label="Reservatórios" />
                <NavItem to="/equipment" icon={Layers} label="Equipamentos" />
                <NavItem to="/systems" icon={Wrench} label="Sistemas" />
                <NavItem to="/os" icon={FileText} label="Ordens de Serviço" />
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.SINDICO_ADMIN) && (
                  <NavItem to="/reports" icon={FileBarChart} label="Relatórios" />
                )}
              </>
            )}

            {user?.role === UserRole.ADMIN && (
              <>
                <div className="pt-4 pb-2 px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">SISTEMA</div>
                <NavItem to="/admin" icon={Settings} label="Administração" />
                <NavItem to="/database" icon={Database} label="Banco de Dados" />
              </>
            )}
          </nav>
          
          <div className="mt-auto pt-6 border-t border-slate-800 space-y-3">
            <div className="px-4 py-3 bg-slate-800/50 rounded-xl flex items-center justify-between">
               <div className="min-w-0">
                 <p className="text-[10px] font-black text-slate-500 uppercase truncate">
                   {user?.role === UserRole.SINDICO_ADMIN ? 'SÍNDICO / GESTOR' : user?.role}
                 </p>
                 <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                 {user?.condo_id && (
                    <p className="text-[8px] font-bold text-blue-400 truncate mt-0.5">
                      {data.condos.find(c => c.id === user.condo_id)?.name}
                    </p>
                 )}
               </div>
               <div title={syncStatus === 'synced' ? 'Nuvem Conectada' : 'Modo Offline'}>
                {syncStatus === 'synced' ? <Cloud size={14} className="text-emerald-400" /> : 
                 syncStatus === 'syncing' ? <RefreshCcw size={14} className="text-blue-400 animate-spin" /> : 
                 <CloudOff size={14} className="text-red-400" />}
               </div>
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
              <span>Encerrar Sessão</span>
            </button>

            <div className="pt-4 text-center border-t border-slate-800/50">
              <p className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] opacity-100 transition-opacity">
                V5.6 | POR ENG. ADRIANO PANTAROTO
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar print:p-0">
          <Routes>
            <Route path="/" element={<Dashboard data={data} updateData={updateData} />} />
            <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />
            <Route path="/reservatorios" element={<WaterLevel data={data} updateData={updateData} onRefresh={async () => {
              const updated = await fetchAllData(data);
              setData(updated);
              saveStore(updated);
            }} />} />
            <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
            <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
            <Route path="/reports" element={<Reports data={data} />} />
            <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
            <Route path="/database" element={<DatabaseSetup />} />
            <Route path="/login" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] md:hidden no-print" onClick={() => setSidebarOpen(false)} />
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
