import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { LiveSession } from './components/LiveSession';
import { CodeRunner } from './components/CodeRunner';
import { NotePad } from './components/NotePad';
import { KatanePanel } from './components/KatanePanel';
import { Auth } from './components/Auth';
import { AppState, User } from './types';
import { Bell, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppState['currentView']>('chat');
  const [logo, setLogo] = useState<string | null>(null);
  const [globalNotification, setGlobalNotification] = useState<string | null>(null);

  useEffect(() => {
    // Load logo if exists
    const savedLogo = localStorage.getItem('azani_logo');
    if (savedLogo) setLogo(savedLogo);

    // Check session
    const savedUser = sessionStorage.getItem('azani_active_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem('azani_active_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('azani_active_user');
  };

  const handleGlobalNotify = (msg: string) => {
    setGlobalNotification(msg);
    setTimeout(() => setGlobalNotification(null), 5000);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen bg-azani-900 text-white overflow-hidden font-sans selection:bg-azani-accent selection:text-black">
      <Sidebar currentView={currentView} setView={setCurrentView} logo={logo} />
      
      <main className="flex-1 h-full relative flex flex-col">
        {/* Top Header / User Status */}
        <div className="h-14 bg-azani-900/90 backdrop-blur border-b border-azani-700 flex items-center justify-between px-6 z-40">
            <h2 className="font-mono text-azani-accent text-sm tracking-wider opacity-80">
                {currentView === 'chat' && '/// İLETİŞİM MODÜLÜ'}
                {currentView === 'live' && '/// CANLI BAĞLANTI (V2.5)'}
                {currentView === 'code' && '/// KOD İŞLEME'}
                {currentView === 'notes' && '/// HAFIZA BANKASI'}
                {currentView === 'panel' && '/// YÖNETİM PANELİ'}
            </h2>
            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <div className="text-xs text-gray-400">AKTİF KATANE</div>
                    <div className="text-sm font-bold text-white">{user.username}</div>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors" title="Oturumu Kapat">
                    <LogOut size={18} />
                </button>
            </div>
        </div>

        {/* Global Notification Toast */}
        {globalNotification && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[60] bg-gradient-to-r from-azani-accent to-blue-500 text-black px-6 py-3 rounded-full shadow-[0_0_30px_rgba(0,255,255,0.4)] flex items-center gap-3 animate-glitch">
                <Bell size={20} />
                <span className="font-bold font-mono uppercase">{globalNotification}</span>
            </div>
        )}

        <div className="flex-1 overflow-hidden relative">
            {currentView === 'chat' && <ChatInterface />}
            {currentView === 'live' && <LiveSession />}
            {currentView === 'code' && <CodeRunner />}
            {currentView === 'notes' && <NotePad />}
            {currentView === 'panel' && <KatanePanel onLogoChange={setLogo} onNotify={handleGlobalNotify} />}
        </div>
      </main>
    </div>
  );
};

export default App;