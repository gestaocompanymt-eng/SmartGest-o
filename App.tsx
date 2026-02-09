
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Wrench, Layers, FileText, Settings, LogOut, Menu, X,
  Droplets, Cloud, CloudOff, RefreshCcw, CheckCircle2, FileBarChart, Database
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

const NavItem: React.FC<{ to: string; icon: any; label: string }> = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
        isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

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

  const sanitizeForSupabase = (item: any, tableName: string) => {
    const clean: any = {};
    const timestamp = new Date().toISOString();
    
    const schema: Record<string, string[]> = {
      users: ['id', 'name', 'email', 'password', 'role', 'condo_id', 'updated_at'],
      condos: ['id', 'name', 'address', 'manager', 'contract_type', 'start_date', 'updated_at'],
      equipments: ['id', 'condo_id', 'type_id', 'manufacturer', 'model', 'power', 'voltage', 'nominal_current', 'measured_current', 'temperature', 'noise', 'electrical_state', 'location', 'observations', 'photos', 'last_maintenance', 'maintenance_period', 'refrigeration_specs', 'last_reading', 'tuya_device_id', 'monitoring_status', 'updated_at'],
      systems: ['id', 'condo_id', 'type_id', 'name', 'location', 'equipment_ids', 'monitoring_points', 'parameters', 'observations', 'last_maintenance', 'maintenance_period', 'updated_at'],
      service_orders: ['id', 'type', 'status', 'condo_id', 'location', 'equipment_id', 'system_id', 'problem_description', 'actions_performed', 'parts_replaced', 'photos_before', 'photos_after', 'refrigeration_readings', 'technician_id', 'service_value', 'material_value', 'created_at', 'completed_at', 'updated_at'],
      appointments: ['id', 'condo_id', 'technician_id', 'equipment_id', 'system_id', 'date', 'time', 'description', 'status', 'is_recurring', 'service_order_id', 'updated_at'],
      monitoring_alerts: ['id', 'equipment_id', 'message', 'value', 'is_resolved', 'created_at', 'updated_at'],
      equipment_types: ['id', 'name'],
      system_types: ['id', 'name']
    };

    const allowedColumns = schema[tableName] || [];
    allowedColumns.forEach(col => {
      const val = item[col];
      if (val === undefined || val === '') {
        clean[col] = null;
      } else {
        clean[col] = val;
      }
    });

    if (!clean.updated_at && tableName !== 'equipment_types' && tableName !== 'system_types') clean.updated_at = timestamp;
    return clean;
  };

  const cloudFirstUnion = (local: any[], cloud: any[] | null) => {
    if (!cloud || cloud.length === 0) return local || [];
    return cloud;
  };

  const fetchAllData = useCallback(async (currentLocalData: AppData, forceCloud: boolean = false) => {
    if (!navigator.onLine || !isSupabaseActive || isSyncingRef.current || !currentLocalData.currentUser) {
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      return currentLocalData;
    }
    
    setSyncStatus('syncing');
    isSyncingRef.current = true;
    try {
      const queries = [
        supabase.from('users').select('*'),
        supabase.from('condos').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('service_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*'),
        supabase.from('nivel_caixa').select('*').order('created_at', { ascending: false }).limit(300),
        supabase.from('monitoring_alerts').select('*'),
        supabase.from('equipment_types').select('*'),
        supabase.from('system_types').select('*')
      ];

      const responses = await Promise.all(queries);

      const updated = {
        ...currentLocalData,
        users: cloudFirstUnion(currentLocalData.users, responses[0].data),
        condos: cloudFirstUnion(currentLocalData.condos, responses[1].data),
        equipments: cloudFirstUnion(currentLocalData.equipments, responses[2].data),
        systems: cloudFirstUnion(currentLocalData.systems, responses[3].data),
        serviceOrders: cloudFirstUnion(currentLocalData.serviceOrders, responses[4].data),
        appointments: cloudFirstUnion(currentLocalData.appointments, responses[5].data),
        waterLevels: responses[6].data || [],
        monitoringAlerts: cloudFirstUnion(currentLocalData.monitoringAlerts, responses[7].data),
        equipmentTypes: cloudFirstUnion(currentLocalData.equipmentTypes, responses[8].data),
        systemTypes: cloudFirstUnion(currentLocalData.systemTypes, responses[9].data)
      };
      
      setSyncStatus('synced');
      return updated;
    } catch (error) {
      console.error("Erro na sincronização de download:", error);
      setSyncStatus('offline');
      return currentLocalData;
    } finally {
      isSyncingRef.current = false;
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
             if (dataRef.current?.currentUser && !isSyncingRef.current) {
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
    setData(newData);
    saveStore(newData);

    if (navigator.onLine && isSupabaseActive) {
      setSyncStatus('syncing');
      
      const tableConfigs = [
        { name: 'condos', data: newData.condos },
        { name: 'users', data: newData.users },
        { name: 'systems', data: newData.systems },
        { name: 'equipments', data: newData.equipments },
        { name: 'service_orders', data: newData.serviceOrders },
        { name: 'appointments', data: newData.appointments },
        { name: 'monitoring_alerts', data: newData.monitoringAlerts },
        { name: 'equipment_types', data: newData.equipmentTypes },
        { name: 'system_types', data: newData.systemTypes }
      ];

      try {
        for (const config of tableConfigs) {
          if (config.data && config.data.length > 0) {
            const cleanBatch = config.data.map(item => sanitizeForSupabase(item, config.name));
            const { error } = await supabase.from(config.name).upsert(cleanBatch, { onConflict: 'id' });
            if (error) console.error(`Falha na tabela ${config.name}:`, error.message);
          }
        }
        setSyncStatus('synced');
      } catch (err: any) {
        console.error("Erro Crítico de Sincronização:", err);
        setSyncStatus('offline');
      }
    }
  };

  const deleteData = async (tableName: string, id: string) => {
    setData(prev => {
      if (!prev) return prev;
      const newData = { ...prev };
      if (tableName === 'service_orders') newData.serviceOrders = prev.serviceOrders.filter(o => o.id !== id);
      if (tableName === 'condos') newData.condos = prev.condos.filter(c => c.id !== id);
      if (tableName === 'equipments') newData.equipments = prev.equipments.filter(e => e.id !== id);
      if (tableName === 'systems') newData.systems = prev.systems.filter(s => s.id !== id);
      if (tableName === 'users') newData.users = prev.users.filter(u => u.id !== id);
      if (tableName === 'appointments') newData.appointments = prev.appointments.filter(a => a.id !== id);
      if (tableName === 'equipment_types') newData.equipmentTypes = prev.equipmentTypes.filter(t => t.id !== id);
      if (tableName === 'system_types') newData.systemTypes = prev.systemTypes.filter(t => t.id !== id);
      
      saveStore(newData);
      return newData;
    });

    if (navigator.onLine && isSupabaseActive) {
      setSyncStatus('syncing');
      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        setSyncStatus('synced');
      } catch (err) {
        console.error(`Erro ao deletar ${tableName} do cloud:`, err);
        setSyncStatus('offline');
      }
    }
  };

  if (!data) return null;

  if (!data.currentUser) {
    return <Login onLogin={(u) => {
      updateData({ ...data, currentUser: u });
      navigate('/', { replace: true });
    }} />;
  }
  
  const user = data.currentUser;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 h-16 shrink-0 shadow-lg no-print">
        <div className="flex items-center space-x-3">
          <Wrench size={18} className="text-blue-500" />
          <span className="font-black text-lg uppercase tracking-tight">SmartGestão</span>
        </div>
        <div className="flex items-center space-x-4">
          {syncStatus === 'syncing' && <RefreshCcw size={18} className="text-blue-400 animate-spin" />}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
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
                V8.0 | POR ENG. ADRIANO PANTAROTO
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar print:p-0">
          <Routes>
            <Route path="/" element={<Dashboard data={data} updateData={updateData} deleteData={deleteData} onSync={async () => {
              const fresh = await fetchAllData(data, true);
              setData(fresh);
              saveStore(fresh);
            }} />} />
            <Route path="/condos" element={<Condos data={data} updateData={updateData} deleteData={deleteData} />} />
            <Route path="/reservatorios" element={<WaterLevel data={data} updateData={updateData} onRefresh={async () => {
              const updated = await fetchAllData(data);
              setData(updated);
              saveStore(updated);
            }} />} />
            <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} deleteData={deleteData} />} />
            <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} deleteData={deleteData} />} />
            <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} deleteData={deleteData} />} />
            <Route path="/reports" element={<Reports data={data} />} />
            <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} deleteData={deleteData} />} />
            <Route path="/database" element={<DatabaseSetup />} />
            <Route path="/login" element={<Login onLogin={(u) => {
              updateData({ ...data, currentUser: u });
              navigate('/', { replace: true });
            }} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
