"use client";
import { useState, useEffect, forwardRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { playSound } from "@/utils/audio";

// @ts-ignore
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page bg-[#f4e4bc] shadow-[inset_0_0_20px_rgba(0,0,0,0.15)] border-r border-black/10 overflow-hidden relative" ref={ref}>
      <div className="absolute inset-0 opacity-50 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      <div className="relative z-10 w-full h-full p-5 md:p-8 flex flex-col">
        {props.children}
      </div>
      <div className="absolute bottom-4 right-5 text-[10px] font-serif text-black/40 font-bold pointer-events-none">
        {props.number}
      </div>
    </div>
  );
});
Page.displayName = 'Page';

export default function DiaryPage() {
  const [currentUser, setCurrentUser] = useState("Emircan");
  const [entries, setEntries] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [draftText, setDraftText] = useState("");
  const [draftImage, setDraftImage] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    
    setEntries([
      { 
        id: 1, 
        date: "3 Ağustos 2026", 
        text: "Kozmik odadan çıkıp gerçek anılara yelken açtığımız o ilk gün... Bu defter bizim yeni rotamızın şahidi olacak.", 
        imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83164ba?w=500&q=80"
      }
    ]);
  }, []);

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
    setDraftDate(entry.date);
    setDraftText(entry.text);
    setDraftImage(entry.imageUrl || "");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    playSound("success");
    if (editingId) {
      setEntries(entries.map(e => e.id === editingId ? { ...e, date: draftDate, text: draftText, imageUrl: draftImage } : e));
    } else {
      const newEntry = { id: Date.now(), date: draftDate, text: draftText, imageUrl: draftImage };
      setEntries([...entries, newEntry]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingId) return;
    playSound("over");
    setEntries(entries.filter(e => e.id !== editingId));
    setIsModalOpen(false);
  };

  // KİTAP TOPLAM SAYFA HESABI (3D motorun çökmemesi için her zaman çift sayı olmalı)
  // Kapak (1) + Girişler (entries.length) + Kalem (1) + Arka Kapak (1)
  const totalBasePages = 1 + entries.length + 1 + 1;
  const needsBlankPage = totalBasePages % 2 !== 0; // Tek sayıysa 1 boş sayfa ekle

  return (
    <main className="min-h-screen bg-[#1c1917] flex flex-col items-center justify-center p-2 overflow-hidden relative font-serif">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
      
      <Link href="/home" onClick={() => playSound("click")} className="absolute top-5 left-4 z-[100] px-4 py-2 bg-black/50 text-[#f4e4bc] rounded-xl font-bold backdrop-blur-md border border-[#f4e4bc]/20 hover:bg-black/70 transition-colors shadow-lg text-[10px] uppercase tracking-widest">
        ← Masadan Kalk
      </Link>

      <div className="relative w-full max-w-4xl flex items-center justify-center mt-12 scale-[0.85] sm:scale-95 md:scale-100">
        
        {/* Kitap boyutu değiştiğinde çökmemesi için KEY atadık, motor kendini yeniliyor */}
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
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          usePortrait={true}
          className="shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          
          {/* ======================================= */}
          {/* 📓 1. KAPAK (SADECE DERİ VE YAZI) */}
          {/* ======================================= */}
          <div className="page page-cover bg-[#3e2723] rounded-l-lg shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)] border-l-4 border-[#2b1b18] overflow-hidden relative flex items-center justify-center cursor-pointer">
             <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
             
             {/* İç Çerçeveyi Kaldırdık, Sadece Parlayan Asil Bir Yazı */}
             <div className="relative z-10 w-full flex items-center justify-center">
                <h1 className="text-7xl md:text-8xl text-[#d4af37] font-black drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Georgia, serif' }}>
                  E & E
                </h1>
             </div>
          </div>

          {/* ======================================= */}
          {/* 📄 İÇ SAYFALAR */}
          {/* ======================================= */}
          {entries.map((entry, index) => (
            <Page key={entry.id} number={index + 1}>
               
               <button
                 onPointerDownCapture={(e) => e.stopPropagation()} 
                 onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); openEditModal(entry); }}
                 className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/5 hover:bg-black/10 text-black/60 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-black/10"
                 title="Sayfayı Düzenle"
               >
                 ✏️
               </button>

               {/* Fotoğraf Kontrolü (Hatalı/Boş linkte 404 yememek için) */}
               {entry.imageUrl && entry.imageUrl.trim().length > 5 && (
                 <div className="relative w-full bg-white p-2 md:p-3 pb-6 md:pb-8 mb-4 shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-300 pointer-events-none mt-2">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-white/40 backdrop-blur-sm shadow-sm transform -rotate-2"></div>
                    <img src={entry.imageUrl} alt="anı" className="w-full h-36 md:h-44 object-cover bg-black/5" />
                 </div>
               )}

               <div className="mt-2 flex flex-col gap-2 relative z-10 pointer-events-none">
                  <span className="text-[10px] text-red-900/80 font-black tracking-widest uppercase border-b border-black/10 pb-1 inline-block w-max">
                     {entry.date}
                  </span>
                  <p className="text-xl md:text-2xl text-black/80 leading-relaxed font-medium" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}>
                    {entry.text}
                  </p>
               </div>
            </Page>
          ))}

          {/* ======================================= */}
          {/* 📄 YENİ SAYFA EKLEME BUTONU (Kalem) */}
          {/* ======================================= */}
          <Page number={entries.length + 1}>
             <button 
               onPointerDownCapture={(e) => e.stopPropagation()} 
               onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); openNewEntryModal(); }}
               className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-red-900/20 rounded-xl bg-black/5 hover:bg-black/10 cursor-pointer transition-colors group relative z-50 outline-none"
             >
                <span className="text-4xl md:text-5xl opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all drop-shadow-sm">🖋️</span>
                <p className="text-red-900/50 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-4 group-hover:text-red-900/70 transition-colors">Deftere Yaz</p>
             </button>
          </Page>

          {/* 3D Motorun Çökmemesi İçin Otomatik Boş Sayfa Dengeleyici */}
          {needsBlankPage && (
             <Page number="">
                <div className="w-full h-full flex items-center justify-center opacity-30 text-[10px] uppercase font-bold text-black">
                   (Boş Sayfa)
                </div>
             </Page>
          )}

          {/* ======================================= */}
          {/* 📓 ARKA KAPAK (DERİ) */}
          {/* ======================================= */}
          <div className="page page-cover bg-[#3e2723] rounded-r-lg shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)] border-r-4 border-[#2b1b18] overflow-hidden relative">
             <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
          </div>

        </HTMLFlipBook>
      </div>

      {/* ============================================================================== */}
      {/* 📝 YENİ ANI / DÜZENLEME MODALI */}
      {/* ============================================================================== */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#f4e4bc] p-6 rounded-2xl max-w-sm w-full shadow-2xl relative border-2 border-[#d4af37]/30 flex flex-col gap-4 pointer-events-auto">
               <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] rounded-2xl"></div>
               
               <div className="relative z-10 flex flex-col gap-4">
                  <h3 className="text-red-900/80 font-black text-sm uppercase tracking-widest border-b border-black/10 pb-2 text-center">
                    {editingId ? "Sayfayı Düzenle" : "Yeni Sayfa Yaz"}
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