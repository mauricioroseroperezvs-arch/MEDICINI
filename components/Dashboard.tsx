import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, FileText, AlertTriangle, FilePlus } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Patient, Case } from '../types';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-clinical-200 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-clinical-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-clinical-900">{value}</h3>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCases: 0,
    totalEvolutions: 0,
    topDiagnoses: [] as {name: string, count: number}[]
  });

  useEffect(() => {
    const patients = storageService.getPatients();
    const cases = storageService.getCases();

    // Calculate real stats
    const dxCount: Record<string, number> = {};
    let evolutionCount = 0;

    cases.forEach(c => {
        c.evolutions.forEach(e => {
            evolutionCount++;
            e.analysis.diagnostics.forEach(dx => {
                dxCount[dx.code] = (dxCount[dx.code] || 0) + 1;
            });
        });
    });

    const sortedDx = Object.entries(dxCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    setStats({
        totalPatients: patients.length,
        activeCases: cases.filter(c => c.status === 'Active').length,
        totalEvolutions: evolutionCount,
        topDiagnoses: sortedDx
    });
  }, []);

  if (stats.totalPatients === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
              <div className="bg-clinical-100 p-8 rounded-full mb-6">
                  <FilePlus className="w-12 h-12 text-clinical-400" />
              </div>
              <h3 className="text-xl font-bold text-clinical-800 mb-2">Bienvenido a MEDICINIA.CO</h3>
              <p className="text-clinical-500 max-w-md mb-8">El sistema está listo. Comience registrando su primer paciente y creando un caso clínico.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pacientes" value={stats.totalPatients} icon={Users} color="bg-blue-600" />
        <StatCard title="Casos Activos" value={stats.activeCases} icon={FileText} color="bg-medical-500" />
        <StatCard title="Evoluciones" value={stats.totalEvolutions} icon={Activity} color="bg-green-600" />
        <StatCard title="Alertas (Demo)" value="0" icon={AlertTriangle} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-clinical-200">
          <h3 className="text-lg font-semibold text-clinical-800 mb-4">Diagnósticos Frecuentes (Real)</h3>
          {stats.topDiagnoses.length > 0 ? (
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topDiagnoses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={50} />
                    <Tooltip cursor={{fill: '#f0fdfa'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-clinical-400 text-sm">
                 Sin datos diagnósticos suficientes.
             </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-clinical-200">
           <h3 className="text-lg font-semibold text-clinical-800 mb-4">Noticias del Sistema</h3>
           <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-blue-900 font-medium">Actualización Normativa</p>
                  <p className="text-xs text-blue-700 mt-1">Recuerde validar los códigos CUPS vigentes para el año en curso.</p>
              </div>
              {/* Only show if admin added news - keeping simple for now */}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
