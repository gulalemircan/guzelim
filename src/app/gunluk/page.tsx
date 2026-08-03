"use client";
import { useState, useEffect, forwardRef, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { playSound } from "@/utils/audio";
import { supabase } from "@/lib/supabaseClient";

// @ts-ignore
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page bg-[#f4e4bc] shadow-[inset_0_0_20px_rgba(0,0,0,0.15)] border-r border-black/10 overflow-hidden relative" ref={ref}>
      <div className="absolute inset-0 opacity-50 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      
      <div className="relative z-10 w-full h-full p-6 md:p-8 flex flex-col">
        {props.children}
      </div>
      
      {props.number !== "" && (
        <div className="absolute bottom-4 right-5 text-xs font-serif text-black/40 font-bold pointer-events-none">
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

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [draftText, setDraftText] = useState("");
  const [draftImage, setDraftImage] = useState("");

  const bookRef = useRef<any>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    
    fetchEntries();

    // Supabase Realtime Bağlantısı
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
    fetchEntries();
  };

  const handleDelete = async () => {
    if (!editingId) return;
    playSound("over");
    setIsModalOpen(false);

    await supabase.from('diary_entries').delete().eq('id', editingId);
    fetchEntries();
  };

  const stopEvent = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1917] flex items-center justify-center text-[#d4af37] text-xs uppercase tracking-widest animate-pulse font-bold font-serif">
        Defter Raftan Alınıyor...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#1c1917] flex flex-col items-center justify-center p-2 overflow-hidden relative font-serif">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
      
      <Link href="/home" onClick={() => playSound("click")} className="absolute top-5 left-4 z-[100] px-5 py-2 bg-black/40 text-[#f4e4bc] rounded-xl font-bold backdrop-blur-md border border-[#f4e4bc]/20 hover:bg-black/60 transition-colors shadow-lg text-[10px] uppercase tracking-widest">
        ← Masadan Kalk
      </Link>

      <div className="relative w-full max-w-4xl flex items-center justify-center scale-90 md:scale-100 mt-8">
        
        {/* @ts-ignore - Key propu sayesinde veri değişiminde çökme ve başa atma hatası kökten çözüldü */}
        <HTMLFlipBook 
          key={`book-${entries.length}`}
          ref={bookRef}
          width={350} 
          height={500} 
          size="stretch"
          minWidth={300}
          maxWidth={400}
          minHeight={400}
          maxHeight={550}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          
          {/* 📓 1. KAPAK (Tam Ortalanmış, Dolgun ve Şık Tasarım) */}
          <div className="page page-cover bg-[#3e2723] rounded-l-lg shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)] border-l-4 border-[#2b1b18] overflow-hidden relative flex flex-col items-center justify-center cursor-pointer">
             <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
             
             {/* Tam Merkezde Dolgun Görünüm */}
             <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center gap-3">
                <h1 className="text-5xl md:text-6xl text-[#d4af37] font-black tracking-widest drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" style={{ fontFamily: 'Georgia, serif' }}>
                  E & E
                </h1>
                <div className="w-12 h-[2px] bg-[#d4af37]/60 mt-1"></div>
                <span className="text-[9px] text-[#d4af37]/70 uppercase tracking-[0.4em] font-bold mt-1">Anı Defteri</span>
             </div>
          </div>

          {/* 📄 İLK SAYFA (Mülkiyet: Emircan & Efsun) */}
          <Page number="1">
             <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <h2 className="text-3xl md:text-4xl font-black text-black/80 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                  Emircan
                </h2>
                <span className="text-xl text-red-900/60 font-serif italic mb-3">&</span>
                <h2 className="text-3xl md:text-4xl font-black text-black/80" style={{ fontFamily: 'Georgia, serif' }}>
                  Efsun
                </h2>
             </div>
          </Page>

          {/* 📄 ANILAR */}
          {entries.map((entry, index) => (
            <Page key={entry.id} number={index + 2}>
               <div
                 onPointerDown={stopEvent} 
                 onClick={(e) => { stopEvent(e); openEditModal(entry); }}
                 className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/5 hover:bg-black/10 text-black/60 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-black/10 shadow-sm"
                 title="Sayfayı Düzenle"
               >
                 ✏️
               </div>

               {entry.image_url && entry.image_url.trim().length > 5 && (
                 <div className="relative w-full bg-white p-3 pb-8 mb-6 shadow-md transform rotate-2 hover:rotate-0 transition-transform duration-300 pointer-events-none">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-sm shadow-sm transform -rotate-2"></div>
                    <img src={entry.image_url} alt="anı" className="w-full h-40 object-cover bg-black/5" />
                 </div>
               )}

               <div className="mt-2 flex flex-col gap-3 relative z-10 pointer-events-none">
                  <span className="text-[10px] text-red-900/80 font-black tracking-widest uppercase border-b border-black/10 pb-2 inline-block w-max">
                     {entry.date}
                  </span>
                  <p className="text-2xl text-black/80 leading-relaxed font-medium" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}>
                    {entry.text}
                  </p>
               </div>
            </Page>
          ))}

          {/* 📄 YENİ SAYFA EKLEME BUTONU */}
          <Page number={entries.length + 2}>
             <div 
               onPointerDown={stopEvent} 
               onClick={(e) => { stopEvent(e); openNewEntryModal(); }}
               className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-red-900/20 rounded-xl bg-black/5 hover:bg-black/10 cursor-pointer transition-colors group relative z-50"
             >
                <span className="text-4xl opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all">🖋️</span>
                <p className="text-red-900/40 text-xs font-bold uppercase tracking-widest mt-4 group-hover:text-red-900/60 transition-colors">Yeni Anı Yaz</p>
             </div>
          </Page>

          {/* 📓 ARKA KAPAK */}
          <div className="page page-cover bg-[#3e2723] rounded-r-lg shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)] border-r-4 border-[#2b1b18] overflow-hidden relative">
             <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
          </div>

        </HTMLFlipBook>
      </div>

      {/* 📝 DÜZENLEME VE YENİ SAYFA MODALI */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#f4e4bc] p-6 rounded-2xl max-w-sm w-full shadow-2xl relative border-2 border-[#d4af37]/30 flex flex-col gap-4 pointer-events-auto">
               <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] rounded-2xl"></div>
               
               <div className="relative z-10 flex flex-col gap-4">
                  <h3 className="text-red-900/80 font-black text-sm uppercase tracking-widest border-b border-black/10 pb-2 text-center">
                    {editingId ? "Sayfayı Düzenle" : "Yeni Anı Yaz"}
                  </h3>
                  
                  <input 
                    type="text" 
                    value={draftDate} 
                    onChange={e => setDraftDate(e.target.value)} 
                    placeholder="Tarih (Örn: 3 Ağustos 2026)"
                    className="w-full bg-black/5 border border-black/10 text-black/70 p-3 rounded-lg outline-none text-xs font-bold uppercase tracking-widest focus:border-red-900/30"
                  />
                  
                  <input 
                    type="text" 
                    value={draftImage} 
                    onChange={e => setDraftImage(e.target.value)} 
                    placeholder="Fotoğraf Linki (URL) - İsteğe Bağlı"
                    className="w-full bg-black/5 border border-black/10 text-black/70 p-3 rounded-lg outline-none text-xs focus:border-red-900/30"
                  />

                  <textarea 
                    value={draftText} 
                    onChange={e => setDraftText(e.target.value)} 
                    placeholder="Bu sayfaya ne yazmak istersin..."
                    className="w-full h-32 bg-black/5 border border-black/10 text-black/80 p-3 rounded-lg outline-none resize-none text-lg leading-relaxed focus:border-red-900/30"
                    style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}
                  />

                  <div className="flex gap-2 mt-2">
                     {editingId && (
                        <button onClick={handleDelete} className="py-3 px-4 bg-red-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-red-800 transition-colors">Sil</button>
                     )}
                     <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-black/10 text-black/60 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black/20 transition-colors">İptal</button>
                     <button onClick={handleSave} className="flex-1 py-3 bg-[#d4af37] text-black rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#c4a133] transition-colors">Kaydet 🖋️</button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </main>
  );
}