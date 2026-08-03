"use client";
import { useState, useEffect, forwardRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { playSound } from "@/utils/audio";
// import { supabase } from "@/lib/supabaseClient"; // Supabase'i bağladığımızda açacağız

// Next.js'te SSR hatası almamak için 3D motoru dinamik yüklüyoruz
// @ts-ignore
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

// SAYFA BİLEŞENİ (Kitabın içindeki saman kağıtları)
const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page bg-[#f4e4bc] shadow-[inset_0_0_20px_rgba(0,0,0,0.15)] border-r border-black/10 overflow-hidden relative" ref={ref}>
      {/* Saman kağıdı dokusu (Dışarıdan şeffaf desen) */}
      <div className="absolute inset-0 opacity-50 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      
      <div className="relative z-10 w-full h-full p-6 md:p-8 flex flex-col">
        {props.children}
      </div>
      
      {/* Sayfa numarası */}
      <div className="absolute bottom-4 right-5 text-xs font-serif text-black/40 font-bold">
        {props.number}
      </div>
    </div>
  );
});
Page.displayName = 'Page';

export default function DiaryPage() {
  const [currentUser, setCurrentUser] = useState("Emircan");
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    
    // Şimdilik tasarım oturması için örnek sayfalar koydum
    // Bir sonraki adımda bunları Supabase'den canlı çekeceğiz!
    setEntries([
      { 
        id: 1, 
        date: "3 Ağustos 2026", 
        text: "Kozmik odadan çıkıp gerçek anılara yelken açtığımız o ilk gün... Bu defter bizim yeni rotamızın şahidi olacak.", 
        imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83164ba?w=500&q=80" // Örnek polaroid resim
      },
      { 
        id: 2, 
        date: "Yakında...", 
        text: "Buraya çok yakında İzmir sokaklarında çekilmiş fotoğraflarımız eklenecek. Sabırsızlıkla bekliyorum.", 
        imageUrl: "" 
      }
    ]);
  }, []);

  return (
    <main className="min-h-screen bg-[#1c1917] flex items-center justify-center p-4 overflow-hidden relative font-serif">
      {/* Arka Plan Ahşap Masa Dokusu */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
      
      {/* Çıkış Butonu */}
      <Link href="/home" onClick={() => playSound("click")} className="absolute top-5 left-4 z-50 px-5 py-2 bg-black/40 text-[#f4e4bc] rounded-xl font-bold backdrop-blur-md border border-[#f4e4bc]/20 hover:bg-black/60 transition-colors shadow-lg text-[10px] uppercase tracking-widest">
        ← Masadan Kalk
      </Link>

      <div className="relative w-full max-w-4xl flex items-center justify-center scale-90 md:scale-100 mt-8">
        
        {/* ======================================================== */}
        {/* 📖 3D KİTAP MOTORU BAŞLIYOR */}
        {/* ======================================================== */}
        {/* @ts-ignore */}
        <HTMLFlipBook 
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
          
          {/* 📓 1. KAPAK (ESKİTİLMİŞ DERİ TASARIMI) */}
          <div className="page page-cover bg-[#3e2723] rounded-l-lg shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)] border-l-4 border-[#2b1b18] overflow-hidden relative flex flex-col items-center justify-center cursor-pointer">
             {/* Deri Dokusu */}
             <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
             
             {/* Kapak Plaketi */}
             <div className="relative z-10 w-4/5 h-4/5 border-2 border-[#d4af37]/30 rounded-lg flex flex-col items-center justify-center p-6 text-center bg-black/10 shadow-inner">
                <h1 className="text-5xl text-[#d4af37] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-4" style={{ fontFamily: 'Georgia, serif' }}>E & E</h1>
                <div className="w-16 h-px bg-[#d4af37]/50 mb-4"></div>
                <p className="text-[#d4af37]/80 text-[10px] uppercase tracking-[0.3em] font-bold">Zaman Kapsülü & Günlük</p>
             </div>
          </div>

          {/* 📄 İÇ SAYFALAR (POLAROİD & EL YAZISI) */}
          {entries.map((entry, index) => (
            <Page key={entry.id} number={index + 1}>
               
               {/* Eğer sayfada resim varsa Polaroid gibi bas */}
               {entry.imageUrl && (
                 <div className="relative w-full bg-white p-3 pb-8 mb-6 shadow-md transform rotate-2 hover:rotate-0 transition-transform duration-300">
                    {/* Yarı Şeffaf Bant Efekti */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-sm shadow-sm transform -rotate-2"></div>
                    <img src={entry.imageUrl} alt="anı" className="w-full h-40 object-cover bg-black/5" />
                 </div>
               )}

               {/* Tarih ve El Yazısı Metin */}
               <div className="mt-2 flex flex-col gap-3">
                  <span className="text-[10px] text-red-900/80 font-black tracking-widest uppercase border-b border-black/10 pb-2 inline-block w-max">
                     {entry.date}
                  </span>
                  {/* El yazısı fontu - Sistemde yüklü olan el yazısı fontlarını dener */}
                  <p className="text-2xl text-black/80 leading-relaxed font-medium" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}>
                    {entry.text}
                  </p>
               </div>
            </Page>
          ))}

          {/* 📄 YENİ SAYFA EKLEME BUTONU (Sadece sayfanın ortasında durur) */}
          <Page number={entries.length + 1}>
             <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-red-900/20 rounded-xl bg-black/5 hover:bg-black/10 cursor-pointer transition-colors group">
                <span className="text-4xl opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all">🖋️</span>
                <p className="text-red-900/40 text-xs font-bold uppercase tracking-widest mt-4 group-hover:text-red-900/60 transition-colors">Yeni Anı Yaz</p>
             </div>
          </Page>

          {/* 📓 ARKA KAPAK (DERİ) */}
          <div className="page page-cover bg-[#3e2723] rounded-r-lg shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)] border-r-4 border-[#2b1b18] overflow-hidden relative">
             <div className="absolute inset-0 opacity-50 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')]"></div>
          </div>

        </HTMLFlipBook>
      </div>
    </main>
  );
}