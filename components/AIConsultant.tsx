import React, { useState, useEffect } from 'react';
import { consultMedicalBase } from '../services/geminiService';
import { MedicalDatabase, UserProfile, ConsultationHistory } from '../types';
import { storageService } from '../services/storageService';
import { MessageSquare, Send, Bot, Clock, Trash2 } from 'lucide-react';

interface AIConsultantProps {
  db: MedicalDatabase;
  profile: UserProfile;
}

const AIConsultant: React.FC<AIConsultantProps> = ({ db, profile }) => {
  const [history, setHistory] = useState<ConsultationHistory[]>([]);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
      { role: 'ai', text: `Hola Dr(a). ${profile.name}. Soy su asistente de codificación para ${profile.specialty}. Pregúntame sobre códigos CIE-10 o CUPS de la base autorizada.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHistory(storageService.getConsultHistory());
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
        const responseText = await consultMedicalBase(userMsg, db, profile);
        
        const aiMsg = responseText || 'No pude procesar tu solicitud.';
        setMessages(prev => [...prev, { role: 'ai', text: aiMsg }]);

        // Save to History
        const newEntry: ConsultationHistory = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            query: userMsg,
            response: aiMsg
        };
        const updatedHistory = storageService.saveConsultQuery(newEntry);
        setHistory(updatedHistory);

    } catch (e) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Error de conexión con el servicio de IA.' }]);
    } finally {
        setLoading(false);
    }
  };

  const loadFromHistory = (item: ConsultationHistory) => {
      setMessages([
          { role: 'user', text: item.query },
          { role: 'ai', text: item.response }
      ]);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
        
        {/* History Sidebar */}
        <div className="w-1/4 bg-white rounded-xl shadow-sm border border-clinical-200 flex flex-col overflow-hidden hidden md:flex">
            <div className="p-4 border-b border-clinical-100 bg-clinical-50">
                <h3 className="font-bold text-clinical-700 text-sm flex items-center gap-2">
                    <Clock size={16} /> Historial de Consultas
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.map(h => (
                    <div 
                        key={h.id} 
                        onClick={() => loadFromHistory(h)}
                        className="p-3 hover:bg-clinical-50 rounded-lg cursor-pointer border border-transparent hover:border-clinical-200 transition-all"
                    >
                        <p className="text-sm font-medium text-clinical-800 line-clamp-2">"{h.query}"</p>
                        <p className="text-xs text-clinical-400 mt-1">{new Date(h.timestamp).toLocaleDateString()}</p>
                    </div>
                ))}
                {history.length === 0 && (
                    <p className="text-center text-xs text-clinical-400 p-4">Sin historial reciente.</p>
                )}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-clinical-200 overflow-hidden">
            <div className="p-4 border-b border-clinical-100 bg-clinical-50 flex justify-between">
                <h2 className="font-semibold text-clinical-800 flex items-center gap-2">
                    <Bot className="text-medical-600" />
                    Consultor Médico ({profile.specialty})
                </h2>
                <button 
                    onClick={() => setMessages([])} 
                    className="text-xs text-clinical-500 hover:text-medical-600 underline"
                >
                    Limpiar Chat
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl p-4 text-sm shadow-sm ${
                            m.role === 'user' 
                            ? 'bg-medical-600 text-white rounded-tr-none' 
                            : 'bg-clinical-50 text-clinical-800 border border-clinical-200 rounded-tl-none'
                        }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-clinical-50 border border-clinical-200 p-4 rounded-xl rounded-tl-none flex gap-1">
                            <span className="w-2 h-2 bg-clinical-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                            <span className="w-2 h-2 bg-clinical-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                            <span className="w-2 h-2 bg-clinical-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-clinical-100 flex gap-2 bg-white">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Pregunte sobre un código o procedimiento..."
                    className="flex-1 border border-clinical-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 bg-white text-clinical-900"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-medical-600 text-white p-3 rounded-lg hover:bg-medical-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default AIConsultant;
