
import React, { useState, useMemo } from 'react';
import { Plus, Layers, ShieldCheck, Thermometer, Zap, AlertCircle, Trash2, Edit2, X, MapPin, Camera, ImageIcon, ChevronLeft, ChevronRight, Building2, Clock, Calendar } from 'lucide-react';
import { Equipment, EquipmentType, Condo, UserRole } from '../types';

const EquipmentPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const user = data.currentUser;
  const isAdminOrTech = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;
  const isCondo = user?.role === UserRole.CONDO_USER;
  const userCondoId = user?.condo_id;

  const filteredEquipments = isCondo
    ? data.equipments.filter((e: Equipment) => e.condo_id === userCondoId)
    : data.equipments;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const openModal = (eq: Equipment | null) => {
    setEditingEq(eq);
    setPhotos(eq?.photos || []);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const condoId = isCondo ? userCondoId : (formData.get('condoId') as string);

    const eqData: Equipment = {
      id: editingEq?.id || `eq-${Date.now()}`,
      condo_id: condoId || '',
      type_id: formData.get('typeId') as string,
      manufacturer: formData.get('manufacturer') as string,
      model: formData.get('model') as string,
      power: formData.get('power') as string,
      voltage: formData.get('voltage') as string,
      nominal_current: Number(formData.get('nominalCurrent')),
      measured_current: Number(formData.get('measuredCurrent')),
      temperature: Number(formData.get('temperature')),
      noise: formData.get('noise') as any,
      electrical_state: formData.get('electricalState') as any,
      location: formData.get('location') as string,
      observations: formData.get('observations') as string,
      photos: photos,
      last_maintenance: formData.get('last_maintenance') as string || new Date().toISOString(),
      maintenance_period: Number(formData.get('maintenance_period')) || 30
    };

    const newEquipments = editingEq
      ? data.equipments.map((e: Equipment) => e.id === editingEq.id ? eqData : e)
      : [...data.equipments, eqData];

    updateData({ ...data, equipments: newEquipments });
    setIsModalOpen(false);
    setEditingEq(null);
    setPhotos([]);
  };

  const getMaintenanceStatus = (eq: Equipment) => {
    if (!eq.last_maintenance || !eq.maintenance_period) return { label: 'Sem dados', color: 'text-slate-400' };
    const last = new Date(eq.last_maintenance);
    const next = new Date(last);
    next.setDate(last.getDate() + eq.maintenance_period);
    const today = new Date();
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { label: 'Atrasada', color: 'text-red-500', days: Math.abs(diff) };
    if (diff <= 7) return { label: 'Vence em breve', color: 'text-amber-500', days: diff };
    return { label: 'Em dia', color: 'text-emerald-500', days: diff };
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Gestão de Ativos</h1>
          <p className="text-sm text-slate-500 font-medium">Controle de inventário e periodicidade técnica.</p>
        </div>
        {isAdminOrTech && (
          <button onClick={() => openModal(null)} className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 font-black uppercase text-[10px] tracking-widest shadow-xl">
            <Plus size={18} />
            <span>Novo Equipamento</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipments.map((eq: Equipment) => {
          const condo = data.condos.find((c: Condo) => c.id === eq.condo_id);
          const type = data.equipmentTypes.find((t: EquipmentType) => t.id === eq.type_id);
          const status = getMaintenanceStatus(eq);
          
          return (
            <div key={eq.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all flex flex-col h-full">
              <div className="relative h-44 bg-slate-100 shrink-0 overflow-hidden">
                {eq.photos && eq.photos.length > 0 ? (
                  <img src={eq.photos[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={eq.model} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={40} /></div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur shadow-sm text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                    {type?.name || 'Inespecífico'}
                  </span>
                </div>
                {eq.maintenance_period && (
                   <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/20">
                      <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Periodicidade</p>
                      <p className="text-[10px] font-black text-white leading-none">{eq.maintenance_period} dias</p>
                   </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{eq.manufacturer}</h3>
                    <p className="text-xs font-bold text-slate-500 truncate">{eq.model}</p>
                  </div>
                  {isAdminOrTech && (
                    <div className="flex space-x-1 shrink-0">
                       <button onClick={() => openModal(eq)} className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                    </div>
                  )}
                </div>
                
                <p className="text-[9px] text-blue-600 font-black uppercase mb-6 flex items-center">
                  <Building2 size={12} className="mr-1.5" /> {condo?.name || 'Geral'}
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Saúde do Cronograma</span>
                      <span className={`text-[9px] font-black uppercase ${status.color}`}>{status.label}</span>
                   </div>
                   <div className="flex items-center space-x-3">
                      <Clock size={16} className="text-slate-300" />
                      <div>
                        <p className="text-[10px] font-black text-slate-900 leading-none">Próxima Revisão</p>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                           {status.days !== undefined ? (status.label === 'Atrasada' ? `Atrasado há ${status.days} dias` : `Em ${status.days} dias`) : '---'}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    <Thermometer size={14} className="mr-1.5" /> {eq.temperature}°C
                  </div>
                  <div className="flex items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    <Zap size={14} className="mr-1.5" /> {eq.measured_current}A
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingEq ? 'Configurar Ativo' : 'Novo Ativo'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingEq(null); }} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condomínio</label>
                  <select required name="condoId" defaultValue={editingEq?.condo_id} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Equipamento</label>
                  <select required name="typeId" defaultValue={editingEq?.type_id} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none">
                    {data.equipmentTypes.map((t: EquipmentType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-5">
                 <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center">
                   <Calendar size={16} className="mr-2" /> Cronograma de Preventivas
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Periodicidade (em dias)</label>
                      <input required type="number" name="maintenance_period" defaultValue={editingEq?.maintenance_period || 30} className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl font-black text-blue-600 outline-none" placeholder="Ex: 30" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Última Revisão Realizada</label>
                      <input required type="date" name="last_maintenance" defaultValue={editingEq?.last_maintenance?.split('T')[0]} className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl font-black text-blue-600 outline-none" />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fabricante</label>
                  <input required name="manufacturer" defaultValue={editingEq?.manufacturer} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modelo</label>
                  <input required name="model" defaultValue={editingEq?.model} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fotos do Ativo</label>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((p, i) => <img key={i} src={p} className="w-20 h-20 object-cover rounded-xl border" />)}
                  <label className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 transition-all">
                    <Camera size={24} />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Salvar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
