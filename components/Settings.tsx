import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { SPECIALTIES } from '../constants';
import { Save, UserCircle } from 'lucide-react';
import { storageService } from '../services/storageService';

interface SettingsProps {
  onProfileUpdate: (p: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ onProfileUpdate }) => {
  const [profile, setProfile] = useState<UserProfile>({ name: '', role: '', specialty: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = storageService.getProfile();
    setProfile(current);
  }, []);

  const handleSave = () => {
    storageService.saveProfile(profile);
    onProfileUpdate(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-clinical-200">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-clinical-100">
            <div className="bg-medical-100 p-3 rounded-full">
                <UserCircle className="w-8 h-8 text-medical-700" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-clinical-900">Perfil Profesional</h2>
                <p className="text-clinical-500 text-sm">Esta información adapta el comportamiento de la IA a su especialidad.</p>
            </div>
        </div>

        <div className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-clinical-700 mb-2">Nombre Completo</label>
                <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full p-3 bg-white border border-clinical-300 rounded-lg text-clinical-900 focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                    placeholder="Ej: Dr. Juan Pérez"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-clinical-700 mb-2">Rol / Cargo</label>
                <input 
                    type="text" 
                    value={profile.role}
                    onChange={(e) => setProfile({...profile, role: e.target.value})}
                    className="w-full p-3 bg-white border border-clinical-300 rounded-lg text-clinical-900 focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                    placeholder="Ej: Médico Especialista"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-clinical-700 mb-2">Especialidad</label>
                <select 
                    value={profile.specialty}
                    onChange={(e) => setProfile({...profile, specialty: e.target.value})}
                    className="w-full p-3 bg-white border border-clinical-300 rounded-lg text-clinical-900 focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                >
                    <option value="">Seleccione una especialidad...</option>
                    {SPECIALTIES.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <p className="mt-2 text-xs text-clinical-500">
                    * La IA usará guías clínicas y terminología acorde a la especialidad seleccionada.
                </p>
            </div>

            <div className="pt-4 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all"
                >
                    <Save size={18} />
                    {saved ? 'Guardado Correctamente' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
