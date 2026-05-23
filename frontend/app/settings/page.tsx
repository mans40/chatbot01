'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  Database, 
  Key,
  Info,
  CheckCircle,
  Shield,
  Activity,
  Bot,
  Moon,
  Save
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';

export default function SettingsPage() {
  const router = useRouter();
  const [botName, setBotName] = useState('AuraChat AI');
  const [greeting, setGreeting] = useState('Hello! I am AuraChat. Ask me anything about your product, installation guides, or billing procedures.');
  const [temperature, setTemperature] = useState(0.2);
  const [isSaved, setIsSaved] = useState(false);

  // Authenticate validation check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('user_authenticated');
      if (auth !== 'true') {
        router.push('/login');
      }
    }
  }, [router]);

  // Load state and force light theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');

    const savedBotName = localStorage.getItem('settings_bot_name');
    const savedGreeting = localStorage.getItem('settings_greeting');
    const savedTemp = localStorage.getItem('settings_temperature');

    if (savedBotName) setBotName(savedBotName);
    if (savedGreeting) setGreeting(savedGreeting);
    if (savedTemp) setTemperature(Number(savedTemp));
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings_bot_name', botName);
    localStorage.setItem('settings_greeting', greeting);
    localStorage.setItem('settings_temperature', temperature.toString());
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-800">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 no-scrollbar bg-slate-50/20">
        
        {/* Title Header */}
        <div className="pb-6 mb-8 border-b border-sky-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-black tracking-tight text-slate-900 flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-sky-500" />
              <span>Platform Settings</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">
              Customize chatbot parameters, audit database connections, and configure security metrics.
            </p>
          </div>

          {isSaved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold shadow-sm">
              <CheckCircle className="h-3.5 w-3.5 animate-bounce" />
              <span>SETTINGS UPDATED</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Main settings form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form */}
            <form onSubmit={handleSaveSettings} className="liquid-glass p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-md space-y-6">
              
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <h3 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">Chatbot Customization</h3>
              </div>

              {/* Bot Name input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Assistant Bot Name</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="AuraChat AI"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all font-medium"
                />
              </div>

              {/* Greeting Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Initial Greeting Message</label>
                <textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all resize-none leading-relaxed font-medium"
                />
              </div>

              {/* Slider for precision temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                  <span className="text-slate-500">Precision Temperature</span>
                  <span className="text-sky-500">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[9px] text-slate-450 leading-none font-bold">
                  <span>Strict / Precise (RAG)</span>
                  <span>Creative / Dynamic</span>
                </div>
              </div>

              {/* Save trigger */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-sky-500/10 flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Configuration</span>
                </button>
              </div>

            </form>

            {/* Appearance panel (Static system status indicator) */}
            <div className="bg-slate-50 border border-sky-100 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-4">
                <Moon className="h-5 w-5 text-sky-500" />
                <h3 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">Interface Styling</h3>
              </div>

              <div className="flex justify-between items-center py-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Locked Pristine Light Theme</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                    The platform is strictly optimized in our pristine White & Sky Blue scheme for clean, high-contrast visual accessibility.
                  </p>
                </div>

                <span className="flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-100 rounded-xl text-[10px] font-bold text-sky-600">
                  <Moon className="h-4 w-4" />
                  <span>ACTIVE</span>
                </span>
              </div>
            </div>

          </div>

          {/* Metadata system status configs (Column 3) */}
          <div className="space-y-6">
            
            {/* Database Audits */}
            <div className="bg-slate-50 border border-sky-100 p-6 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 font-display uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-sky-500" />
                <span>Audited Database Engine</span>
              </h3>

              <div className="space-y-4 text-xs text-slate-600 font-medium">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span>Local SQLite DB:</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 flex items-center gap-1">
                    <Activity className="h-3 w-3 animate-pulse" /> CONNECTED
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span>ChromaDB Path:</span>
                  <span className="text-[9px] font-mono text-slate-500">
                    ./data/chromadb
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span>Local Memory Cache:</span>
                  <span className="text-[10px] font-bold text-sky-655 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    ThreadLocked
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Metadata Schema:</span>
                  <span className="text-[10px] font-bold text-sky-655 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    v2.0 Pandas CSV
                  </span>
                </div>
              </div>
            </div>

            {/* Sandbox Guard */}
            <div className="bg-slate-50 border border-sky-100 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-sky-500" />
                <span>University sandbox mode</span>
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                AuraChat handles offline operations safely. All indexing configurations, local database tables, and conversation streams run natively inside your secure sandbox environment.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
