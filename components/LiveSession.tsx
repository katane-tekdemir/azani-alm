import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Activity } from 'lucide-react';
import { connectLiveSession } from '../services/geminiService';

export const LiveSession: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{text: string, isUser: boolean}[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const disconnectRef = useRef<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(true);

  const startSession = async () => {
    setIsActive(true);
    setTranscript([]);
    try {
        if (cameraOn && videoRef.current) {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = videoStream;
        }

        const disconnect = await connectLiveSession({
            onAudioData: (base64) => {
                // Simulate audio level for visualization
                setAudioLevel(Math.random() * 100);
            },
            onTranscript: (text, isUser, isFinal) => {
                setTranscript(prev => {
                    // Simple logic to append or update last message
                    const last = prev[prev.length - 1];
                    if (last && last.isUser === isUser && !last.text.endsWith('.')) {
                         // Very basic append logic, in real app needs ID handling
                         return [...prev.slice(0, -1), { text: text, isUser }];
                    }
                    return [...prev, { text, isUser }];
                });
            },
            onClose: () => {
                setIsActive(false);
                setAudioLevel(0);
            }
        });
        disconnectRef.current = disconnect;
    } catch (err) {
        console.error("Failed to start live", err);
        setIsActive(false);
        alert("Bağlantı hatası: Kamera/Mikrofon izni gerekli.");
    }
  };

  const endSession = () => {
    if (disconnectRef.current) {
        disconnectRef.current();
        disconnectRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
        endSession();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-black relative">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* User Camera Feed */}
        {cameraOn && isActive ? (
             <video ref={videoRef} autoPlay muted className="absolute inset-0 w-full h-full object-cover opacity-40" />
        ) : (
             <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale')] opacity-10 bg-cover"></div>
        )}

        {/* Azani Visualizer */}
        <div className="z-10 flex flex-col items-center gap-8">
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-100 ${isActive ? 'scale-110' : 'scale-100'}`}>
                <div className={`absolute inset-0 rounded-full border-4 border-azani-accent blur-md ${isActive ? 'animate-pulse-fast' : 'opacity-20'}`}></div>
                <div className="absolute inset-2 rounded-full border-2 border-azani-500 animate-[spin_4s_linear_infinite]"></div>
                <div 
                    className="w-32 h-32 bg-azani-900 rounded-full flex items-center justify-center border border-azani-accent/50 shadow-[0_0_50px_rgba(0,255,255,0.4)] transition-all"
                    style={{ transform: `scale(${1 + (audioLevel / 200)})`}}
                >
                    <Activity size={64} className="text-azani-accent" />
                </div>
            </div>
            
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-azani-700 max-w-lg w-full h-48 overflow-y-auto">
                {transcript.length === 0 && <p className="text-gray-500 text-center italic">Bağlantı bekleniyor...</p>}
                {transcript.map((t, i) => (
                    <p key={i} className={`mb-2 text-sm ${t.isUser ? 'text-gray-300 text-right' : 'text-azani-accent text-left'}`}>
                        {t.isUser ? 'Katane: ' : 'Azani: '}{t.text}
                    </p>
                ))}
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 bg-azani-900 border-t border-azani-700 flex items-center justify-center gap-6 z-20">
        {!isActive ? (
            <button 
                onClick={startSession}
                className="flex items-center gap-2 bg-azani-accent text-black font-bold px-8 py-4 rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            >
                <Video size={24} />
                BAĞLANTISAL MOD
            </button>
        ) : (
            <>
                <button onClick={() => setCameraOn(!cameraOn)} className={`p-4 rounded-full ${cameraOn ? 'bg-azani-700 text-white' : 'bg-red-500/20 text-red-500'}`}>
                    {cameraOn ? <Video size={24}/> : <VideoOff size={24}/>}
                </button>
                <button 
                    onClick={endSession}
                    className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg"
                >
                    <PhoneOff size={32} />
                </button>
            </>
        )}
      </div>
    </div>
  );
};