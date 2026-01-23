
import React, { useState } from 'react';
import { Plus, Filter, FileText, CheckCircle2, Clock, AlertCircle, Share2, Camera, User } from 'lucide-react';
import { OSType, OSStatus, ServiceOrder, Condo, Equipment, System } from '../types';

const ServiceOrders: React.FC<{ data: any; updateData: (d: any) => void }> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOS = data.serviceOrders.filter((os: ServiceOrder) => 
    filterStatus === 'all' ? true : os.status === filterStatus
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newOS: ServiceOrder = {
      id: `OS-${Math.floor(Math.random() * 10000)}`,
      type: formData.get('type') as OSType,
      status: OSStatus.OPEN,
      condoId: formData.get('condoId') as string,
      equipmentId: formData.get('equipmentId') as string || undefined,
      problemDescription: formData.get('description') as string,
      actionsPerformed: '',
      partsReplaced: [],
      photosBefore: [],
      photosAfter: [],
      technicianId: data.currentUser?.id || 'unknown',
      createdAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      serviceOrders: [newOS, ...data.serviceOrders]
    });
    setIsModalOpen(false);
  };

  const updateOSStatus = (id: string, newStatus: OSStatus) => {
    updateData({
      ...data,
      serviceOrders: data.serviceOrders.map((os: ServiceOrder) => 
        os.id === id ? { ...os, status: newStatus, completedAt: newStatus === OSStatus.COMPLETED ? new Date().toISOString() : undefined } : os
      )
    });
  };

  const StatusIcon = ({ status }: { status: OSStatus }) => {
    switch (status) {
      case OSStatus.COMPLETED: return <CheckCircle2 size={16} className="text-emerald-500" />;
      case OSStatus.OPEN: return <Clock size={16} className="text-blue-500" />;
      case OSStatus.IN_PROGRESS: return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ordens de Serviço</h1>
          <p className="text-slate-500">Gestão de atendimentos e manutenções.</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm font-medium text-sm text-slate-600"
            >
              <option value="all">Todos Status</option>
              {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm hover:bg-blue-700">
            <Plus size={20} />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOS.map((os: ServiceOrder) => {
          const condo = data.condos.find((c: Condo) => c.id === os.condoId);
          const tech = data.users.find((u: any) => u.id === os.technicianId);
          const equipment = os.equipmentId ? data.equipments.find((e: Equipment) => e.id === os.equipmentId) : null;
          
          return (
            <div key={os.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-colors">
              <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    os.type === OSType.PREVENTIVE ? 'bg-blue-50 text-blue-600' : 
                    os.type === OSType.CORRECTIVE ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-slate-900">{os.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        os.type === OSType.PREVENTIVE ? 'bg-blue-100 text-blue-700' : 
                        os.type === OSType.CORRECTIVE ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {os.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{condo?.name || 'Condomínio não vinculado'}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{equipment ? `${equipment.manufacturer} - ${equipment.model}` : os.problemDescription}</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end space-y-2 w-full md:w-auto">
                  <div className="flex items-center space-x-2">
                    <StatusIcon status={os.status} />
                    <span className="text-sm font-bold text-slate-700">{os.status}</span>
                  </div>
                  <div className="flex items-center text-xs text-slate-400 font-medium">
                    <User size={12} className="mr-1" /> {tech?.name || 'Sistema'} • {new Date(os.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  {os.status === OSStatus.OPEN && (
                    <button 
                      onClick={() => updateOSStatus(os.id, OSStatus.IN_PROGRESS)}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                    >
                      INICIAR
                    </button>
                  )}
                  {os.status === OSStatus.IN_PROGRESS && (
                    <button 
                      onClick={() => updateOSStatus(os.id, OSStatus.COMPLETED)}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                    >
                      FINALIZAR
                    </button>
                  )}
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredOS.length === 0 && (
          <div className="py-20 text-center bg-white border border-dashed rounded-xl">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500">Nenhuma ordem de serviço encontrada com este filtro.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-8 overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Abertura de Chamado</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div className="space-y-1">
                <label className="text-sm font-semibold">Tipo de Manutenção</label>
                <select required name="type" className="w-full p-2 border rounded-lg bg-white">
                  {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Condomínio</label>
                <select required name="condoId" className="w-full p-2 border rounded-lg bg-white">
                  <option value="">Selecione...</option>
                  {data.condos.map((c: Condo) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Equipamento (Opcional)</label>
                <select name="equipmentId" className="w-full p-2 border rounded-lg bg-white">
                  <option value="">Nenhum / Geral</option>
                  {data.equipments.map((e: Equipment) => <option key={e.id} value={e.id}>{e.manufacturer} - {e.model}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Descrição do Problema / Solicitação</label>
                <textarea required name="description" rows={3} className="w-full p-2 border rounded-lg"></textarea>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed flex flex-col items-center">
                <Camera size={24} className="text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium">Anexar Fotos (Antes)</span>
                <input type="file" multiple className="hidden" id="photo-upload" />
                <label htmlFor="photo-upload" className="mt-2 text-xs font-bold text-blue-600 cursor-pointer">SELECIONAR ARQUIVOS</label>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg font-bold">CANCELAR</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20">ABRIR ORDEM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
