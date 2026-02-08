
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Edit2, Share2, Wrench, MapPin, Camera, Trash2, Image as ImageIcon, CheckCircle2, Save, Layers, Settings, Building2, RefreshCcw, Play, Eye, Thermometer, Droplet, Wind, User as UserIcon, Activity
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, System, UserRole, AppData, Equipment } from '../types';
import { supabase, isSupabaseActive } from '../supabase';

const ServiceOrders: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const isSindicoAdmin = user?.role === UserRole.SINDICO_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isRonda = user?.role === UserRole.RONDA;
  const userCondoId = user?.condo_id;
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>(isRonda ? OSType.VISTORIA : 'all');
  const [expandedOS, setExpandedOS] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const [selectedCondoId, setSelectedCondoId] = useState(userCondoId || '');
  const [assignmentType, setAssignmentType] = useState<'general' | 'equipment' | 'system'>('general');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [osType, setOsType] = useState<OSType>(isRonda ? OSType.VISTORIA : OSType.SERVICE);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const osId = params.get('id');
    const equipmentParam = params.get('equipmentId');

    if (osId) {
      const os = data.serviceOrders.find(o => o.id === osId);
      if (os) {
        setEditingOS(os);
        setExpandedOS(os.id);
        setSelectedCondoId(os.condo_id);
        setAssignmentType(os.equipment_id ? 'equipment' : os.system_id ? 'system' : 'general');
        setSelectedEquipmentId(os.equipment_id || '');
        setSelectedSystemId(os.system_id || '');
        setOsType(os.type);
        setIsModalOpen(true);
      }
    } else if (equipmentParam) {
      const eq = data.equipments.find(e => e.id === equipmentParam);
      if (eq) {
        setSelectedCondoId(eq.condo_id);
        setAssignmentType('equipment');
        setSelectedEquipmentId(eq.id);
        setOsType(OSType.SERVICE);
        setIsModalOpen(true);
      }
    }
  }, [location.search, data.serviceOrders, data.equipments]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    const formData = new FormData(e.currentTarget);
    const statusFromForm = formData.get('status') as OSStatus;
    const finalCondoId = userCondoId || selectedCondoId;
    const currentTechnicianId = user?.id || 'unknown';

    const osData: ServiceOrder = {
      id: editingOS?.id || `OS-${Date.now()}`,
      type: isRonda ? OSType.VISTORIA : (formData.get('type') as OSType),
      status: statusFromForm || editingOS?.status || OSStatus.OPEN,
      condo_id: finalCondoId,
      location: formData.get('location') as string || '',
      equipment_id: assignmentType === 'equipment' ? selectedEquipmentId : undefined,
      system_id: assignmentType === 'system' ? selectedSystemId : undefined,
      problem_description: formData.get('description') as string,
      actions_performed: (formData.get('actions') as string) || editingOS?.actions_performed || '',
      parts_replaced: editingOS?.parts_replaced || [],
      photos_before: editingOS?.photos_before || [],
      photos_after: editingOS?.photos_after || [],
      technician_id: currentTechnicianId,
      created_at: editingOS?.created_at || new Date().toISOString(),
      service_value: Number(formData.get('service_value')) || 0,
      material_value: Number(formData.get('material_value')) || 0,
      completed_at: statusFromForm === OSStatus.COMPLETED ? new Date().toISOString() : editingOS?.completed_at,
      updated_at: new Date().toISOString()
    };

    try {
      if (navigator.onLine && isSupabaseActive) {
        const { error } = await supabase.from('service_orders').upsert(osData);
        if (error) throw error;
      }

      const newOrders = editingOS 
        ? data.serviceOrders.map((o: ServiceOrder) => o.id === editingOS.id ? osData : o) 
        : [osData, ...data.serviceOrders];
      
      updateData({ ...data, serviceOrders: newOrders });
      setSaveStatus('success');
      setTimeout(closeModal, 800);
    } catch (err) {
      console.error("Erro ao salvar OS:", err);
      setSaveStatus('error');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOS(null);
    setSaveStatus('idle');
    setAssignmentType('general');
    setSelectedEquipmentId('');
    setSelectedSystemId('');
  };

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => {
    const matchStatus = filterStatus === 'all' || os.status === filterStatus;
    const matchType = filterType === 'all' || os.type === filterType;
    if (isRonda) return os.type === OSType.VISTORIA && os.condo_id === userCondoId && matchStatus;
    if (isSindicoAdmin) return os.condo_id === userCondoId && matchStatus && matchType;
    return matchStatus && matchType;
  });

  const availableEquipments = useMemo(() => 
    data.equipments.filter((e: Equipment) => e.condo_id === selectedCondoId),
    [data.equipments, selectedCondoId]
  );

  const availableSystems = useMemo(() => 
    data.systems.filter((s: System) => s.condo_id === selectedCondoId),
    [data.systems, selectedCondoId]
  );

  const handleShare = async (os: ServiceOrder, condoName?: string) => {
    const text = `🛠️ *SmartGestão - ${os.type}*\n\n*ID:* ${os.id}\n*Condomínio:* ${condoName || 'Não informado'}\n*Status:* ${os.status}\n\n*Relato:* ${os.problem_description}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${os.type} ${os.id}`, text: text, url: window.location.origin });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copiado!');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {isRonda ? 'Minhas Vistorias' : 'Ordens de Serviço'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">{isRonda ? 'Inspeções e rondas periódicas.' : 'Gestão técnica e atendimentos.'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {!isRonda && (
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none flex-1 md:flex