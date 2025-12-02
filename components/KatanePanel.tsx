import React, { useState, useEffect } from 'react';
import { Lock, Upload, Bell, ShieldCheck } from 'lucide-react';
import { PANEL_PASSWORD } from '../constants';

interface PanelProps {
  onLogoChange: (logo: string) => void;
  onNotify: (msg: string) => void;
}

export const KatanePanel: React.FC<PanelProps> = ({ onLogoChange, onNotify }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [notification, setNotification] = useState('');
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === PANEL_PASSWORD) {
        setIsAuthenticated(true);
    } else {
        alert("Yetkisiz erişim denemesi tespit edildi.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        localStorage.setItem('azani_logo', res);
        onLogoChange(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendNotification = () => {
    if (!notification) return;
    onNotify(notification);
    setNotification('');
    alert("Bildirim tüm birimlere iletildi.");
  };

  if (!isAuthenticated) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-black">
            <div className="w-full max-w-md p-8 border border-azani-800 bg-azani-900/50 rounded-2xl backdrop-blur-xl">
                <div className="flex justify-center mb-6 text-azani-danger">
                    <Lock size={48} />
                </div>
                <h2 className="text-2xl font-mono text-center text-white mb-6 tracking-widest">KATANE PANEL ERİŞİMİ</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="password" 
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        placeholder="Güvenlik Kodu"
                        className="w-full bg-black/50 border border-azani-700 text-center text-white p-3 rounded text-lg tracking-widest focus:border-azani-accent focus:outline-none"
                    />
                    <button type="submit" className="w-full bg-azani-700 hover:bg-azani-600 text-white font-bold py-3 rounded transition-all">GİRİŞ</button>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full p-8 bg-azani-900 overflow-y-auto">
        <h1 className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-azani-accent to-purple-500 mb-10 flex items-center gap-4">
            <ShieldCheck size={40} className="text-azani-accent"/> YÖNETİCİ KONSOLU
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo Settings */}
            <div className="bg-black/30 border border-azani-700 p-6 rounded-xl">
                <h3 className="text-xl text-white font-bold mb-4 flex items-center gap-2"><Upload size={20}/> Sistem Logosu</h3>
                <p className="text-gray-400 text-sm mb-4">Arayüzde görüntülenen ana ikonu değiştir.</p>
                <label className="block w-full p-4 border-2 border-dashed border-azani-700 rounded-lg hover:border-azani-accent cursor-pointer transition-colors text-center">
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    <span className="text-azani-500 font-mono">Dosya Seç veya Sürükle</span>
                </label>
            </div>

            {/* Notifications */}
            <div className="bg-black/30 border border-azani-700 p-6 rounded-xl">
                <h3 className="text-xl text-white font-bold mb-4 flex items-center gap-2"><Bell size={20}/> Global Bildirim</h3>
                <p className="text-gray-400 text-sm mb-4">Tüm kullanıcılara (sanal) anlık bildirim gönder.</p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={notification}
                        onChange={(e) => setNotification(e.target.value)}
                        className="flex-1 bg-black/50 border border-azani-700 rounded p-3 text-white focus:border-azani-accent focus:outline-none"
                        placeholder="Mesaj içeriği..."
                    />
                    <button onClick={sendNotification} className="bg-azani-accent text-black font-bold px-6 rounded hover:bg-white transition-colors">
                        GÖNDER
                    </button>
                </div>
            </div>

            {/* System Status Mockup */}
            <div className="col-span-1 md:col-span-2 bg-black/30 border border-azani-700 p-6 rounded-xl">
                <h3 className="text-xl text-white font-bold mb-4">Sistem Durumu</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-azani-800/50 rounded border border-azani-700">
                        <div className="text-3xl font-bold text-green-400">AKTİF</div>
                        <div className="text-xs text-gray-500 uppercase mt-1">Çekirdek Durumu</div>
                    </div>
                    <div className="p-4 bg-azani-800/50 rounded border border-azani-700">
                        <div className="text-3xl font-bold text-blue-400">12ms</div>
                        <div className="text-xs text-gray-500 uppercase mt-1">Gecikme</div>
                    </div>
                    <div className="p-4 bg-azani-800/50 rounded border border-azani-700">
                        <div className="text-3xl font-bold text-purple-400">v2.5</div>
                        <div className="text-xs text-gray-500 uppercase mt-1">Model Sürümü</div>
                    </div>
                    <div className="p-4 bg-azani-800/50 rounded border border-azani-700">
                        <div className="text-3xl font-bold text-yellow-400">GÜVENLİ</div>
                        <div className="text-xs text-gray-500 uppercase mt-1">Şifreleme</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
