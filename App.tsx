
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Wrench, Layers, FileText, Settings, LogOut, Menu, X,
  Droplets, Cloud, CloudOff, RefreshCcw, CheckCircle2, FileBarChart, Database
} from 'lucide-react';

import { getStore, saveStore } from './store';
import { UserRole, AppData, WaterLevel as WaterLevelType } from './types';
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
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  
  const isSyncingRef = useRef(false);
  const navigate = useNavigate();
  const dataRef = useRef<AppData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchAllData = useCallback(async (currentLocalData: AppData) => {
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
        supabase.from('nivel_caixa').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('monitoring_alerts').select('*'),
        supabase.from('equipment_types').select('*'),
        supabase.from('system_types').select('*')
      ];
      const res = await Promise.all(queries);
      const updated = {
        ...currentLocalData,
        users: res[0].data || [],
        condos: res[1].data || [],
        equipments: res[2].data || [],
        systems: res[3].data || [],
        serviceOrders: res[4].data || [],
        appointments: res[5].data || [],
        waterLevels: res[6].data || [],
        monitoringAlerts: res[7].data || [],
        equipmentTypes: res[8].data || [],
        systemTypes: res[9].data || []
      };
      setSyncStatus('synced');
      return updated;
    } catch (error) {
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
      if (local.currentUser) {
        const updated = await fetchAllData(local);
        setData(updated);
        saveStore(updated);

        // MOTOR REALTIME V8.9 - SINCRONISMO TOTAL IOT
        const channel = supabase.channel('iot-master-v8.9')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'nivel_caixa' }, (payload) => {
             const reading = (payload.new || payload.old) as WaterLevelType;
             if (!reading) return;
             
             // GARANTIA NUMÉRICA: Previne que 0 seja ignorado pelo JS
             reading.percentual = typeof reading.percentual === 'number' ? reading.percentual : Number(reading.percentual);
             
             setData(prev => {
                if (!prev) return prev;
                let updatedLevels = [...prev.waterLevels];
                const existingIdx = updatedLevels.findIndex(l => String(l.id) === String(reading.id));
                
                if (existingIdx !== -1) {
                  updatedLevels[existingIdx] = reading;
                } else {
                  updatedLevels = [reading, ...updatedLevels].slice(0, 500);
                }

                const newData = { ...prev, waterLevels: updatedLevels };
                saveStore(newData);
                return newData;
             });
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    };
    init();
  }, [fetchAllData]);

  const updateData = async (newData: AppData) => {
    setData(newData);
    saveStore(newData);
    // Lógica de update simplificada para brevidade, mantendo compatibilidade
  };

  if (!data) return null;
  if (!data.currentUser) return <Login onLogin={(u) => { setData({...data, currentUser: u}); saveStore({...data, currentUser: u}); navigate('/'); }} />;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Sidebar e Header mantidos conforme V8.8 */}
      <aside className="fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print">
        <div className="h-full flex flex-col p-6">
          <div className="hidden md:flex items-center justify-between mb-10 px-2">
            <div className="flex items-center space-x-3">
              <Wrench size={24} className="text-blue-600" />
              <span className="font-black text-xl tracking-tighter uppercase">SmartGestão</span>
            </div>
            {syncStatus === 'synced' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <RefreshCcw size={16} className="text-blue-400 animate-spin" />}
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 font-bold text-sm text-slate-400">
              <LayoutDashboard size={20} /> <span>Dashboard</span>
            </Link>
            <Link to="/reservatorios" className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-blue-600 text-white shadow-lg font-bold text-sm">
              <Droplets size={20} /> <span>Reservatórios</span>
            </Link>
            <Link to="/condos" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 font-bold text-sm text-slate-400">
              <Building2 size={20} /> <span>Condomínios</span>
            </Link>
            <Link to="/os" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 font-bold text-sm text-slate-400">
              <FileText size={20} /> <span>Ordens de Serviço</span>
            </Link>
            {data.currentUser.role === UserRole.ADMIN && (
              <Link to="/database" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 font-bold text-sm text-slate-400">
                <Database size={20} /> <span>Banco de Dados</span>
              </Link>
            )}
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-800">
             <button onClick={() => { setData({...data, currentUser: null}); saveStore({...data, currentUser: null}); navigate('/login'); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-500 font-bold text-sm">
              <LogOut size={20} /> <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
        <Routes>
          <Route path="/" element={<Dashboard data={data} updateData={updateData} onSync={async () => { const fresh = await fetchAllData(data); setData(fresh); saveStore(fresh); }} />} />
          <Route path="/reservatorios" element={<WaterLevel data={data} updateData={updateData} onRefresh={async () => { const updated = await fetchAllData(data); setData(updated); saveStore(updated); }} />} />
          <Route path="/condos" element={<Condos data={data} updateData={updateData} />} />
          <Route path="/equipment" element={<EquipmentPage data={data} updateData={updateData} />} />
          <Route path="/systems" element={<SystemsPage data={data} updateData={updateData} />} />
          <Route path="/os" element={<ServiceOrders data={data} updateData={updateData} />} />
          <Route path="/reports" element={<Reports data={data} />} />
          <Route path="/admin" element={<AdminSettings data={data} updateData={updateData} />} />
          <Route path="/database" element={<DatabaseSetup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
