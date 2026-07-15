"use client";

import { useState, useRef } from "react";

export default function GlobalMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Varsayılan olarak bar kapalı (chat'i engellemesin diye)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Şarkı listesi (Kendi mp3 dosyalarının yollarını veya Supabase linklerini buraya ekleyebilirsin)
  const songs = [
    "/music/jazz1.mp3", 
    "/music/jazz2.mp3"
  ];
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextSong = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
    if (isPlaying && audioRef.current) {
      setTimeout(() => {
        audioRef.current?.play().catch(e => console.log("Otomatik oynatma hatası:", e));
      }, 100);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex items-center">
      
      {/* ŞARKICI/ŞARKI ADI EKRANI YOK (Sadece arkaplanda çalışan ses) */}
      <audio
        ref={audioRef}
        src={songs[currentSongIndex]}
        onEnded={nextSong}
      />

      {/* PLAK KISMI (Ana Buton) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative w-12 h-12 rounded-full bg-[#111] border-[3px] border-[#333] flex items-center justify-center cursor-pointer shadow-2xl z-20 transition-transform hover:scale-105 ${
          isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
        }`}
        title="Müzik Çalar"
      >
        {/* Plak iç çizgileri (Detay) */}
        <div className="absolute inset-[2px] rounded-full border border-white/10"></div>
        <div className="absolute inset-[6px] rounded-full border border-white/5"></div>
        {/* Plak göbeği (Oyun temanıza uygun renk alır) */}
        <div className="w-3 h-3 rounded-full bg-primary/90 border border-black shadow-inner"></div>
      </div>

      {/* KONTROL BARI (Tıklayınca plağın arkasından açılır/kapanır) */}
      <div 
        className={`flex items-center bg-black/70 backdrop-blur-md rounded-r-full h-10 transition-all duration-300 ease-out overflow-hidden border-y border-r border-white/10 relative z-10 ${
          isExpanded ? 'w-[72px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-5 border-none'
        }`}
        style={{ marginLeft: '-15px', paddingLeft: isExpanded ? '20px' : '0px' }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="text-white/70 hover:text-white p-1 transition-colors outline-none"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); nextSong(); }}
          className="text-white/70 hover:text-white p-1 transition-colors outline-none ml-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

    </div>
  );
}