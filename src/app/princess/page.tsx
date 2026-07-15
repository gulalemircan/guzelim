"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

const QUICK_ICONS = ["👗", "👚", "🥿", "👠", "💍", "💄", "🧴", "🧸", "🥤", "👜", "🕶️", "🎀"];
const CLOSET_ICONS = ["🚪", "👠", "👞", "👟", "👜", "🎒", "💍", "👑", "🧥", "👖", "🎁", "✨"];

export default function PrincessClosetPage() {
  const [phase, setPhase] = useState<"lobby" | "closet">("lobby");
  const [closets, setClosets] = useState<any[]>([]);
  const [activeClosetId, setActiveClosetId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDoorsClosed, setIsDoorsClosed] = useState(true);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemIcon, setNewItemIcon] = useState(QUICK_ICONS[0]);
  const [newItemLink, setNewItemLink] = useState("");
  const [isClosetModalOpen, setIsClosetModalOpen] = useState(false);
  const [closetModalMode, setClosetModalMode] = useState<"create" | "edit">("create");
  const [editingClosetId, setEditingClosetId] = useState<string | null>(null);
  const [closetNameInput, setClosetNameInput] = useState("");
  const [closetIconInput, setClosetIconInput] = useState("🚪");
  const [closetToDelete, setClosetToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  useEffect(() => { setIsClient(true); fetchData(); }, []);

  const fetchData = async () => {
    const { data: cData } = await supabase.from('closets').select('*');
    const { data: iData } = await supabase.from('closet_items').select('*');
    if (cData) {
      const formatted = cData.map((c: any) => ({
        ...c,
        items: Array(15).fill(null).map((_, idx) => iData?.filter((i: any) => i.closet_id == c.id)[idx] || null)
      }));
      setClosets(formatted);
    }
  };

  const saveCloset = async () => {
    if (!closetNameInput.trim()) return;
    playSound("success");
    if (closetModalMode === "create") await supabase.from('closets').insert([{ name: closetNameInput, icon: closetIconInput }]);
    else await supabase.from('closets').update({ name: closetNameInput, icon: closetIconInput }).eq('id', editingClosetId);
    setIsClosetModalOpen(false); fetchData();
  };

  const hangItem = async () => {
    if (!activeClosetId || addingIndex === null) return;
    playSound("photo_add"); // YENİ SES: Fotoğraf / Ürün ekleme
    await supabase.from('closet_items').insert([{ closet_id: activeClosetId, name: newItemName, icon: newItemIcon, link: newItemLink }]);
    setAddingIndex(null); setNewItemName(""); fetchData();
  };

  const confirmDeleteCloset = async () => {
    await supabase.from('closets').delete().eq('id', closetToDelete);
    setClosetToDelete(null); fetchData();
  };

  const confirmDeleteItem = async () => {
    const item = closets.find(c => c.id === activeClosetId)?.items[itemToDelete!];
    if (item) await supabase.from('closet_items').delete().eq('id', item.id);
    setItemToDelete(null); fetchData();
  };

  const openCreateClosetModal = () => { playSound("click"); setClosetModalMode("create"); setClosetNameInput(""); setClosetIconInput("🚪"); setIsClosetModalOpen(true); };
  const openEditClosetModal = (e: any, c: any) => { e.stopPropagation(); playSound("click"); setEditingClosetId(c.id); setClosetNameInput(c.name); setClosetIconInput(c.icon || "🚪"); setIsClosetModalOpen(true); setClosetModalMode("edit"); };
  
  const openCloset = (id: string) => { 
    playSound("wardrobe_open"); // YENİ SES: Dolap Açma
    setActiveClosetId(id); 
    setPhase("closet"); 
    setIsDoorsClosed(true); 
    setTimeout(() => setIsDoorsClosed(false), 100); 
  };
  
  const closeCloset = () => { 
    playSound("wardrobe_close"); // YENİ SES: Dolap Kapatma
    setIsDoorsClosed(true); 
    setTimeout(() => setPhase("lobby"), 500); 
  };
  
  const handleAddClick = (index: number) => { playSound("click"); setAddingIndex(index); setNewItemName(""); setNewItemLink(""); setNewItemIcon(QUICK_ICONS[0]); };
  const openLink = (link: string) => { playSound("click"); window.open(link.startsWith('http') ? link : `https://${link}`, "_blank"); };
  const requestDeleteCloset = (e: any, id: string) => { e.stopPropagation(); playSound("click"); setClosetToDelete(id); };
  const requestDeleteItem = (e: any, index: number) => { e.stopPropagation(); playSound("click"); setItemToDelete(index); };

  if (!isClient) return <div className="min-h-screen bg-background"></div>;
  const activeCloset = closets.find(c => c.id === activeClosetId);

  return (
    <main className="p-5 animate-in fade-in duration-500 min-h-screen pb-24 flex flex-col relative overflow-x-hidden">
      
      {/* --- LOBİ AŞAMASI --- */}
      {phase === "lobby" && (
        <div className="animate-in slide-in-from-bottom-5">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4 drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>✨</div>
            <h1 className="display-font text-4xl text-primary drop-shadow-md">Prensesin Odası</h1>
            <p className="text-text/70 text-sm mt-2 font-medium">İstediğin kadar dolap ekle, tarzını yarat.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={openCreateClosetModal}
              className="bg-card border-2 border-dashed border-primary/40 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary transition-all group min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl group-hover:scale-110 transition-transform">
                +
              </div>
              <span className="text-primary font-bold text-sm tracking-widest uppercase text-center">Yeni Dolap Ekle</span>
            </button>

            {closets.map((closet) => (
              <div 
                key={closet.id}
                onClick={() => openCloset(closet.id)}
                className="bg-card border-2 border-primary/20 rounded-3xl p-5 shadow-xl hover:scale-[1.02] hover:border-primary/60 transition-all cursor-pointer relative group flex flex-col justify-between min-h-[160px]"
                style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(0,0,0,0.1), transparent)' }}
              >
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => openEditClosetModal(e, closet)}
                    className="bg-background/80 text-primary w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary hover:text-background transition-colors shadow-sm"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={(e) => requestDeleteCloset(e, closet.id)}
                    className="bg-background/80 text-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                  >
                    ✖
                  </button>
                </div>

                <div className="text-4xl mb-2">{closet.icon || "🚪"}</div>
                
                <div>
                  <h3 className="font-bold text-primary text-lg leading-tight line-clamp-2">{closet.name}</h3>
                  <p className="text-xs text-text/50 mt-1 font-bold">
                    {closet.items.filter((i: any) => i !== null).length} / 15 Askı Dolu
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- DOLAP İÇİ AŞAMASI --- */}
      {phase === "closet" && activeCloset && (
        <div className="relative flex-1 rounded-[40px] overflow-hidden shadow-2xl bg-background border border-primary/10 p-4">
          <div className={`absolute top-0 left-0 w-1/2 h-full bg-card border-r-2 border-primary/30 z-[60] shadow-[10px_0_20px_rgba(0,0,0,0.5)] transition-transform duration-[800ms] ease-in-out flex items-center justify-end ${isDoorsClosed ? 'translate-x-0' : '-translate-x-[110%]'}`}>
            <div className="w-2 h-24 bg-primary/60 rounded-full mr-4 shadow-lg"></div>
          </div>
          <div className={`absolute top-0 right-0 w-1/2 h-full bg-card border-l-2 border-primary/30 z-[60] shadow-[-10px_0_20px_rgba(0,0,0,0.5)] transition-transform duration-[800ms] ease-in-out flex items-center justify-start ${isDoorsClosed ? 'translate-x-0' : 'translate-x-[110%]'}`}>
             <div className="w-2 h-24 bg-primary/60 rounded-full ml-4 shadow-lg"></div>
          </div>

          <div className={`transition-opacity duration-700 ${isDoorsClosed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-8 z-10 relative">
              <button 
                onClick={closeCloset}
                className="bg-card px-4 py-2 rounded-xl border border-primary/20 text-primary hover:bg-primary hover:text-background transition-all flex items-center gap-2 text-sm font-bold shadow-md"
              >
                <span>←</span> Kapakları Kapat
              </button>
              <div className="text-[10px] uppercase tracking-[2px] text-primary font-bold opacity-70 bg-card px-3 py-1 rounded-full border border-primary/10">
                {activeCloset.items.filter((i: any) => i !== null).length} / 15 ASKI
              </div>
            </div>

            <h2 className="display-font text-3xl text-primary text-center mb-8 drop-shadow-md z-10 relative">
              {activeCloset.icon || "🚪"} {activeCloset.name}
            </h2>

            <div className="relative bg-card/40 rounded-[32px] p-6 pt-12 border border-primary/10 shadow-inner">
              <div className="absolute top-8 left-4 right-4 h-3 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/10 rounded-full shadow-inner z-0"></div>

              <div className="grid grid-cols-3 gap-x-4 gap-y-12 relative z-10">
                {activeCloset.items.map((item: any, index: number) => (
                  <div key={index} className="flex flex-col items-center relative" style={{ transitionDelay: `${index * 50}ms` }}>
                    <div className="w-1.5 h-6 bg-primary/40 absolute -top-8 rounded-t-full shadow-sm"></div>
                    <div className="w-6 h-4 border-2 border-b-0 border-primary/40 absolute -top-8 rounded-t-full"></div>

                    {item ? (
                      <div 
                        onClick={() => openLink(item.link)}
                        className="group relative bg-background border border-primary/30 w-full aspect-square rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center hover:scale-110 hover:-rotate-3 transition-transform cursor-pointer overflow-hidden"
                      >
                        {item.link && (
                          <div className="absolute top-1 left-1 text-[10px] bg-primary text-background px-1.5 rounded-md font-black">🔗</div>
                        )}
                        <span className="text-4xl drop-shadow-md">{item.icon}</span>
                        <span className="text-[10px] font-bold text-primary mt-2 uppercase tracking-widest text-center px-1 truncate w-full">{item.name}</span>
                        
                        <button 
                          onClick={(e) => requestDeleteItem(e, index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 hover:scale-110"
                        >
                          ✖
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAddClick(index)}
                        className="bg-background/30 border-2 border-dashed border-primary/30 w-full aspect-square rounded-2xl flex flex-col items-center justify-center hover:bg-primary/10 hover:border-primary transition-colors group"
                      >
                        <span className="text-primary/50 text-2xl group-hover:scale-125 transition-transform mb-1">+</span>
                        <span className="text-[9px] uppercase tracking-widest text-primary/50 font-bold group-hover:text-primary transition-colors text-center">Askı Ekle</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 1. MODAL: DOLAP EKLE / DÜZENLE --- */}
      {isClosetModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-primary/20">
            <h3 className="display-font text-2xl text-primary mb-6 text-center">
              {closetModalMode === "create" ? "Yeni Dolap Ekle ✨" : "Dolabı Düzenle ✏️"}
            </h3>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block text-left">Dolap Çıkartması</label>
              <div className="grid grid-cols-6 gap-2">
                {CLOSET_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => { playSound("click"); setClosetIconInput(icon); }}
                    className={`text-2xl p-2 rounded-xl transition-all ${closetIconInput === icon ? 'bg-primary/20 border border-primary shadow-inner scale-110' : 'hover:bg-primary/10 border border-transparent'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block text-left">Dolap Adı</label>
            <input 
              type="text" 
              value={closetNameInput}
              onChange={(e) => setClosetNameInput(e.target.value)}
              placeholder="Örn: Ayakkabılarım"
              className="w-full bg-background border border-primary/30 rounded-xl p-4 text-sm font-bold text-primary focus:outline-none focus:border-primary transition-colors mb-6 text-center"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveCloset()}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setIsClosetModalOpen(false)}
                className="flex-1 bg-background text-text/70 border border-primary/20 p-4 rounded-xl font-bold hover:bg-primary/10 transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={saveCloset}
                disabled={!closetNameInput.trim()}
                className="flex-1 bg-primary text-background p-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. MODAL: ASKIYA ÜRÜN ASMA MODALI --- */}
      {addingIndex !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-primary/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="display-font text-2xl text-primary">Yeni Ürün As ✨</h3>
              <button onClick={() => setAddingIndex(null)} className="text-text/50 hover:text-primary text-xl">✖</button>
            </div>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Ürün Emojisi</label>
              <div className="grid grid-cols-6 gap-2">
                {QUICK_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => { playSound("click"); setNewItemIcon(icon); }}
                    className={`text-2xl p-2 rounded-xl transition-all ${newItemIcon === icon ? 'bg-primary/20 border border-primary shadow-inner scale-110' : 'hover:bg-primary/10 border border-transparent'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 block">Ürünün Adı</label>
              <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Örn: Siyah Midi Elbise..."
                className="w-full bg-background border border-primary/30 rounded-xl p-4 text-sm font-bold text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="text-xs uppercase tracking-widest text-primary font-bold mb-2 flex justify-between">
                <span>Ürün Linki (URL)</span>
                <span className="text-text/40 text-[10px]">İsteğe Bağlı</span>
              </label>
              <input 
                type="url" 
                value={newItemLink}
                onChange={(e) => setNewItemLink(e.target.value)}
                placeholder="https://trendyol.com/..."
                className="w-full bg-background border border-primary/30 rounded-xl p-4 text-sm font-bold text-primary focus:outline-none focus:border-primary transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && hangItem()}
              />
            </div>

            <button 
              onClick={hangItem}
              disabled={!newItemName.trim()}
              className="w-full bg-primary text-background p-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              Askıya Yerleştir 🪄
            </button>
          </div>
        </div>
      )}

      {/* --- 3. MODAL: DOLAP SİLME ONAYI --- */}
      {closetToDelete !== null && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[110] flex items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card w-full max-w-xs rounded-[32px] p-6 shadow-2xl border border-red-500/20 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="display-font text-2xl text-primary mb-2">Emin misin?</h3>
            <p className="text-text/70 text-sm mb-8 font-medium">Bu dolabı ve içindeki tüm eşyaları tamamen sileceksin. Geri alınamaz!</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setClosetToDelete(null)}
                className="flex-1 bg-background text-text/70 border border-primary/20 p-3 rounded-xl font-bold hover:bg-primary/10 transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={confirmDeleteCloset}
                className="flex-1 bg-red-500 text-white p-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 4. MODAL: EŞYA SİLME ONAYI --- */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[110] flex items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card w-full max-w-xs rounded-[32px] p-6 shadow-2xl border border-red-500/20 text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="display-font text-xl text-primary mb-2">Askıyı Boşalt?</h3>
            <p className="text-text/70 text-sm mb-6 font-medium">Bu ürünü askıdan kaldırmak istediğine emin misin?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 bg-background text-text/70 border border-primary/20 p-3 rounded-xl font-bold hover:bg-primary/10 transition-colors"
              >
                Vazgeç
              </button>
              <button 
                onClick={confirmDeleteItem}
                className="flex-1 bg-red-500 text-white p-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}