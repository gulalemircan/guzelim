"use client";
import { useState, useEffect, forwardRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { playSound } from "@/utils/audio";
import { supabase } from "@/lib/supabaseClient";

// 3D Motoru dinamik olarak yüklüyoruz
// @ts-ignore
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

// YENİ, TERTEMİZ İÇ SAYFA TASARIMI
const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page bg-[#faf8f5] shadow-[inset_0_0_15px_rgba(0,0,0,0.05)] border-r border-black/5 overflow-hidden relative" ref={ref}>
      <div className="relative z-10 w-full h-full p-6 md:p-8 flex flex-col">
        {props.children}
      </div>
      {props.number && (
        <div className="absolute bottom-4 right-5 text-[10px] font-sans text-black/30 font-bold pointer-events-none">
          {props.number}
        </div>
      )}
    </div>
  );
});
Page.displayName = 'Page';

export default function DiaryPage() {
  const [currentUser, setCurrentUser] = useState("Emircan");
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [draftText, setDraftText] = useState("");
  const [draftImage, setDraftImage] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    
    fetchEntries();

    const channel = supabase
      .channel('diary_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diary_entries' }, () => {
         fetchEntries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEntries = async () => {
    const { data } = await supabase.from('diary_entries').select('*').order('id', { ascending: true });
    if (data) setEntries(data);
    setIsLoading(false);
  };

  const openNewEntryModal = () => {
    playSound("click");
    setEditingId(null);
    setDraftDate(new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }));
    setDraftText("");
    setDraftImage("");
    setIsModalOpen(true);
  };

  const openEditModal = (entry: any) => {
    playSound("click");
    setEditingId(entry.id);
    setDraftDate(entry.date || "");
    setDraftText(entry.text || "");
    setDraftImage(entry.image_url || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    playSound("success");
    setIsModalOpen(false);
    if (editingId) {
      await supabase.from('diary_entries').update({ date: draftDate, text: draftText, image_url: draftImage }).eq('id', editingId);
    } else {
      await supabase.from('diary_entries').insert([{ date: draftDate, text: draftText, image_url: draftImage }]);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    playSound("over");
    setIsModalOpen(false);
    await supabase.from('diary_entries').delete().eq('id', editingId);
  };

  // =====================================================================
  // ÇÖKME ÖNLEYİCİ ALGORİTMA: Kitabın fiziksel yapısını sıfırdan kuruyoruz
  // =====================================================================
  const renderBookPages = () => {
    const pages = [];

    // 1. ÖN KAPAK (Mat Siyah & Altın)
    pages.push(
      <div key="cover-front" className="page page-cover bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-l-xl shadow-[inset_-5px_0_20px_rgba(0,0,0,0.8)] border-l border-[#2b2b2b] overflow-hidden relative flex items-center justify-center">
         <div className="relative z-10 w-full flex items-center justify-center">
            <h1 className="text-6xl md:text-7xl text-[#d4af37] font-black tracking-widest drop-shadow-[0_2px_15px_rgba(212,175,55,0.2)]" style={{ fontFamily: 'Georgia, serif' }}>
              E & E
            </h1>
         </div>
      </div>
    );

    // 2. ÖN İÇ KAPAK (Boş, premium hissi için)
    pages.push(
      <Page key="cover-inside-front" number="">
         <div className="w-full h-full flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-black/20 rounded-xl">
            <span className="text-3xl mb-2">✦</span>
         </div>
      </Page>
    );

    // 3. ANILAR (Kullanıcı girdileri)
    entries.forEach((entry, index) => {
      pages.push(
        <Page key={`entry-${entry.id}`} number={index + 1}>
           <button
             onPointerDownCapture={(e) => e.stopPropagation()} 
             onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); openEditModal(entry); }}
             className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/5 hover:bg-black/10 text-black/50 rounded-full flex items-center justify-center transition-colors cursor-pointer"
           >
             ✏️
           </button>

           {entry.image_url && entry.image_url.trim().length > 5 && (
             <div className="relative w-full p-2 bg-white shadow-sm border border-black/5 mb-6">
                <img 
                  src={entry.image_url} 
                  alt="anı" 
                  className="w-full h-40 md:h-48 object-cover bg-black/5" 
                  onError={(e) => e.currentTarget.style.display = 'none'} // Kırık link hatasını gizler
                />
             </div>
           )}

           <div className="flex flex-col gap-3 relative z-10">
              <span className="text-[9px] text-[#8b7355] font-black tracking-widest uppercase pb-1">
                 {entry.date}
              </span>
              <p className="text-lg md:text-xl text-[#2b2b2b] leading-relaxed" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}>
                {entry.text}
              </p>
           </div>
        </Page>
      );
    });

    // 4. YENİ SAYFA EKLEME BUTONU
    pages.push(
      <Page key="add-new" number={entries.length + 1}>
         <button 
           onPointerDownCapture={(e) => e.stopPropagation()} 
           onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); openNewEntryModal(); }}
           className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#d4af37]/40 rounded-xl bg-[#d4af37]/5 hover:bg-[#d4af37]/10 cursor-pointer transition-colors group relative z-50 outline-none"
         >
            <span className="text-4xl text-[#d4af37] opacity-60 group-hover:scale-110 transition-transform">🖋️</span>
            <p className="text-[#8b7355] text-[10px] font-bold uppercase tracking-widest mt-4">Deftere Yaz</p>
         </button>
      </Page>
    );

    // 5. DENGELEYİCİ BOŞ SAYFA (Sayfa sayısını çift yapmak için)
    // Ön Kapak(1) + Ön İç(1) + Anılar(N) + Yeni Ekle(1) + Arka İç(1) + Arka Kapak(1) = N + 5
    // Eğer N + 5 tek sayıysa, araya 1 boş sayfa atmamız lazım.
    if ((entries.length + 5) % 2 !== 0) {
      pages.push(
        <Page key="filler" number="">
           <div className="w-full h-full opacity-0"></div>
        </Page>
      );
    }

    // 6. ARKA İÇ KAPAK
    pages.push(
      <Page key="cover-inside-back" number="">
         <div className="w-full h-full flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-black/20 rounded-xl">
            <span className="text-3xl mb-2">✦</span>
         </div>
      </Page>
    );

    // 7. ARKA KAPAK
    pages.push(
      <div key="cover-back" className="page page-cover bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-r-xl shadow-[inset_5px_0_20px_rgba(0,0,0,0.8)] border-r border-[#2b2b2b] overflow-hidden relative">
      </div>
    );

    return pages;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#d4af37] text-xs uppercase tracking-widest animate-pulse font-bold">
        Arşiv Açılıyor...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-2 overflow-hidden relative font-sans">
      
      <Link href="/home" onClick={() => playSound("click")} className="absolute top-6 left-6 z-[100] px-4 py-2 bg-white/5 text-white/50 rounded-lg backdrop-blur-md hover:bg-white/10 hover:text-white transition-colors text-[10px] uppercase tracking-widest border border-white/5">
        ← Geri
      </Link>

      <div className="relative w-full max-w-4xl flex items-center justify-center mt-8 scale-[0.85] sm:scale-95 md:scale-100">
        
        {/* @ts-ignore */}
        <HTMLFlipBook 
          key={entries.length} 
          width={320} 
          height={480} 
          size="stretch"
          minWidth={280}
          maxWidth={400}
          minHeight={400}
          maxHeight={550}
          maxShadowOpacity={0.3}
          showCover={true}
          mobileScrollSupport={true}
          usePortrait={true}
          className="shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          {renderBookPages()}
        </HTMLFlipBook>
      </div>

      {/* YENİ ANI / DÜZENLEME MODALI (Premium Tasarım) */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#1a1a1a] p-6 rounded-2xl max-w-sm w-full shadow-2xl relative border border-[#333] flex flex-col gap-4 pointer-events-auto">
               
               <div className="flex flex-col gap-4">
                  <h3 className="text-[#d4af37] font-black text-xs uppercase tracking-widest border-b border-[#333] pb-3 text-center">
                    {editingId ? "Sayfayı Düzenle" : "Yeni Sayfa"}
                  </h3>
                  
                  <input 
                    type="text" 
                    value={draftDate} 
                    onChange={e => setDraftDate(e.target.value)} 
                    placeholder="Tarih"
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white/80 p-3 rounded-lg outline-none text-xs font-bold tracking-wider focus:border-[#d4af37]/50 transition-colors"
                  />
                  
                  <input 
                    type="text" 
                    value={draftImage} 
                    onChange={e => setDraftImage(e.target.value)} 
                    placeholder="Fotoğraf Linki (URL) - İsteğe Bağlı"
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white/80 p-3 rounded-lg outline-none text-xs focus:border-[#d4af37]/50 transition-colors"
                  />

                  <textarea 
                    value={draftText} 
                    onChange={e => setDraftText(e.target.value)} 
                    placeholder="Yazmaya başla..."
                    className="w-full h-32 bg-[#0a0a0a] border border-[#333] text-white/90 p-4 rounded-lg outline-none resize-none text-lg leading-relaxed focus:border-[#d4af37]/50 transition-colors"
                    style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}
                  />

                  <div className="flex gap-2 mt-4">
                     {editingId && (
                        <button onClick={handleDelete} className="py-3 px-4 bg-red-900/40 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-900/60 transition-colors border border-red-900/50">Sil</button>
                     )}
                     <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/5 text-white/60 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">İptal</button>
                     <button onClick={handleSave} className="flex-1 py-3 bg-[#d4af37] text-black rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#c4a133] transition-colors">Kaydet</button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </main>
  );
}