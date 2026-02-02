
import { Plus, Layers, ShieldCheck, Thermometer, Zap, AlertCircle, Trash2, Edit2, X, MapPin, Camera, ImageIcon, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Equipment, EquipmentType, Condo, UserRole } from '../types';

const EquipmentPage: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const user = data.currentUser;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isTech = user?.role === UserRole.TECHNICIAN;
  const isCondo = user?.role === UserRole.CONDO_USER;

  const filteredEquipments = isCondo
    ? data.equipments.filter((e: Equipment) => e.condo_id === user?.condo_id)
    : data.equipments;

  // Fix: Explicitly cast Array.from(files) to File[] to ensure compatibility with FileReader.readAsDataURL and avoid 'unknown' type issues.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openModal = (eq: Equipment | null) => {
    setEditingEq(eq);
    setPhotos(eq?.photos || []);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const eqData: Equipment = {
      id: editingEq?.id || Math.random().toString(36).substr(2, 9),
      condo_id: formData.get('condoId') as string,
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
      last_maintenance: editingEq?.last_maintenance || new Date().toISOString()
    };

    const newEquipments = editingEq
      ? data.equipments.map((e: Equipment) => e.id === editingEq.id ? eqData : e)
      : [...data.equipments, eqData];

    updateData({ ...data, equipments: newEquipments });
    setIsModalOpen(false);
    setEditingEq(null);
    setPhotos([]);
  };

  const deleteEquipment = (id: string) => {
    if (confirm('Excluir este equipamento permanentemente?')) {
      updateData({ ...data, equipments: data.equipments.filter((e: Equipment) => e.id !== id) });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Equipamentos</h1>
          <p className="text-sm text-slate-500 font-medium italic">Inventário técnico e controle de ativos.</p>
        </div>
        {(isAdmin || isTech) && (
          <button 
            onClick={() => openModal(null)}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center space-x-2 font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={20} />
            <span className="uppercase text-xs tracking-widest">Cadastrar Ativo</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipments.map((eq: Equipment) => {
          const condo = data.condos.find((c: Condo) => c.id === eq.condo_id);
          const type = data.equipmentTypes.find((t: EquipmentType) => t.id === eq.type_id);
          
          return (
            <div key={eq.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all flex flex-col h-full">
              {/* Espaço para Foto do Ativo */}
              <div className="relative h-48 bg-slate-100 shrink-0 overflow-hidden">
                {eq.photos && eq.photos.length > 0 ? (
                  <img src={eq.photos[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={eq.model} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon size={48} />
                    <span className="text-[9px] font-black uppercase mt-2">Sem Foto</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur shadow-sm text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                    {type?.name || 'Inespecífico'}
                  </span>
                </div>
                {eq.photos && eq.photos.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase">
                    +{eq.photos.length - 1} fotos
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{eq.manufacturer}</h3>
                    <p className="text-xs font-bold text-slate-500 truncate">{eq.model}</p>
                  </div>
                  {(isAdmin || isTech) && (
                    <div className="flex space-x-1 shrink-0">
                       <button onClick={() => openModal(eq)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                       <button onClick={() => deleteEquipment(eq.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
                
                {/* Fix: Use Building2 component after proper import from lucide-react */}
                <p className="text-[10px] text-blue-600 font-black uppercase mb-6 flex items-center">
                  <Building2 size={12} className="mr-1.5" /> {condo?.name || 'SEM CONDOMÍNIO'}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Corrente</p>
                    <div className="text-sm font-black text-slate-900">{eq.measured_current}A</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Temperatura</p>
                    <div className="text-sm font-black text-slate-900">{eq.temperature}°C</div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <AlertCircle size={14} className="mr-1.5" />
                    Ruído: <span className={eq.noise === 'Normal' ? 'text-emerald-600 ml-1' : 'text-red-500 ml-1'}>{eq.noise}</span>
                  </div>
                  <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                    eq.electrical_state === 'Bom' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                    eq.electrical_state === 'Regular' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {eq.electrical_state}
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
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{editingEq ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingEq(null); }} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Seção de Fotos */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fotos do Ativo</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {photos.map((img, idx) => (
                    <div key={idx} className="relative aspect-square group">
                      <img src={img} className="w-full h-full object-cover rounded-2xl border border-slate-200 shadow-sm" alt="Preview" />
                      <button type="button" onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                    <Camera size={24} />
                    <span className="text-[8px] font-black uppercase mt-1">Adicionar</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Condomínio</label>
                  <select required name="condoId" defaultValue={editingEq?.condo_id} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="">Selecione...</option>
                    {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo</label>
                  <select required name="typeId" defaultValue={editingEq?.type_id} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:ring-2 focus:ring-blue-500/20 outline-none">
                    {data.equipmentTypes.map((t: EquipmentType) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Fabricante</label>
                  <input required name="manufacturer" defaultValue={editingEq?.manufacturer} placeholder="Ex: WEG, Schneider..." className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Modelo / Identificação</label>
                  <input required name="model" defaultValue={editingEq?.model} placeholder="Ex: Motor Trifásico 5HP..." className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Potência</label>
                  <input required name="power" defaultValue={editingEq?.power} placeholder="HP/kW" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tensão</label>
                  <input required name="voltage" defaultValue={editingEq?.voltage} placeholder="V" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Corr. Nom.</label>
                  <input required type="number" step="0.1" name="nominalCurrent" defaultValue={editingEq?.nominal_current} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Corr. Med.</label>
                  <input required type="number" step="0.1" name="measuredCurrent" defaultValue={editingEq?.measured_current} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Estado Elétrico</label>
                    <select name="electricalState" defaultValue={editingEq?.electrical_state} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs">
                      <option value="Bom">Bom</option>
                      <option value="Regular">Regular</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ruído</label>
                    <select name="noise" defaultValue={editingEq?.noise} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs">
                      <option value="Normal">Normal</option>
                      <option value="Anormal">Anormal</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Localização</label>
                <input required name="location" defaultValue={editingEq?.location} placeholder="Ex: Casa de Máquinas Subsolo" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" />
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingEq(null); }} className="flex-1 py-4 border rounded-2xl font-black uppercase text-[10px] text-slate-400">Descartar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Gravar Ativo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
