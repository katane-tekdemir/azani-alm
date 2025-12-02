import React, { useState } from 'react';
import { Play, Trash2, Save, Terminal as TermIcon } from 'lucide-react';
import { CodeExecutionResult } from '../types';

export const CodeRunner: React.FC = () => {
  const [code, setCode] = useState(`// Azani Code Environment
// Sadece JavaScript (ES6+) çalışır.
// DOM manipülasyonu kısıtlıdır.

console.log("Sistem hazır Katane.");
const x = 10;
const y = 20;
console.log("Hesaplama sonucu:", x * y);
`);
  const [output, setOutput] = useState<CodeExecutionResult | null>(null);

  const runCode = () => {
    const logs: string[] = [];
    const originalLog = console.log;
    
    // Hijack console.log
    console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    try {
        // Safe evaluation wrapper
        // Note: new Function is still potentially dangerous if input is untrusted, 
        // but this is a client-side playground for the user themselves.
        const safeRun = new Function(code);
        safeRun();
        setOutput({ logs, error: null });
    } catch (e: any) {
        setOutput({ logs, error: e.toString() });
    } finally {
        console.log = originalLog;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-azani-900 text-gray-300">
        <div className="flex-1 flex flex-col border-r border-azani-700">
            <div className="h-12 bg-azani-800 border-b border-azani-700 flex items-center justify-between px-4">
                <span className="font-mono text-azani-accent flex items-center gap-2"><TermIcon size={16}/> editor.js</span>
                <div className="flex gap-2">
                    <button onClick={() => setCode('')} className="p-1 hover:text-red-400"><Trash2 size={18}/></button>
                    <button onClick={runCode} className="flex items-center gap-2 bg-green-600/20 text-green-400 border border-green-600/50 px-3 py-1 rounded hover:bg-green-600/30 transition-colors">
                        <Play size={16} /> ÇALIŞTIR
                    </button>
                </div>
            </div>
            <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-[#0a0a0f] p-4 font-mono text-sm resize-none focus:outline-none text-blue-200"
                spellCheck={false}
            />
        </div>
        
        <div className="h-1/3 md:h-auto md:w-1/3 bg-[#050508] flex flex-col">
            <div className="h-12 bg-azani-800 border-b border-azani-700 flex items-center px-4 font-bold text-gray-400">
                TERMINAL ÇIKTISI
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto font-bold">
                {!output && <span className="text-gray-600">// Çıktı bekleniyor...</span>}
                {output?.logs.map((log, i) => (
                    <div key={i} className="mb-1 text-green-400 border-l-2 border-green-700 pl-2">{log}</div>
                ))}
                {output?.error && (
                    <div className="mt-2 text-red-500 border-l-2 border-red-700 pl-2 bg-red-900/10 p-2">
                        {output.error}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
