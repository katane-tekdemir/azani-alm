import React, { useState, useEffect } from 'react';
import { Plus, Trash, Save } from 'lucide-react';
import { Note } from '../types';

export const NotePad: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('azani_notes');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem('azani_notes', JSON.stringify(newNotes));
  };

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Yeni Veri',
      content: '',
      createdAt: Date.now()
    };
    saveNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newNotes = notes.filter(n => n.id !== id);
    saveNotes(newNotes);
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const updateActiveNote = (key: keyof Note, value: string) => {
    const newNotes = notes.map(n => n.id === activeNoteId ? { ...n, [key]: value } : n);
    saveNotes(newNotes);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="flex h-full bg-azani-900">
      <div className="w-1/3 border-r border-azani-700 flex flex-col">
        <div className="p-4 border-b border-azani-700 flex justify-between items-center bg-azani-800">
            <h2 className="font-mono text-azani-accent font-bold">VERİLER</h2>
            <button onClick={addNote} className="text-white hover:text-azani-accent"><Plus size={20}/></button>
        </div>
        <div className="overflow-y-auto flex-1">
            {notes.length === 0 && <p className="text-gray-600 text-center mt-10 text-sm">Veri yok Katane.</p>}
            {notes.map(note => (
                <div 
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-4 border-b border-azani-800 cursor-pointer hover:bg-azani-800 transition-colors group ${activeNoteId === note.id ? 'bg-azani-800 border-l-4 border-l-azani-accent' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-200 truncate pr-2">{note.title}</span>
                        <button onClick={(e) => deleteNote(note.id, e)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={14}/></button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{note.content || 'Boş...'}</p>
                </div>
            ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-[#0f0f13]">
        {activeNote ? (
            <>
                <input 
                    className="bg-transparent text-2xl font-bold p-6 text-white focus:outline-none border-b border-azani-800"
                    value={activeNote.title}
                    onChange={(e) => updateActiveNote('title', e.target.value)}
                    placeholder="Başlık..."
                />
                <textarea 
                    className="flex-1 bg-transparent p-6 text-gray-300 focus:outline-none resize-none font-sans leading-7"
                    value={activeNote.content}
                    onChange={(e) => updateActiveNote('content', e.target.value)}
                    placeholder="Notlarını buraya al..."
                />
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 font-mono">
                &lt; Seçim yapılmadı /&gt;
            </div>
        )}
      </div>
    </div>
  );
};
