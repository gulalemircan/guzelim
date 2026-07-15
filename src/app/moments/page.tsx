"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio"; // YENİ EKLENDİ

// --- TİPLER ---
type ListItem = { id: number; text: string; completed: boolean };
type PhotoItem = { id: number; url: string; note: string };

export default function MomentsPage() {
  // --- STATE'LER ---
  const [watchList, setWatchList] = useState<ListItem[]>([]);
  const [newWatch, setNewWatch] = useState("");

  const [todoList, setTodoList] = useState<ListItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingItem, setEditingItem] = useState<{ id: number; type: 'watch' | 'todo'; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'watch' | 'todo' | 'photo'; id: number | null }>({ isOpen: false, type: 'watch', id: null });

  // --- SUPABASE VERİ ÇEKME ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [watches, todos, pics] = await Promise.all([
      supabase.from('watch_list').select('*').order('id', { ascending: true }),
      supabase.from('todo_list').select('*').order('id', { ascending: true }),
      supabase.from('photos').select('*').order('id', { ascending: true })
    ]);
    
    if (watches.data) setWatchList(watches.data);
    if (todos.data) setTodoList(todos.data);
    if (pics.data) setPhotos(pics.data);
  };

  // --- FONKSİYONLAR ---
  const handleAdd = async (type: 'watch' | 'todo') => {
    playSound("list_add"); // YENİ SES TETİKLEYİCİSİ
    if (type === 'watch' && newWatch.trim()) {
      await supabase.from('watch_list').insert([{ text: newWatch, completed: false }]);
      setNewWatch("");
    } else if (type === 'todo' && newTodo.trim()) {
      await supabase.from('todo_list').insert([{ text: newTodo, completed: false }]);
      setNewTodo("");
    }
    fetchData();
  };

  const toggleComplete = async (type: 'watch' | 'todo', id: number) => {
    playSound("list_tick"); // YENİ SES TETİKLEYİCİSİ
    const list = type === 'watch' ? watchList : todoList;
    const item = list.find(i => i.id === id);
    if (!item) return;

    const table = type === 'watch' ? 'watch_list' : 'todo_list';
    await supabase.from(table).update({ completed: !item.completed }).eq('id', id);
    fetchData();
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const table = editingItem.type === 'watch' ? 'watch_list' : 'todo_list';
    await supabase.from(table).update({ text: editingItem.text }).eq('id', editingItem.id);
    setEditingItem(null);
    fetchData();
  };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    let table = '';
    if (confirmModal.type === 'watch') table = 'watch_list';
    else if (confirmModal.type === 'todo') table = 'todo_list';
    else if (confirmModal.type === 'photo') table = 'photos';

    await supabase.from(table).delete().eq('id', confirmModal.id);
    setConfirmModal({ isOpen: false, type: 'watch', id: null });
    fetchData();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          playSound("photo_add"); // FOTOĞRAF EKLENDİĞİNDE DE SES ÇALSIN
          await supabase.from('photos').insert([{ url: event.target.result as string, note: "" }]);
          fetchData();
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const updatePhotoNoteLocal = (id: number, newNote: string) => {
    setPhotos(photos.map(photo => photo.id === id ? { ...photo, note: newNote } : photo));
  };

  const savePhotoNote = async (id: number, note: string) => {
    await supabase.from('photos').update({ note }).eq('id', id);
  };

  const renderList = (items: ListItem[], type: 'watch' | 'todo') => (
    <div className="flex flex-col gap-3 mt-4">
      {items.map(item => (
        <div key={item.id} className={`flex items-center justify-between p-4 bg-background border ${item.completed ? 'border-primary/10 opacity-50' : 'border-primary/20'} rounded-2xl transition-all duration-300`}>
          
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => toggleComplete(type, item.id)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${item.completed ? 'bg-primary border-primary text-background' : 'border-primary/40 text-transparent hover:border-primary'}`}
            >
              ✓
            </button>
            
            {editingItem?.id === item.id && editingItem.type === type ? (
              <input 
                type="text" 
                autoFocus
                value={editingItem.text}
                onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="flex-1 bg-transparent border-b border-primary text-white outline-none font-medium"
              />
            ) : (
              <span className={`text-sm md:text-base font-medium transition-all ${item.completed ? 'line-through text-text/50' : 'text-white'}`}>
                {item.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button 
              onClick={() => setEditingItem({ id: item.id, type, text: item.text })}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-background transition-colors"
              title="Düzenle"
            >
              ✎
            </button>
            <button 
              onClick={() => setConfirmModal({ isOpen: true, type, id: item.id })}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              title="Sil"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="p-4 md:p-8 min-h-screen bg-background pb-32">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-write {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(8deg); }
        }
        .animate-float-write { animation: float-write 3s ease-in-out infinite; display: inline-block; }
      `}} />

      <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
        
        <div className="w-full flex flex-col items-center justify-center mb-4 border-b border-primary/20 pb-10">
          <span className="text-6xl mb-4 drop-shadow-xl animate-float-write cursor-default">📝</span>
          <h2 className="display-font text-4xl text-primary tracking-wide text-center">Anılar & Planlar</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-card border border-primary/20 rounded-[32px] p-6 shadow-xl flex flex-col">
            <h3 className="text-primary text-sm font-bold tracking-[2px] uppercase mb-4 flex items-center gap-2">
              <span>🍿</span> İzleme Listesi
            </h3>
            
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={newWatch}
                onChange={(e) => setNewWatch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd('watch')}
                placeholder="Yeni film/dizi ekle..."
                className="flex-1 bg-background border border-primary/20 text-white rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
              />
              <button 
                onClick={() => handleAdd('watch')}
                className="bg-primary text-background px-4 rounded-xl font-bold hover:scale-105 transition-transform"
              >
                Ekle
              </button>
            </div>
            
            {renderList(watchList, 'watch')}
          </div>

          <div className="bg-card border border-primary/20 rounded-[32px] p-6 shadow-xl flex flex-col">
            <h3 className="text-primary text-sm font-bold tracking-[2px] uppercase mb-4 flex items-center gap-2">
              <span>✨</span> Yapılacaklar Listesi
            </h3>
            
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd('todo')}
                placeholder="Yeni plan ekle..."
                className="flex-1 bg-background border border-primary/20 text-white rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
              />
              <button 
                onClick={() => handleAdd('todo')}
                className="bg-primary text-background px-4 rounded-xl font-bold hover:scale-105 transition-transform"
              >
                Ekle
              </button>
            </div>

            {renderList(todoList, 'todo')}
          </div>

        </div>

        <div className="bg-card border border-primary/20 rounded-[32px] p-6 md:p-8 shadow-xl mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-primary/10 pb-4">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h3 className="text-primary text-sm font-bold tracking-[2px] uppercase flex items-center justify-center md:justify-start gap-2">
                <span>📸</span> Anı Galerisi
              </h3>
              <p className="text-xs text-text/50 mt-1">En güzel anlarımızı buraya ekle, altına notunu düş.</p>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary text-background px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
            >
              + Yeni Fotoğraf Ekle
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center opacity-50">
              <span className="text-6xl mb-4">🖼️</span>
              <p className="text-primary font-medium">Henüz fotoğraf eklenmemiş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map(photo => (
                <div key={photo.id} className="bg-background border border-primary/20 rounded-2xl p-4 flex flex-col group relative shadow-md hover:shadow-xl transition-all">
                  
                  <button 
                    onClick={() => setConfirmModal({ isOpen: true, type: 'photo', id: photo.id })}
                    className="absolute top-6 right-6 w-8 h-8 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-lg"
                    title="Fotoğrafı Sil"
                  >
                    ✕
                  </button>

                  <div className="w-full h-48 md:h-64 bg-card rounded-xl overflow-hidden mb-4 relative">
                    <img src={photo.url} alt="Anı" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  
                  <textarea 
                    value={photo.note || ""}
                    onChange={(e) => updatePhotoNoteLocal(photo.id, e.target.value)}
                    onBlur={(e) => savePhotoNote(photo.id, e.target.value)}
                    placeholder="Bu fotoğrafın altına bir not düş..."
                    className="w-full bg-transparent border border-primary/10 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 resize-none h-20 transition-colors placeholder:text-white/20"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-primary/30 p-8 rounded-[32px] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="display-font text-2xl text-white mb-2">Emin misin?</h3>
            <p className="text-sm text-text/70 mb-8">
              Bu öğeyi tamamen silmek istediğine emin misin? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: 'watch', id: null })}
                className="flex-1 py-3 rounded-xl border border-primary/20 text-white hover:bg-white/5 transition-colors font-bold"
              >
                Vazgeç
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}