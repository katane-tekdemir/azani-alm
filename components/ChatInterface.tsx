
import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Loader2, RefreshCw, Code, Play, Maximize2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { generateTextResponse, generateImage } from '../services/geminiService';

export const ChatInterface: React.FC = () => {
  // Initialize state from localStorage if available
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('azani_chat_history');
    return saved ? JSON.parse(saved) : [{ id: '1', role: 'model', text: 'Sistem aktif Katane. Seni dinliyorum.', timestamp: Date.now() }];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('azani_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  // Mesajlardaki son kodu bulup önizlemeye atar
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'model') {
        const codeBlock = extractCodeBlock(lastMsg.text);
        if (codeBlock) {
            setPreviewCode(codeBlock);
        }
    }
  }, [messages]); // Dependency remains messages to trigger on load

  const extractCodeBlock = (text: string): string | null => {
    // HTML, JSX veya JS bloklarını yakalar
    const htmlMatch = text.match(/```html([\s\S]*?)```/);
    if (htmlMatch) return htmlMatch[1];
    
    return null;
  };

  const clearChatMemory = (systemMsg: string = 'Hafıza formatlandı. Temiz bir sayfa açtık.') => {
      const initialMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: systemMsg,
        timestamp: Date.now()
      };
      setMessages([initialMsg]);
      localStorage.setItem('azani_chat_history', JSON.stringify([initialMsg]));
      setPreviewCode(null);
      setImageAttachment(null);
  };

  const handleClearChat = () => {
    if (window.confirm('Tüm veri akışını ve hafızayı temizlemek üzeresin Katane. Onaylıyor musun?')) {
      clearChatMemory();
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !imageAttachment) || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: imageAttachment || undefined,
      timestamp: Date.now()
    };

    // UI'da kullanıcı mesajını göster
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImageAttachment(null);
    setLoading(true);
    setPreviewCode(null); // Yeni soruda önizlemeyi sıfırla

    try {
      const lowerInput = userMsg.text.toLowerCase();

      // Komut ile temizleme kontrolü - Daha güvenli ve akıllı algılama
      const exactCommands = ['/clear', '/reset', 'reset', 'temizle'];
      
      const phraseTriggers = [
        'tüm mesajları sil', 'mesajları sil', 'sohbeti sil', 'hafızayı sil',
        'yazdıklarımı sil', 'her şeyi sil', 'geçmişi sil',
        'sohbeti temizle', 'hafızayı temizle', 'sayfayı temizle',
        'silme imkanın', 'temizleyebilir misin', 'sıfırla'
      ];

      // "Sana yazdığım" tek başına tetikleyici olmamalı, "sil" ile birleşmeli
      const complexTrigger = lowerInput.includes('sana yazdığım') && (lowerInput.includes('sil') || lowerInput.includes('temizle'));

      const isClearCommand = 
        exactCommands.includes(lowerInput) || 
        phraseTriggers.some(phrase => lowerInput.includes(phrase)) ||
        complexTrigger;

      // Eğer silme komutu ise ve metin çok uzun değilse (konu anlatımı içinde geçmiyorsa)
      if (isClearCommand && (lowerInput.length < 150)) {
        
        let systemResponse = 'Komut algılandı. Tüm hafıza protokolleri sıfırlandı.';
        
        // "Bu mesaj dahil" özel durumu
        if (lowerInput.includes('bu mesaj') || lowerInput.includes('dahil') || lowerInput.includes('dahilin')) {
            systemResponse = 'Protokol uygulandı: Bu komut satırı dahil tüm veri akışı kalıcı olarak silindi Katane.';
        }

        // Kullanıcıya mesajının gittiğini hissettirmek için kısa bir gecikme, sonra yok etme
        setTimeout(() => {
            clearChatMemory(systemResponse);
            setLoading(false);
        }, 600);
        return;
      }

      if (lowerInput.includes('görsel oluştur') || lowerInput.includes('resim çiz') || lowerInput.startsWith('/img')) {
        const prompt = userMsg.text.replace('/img', '').replace('görsel oluştur', '').trim();
        const generatedImageBase64 = await generateImage(prompt || "abstract modern art");
        
        if (generatedImageBase64) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: 'Görsel bellekte oluşturuldu Katane.',
                image: generatedImageBase64,
                timestamp: Date.now()
            }]);
        } else {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: 'Render motoru hata verdi. Tekrar denemelisin.',
                timestamp: Date.now()
            }]);
        }
      } else {
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
        
        const responseText = await generateTextResponse(history, userMsg.text, userMsg.image);
        
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: Date.now()
        }]);
      }

    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Çekirdek hatası.', timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-azani-900/50 backdrop-blur-sm relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-azani-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Clear Chat Button */}
        <button
            onClick={handleClearChat}
            className="absolute top-4 right-6 z-20 p-2 bg-black/40 text-gray-500 hover:text-red-500 rounded-lg backdrop-blur-md border border-white/5 hover:border-red-500/30 transition-all shadow-lg group"
            title="Sohbeti Temizle"
        >
            <Trash2 size={18} className="group-hover:scale-110 transition-transform"/>
        </button>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-lg backdrop-blur-md ${
              msg.role === 'user' 
                ? 'msg-user text-white rounded-br-none' 
                : 'msg-model text-gray-200 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] font-mono uppercase tracking-widest">
                {msg.role === 'user' ? 'KATANE' : 'AZANI CORE'}
                <span className="ml-auto text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              {msg.image && (
                <img src={msg.image} alt="Attachment" className="max-w-full h-auto rounded-lg mb-3 border border-white/10" />
              )}
              
              <div className="prose prose-invert prose-sm max-w-none font-sans leading-relaxed">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {/* LIVE CODE PREVIEW PANEL */}
        {previewCode && !loading && (
             <div className="w-full max-w-4xl mx-auto mt-4 animate-float">
                <div className="bg-[#0f0f13] border border-azani-accent/30 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                    <div className="bg-azani-800/80 px-4 py-2 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2 text-azani-accent text-xs font-mono tracking-widest">
                            <Code size={14} />
                            CANLI ÖNİZLEME MODÜLÜ
                        </div>
                        <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                             <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                             <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                    </div>
                    <div className="relative w-full h-80 bg-white">
                        <iframe 
                            srcDoc={previewCode}
                            className="w-full h-full border-0"
                            title="Azani Preview"
                            sandbox="allow-scripts"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded font-mono pointer-events-none">
                            RENDER: ACTIVE
                        </div>
                    </div>
                </div>
             </div>
        )}

        {loading && (
             <div className="flex justify-start">
                <div className="bg-black/40 border-l-2 border-azani-accent/50 rounded-r-2xl p-4 flex items-center gap-3">
                    <Loader2 className="animate-spin text-azani-accent" size={18} />
                    <span className="text-azani-accent/70 font-mono text-xs animate-pulse tracking-widest">VERİ İŞLENİYOR...</span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black/60 border-t border-white/5 backdrop-blur-md">
        {imageAttachment && (
            <div className="mb-2 flex items-center gap-2 bg-azani-900/80 p-2 rounded border border-azani-accent/20 w-fit">
                <img src={imageAttachment} className="h-10 w-10 object-cover rounded" />
                <button onClick={() => setImageAttachment(null)} className="text-red-400 hover:text-red-300"><RefreshCw size={14}/></button>
            </div>
        )}
        <div className="flex gap-2 max-w-5xl mx-auto">
          <label className="p-3 rounded-lg bg-black/50 hover:bg-azani-800 text-azani-accent/70 cursor-pointer transition-colors border border-white/5 hover:border-azani-accent/50 flex items-center justify-center">
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            <ImageIcon size={22} />
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Veri girişi yap..."
            className="flex-1 azani-input rounded-lg px-4 py-3 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="p-3 rounded-lg azani-btn disabled:opacity-50 disabled:cursor-not-allowed w-14 flex items-center justify-center"
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
