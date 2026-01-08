import React, { useState, useEffect } from 'react';
import { Patient, MedicalDatabase, UserProfile, Case, ClinicalEvolution } from '../types';
import { analyzeClinicalNote } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { 
    User, Activity, FileText, AlertTriangle, CheckCircle, Save, 
    Stethoscope, Copy, Plus, ArrowLeft, Clock, Calendar 
} from 'lucide-react';

interface ClinicalCaseProps {
  db: MedicalDatabase;
  profile: UserProfile;
}

type Mode = 'LIST_PATIENTS' | 'CREATE_PATIENT' | 'CASE_DETAIL';

const ClinicalCase: React.FC<ClinicalCaseProps> = ({ db, profile }) => {
  const [mode, setMode] = useState<Mode>('LIST_PATIENTS');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);

  // Form State for New Patient
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({ gender: 'F' });
  
  // Clinical Note State
  const [clinicalNote, setClinicalNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null); // Type defined in types.ts
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = () => {
    setPatients(storageService.getPatients());
  };

  const handleCreatePatient = () => {
    if (!newPatient.name || !newPatient.age) return;
    const patient: Patient = {
        id: crypto.randomUUID(),
        name: newPatient.name,
        age: Number(newPatient.age),
        gender: newPatient.gender as 'M' | 'F',
        weight: newPatient.weight,
        height: newPatient.height,
        personalHistory: newPatient.personalHistory,
        familyHistory: newPatient.familyHistory,
        createdAt: new Date().toISOString()
    };
    storageService.savePatient(patient);
    
    // Auto-create an empty case for the patient
    const newCase: Case = {
        id: crypto.randomUUID(),
        patientId: patient.id,
        status: 'Active',
        createdAt: new Date().toISOString(),
        evolutions: []
    };
    storageService.saveCase(newCase);
    
    loadPatients();
    setMode('LIST_PATIENTS');
    setNewPatient({ gender: 'F' });
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    const existingCase = storageService.getCaseByPatientId(patient.id);
    setCurrentCase(existingCase || null);
    setMode('CASE_DETAIL');
    setClinicalNote('');
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!clinicalNote.trim() || !selectedPatient || !currentCase) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      // Build Context
      const patientContext = `Paciente: ${selectedPatient.name}, ${selectedPatient.age} años, Sexo: ${selectedPatient.gender}. 
      Antecedentes: ${selectedPatient.personalHistory || 'Niega'}. 
      Peso: ${selectedPatient.weight || 'N/A'}.`;

      const prevEvolutions = currentCase.evolutions
        .map(e => `[${new Date(e.date).toLocaleDateString()}] ${e.originalText}`)
        .join('\n\n');

      const result = await analyzeClinicalNote(clinicalNote, patientContext, prevEvolutions, db, profile);
      setAnalysis(result);
    } catch (err) {
      setError("Error al procesar. Verifique su conexión.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveEvolution = () => {
      if (!currentCase || !analysis || !selectedPatient) return;

      const newEvolution: ClinicalEvolution = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          professionalName: profile.name,
          professionalSpecialty: profile.specialty,
          originalText: clinicalNote,
          analysis: analysis
      };

      const updatedCase = {
          ...currentCase,
          evolutions: [...currentCase.evolutions, newEvolution]
      };

      storageService.saveCase(updatedCase);
      setCurrentCase(updatedCase);
      
      // Reset for next entry
      setClinicalNote('');
      setAnalysis(null);
  };

  // --- VIEWS ---

  if (mode === 'LIST_PATIENTS') {
      return (
          <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-clinical-900">Pacientes</h2>
                  <button 
                    onClick={() => setMode('CREATE_PATIENT')}
                    className="bg-medical-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-medical-700 transition-colors"
                  >
                      <Plus size={20} /> Nuevo Paciente
                  </button>
              </div>

              {patients.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl text-center border border-clinical-200 shadow-sm">
                      <User size={48} className="mx-auto text-clinical-300 mb-4" />
                      <p className="text-clinical-600 text-lg">No hay pacientes registrados.</p>
                      <p className="text-clinical-400">Comience creando un nuevo registro.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {patients.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => handleSelectPatient(p)}
                            className="bg-white p-6 rounded-xl border border-clinical-200 shadow-sm hover:shadow-md cursor-pointer hover:border-medical-300 transition-all group"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="bg-clinical-100 p-3 rounded-full group-hover:bg-medical-100 group-hover:text-medical-700 transition-colors">
                                      <User size={24} className="text-clinical-500 group-hover:text-medical-700" />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-clinical-900 text-lg">{p.name}</h3>
                                      <p className="text-clinical-600 text-sm">{p.age} años | {p.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
                                  </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-clinical-100 text-xs text-clinical-400 flex justify-between">
                                  <span>ID: {p.id.slice(0,8)}...</span>
                                  <span>Ver Caso &rarr;</span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  if (mode === 'CREATE_PATIENT') {
      return (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-clinical-200 overflow-hidden">
              <div className="bg-clinical-50 p-6 border-b border-clinical-200 flex items-center gap-4">
                  <button onClick={() => setMode('LIST_PATIENTS')} className="text-clinical-500 hover:text-clinical-800">
                      <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-xl font-bold text-clinical-900">Nuevo Registro de Paciente</h2>
              </div>
              <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2">
                          <label className="block text-sm font-bold text-clinical-700 mb-2">Nombre Completo</label>
                          <input 
                            className="w-full p-3 border border-clinical-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none text-clinical-900 bg-white"
                            placeholder="Ej: Maria Antonia Gomez"
                            value={newPatient.name || ''}
                            onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-clinical-700 mb-2">Edad</label>
                          <input 
                            type="number"
                            className="w-full p-3 border border-clinical-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none text-clinical-900 bg-white"
                            value={newPatient.age || ''}
                            onChange={e => setNewPatient({...newPatient, age: Number(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-clinical-700 mb-2">Sexo Biológico</label>
                          <select 
                             className="w-full p-3 border border-clinical-300 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none text-clinical-900 bg-white"
                             value={newPatient.gender}
                             onChange={e => setNewPatient({...newPatient, gender: e.target.value as 'M'|'F'})}
                          >
                              <option value="F">Femenino</option>
                              <option value="M">Masculino</option>
                          </select>
                      </div>
                      {/* Optional Fields */}
                      <div>
                          <label className="block text-sm font-bold text-clinical-700 mb-2">Peso (kg) - Opcional</label>
                          <input 
                            className="w-full p-3 border border-clinical-300 rounded-lg text-clinical-900 bg-white"
                            value={newPatient.weight || ''}
                            onChange={e => setNewPatient({...newPatient, weight: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-clinical-700 mb-2">Estatura (cm) - Opcional</label>
                          <input 
                            className="w-full p-3 border border-clinical-300 rounded-lg text-clinical-900 bg-white"
                            value={newPatient.height || ''}
                            onChange={e => setNewPatient({...newPatient, height: e.target.value})}
                          />
                      </div>
                      <div className="col-span-2">
                          <label className="block text-sm font-bold text-clinical-700 mb-2">Antecedentes Personales</label>
                          <textarea 
                            className="w-full p-3 border border-clinical-300 rounded-lg text-clinical-900 bg-white h-24"
                            placeholder="HTA, Diabetes, Alergias..."
                            value={newPatient.personalHistory || ''}
                            onChange={e => setNewPatient({...newPatient, personalHistory: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="pt-4">
                      <button 
                        onClick={handleCreatePatient}
                        disabled={!newPatient.name || !newPatient.age}
                        className="w-full bg-medical-600 text-white py-3 rounded-lg font-bold hover:bg-medical-700 disabled:opacity-50 transition-colors"
                      >
                          Crear Paciente y Abrir Caso
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // CASE DETAIL MODE
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-clinical-200 p-4 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setMode('LIST_PATIENTS')} className="text-clinical-500 hover:text-medical-600">
                    <ArrowLeft />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-clinical-900">{selectedPatient?.name}</h2>
                    <p className="text-sm text-clinical-600">
                        {selectedPatient?.age} Años | {selectedPatient?.gender} | 
                        {selectedPatient?.weight ? ` ${selectedPatient.weight}kg |` : ''} 
                        {selectedPatient?.personalHistory ? ` AP: ${selectedPatient.personalHistory}` : ' AP: Niega'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    Caso Activo
                </span>
            </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* LEFT: TIMELINE & EVOLUTIONS */}
            <div className="w-full md:w-1/2 lg:w-5/12 overflow-y-auto bg-clinical-50 border-r border-clinical-200 p-4">
                <h3 className="text-sm font-bold text-clinical-500 uppercase tracking-wider mb-4 sticky top-0 bg-clinical-50 pb-2 z-10 flex items-center gap-2">
                    <Clock size={16} /> Línea de Tiempo
                </h3>
                
                <div className="space-y-6">
                    {/* New Evolution Entry Form */}
                    <div className="bg-white rounded-xl shadow-md border border-medical-200 p-1">
                        <div className="bg-medical-50 p-3 border-b border-medical-100 flex justify-between items-center rounded-t-lg">
                            <span className="font-bold text-medical-800 text-sm">Nueva Evolución</span>
                            <span className="text-xs text-medical-600">{new Date().toLocaleDateString()}</span>
                        </div>
                        <textarea 
                            value={clinicalNote}
                            onChange={e => setClinicalNote(e.target.value)}
                            placeholder="Escriba aquí el motivo de consulta, enfermedad actual, examen físico y análisis..."
                            className="w-full h-48 p-4 text-clinical-900 outline-none resize-none text-base leading-relaxed"
                        />
                        <div className="p-3 border-t border-clinical-100 flex justify-end bg-gray-50 rounded-b-lg">
                             <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !clinicalNote.trim()}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${
                                    isAnalyzing 
                                    ? 'bg-clinical-200 text-clinical-500 cursor-not-allowed'
                                    : 'bg-medical-600 text-white hover:bg-medical-700 shadow-sm'
                                }`}
                            >
                                {isAnalyzing ? <Activity className="animate-spin" size={16} /> : <Stethoscope size={16} />}
                                {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                            </button>
                        </div>
                    </div>

                    {/* Historical Evolutions (Reverse Order) */}
                    {currentCase?.evolutions.slice().reverse().map((evo) => (
                        <div key={evo.id} className="relative pl-6 border-l-2 border-clinical-300">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-clinical-400 border-2 border-clinical-50"></div>
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-clinical-200 mb-4 opacity-80 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-clinical-500 bg-clinical-100 px-2 py-1 rounded">
                                        {new Date(evo.date).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-clinical-400">{evo.professionalName} ({evo.professionalSpecialty})</span>
                                </div>
                                <div className="text-sm text-clinical-800 line-clamp-3 mb-2 italic">
                                    "{evo.originalText}"
                                </div>
                                <div className="text-sm font-semibold text-medical-700">
                                    Dx: {evo.analysis.diagnostics.map(d => d.code).join(', ')}
                                </div>
                                <button className="text-xs text-medical-600 mt-2 font-medium hover:underline">Ver detalle completo</button>
                            </div>
                        </div>
                    ))}
                    {currentCase?.evolutions.length === 0 && (
                        <div className="text-center text-clinical-400 text-sm italic py-8">
                            Historia clínica nueva. No hay evoluciones previas.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: AI ANALYSIS RESULT */}
            <div className="w-full md:w-1/2 lg:w-7/12 bg-white overflow-y-auto p-6">
                {!analysis ? (
                    <div className="h-full flex flex-col items-center justify-center text-clinical-400 opacity-60">
                        <Activity size={64} className="mb-4 text-clinical-200" />
                        <p className="text-lg font-medium">Esperando análisis clínico</p>
                        <p className="text-sm text-center max-w-xs mt-2">Redacte la evolución en el panel izquierdo y presione "Analizar".</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="flex justify-between items-center border-b border-clinical-100 pb-4">
                            <h3 className="text-lg font-bold text-medical-700 flex items-center gap-2">
                                <Activity /> Auditoría & Sugerencias IA
                            </h3>
                            <button 
                                onClick={handleSaveEvolution}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2"
                            >
                                <Save size={18} /> Confirmar y Guardar
                            </button>
                        </div>

                        {/* Analysis Content */}
                        <div className="space-y-6">
                            {/* Corrected Text */}
                            <div className="bg-clinical-50 border border-clinical-200 rounded-lg p-4">
                                <h4 className="text-xs font-bold text-clinical-500 uppercase mb-2">Redacción Clínica Sugerida</h4>
                                <p className="text-clinical-900 text-sm leading-relaxed whitespace-pre-wrap">{analysis.correctedText}</p>
                            </div>

                            {/* Diagnostics */}
                            <div>
                                <h4 className="text-sm font-bold text-clinical-800 mb-3">Diagnósticos CIE-10 (Base Controlada)</h4>
                                <div className="space-y-2">
                                    {analysis.diagnostics.length > 0 ? analysis.diagnostics.map((dx: any, i: number) => (
                                        <div key={i} className="flex justify-between items-start bg-white border border-clinical-200 p-3 rounded-lg shadow-sm border-l-4 border-l-medical-500">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-medical-700">{dx.code}</span>
                                                    <span className="text-clinical-900 font-medium">{dx.description}</span>
                                                </div>
                                                <p className="text-xs text-clinical-500 mt-1">{dx.justification}</p>
                                            </div>
                                            <span className="text-xs bg-clinical-100 text-clinical-600 px-2 py-1 rounded">{dx.probability}</span>
                                        </div>
                                    )) : (
                                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                                            No se identificaron diagnósticos en la base autorizada.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Plan & Procedures */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                    <h4 className="text-blue-800 font-bold text-sm mb-2">Plan / Conducta</h4>
                                    <p className="text-blue-900 text-sm leading-relaxed">{analysis.plan}</p>
                                </div>
                                
                                {analysis.procedures.length > 0 && (
                                    <div className="border border-clinical-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-clinical-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-bold text-clinical-600">CUPS</th>
                                                    <th className="px-4 py-2 text-left font-bold text-clinical-600">Descripción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-clinical-100">
                                                {analysis.procedures.map((p: any, i: number) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2 font-mono text-medical-700">{p.cups}</td>
                                                        <td className="px-4 py-2 text-clinical-800">{p.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Alerts */}
                            {analysis.alerts.length > 0 && (
                                <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                                    <h4 className="text-red-800 font-bold text-sm mb-2 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Alertas
                                    </h4>
                                    <ul className="list-disc list-inside text-red-700 text-sm">
                                        {analysis.alerts.map((a: string, i: number) => <li key={i}>{a}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ClinicalCase;
