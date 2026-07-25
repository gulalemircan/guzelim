"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

type ReelNote = { id: string; url: string; note: string };

export default function TripRoomPage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [isLoading, setIsLoading] = useState(true);
  
  // Odanın Temel Stateleri
  const [roomMode, setRoomMode] = useState<"trip" | "peace">("trip");
  const [spotifyUrl, setSpotifyUrl] = useState<string>("");
  const [reels, setReels] = useState<ReelNote[]>([]);
  
  // Input Stateleri
  const [newSpotify, setNewSpotify] = useState("");
  const [newReelUrl, setNewReelUrl] = useState("");
  const [newReelNote, setNewReelNote] = useState("");

  const [confirmTrash, setConfirmTrash] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("myName");
    if (savedName) setCurrentUser(savedName);
    
    fetchRoomState();

    const channel = supabase
      .channel('trip_room_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_room', filter: 'id=eq.1' }, (payload: any) => {
        if (payload.new && Object.keys(payload.new).length > 0) {
          setRoomMode(payload.new.mode);
          setSpotifyUrl(payload.new.spotify_url || "");
          setReels(payload.new.reels || []);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRoomState = async () => {
    const { data } = await supabase.from('trip_room').select('*').eq('id', 1).single();
    if (data) {
      setRoomMode(data.mode || "trip");
      setSpotifyUrl(data.spotify_url || "");
      setReels(data.reels || []);
    } else {
      const defaultState = { id: 1, mode: "trip", spotify_url: "", reels: [] };
      await supabase.from('trip_room').upsert([defaultState]);
    }
    setIsLoading(false);
  };

  const updateRoomState = async (updates: any) => {
    await supabase.from('trip_room').update(updates).eq('id', 1);
  };

  const handleSpotifySubmit = () => {
    if (!newSpotify.trim()) return;
    playSound("click");
    setSpotifyUrl(newSpotify);
    setNewSpotify("");
    updateRoomState({ spotify_url: newSpotify });
  };

  const clearSpotify = () => {
    playSound("click");
    setSpotifyUrl("");
    updateRoomState({ spotify_url: "" });
  };

  const handleAddReel = () => {
    if (!newReelUrl.trim()) return;
    playSound("success");
    const newReel = { id: Date.now().toString(), url: newReelUrl, note: newReelNote };
    const updatedReels = [...reels, newReel];
    setReels(updatedReels);
    setNewReelUrl("");
    setNewReelNote("");
    updateRoomState({ reels: updatedReels });
  };

  const emptyTrash = () => {
    playSound("click");
    setReels([]);
    setConfirmTrash(false);
    updateRoomState({ reels: [] });
  };

  // Spotify embed linkini güvenli hale getirme
  const getEmbedUrl = (url: string) => {
    if (url.includes('spotify.com')) {
      const parts = url.split('/');
      const typeIndex = parts.findIndex(p => p === 'track' || p === 'playlist' || p === 'album');
      if (typeIndex !== -1 && parts[typeIndex + 1]) {
        const id = parts[typeIndex + 1].split('?')[0];
        const type = parts[typeIndex];
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      }
    }
    return url;
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 animate-pulse">Odaya Giriliyor...</div>;

  return (
    <main className={`min-h-screen w-full flex flex-col relative overflow-hidden transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-[#0f172a]' : 'bg-[#F4EED3]'}`}>
      
      {/* Üst Kısım: Çıkış ve Mod Göstergesi */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-50">
        <Link href="/home" onClick={() => playSound("click")} className={`px-4 py-2 rounded-xl font-bold transition-all shadow-lg backdrop-blur-md ${roomMode === 'trip' ? 'bg-white/10 text-white hover:bg-white/20 border-white/20' : 'bg-card text-primary border-primary/20 hover:border-primary/50'} border`}>
          ← Odadan Çık
        </Link>
        
        {currentUser === "Emircan" && (
           <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border backdrop-blur-md ${roomMode === 'trip' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-600 border-green-500/30'}`}>
              Şu Anki Mod: {roomMode === 'trip' ? 'TRİP ⛈️' : 'BARIŞILDI ☀️'}
           </div>
        )}
      </div>

      {/* YAĞMUR VEYA GÜNEŞ EFEKTLERİ */}
      <div className="absolute inset-0 pointer-events-none z-0">
         {roomMode === 'trip' && (
           <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
         )}
         {roomMode === 'peace' && (
           <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-400/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute top-10 left-10 w-[400px] h-[400px] border-[40px] border-transparent border-t-pink-300/30 border-r-blue-300/30 rounded-full blur-md opacity-60"></div>
           </>
         )}
      </div>

      {/* 3D ODA İSKELETİ (Perspective Container) */}
      <div className="flex-1 flex items-center justify-center perspective-[1200px] pt-16 pb-10 overflow-x-hidden">
        
        {/* SOL DUVAR: Spotify Laf Sokma Tablosu */}
        <div className="w-[300px] hidden lg:flex flex-col shrink-0 mr-8 transition-transform duration-700 ease-out z-20 group" style={{ transform: 'rotateY(15deg) translateZ(-50px)' }}>
            <div className={`w-full rounded-2xl border-[8px] shadow-2xl p-4 transition-colors duration-1000 relative ${roomMode === 'trip' ? 'border-[#1e293b] bg-[#0f172a] shadow-black/50' : 'border-[#8B0000] bg-card shadow-[#8B0000]/20'}`}>
               
               {/* Neon Tabela */}
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 text-center">
                  <h3 className={`font-black uppercase tracking-widest text-sm transition-colors duration-1000 drop-shadow-[0_0_10px_currentColor] ${roomMode === 'trip' ? 'text-red-500' : 'text-pink-500'}`}>
                    {roomMode === 'trip' ? "Dinle ve Düşün" : "Bugünün Şarkısı"}
                  </h3>
               </div>

               <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/20 flex items-center justify-center relative">
                  {spotifyUrl ? (
                    <>
                      <iframe src={getEmbedUrl(spotifyUrl)} width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-lg"></iframe>
                      {currentUser === "Efsun" && (
                         <button onClick={clearSpotify} className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full font-bold shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 border-2 border-white">X</button>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-4xl block mb-2 opacity-50">🎧</span>
                      <p className={`text-xs font-bold tracking-widest uppercase ${roomMode === 'trip' ? 'text-white/40' : 'text-text/40'}`}>Henüz Şarkı Asılmadı</p>
                    </div>
                  )}
               </div>

               {currentUser === "Efsun" && !spotifyUrl && (
                  <div className="mt-4 flex flex-col gap-2">
                     <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify şarkı linkini yapıştır..." className="w-full bg-black/10 border border-white/20 rounded-lg p-2 text-xs outline-none text-current placeholder:text-current/40" />
                     <button onClick={handleSpotifySubmit} className="w-full bg-green-500 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-600 transition-colors">Duvarda Çal</button>
                  </div>
               )}
            </div>
        </div>

        {/* ORTA DUVAR: Pencere */}
        <div className="w-[320px] md:w-[400px] h-[500px] shrink-0 border-[16px] rounded-t-full shadow-2xl relative overflow-hidden transition-all duration-1000 z-10" style={{ transform: 'translateZ(-150px)', borderColor: roomMode === 'trip' ? '#1e293b' : '#ffffff' }}>
            
            {/* Pencere Camı (Görüntü) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
               <img src="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop" alt="Rainy Window" className="w-full h-full object-cover blur-[2px] brightness-50" />
            </div>
            
            <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
               <img src="https://images.unsplash.com/photo-1590419690008-905895e8fd0d?q=80&w=1000&auto=format&fit=crop" alt="Sunny Window" className="w-full h-full object-cover brightness-110" />
            </div>

            {/* Pencere Pervazı (Orta Çizgiler) */}
            <div className={`absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-[#1e293b]' : 'bg-white'}`}></div>
            <div className={`absolute top-[60%] left-0 right-0 h-2 -translate-y-1/2 transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-[#1e293b]' : 'bg-white'}`}></div>
        </div>

        {/* SAĞ DUVAR: Mantar Pano ve Çöp Kutusu */}
        <div className="w-[300px] hidden lg:flex flex-col shrink-0 ml-8 transition-transform duration-700 ease-out z-20" style={{ transform: 'rotateY(-15deg) translateZ(-50px)' }}>
            
            {/* Mantar Pano */}
            <div className="w-full h-[400px] bg-[#D4A373] border-[10px] border-[#8B5A2B] rounded-lg shadow-2xl relative p-4 overflow-y-auto custom-scrollbar">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 pointer-events-none"></div>
               
               {reels.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-40 text-[#5C4033] font-bold text-center text-sm px-4">
                     Pano şu an boş.
                  </div>
               ) : (
                  <div className="flex flex-col gap-4 relative z-10">
                     {reels.map(reel => (
                       <a href={reel.url} target="_blank" rel="noopener noreferrer" key={reel.id} className="block bg-[#FEFAE0] p-3 rounded-md shadow-md rotate-[-2deg] hover:rotate-0 transition-transform relative group">
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-sm border border-red-700"></div>
                          <p className="font-serif text-[#3E2723] text-xs leading-relaxed mt-2">{reel.note || "Bir video bırakıldı..."}</p>
                          <span className="text-[9px] text-blue-500 mt-2 block underline">Linki Aç</span>
                       </a>
                     ))}
                  </div>
               )}
            </div>

            {/* Pano Ekleme (Efsun İçin) & Çöp Kutusu */}
            <div className="mt-4 w-full flex flex-col items-center gap-3">
               {currentUser === "Efsun" && (
                 <div className={`w-full p-3 rounded-xl border backdrop-blur-sm transition-colors ${roomMode === 'trip' ? 'bg-white/5 border-white/10' : 'bg-card/50 border-primary/20'}`}>
                    <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Tiktok/Reels Linki..." className="w-full bg-transparent border-b border-current/20 pb-1 mb-2 text-xs outline-none text-current" />
                    <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="İğneleyici notun (İsteğe bağlı)..." className="w-full bg-transparent border-b border-current/20 pb-1 mb-2 text-xs outline-none text-current" />
                    <button onClick={handleAddReel} className="w-full py-1.5 bg-[#8B5A2B] text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#6b4420] transition-colors">Panoya İğnele</button>
                 </div>
               )}

               {/* Çöp Kutusu */}
               <div className="w-full flex justify-end">
                  <div className="relative">
                    <button onClick={() => setConfirmTrash(true)} className={`w-14 h-16 rounded-b-xl rounded-t-sm border-2 flex flex-col items-center justify-start pt-1 transition-all hover:scale-105 ${roomMode === 'trip' ? 'bg-[#1e293b] border-white/20' : 'bg-[#D4A373] border-[#8B5A2B]'}`}>
                       <div className={`w-16 h-2 absolute -top-2 rounded-sm ${roomMode === 'trip' ? 'bg-white/20' : 'bg-[#8B5A2B]'}`}></div>
                       <span className="text-xl mt-2 opacity-50">🗑️</span>
                    </button>

                    {confirmTrash && (
                       <div className="absolute bottom-full right-0 mb-4 bg-card border border-primary/20 p-4 rounded-2xl shadow-xl w-48 text-center z-50 animate-in fade-in">
                          <p className="text-xs font-bold text-primary mb-3">Bu trip dosyasını kapatıp her şeyi çöpe atmak istediğine emin misin?</p>
                          <div className="flex gap-2">
                             <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-background border border-primary/20 rounded-md text-[10px] py-1">Vazgeç</button>
                             <button onClick={emptyTrash} className="flex-1 bg-red-500 text-white rounded-md text-[10px] font-bold py-1">Çöpe At</button>
                          </div>
                       </div>
                    )}
                  </div>
               </div>
            </div>

        </div>

      </div>
    </main>
  );
}