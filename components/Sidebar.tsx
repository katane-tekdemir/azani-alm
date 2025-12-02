import React from 'react';
import { MessageSquare, Radio, FileText, Terminal, Settings, LogOut } from 'lucide-react';
import { AppState } from '../types';

interface SidebarProps {
  currentView: AppState['currentView'];
  setView: (view: AppState['currentView']) => void;
  logo: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, logo }) => {
  const navItemClass = (view: AppState['currentView']) => `
    w-full p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer
    ${currentView === view ? 'bg-azani-700 text-azani-accent border-r-4 border-azani-accent' : 'text-gray-400 hover:bg-azani-800 hover:text-white'}
  `;

  return (
    <div className="w-20 md:w-64 h-full bg-azani-900 border-r border-azani-700 flex flex-col items-center md:items-stretch z-50">
      <div className="h-20 flex items-center justify-center border-b border-azani-700 p-4">
        {logo ? (
            <img src={logo} alt="Azani Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
        ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-azani-500 to-azani-900 flex items-center justify-center font-bold text-xl text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                AZ
            </div>
        )}
        <span className="hidden md:block ml-3 font-mono font-bold text-lg tracking-widest text-azani-accent">AZANI</span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2">
        <button className={navItemClass('chat')} onClick={() => setView('chat')}>
          <MessageSquare size={24} />
          <span className="hidden md:block font-medium">İletişim</span>
        </button>
        <button className={navItemClass('live')} onClick={() => setView('live')}>
          <Radio size={24} className={currentView === 'live' ? 'animate-pulse text-red-500' : ''} />
          <span className="hidden md:block font-medium">Canlı Bağlantı</span>
        </button>
        <button className={navItemClass('code')} onClick={() => setView('code')}>
          <Terminal size={24} />
          <span className="hidden md:block font-medium">Kod Terminali</span>
        </button>
        <button className={navItemClass('notes')} onClick={() => setView('notes')}>
          <FileText size={24} />
          <span className="hidden md:block font-medium">Veri Kayıt</span>
        </button>
      </nav>

      <div className="border-t border-azani-700 p-2">
        <button className={navItemClass('panel')} onClick={() => setView('panel')}>
            <Settings size={24} />
            <span className="hidden md:block font-medium">Katane Paneli</span>
        </button>
      </div>
    </div>
  );
};
