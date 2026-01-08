import React, { useState, useEffect } from 'react';
import { ViewState, MedicalDatabase, UserProfile } from './types';
import { LEGAL_DISCLAIMER } from './constants';
import { storageService } from './services/storageService';

import Dashboard from './components/Dashboard';
import ClinicalCase from './components/ClinicalCase';
import AdminPanel from './components/AdminPanel';
import AIConsultant from './components/AIConsultant';
import Settings from './components/Settings';

import { 
  LayoutDashboard, 
  Stethoscope, 
  MessageSquare, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Menu,
  X,
  UserCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Persistent State
  const [db, setDb] = useState<MedicalDatabase>({ cie10: [], cups: [] });
  const [profile, setProfile] = useState<UserProfile>({ name: '', role: '', specialty: '' });

  useEffect(() => {
    // Load data from LocalStorage on mount
    setDb(storageService.getDatabase());
    setProfile(storageService.getProfile());
  }, []);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        activeView === view 
          ? 'bg-medical-600 text-white shadow-md' 
          : 'text-clinical-400 hover:bg-clinical-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-clinical-50 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-clinical-900 flex-shrink-0 transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-clinical-800">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold text-white tracking-tight">MEDICINIA<span className="text-medical-400">.CO</span></h1>
          ) : (
            <span className="text-xl font-bold text-medical-400 mx-auto">M</span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-clinical-400 hover:text-white">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} />
          <NavItem view={ViewState.CASES} icon={Stethoscope} label={isSidebarOpen ? "Casos Clínicos" : ""} />
          <NavItem view={ViewState.CONSULTANT} icon={MessageSquare} label={isSidebarOpen ? "Consultor IA" : ""} />
          <div className="pt-8 pb-2">
            {isSidebarOpen && <p className="px-4 text-xs font-semibold text-clinical-600 uppercase tracking-wider mb-2">Sistema</p>}
            <NavItem view={ViewState.SETTINGS} icon={UserCircle} label={isSidebarOpen ? "Perfil Profesional" : ""} />
            <NavItem view={ViewState.ADMIN} icon={SettingsIcon} label={isSidebarOpen ? "Bases de Datos" : ""} />
          </div>
        </nav>

        <div className="p-4 border-t border-clinical-800 bg-clinical-900">
          <div className="flex items-center space-x-3 text-clinical-400">
            <div className="w-8 h-8 rounded-full bg-medical-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'DR'}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm text-white font-medium truncate">{profile.name || 'Sin Configurar'}</p>
                <p className="text-xs truncate">{profile.specialty || 'Perfil Incompleto'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-clinical-200 flex items-center justify-between px-6 shadow-sm z-10">
          <h2 className="text-lg font-bold text-clinical-800">
            {activeView === ViewState.DASHBOARD && 'Resumen Ejecutivo'}
            {activeView === ViewState.CASES && 'Gestión de Casos Clínicos'}
            {activeView === ViewState.CONSULTANT && 'Consultor Médico Inteligente'}
            {activeView === ViewState.ADMIN && 'Configuración de Bases de Conocimiento'}
            {activeView === ViewState.SETTINGS && 'Configuración de Perfil'}
          </h2>
          <div className="flex items-center gap-4">
             <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1 shadow-sm">
                <ShieldCheck size={12} />
                Ley 23/1981 Compliance
             </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {activeView === ViewState.DASHBOARD && <Dashboard />}
          {activeView === ViewState.CASES && <ClinicalCase db={db} profile={profile} />}
          {activeView === ViewState.CONSULTANT && <AIConsultant db={db} profile={profile} />}
          {activeView === ViewState.SETTINGS && <Settings onProfileUpdate={setProfile} />}
          {activeView === ViewState.ADMIN && <AdminPanel db={db} onUpdateDb={setDb} />}
        </div>

        {/* Disclaimer Footer */}
        <footer className="bg-white border-t border-clinical-200 p-2 text-center text-[10px] text-clinical-400">
          {LEGAL_DISCLAIMER}
        </footer>
      </main>
    </div>
  );
};

export default App;
