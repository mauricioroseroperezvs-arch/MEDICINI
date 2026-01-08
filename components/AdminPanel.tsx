import React, { useState } from 'react';
import { MedicalDatabase, Cie10Code, CupsCode } from '../types';
import { storageService } from '../services/storageService';
import { Database, Plus, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  db: MedicalDatabase;
  onUpdateDb: (newDb: MedicalDatabase) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ db, onUpdateDb }) => {
  const [activeTab, setActiveTab] = useState<'CIE10' | 'CUPS'>('CIE10');
  const [newCieCode, setNewCieCode] = useState('');
  const [newCieDesc, setNewCieDesc] = useState('');

  const [newCupsCode, setNewCupsCode] = useState('');
  const [newCupsDesc, setNewCupsDesc] = useState('');
  const [newCupsSoat, setNewCupsSoat] = useState('');

  const updateAndSave = (newDb: MedicalDatabase) => {
      storageService.saveDatabase(newDb);
      onUpdateDb(newDb);
  };

  const handleAddCie10 = () => {
    if (!newCieCode || !newCieDesc) return;
    const newEntry: Cie10Code = { code: newCieCode.toUpperCase(), description: newCieDesc, active: true };
    updateAndSave({
      ...db,
      cie10: [...db.cie10, newEntry]
    });
    setNewCieCode('');
    setNewCieDesc('');
  };

  const handleAddCups = () => {
    if (!newCupsCode || !newCupsDesc) return;
    const newEntry: CupsCode = { 
        code: newCupsCode, 
        description: newCupsDesc, 
        active: true, 
        category: 'Diagnostic', 
        soatCode: newCupsSoat 
    };
    updateAndSave({
      ...db,
      cups: [...db.cups, newEntry]
    });
    setNewCupsCode('');
    setNewCupsDesc('');
    setNewCupsSoat('');
  };

  const toggleCieActive = (code: string) => {
    updateAndSave({
        ...db,
        cie10: db.cie10.map(c => c.code === code ? { ...c, active: !c.active } : c)
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-clinical-200">
        <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-clinical-900">Gestión de Bases de Conocimiento</h2>
                <p className="text-sm text-clinical-500">Controla los códigos que la IA tiene permitido sugerir (Anti-Alucinación).</p>
            </div>
        </div>

        <div className="flex space-x-4 border-b border-clinical-200 mb-6">
            <button 
                onClick={() => setActiveTab('CIE10')}
                className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'CIE10' ? 'text-medical-600 border-b-2 border-medical-600' : 'text-clinical-500 hover:text-clinical-700'}`}
            >
                Base CIE-10 ({db.cie10.length})
            </button>
            <button 
                onClick={() => setActiveTab('CUPS')}
                className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'CUPS' ? 'text-medical-600 border-b-2 border-medical-600' : 'text-clinical-500 hover:text-clinical-700'}`}
            >
                Base CUPS / SOAT ({db.cups.length})
            </button>
        </div>

        {activeTab === 'CIE10' && (
            <div className="space-y-6">
                {/* Add New */}
                <div className="bg-clinical-50 p-4 rounded-lg border border-clinical-200 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-medium text-clinical-600 mb-1">Código</label>
                        <input value={newCieCode} onChange={e => setNewCieCode(e.target.value)} className="w-full border-clinical-300 rounded-md shadow-sm focus:border-medical-500 focus:ring-medical-500 px-3 py-2 text-sm text-clinical-900 bg-white" placeholder="Ej: A09X" />
                    </div>
                    <div className="flex-[3] min-w-[250px]">
                        <label className="block text-xs font-medium text-clinical-600 mb-1">Descripción</label>
                        <input value={newCieDesc} onChange={e => setNewCieDesc(e.target.value)} className="w-full border-clinical-300 rounded-md shadow-sm focus:border-medical-500 focus:ring-medical-500 px-3 py-2 text-sm text-clinical-900 bg-white" placeholder="Descripción oficial" />
                    </div>
                    <button onClick={handleAddCie10} className="bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-1" /> Agregar
                    </button>
                </div>

                {/* List */}
                <div className="overflow-x-auto border border-clinical-200 rounded-lg">
                    <table className="min-w-full divide-y divide-clinical-200">
                        <thead className="bg-clinical-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-clinical-600 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-clinical-600 uppercase">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-clinical-600 uppercase">Descripción</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-clinical-600 uppercase">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-clinical-200">
                            {db.cie10.map((item, idx) => (
                                <tr key={`${item.code}-${idx}`} className="hover:bg-clinical-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-clinical-900">{item.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-clinical-600">{item.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => toggleCieActive(item.code)} className="text-medical-600 hover:text-medical-900 underline">
                                            {item.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'CUPS' && (
            <div className="space-y-6">
                 {/* Add New CUPS */}
                 <div className="bg-clinical-50 p-4 rounded-lg border border-clinical-200 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[100px]">
                        <label className="block text-xs font-medium text-clinical-600 mb-1">Código CUPS</label>
                        <input value={newCupsCode} onChange={e => setNewCupsCode(e.target.value)} className="w-full border-clinical-300 rounded-md shadow-sm focus:border-medical-500 focus:ring-medical-500 px-3 py-2 text-sm text-clinical-900 bg-white" placeholder="Ej: 902210" />
                    </div>
                     <div className="flex-1 min-w-[100px]">
                        <label className="block text-xs font-medium text-clinical-600 mb-1">SOAT (Opcional)</label>
                        <input value={newCupsSoat} onChange={e => setNewCupsSoat(e.target.value)} className="w-full border-clinical-300 rounded-md shadow-sm focus:border-medical-500 focus:ring-medical-500 px-3 py-2 text-sm text-clinical-900 bg-white" placeholder="Ej: 19304" />
                    </div>
                    <div className="flex-[3] min-w-[200px]">
                        <label className="block text-xs font-medium text-clinical-600 mb-1">Descripción</label>
                        <input value={newCupsDesc} onChange={e => setNewCupsDesc(e.target.value)} className="w-full border-clinical-300 rounded-md shadow-sm focus:border-medical-500 focus:ring-medical-500 px-3 py-2 text-sm text-clinical-900 bg-white" placeholder="Descripción oficial" />
                    </div>
                    <button onClick={handleAddCups} className="bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-1" /> Agregar
                    </button>
                </div>
                
                 {/* List CUPS */}
                <div className="overflow-x-auto border border-clinical-200 rounded-lg">
                    <table className="min-w-full divide-y divide-clinical-200">
                        <thead className="bg-clinical-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-clinical-600 uppercase">CUPS</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-clinical-600 uppercase">SOAT</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-clinical-600 uppercase">Descripción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-clinical-200">
                            {db.cups.map((item, idx) => (
                                <tr key={`${item.code}-${idx}`} className="hover:bg-clinical-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-clinical-900">{item.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-clinical-600">{item.soatCode || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-clinical-600">{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
            <h4 className="text-sm font-bold text-yellow-800">Principio Anti-Alucinación</h4>
            <p className="text-xs text-yellow-700 mt-1">
                Recuerda: El asistente de IA está configurado para <strong>ignorar</strong> cualquier código médico que no esté registrado activamente en estas tablas. 
                Si necesitas que la IA reconozca una nueva patología o procedimiento, debes agregarla aquí primero.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
