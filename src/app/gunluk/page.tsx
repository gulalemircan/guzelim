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
    <div className="page bg-[#faf6f0] shadow-[inset_0_0_15px_rgba(0,0,0,0.03)] border-r border-black/5 overflow-hidden relative" ref={ref}>
      {/* Hafif kağıt dokusu */}
      <div className="absolute inset-0 opacity-30 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
      
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

  const bookRef = useRef<any>(null);

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

  // Butonların tıklanmasını sağlayan, 3D motoru engelleyen sihirli kalkan
  const stopEvent = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const renderBookPages = () => {
    const pages = [];

    // ==========================================
    // 1. ÖN KAPAK (KETEN, SPİRALLİ, LASTİKLİ)
    // ==========================================
    pages.push(
      <div key="cover-front" className="page page-cover bg-[#c2b2a1] rounded-l-xl shadow-[inset_-5px_0_20px_rgba(0,0,0,0.2)] border-l border-[#8b7d6e] overflow-hidden relative flex flex-col items-center justify-center">
         {/* Keten (Kumaş) Dokusu */}
         <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/woven.png')] mix-blend-multiply pointer-events-none"></div>
         
         {/* Sağdaki Dikine Lastik */}
         <div className="absolute right-4 top-0 bottom-0 w-3 bg-[#a3907c] shadow-[inset_1px_0_3px_rgba(0,0,0,0.3),_0_0_5px_rgba(0,0,0,0.2)] z-10 pointer-events-none"></div>

         {/* Soldaki Spiraller (Tel Halka İllüzyonu) */}
         <div className="absolute left-1 top-4 bottom-4 w-4 flex flex-col justify-between z-10 pointer-events-none py-4">
             {[...Array(14)].map((_, i) => (
                 <div key={i} className="w-6 h-4 border-[3px] border-[#7a6a58] rounded-full shadow-sm -ml-3 bg-gradient-to-r from-transparent to-black/10"></div>
             ))}
         </div>
         
         {/* Ortadaki "2026" ve "E & E" Yıldızlı Tasarım */}
         <div className="relative z-10 flex flex-col items-center gap-6 text-[#3e2723] pr-4">
            <h1 className="text-6xl md:text-7xl font-serif font-black tracking-widest drop-shadow-sm">
              E & E
            </h1>
            <div className="flex items-center justify-center gap-4 text-xl font-bold tracking-[0.3em] font-serif relative">
                <span className="text-sm absolute -top-4 -left-4">✦</span>
                <span className="text-2xl">•</span>
                <span className="text-4xl">2026</span>
                <span className="text-2xl">•</span>
                <span className="text-sm absolute -bottom-4 -right-4">✦</span>
            </div>
         </div>
      </div>
    );

    // ==========================================
    // 2. İÇ KAPAK (Mülkiyet Sayfası - Artık boş değil)
    // ==========================================
    pages.push(
      <Page key="cover-inside-front" number="">
         <div className="w-full h-full flex flex-col items-center justify-center text-[#3e2723] relative">
            <div className="absolute top-10 left-10 text-4xl opacity-20">❝</div>
            <div className="absolute bottom-10 right-10 text-4xl opacity-20">❞</div>
            
            <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-8">Bu defterin sahipleri</p>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Georgia, serif' }}>Efsun</h2>
            <p className="text-lg italic opacity-70 mb-4">&</p>
            <h2 className="text-4xl font-black mb-12" style={{ fontFamily: 'Georgia, serif' }}>Emircan</h2>
            <div className="w-16 h-px bg-[#3e2723]/30"></div>
         </div>
      </Page>
    );

    // ==========================================
    // 3. ANILAR (Senin girdiklerin)
    // ==========================================
    entries.forEach((entry, index) => {
      pages.push(
        <Page key={`entry-${entry.id}`} number={index + 1}>
           {/* Tıklanabilen Kalem İkonu */}
           <div 
             onPointerDown={stopEvent} 
             onClick={(e) => { stopEvent(e); openEditModal(entry); }}
             className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/5 hover:bg-black/10 text-black/50 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-black/10 shadow-sm"
             title="Sayfayı Düzenle"
           >
             ✏️
           </div>

           {entry.image_url && entry.image_url.trim().length > 5 && (
             <div className="relative w-full p-3 bg-white shadow-md transform rotate-1 mb-6 border border-black/5">
                <img 
                  src={entry.image_url} 
                  alt="anı" 
                  className="w-full h-40 md:h-48 object-cover" 
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                />
             </div>
           )}

           <div className="flex flex-col gap-3 relative z-10 pointer-events-none mt-2">
              <span className="text-[10px] text-[#8b7355] font-black tracking-widest uppercase border-b border-black/10 pb-1 w-max">
                 {entry.date}
              </span>
              <p className="text-xl md:text-2xl text-[#2b2b2b] leading-relaxed" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}>
                {entry.text}
              </p>
           </div>
        </Page>
      );
    });

    // ==========================================
    // 4. YENİ SAYFA EKLEME BUTONU
    // ==========================================
    pages.push(
      <Page key="add-new" number={entries.length + 1}>
         <div 
           onPointerDown={stopEvent} 
           onClick={(e) => { stopEvent(e); openNewEntryModal(); }}
           className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#8b7355]/40 rounded-xl bg-[#8b7355]/5 hover:bg-[#8b7355]/10 cursor-pointer transition-colors group relative z-50"
         >
            <span className="text-5xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-transform">🖋️</span>
            <p className="text-[#8b7355] text-xs font-bold uppercase tracking-widest mt-4">Deftere Yaz</p>
         </div>
      </Page>
    );

    // Dengeleyici Sayfa (Çökmeyi önlemek için)
    if ((entries.length + 5) % 2 !== 0) {
      pages.push(
        <Page key="filler" number="">
           <div className="w-full h-full opacity-0 pointer-events-none"></div>
        </Page>
      );
    }

    // ==========================================
    // 5. ARKA İÇ KAPAK & ARKA KAPAK
    // ==========================================
    pages.push(
      <Page key="cover-inside-back" number="">
         <div className="w-full h-full flex items-center justify-center opacity-20 border-2 border-dashed border-black/20 rounded-xl">
            <span className="text-3xl">✦</span>
         </div>
      </Page>
    );

    pages.push(
      <div key="cover-back" className="page page-cover bg-[#c2b2a1] rounded-r-xl shadow-[inset_5px_0_20px_rgba(0,0,0,0.2)] border-r border-[#8b7d6e] overflow-hidden relative">
         <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/woven.png')] mix-blend-multiply pointer-events-none"></div>
         <div className="absolute left-4 top-0 bottom-0 w-3 bg-[#a3907c] shadow-[inset_1px_0_3px_rgba(0,0,0,0.3),_0_0_5px_rgba(0,0,0,0.2)] z-10 pointer-events-none"></div>
      </div>
    );

    return pages;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3ece4] flex items-center justify-center text-[#8b7355] text-xs uppercase tracking-widest animate-pulse font-bold">
        Defter Açılıyor...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3ece4] flex flex-col items-center justify-center p-2 overflow-hidden relative font-sans">
      
      {/* Arka Planda Sıcak Bir Masa Dokusu */}
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

      <Link href="/home" onClick={() => playSound("click")} className="absolute top-6 left-6 z-[100] px-4 py-2 bg-white/50 text-[#3e2723] rounded-lg backdrop-blur-md hover:bg-white border border-black/10 transition-colors text-[10px] uppercase font-black tracking-widest shadow-sm">
        ← Masadan Kalk
      </Link>

      <div className="relative w-full max-w-4xl flex items-center justify-center mt-8 scale-[0.85] sm:scale-95 md:scale-100">
        
        {/* @ts-ignore - KEY PROP'UNU KALDIRDIK Kİ BAŞA DÖNMESİN! */}
        <HTMLFlipBook 
          ref={bookRef}
          width={320} 
          height={480} 
          size="stretch"
          minWidth={280}
          maxWidth={400}
          minHeight={400}
          maxHeight={550}
          maxShadowOpacity={0.4}
          showCover={true}
          mobileScrollSupport={true}
          usePortrait={true}
          className="shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        >
          {renderBookPages()}
        </HTMLFlipBook>
      </div>

      {/* YENİ ANI / DÜZENLEME MODALI */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#faf6f0] p-6 rounded-2xl max-w-sm w-full shadow-2xl relative border border-[#c2b2a1] flex flex-col gap-4 pointer-events-auto">
               
               <div className="flex flex-col gap-4">
                  <h3 className="text-[#3e2723] font-black text-xs uppercase tracking-widest border-b border-black/10 pb-3 text-center">
                    {editingId ? "Sayfayı Düzenle" : "Yeni Sayfa"}
                  </h3>
                  
                  <input 
                    type="text" 
                    value={draftDate} 
                    onChange={e => setDraftDate(e.target.value)} 
                    placeholder="Tarih"
                    className="w-full bg-white border border-black/10 text-[#3e2723] p-3 rounded-lg outline-none text-xs font-bold tracking-wider focus:border-[#c2b2a1] transition-colors"
                  />
                  
                  <input 
                    type="text" 
                    value={draftImage} 
                    onChange={e => setDraftImage(e.target.value)} 
                    placeholder="Fotoğraf Linki (URL) - İsteğe Bağlı"
                    className="w-full bg-white border border-black/10 text-[#3e2723] p-3 rounded-lg outline-none text-xs focus:border-[#c2b2a1] transition-colors"
                  />

                  <textarea 
                    value={draftText} 
                    onChange={e => setDraftText(e.target.value)} 
                    placeholder="Bugün ne oldu?..."
                    className="w-full h-32 bg-white border border-black/10 text-[#3e2723] p-4 rounded-lg outline-none resize-none text-lg leading-relaxed focus:border-[#c2b2a1] transition-colors"
                    style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}
                  />

                  <div className="flex gap-2 mt-4">
                     {editingId && (
                        <button onClick={handleDelete} className="py-3 px-4 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-colors border border-red-200">Sil</button>
                     )}
                     <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-black/5 text-black/60 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 transition-colors">İptal</button>
                     <button onClick={handleSave} className="flex-1 py-3 bg-[#c2b2a1] text-[#3e2723] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#a3907c] transition-colors">Kaydet</button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </main>
  );
}