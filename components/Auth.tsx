import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Cpu, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3 || pin.length < 4) {
        setError('Eksik bilgi Katane. Düzgün doldur.');
        return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('azani_users') || '[]');
    
    if (isLogin) {
        const user = storedUsers.find((u: User) => u.username === username && u.pin === pin);
        if (user) {
            onLogin(user);
        } else {
            setError('Tanınmayan veri. Erişim reddedildi.');
        }
    } else {
        if (storedUsers.find((u: User) => u.username === username)) {
            setError('Bu Katane zaten kayıtlı.');
            return;
        }
        const newUser: User = { username, pin };
        localStorage.setItem('azani_users', JSON.stringify([...storedUsers, newUser]));
        onLogin(newUser);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-azani-900 relative overflow-hidden font-mono">
        {/* CSS ile yönetilen arka plan */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-azani-500/20 rounded-full blur-[100px] animate-pulse-fast"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-azani-accent/10 rounded-full blur-[100px] animate-float"></div>
        </div>

        {/* CSS Sınıfı: azani-card */}
        <div className="z-10 w-full max-w-md azani-card p-8 rounded-2xl relative group transition-all duration-500 hover:border-azani-accent/40">
            
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mb-4 border border-azani-accent/50 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                    <Cpu size={40} className="text-azani-accent animate-[spin_10s_linear_infinite]" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-[0.2em] text-glow">AZANI ALM</h1>
                <p className="text-azani-accent/70 text-xs mt-2 font-sans">SÜPER ZEKA ARAYÜZÜ V2.5</p>
            </div>

            <div className="flex bg-black/40 p-1 rounded-lg mb-6 border border-white/5">
                <button 
                    onClick={() => { setIsLogin(true); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold rounded transition-all ${isLogin ? 'bg-azani-accent text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'text-gray-500 hover:text-white'}`}
                >
                    GİRİŞ
                </button>
                <button 
                    onClick={() => { setIsLogin(false); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold rounded transition-all ${!isLogin ? 'bg-azani-accent text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'text-gray-500 hover:text-white'}`}
                >
                    KAYIT
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-[10px] text-azani-accent/80 mb-1 ml-1 tracking-wider">KİMLİK ADI (KATANE)</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full azani-input rounded-lg p-3" 
                        placeholder="Kullanıcı Adı"
                    />
                </div>
                <div>
                    <label className="block text-[10px] text-azani-accent/80 mb-1 ml-1 tracking-wider">GÜVENLİK PIN</label>
                    <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full azani-input rounded-lg p-3"
                        placeholder="••••"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-xs text-center font-bold">
                        {error}
                    </div>
                )}

                {/* CSS Sınıfı: azani-btn */}
                <button 
                    type="submit" 
                    className="w-full azani-btn py-3 rounded-lg mt-4 font-bold flex items-center justify-center gap-3 group"
                >
                    {isLogin ? 'SİSTEME BAĞLAN' : 'PROTOKOLÜ BAŞLAT'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="mt-8 text-center opacity-60">
                <p className="text-[9px] text-gray-500 tracking-widest">
                    <Shield size={10} className="inline mr-1 text-azani-accent"/>
                    AZANI SECURE CONNECTION • 2025
                </p>
            </div>
        </div>
    </div>
  );
};