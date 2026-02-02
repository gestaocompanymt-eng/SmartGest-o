
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, FileText, ChevronDown, ChevronUp, X, DollarSign, Calculator, Printer, MessageCircle, Edit2, Share2, Wrench, MapPin, Camera, Trash2, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, System, UserRole, AppData, Equipment } from '../types';

const ServiceOrders: React.FC<{ data: AppData; updateData: (d: AppData) => void }> = ({ data, updateData }) => {
  const user = data.currentUser;
  const isCondoUser = user?.role === UserRole.CONDO_USER;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const userCondoId = user?.condo_id;
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [quoteOS, setQuoteOS] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOS, setExpandedOS] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const [selectedCondoId, setSelectedCondoId] = useState(isCondoUser ? (userCondoId || '') : '');
  const [assignmentType, setAssignmentType] = useState<'equipment' | 'system' | 'general'>('general');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [initialDescription, setInitialDescription] = useState('');

  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const systemId = params.get('systemId');
    const equipmentId = params.get('equipmentId');
    const description = params.get('description');

    if (systemId) {
      const sys = data.systems.find((s: System) => s.id === systemId);
      if (sys && (!isCondoUser || sys.condo_id === userCondoId)) openNewOSWithSystem(sys);
    } else if (equipmentId) {
      const eq = data.equipments.find((e: Equipment) => e.id === equipmentId);
      if (eq && (!isCondoUser || eq.condo_id === userCondoId)) openNewOSWithEquipment(eq, description || '');
    }
  }, [location.search, data.systems, data.equipments, isCondoUser, userCondoId]);

  const openNewOSWithSystem = (sys: System) => {
    setSelectedCondoId(sys.condo_id);
    setAssignmentType('system');
    setSelectedSystemId(sys.id);
    setSelectedEquipmentId('');
    setInitialDescription('');
    setEditingOS(null);
    setPhotosBefore([]);
    setPhotosAfter([]);
    setIsModalOpen(true);
  };

  const openNewOSWithEquipment = (eq: Equipment, desc: string) => {
    setSelectedCondoId(eq.condo_id);
    setAssignmentType('equipment');
    setSelectedEquipmentId(eq.id);
    setSelectedSystemId('');
    setInitialDescription(desc);
    setEditingOS(null);
    setPhotosBefore([]);
    setPhotosAfter([]);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'before') {
          setPhotosBefore(prev => [...prev, base64String]);
        } else {
          setPhotosAfter(prev => [...prev, base64String]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setPhotosBefore(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotosAfter(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleShare = async (os: ServiceOrder, condoName?: string) => {
    const text = `🛠️ *SmartGestão - Ordem de Serviço*\n\n*ID:* ${os.id}\n*Condomínio:* ${condoName || 'Não informado'}\n*Local:* ${os.location || 'Não informado'}\n*Tipo:* ${os.type}\n*Status:* ${os.status}\n\n*Descrição:* ${os.problem_description}\n\n_Gerado via SmartGestão_`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `OS ${os.id} - SmartGestão`,
          text: text,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Informações da OS copiadas para a área de transferência!');
      } catch (err) {
        alert('Não foi possível copiar os dados.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    const formData = new FormData(e.currentTarget);
    
    const statusFromForm = formData.get('status') as OSStatus;
    // Pega o ID do condomínio: se for síndico é o dele, se for global é o que foi selecionado
    const condoId = isCondoUser ? (userCondoId || '') : (formData.get('condo_id') as string);

    const uniqueId = `OS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const osData: ServiceOrder = {
      id: editingOS?.id || uniqueId,
      type: formData.get('type') as OSType,
      status: statusFromForm || editingOS?.status || OSStatus.OPEN,
      condo_id: condoId,
      location: formData.get('location') as string,
      equipment_id: assignmentType === 'equipment' ? (formData.get('equipment_id') as string) : undefined,
      system_id: assignmentType === 'system' ? (formData.get('system_id') as string) : undefined,
      problem_description: formData.get('description') as string,
      actions_performed: (formData.get('actions') as string) || editingOS?.actions_performed || '',
      parts_replaced: editingOS?.parts_replaced || [],
      photos_before: photosBefore,
      photos_after: photosAfter,
      technician_id: editingOS?.technician_id || user?.id || 'unknown',
      created_at: editingOS?.created_at || new Date().toISOString(),
      service_value: Number(formData.get('service_value')) || 0,
      material_value: Number(formData.get('material_value')) || 0,
      completed_at: statusFromForm === OSStatus.COMPLETED ? new Date().toISOString() : editingOS?.completed_at
    };

    await updateData({ 
      ...data, 
      serviceOrders: editingOS 
        ? data.serviceOrders.map((o: ServiceOrder) => o.id === editingOS.id ? osData : o) 
        : [osData, ...data.serviceOrders] 
    });

    setSaveStatus('success');
    setTimeout(closeModal, 800);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOS(null);
    setAssignmentType('general');
    setSelectedCondoId(isCondoUser ? (userCondoId || '') : '');
    setSelectedEquipmentId('');
    setSelectedSystemId('');
    setInitialDescription('');
    setPhotosBefore([]);
    setPhotosAfter([]);
    setSaveStatus('idle');
  };

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => {
    const matchStatus = filterStatus === 'all' || os.status === filterStatus;
    const matchCondo = isCondoUser ? os.condo_id === userCondoId : true;
    return matchStatus && matchCondo;
  });

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500">{isCondoUser ? 'Chamados do seu condomínio.' : 'Gestão técnica de chamados.'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none flex-1 md:flex-none">
            <option value="all">Todos</option>
            {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => { setEditingOS(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 flex-1 md:flex-none">
            <Plus size={16} className="inline mr-1" /> Novo Chamado
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOS.map((os: ServiceOrder) => {
          const condo = data.condos.find((c: Condo) => c.id === os.condo_id);
          const isExpanded = expandedOS === os.id;
          return (
            <div key={os.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedOS(isExpanded ? null : os.id)}>
                <div className="flex items-center space-x-4 min-w-0">
                  <div className={`p-2.5 rounded-xl ${os.type === OSType.CORRETIVE ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{condo?.name || 'Condomínio'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{os.id} • {os.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                    os.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                    os.status === OSStatus.CANCELLED ? 'bg-slate-100 text-slate-500' : 
                    os.status === OSStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {os.status}
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-4 space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Descrição da Ocorrência</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl italic">{os.problem_description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {(isAdminOrTech || (isCondoUser && os.condo_id === userCondoId)) && (
                      <button 
                        onClick={() => { 
                          setEditingOS(os); 
                          setPhotosBefore(os.photos_before || []);
                          setPhotosAfter(os.photos_after || []);
                          setIsModalOpen(true); 
                        }} 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center transition-colors"
                      >
                        <Edit2 size={14} className="mr-1.5" /> Editar / Finalizar
                      </button>
                    )}
                    <button 
                      onClick={() => handleShare(os, condo?.name)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center transition-colors"
                    >
                      <Share2 size={14} className="mr-1.5" /> Compartilhar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingOS ? 'Gerenciar OS' : 'Novo Chamado'}</h2>
              <button onClick={closeModal} className="p-2 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingOS?.status || OSStatus.OPEN}
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl font-black text-blue-700 text-xs"
                  >
                    {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Condomínio</label>
                  {isCondoUser ? (
                    <div className="w-full px-4 py-3 bg-slate-100 border rounded-xl font-black text-xs text-slate-600">
                      {data.condos.find((c: Condo) => c.id === userCondoId)?.name || 'NÃO VINCULADO'}
                    </div>
                  ) : (
                    <select 
                      disabled={!!editingOS}
                      required 
                      name="condo_id" 
                      value={selectedCondoId} 
                      onChange={(e) => setSelectedCondoId(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                    >
                      <option value="">Selecione...</option>
                      {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Descrição do Problema</label>
                <textarea required name="description" defaultValue={editingOS?.problem_description || initialDescription} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border rounded-2xl font-black text-xs uppercase">Descartar</button>
                <button type="submit" disabled={saveStatus === 'saving'} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95">
                  {saveStatus === 'saving' ? 'Salvando...' : 'Gravar OS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
