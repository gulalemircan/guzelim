"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

type ReelNote = { id: string; url: string; note: string };

export default function TripRoomPage() {
  const [currentUser, setCurrentUser] = useState<string>("Emircan");
  const [isLoading, setIsLoading] = useState(true);
  
  const [roomMode, setRoomMode] = useState<"trip" | "peace">("trip");
  const [spotifyUrl, setSpotifyUrl] = useState<string>("");
  const [reels, setReels] = useState<ReelNote[]>([]);
  
  const [pigeonActive, setPigeonActive] = useState(false);
  const [peaceMessage, setPeaceMessage] = useState("");
  const [isWritingNote, setIsWritingNote] = useState(false);
  const [isReadingNote, setIsReadingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  const [newSpotify, setNewSpotify] = useState("");
  const [newReelUrl, setNewReelUrl] = useState("");
  const [newReelNote, setNewReelNote] = useState("");
  const [confirmTrash, setConfirmTrash] = useState(false);
  
  // Peluşa vurma animasyonu state'i
  const [isPlushHit, setIsPlushHit] = useState(false);

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
          setPigeonActive(payload.new.pigeon_active || false);
          setPeaceMessage(payload.new.peace_message || "");
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
      setPigeonActive(data.pigeon_active || false);
      setPeaceMessage(data.peace_message || "");
    } else {
      const defaultState = { id: 1, mode: "trip", spotify_url: "", reels: [], pigeon_active: false, peace_message: "" };
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

  const sendPigeon = () => {
    if (!draftNote.trim()) return;
    playSound("success");
    setPigeonActive(true);
    setPeaceMessage(draftNote);
    setIsWritingNote(false);
    setDraftNote("");
    updateRoomState({ pigeon_active: true, peace_message: draftNote });
  };

  const acceptPeace = () => {
    playSound("success");
    setRoomMode("peace");
    setPigeonActive(false);
    setIsReadingNote(false);
    updateRoomState({ mode: "peace", pigeon_active: false });
  };

  const hitPlush = () => {
    if (roomMode === 'trip') {
      playSound("click"); 
      setIsPlushHit(true);
      setTimeout(() => setIsPlushHit(false), 500);
    }
  };

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

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-pink-300 animate-pulse font-bold">Odaya Giriliyor...</div>;

  return (
    <main className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center font-sans overflow-hidden">
      
      {/* ÜST ARAYÜZ (GÜVERCİN VE MOD) */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-[200] pointer-events-auto">
        <Link href="/home" onClick={() => playSound("click")} className="px-5 py-2.5 bg-black/50 text-white rounded-2xl font-bold backdrop-blur-md border border-white/20 hover:bg-black/70 transition-colors shadow-lg">
          ← Odadan Çık
        </Link>
        
        <div className="flex items-center gap-3">
          {currentUser === "Emircan" && roomMode === 'trip' && !pigeonActive && (
             <button onClick={() => setIsWritingNote(true)} className="px-5 py-2.5 bg-pink-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.5)] animate-pulse hover:bg-pink-600 border border-pink-400">
               Gönül Al 🕊️
             </button>
          )}
          <div className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md border shadow-lg ${roomMode === 'trip' ? 'bg-black/80 text-blue-300 border-blue-500/30' : 'bg-white/80 text-pink-600 border-pink-400/50'}`}>
             {roomMode === 'trip' ? 'TRİP MODU ⛈️' : 'BARIŞILDI ☀️'}
          </div>
        </div>
      </div>

      {/* MODALLAR */}
      {pigeonActive && (
         <div className="absolute inset-0 z-[150] pointer-events-none flex items-center justify-center">
            <div onClick={() => currentUser === 'Efsun' && setIsReadingNote(true)} className={`pointer-events-auto cursor-pointer animate-bounce absolute top-1/4 bg-white backdrop-blur-md border-4 border-pink-400 p-6 rounded-[40px] shadow-[0_0_50px_rgba(255,105,180,0.6)] flex items-center gap-4 hover:scale-110 transition-transform`}>
               <span className="text-5xl drop-shadow-md">🕊️</span>
               <div>
                  <p className="text-sm font-black text-pink-600 uppercase tracking-wide">Emircan'dan Mektup Var!</p>
                  <p className="text-xs text-gray-500 font-medium">Okumak için dokun...</p>
               </div>
            </div>
         </div>
      )}

      {isWritingNote && (
         <div className="fixed inset-0 z-[160] bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-[32px] max-w-sm w-full shadow-2xl flex flex-col gap-4 border-4 border-pink-200">
               <h3 className="text-lg font-black text-pink-600 uppercase tracking-widest text-center">Gönül Alma Notu</h3>
               <textarea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Prensesin gönlünü alacak tatlı bir şeyler yaz..." className="w-full h-32 bg-pink-50 border border-pink-200 rounded-2xl p-4 text-sm text-gray-800 outline-none resize-none font-medium"></textarea>
               <div className="flex gap-3">
                  <button onClick={() => setIsWritingNote(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200">İptal</button>
                  <button onClick={sendPigeon} className="flex-1 py-3 bg-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-pink-600">Sal 🕊️</button>
               </div>
            </div>
         </div>
      )}

      {isReadingNote && (
         <div className="fixed inset-0 z-[160] bg-black/80 flex items-center justify-center p-4 animate-in zoom-in-95">
            <div className="bg-[#FFF0F5] border-4 border-pink-300 p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-gray-800 font-serif">
               <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-sm">❤️</div>
               <span className="text-5xl text-pink-300 block mb-2 leading-none">"</span>
               <p className="text-base leading-relaxed mb-6 font-medium whitespace-pre-wrap">{peaceMessage}</p>
               <div className="text-right text-sm italic text-pink-600 font-bold mb-8">- Emircan</div>
               <div className="flex gap-3 font-sans">
                  <button onClick={() => setIsReadingNote(false)} className="flex-1 py-3.5 bg-gray-300 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-400">Hala Tripliyim ⛈️</button>
                  <button onClick={acceptPeace} className="flex-1 py-3.5 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-green-600">Affettim ☀️</button>
               </div>
            </div>
         </div>
      )}

      {/* ============================================================================== */}
      {/* 🏡 İNTERAKTİF FOTOĞRAF SAHNESİ (POINT & CLICK MANTIĞI) */}
      {/* ============================================================================== */}
      
      <div className="w-full h-full overflow-x-auto overflow-y-hidden flex items-center justify-start lg:justify-center custom-scrollbar">
         {/* SAHNE KONTEYNERİ (Oranları kilitli 1200x675) */}
         <div className="relative w-[1200px] h-[675px] shrink-0 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* 1. GERÇEK ODA FOTOĞRAFI */}
            <img 
              src="/rosa-genc-odasi-takimi_3_c042b4f6-b05e-4054-babc-35e090ed3ca7.webp" 
              alt="Oda" 
              className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none" 
            />

            {/* ========================================= */}
            {/* 2. ETKİLEŞİMLİ KATMANLAR (Görünmez veya UI) */}
            {/* ========================================= */}

            {/* A) PENCERE BÖLGESİ (Buğu ve Işık Efekti) */}
            <div className="absolute z-10 pointer-events-none" style={{ top: '18%', left: '57%', width: '13%', height: '40%' }}>
               {roomMode === 'trip' && (
                 <div className="absolute inset-0 backdrop-blur-md bg-white/20 transition-all duration-1000 flex items-center justify-center">
                    <span className="text-blue-900/30 text-5xl">🌧️</span>
                 </div>
               )}
            </div>

            {/* B) SPOTIFY LAF SOKMA DUVARI (Sol Dolabın Aynasına Akıllı Ekran) */}
            <div className="absolute z-20 flex flex-col items-center" style={{ top: '35%', left: '16.5%', width: '12%', height: '30%' }}>
               <div className={`w-full h-full bg-black/60 backdrop-blur-sm rounded-lg shadow-inner border-[2px] border-white/20 flex flex-col transition-colors duration-1000 ${roomMode === 'trip' ? 'shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'shadow-[0_0_15px_rgba(236,72,153,0.4)]'}`}>
                  <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
                    {spotifyUrl ? (
                      <>
                        <iframe src={getEmbedUrl(spotifyUrl)} width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                        {currentUser === "Efsun" && (
                           <button onClick={clearSpotify} className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-[10px] font-bold shadow-lg flex items-center justify-center hover:scale-110 z-50">X</button>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-white/50">
                        <span className="text-xl block mb-1">🎵</span>
                        <p className="text-[8px] font-bold tracking-widest uppercase">Akıllı Ayna</p>
                      </div>
                    )}
                  </div>
               </div>

               {currentUser === "Efsun" && !spotifyUrl && (
                  <div className="mt-2 w-[140%] flex gap-1 z-30">
                     <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify link..." className="w-full bg-white/90 border border-gray-300 rounded p-1 text-[8px] outline-none text-black" />
                     <button onClick={handleSpotifySubmit} className="bg-primary text-white px-2 rounded text-[8px] font-bold">Çal</button>
                  </div>
               )}
            </div>

            {/* C) MANTAR REELS PANOSU (Masadaki Boş Duvara Monteli) */}
            <div className="absolute z-20" style={{ top: '35%', left: '33%', width: '16%', height: '22%' }}>
               <div className="w-full h-full bg-[#D4A373]/90 backdrop-blur-sm border-[6px] border-[#8B5A2B] rounded-sm shadow-xl p-2 overflow-y-auto custom-scrollbar relative">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 pointer-events-none"></div>
                 
                 <button onClick={() => setConfirmTrash(true)} className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-md shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-30 border border-white" title="Panoyu Temizle">
                    <span className="text-xs">🗑️</span>
                 </button>
                 
                 {confirmTrash && (
                    <div className="absolute bottom-6 right-0 bg-white p-2 rounded-lg shadow-xl border border-red-500 z-50 w-24 text-center">
                       <p className="text-[8px] font-bold mb-1 text-black">Emin misin?</p>
                       <div className="flex gap-1">
                          <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-gray-200 text-black rounded text-[8px] py-1 font-bold">İptal</button>
                          <button onClick={emptyTrash} className="flex-1 bg-red-500 text-white rounded text-[8px] py-1 font-bold">At</button>
                       </div>
                    </div>
                 )}

                 {reels.length === 0 ? (
                    <div className="h-full flex items-center justify-center opacity-70 text-[#5C4033] font-bold text-center text-[10px]">Pano boş.</div>
                 ) : (
                    <div className="flex flex-col gap-2 relative z-10">
                       {reels.map(reel => (
                         <a href={reel.url} target="_blank" rel="noopener noreferrer" key={reel.id} className="block bg-[#FEFAE0] p-1.5 rounded-sm shadow-sm rotate-[-2deg] hover:rotate-1 transition-transform relative border border-[#e6debc]">
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
                            <p className="font-serif text-[#3E2723] text-[9px] leading-tight mt-1 truncate">{reel.note || "Video"}</p>
                         </a>
                       ))}
                    </div>
                 )}
               </div>

               {/* Reels Ekleme Çekmecesi */}
               {currentUser === "Efsun" && (
                  <div className="absolute top-[105%] left-0 w-full bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-md border border-white z-20">
                     <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Reels Linki..." className="w-full bg-transparent border-b border-gray-400 pb-0.5 mb-1 text-[9px] outline-none text-black" />
                     <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="Notun..." className="w-full bg-transparent border-b border-gray-400 pb-0.5 mb-1 text-[9px] outline-none text-black" />
                     <button onClick={handleAddReel} className="w-full py-1 bg-[#8B5A2B] text-white rounded text-[9px] font-bold uppercase tracking-widest shadow-sm">İğnele</button>
                  </div>
               )}
            </div>

            {/* D) KOMODİN BÖLGESİ (Kahve Fincanı ve Fotoğraf Çerçevesi) */}
            <div className="absolute z-20 flex items-end justify-center gap-2" style={{ bottom: '26%', right: '5%', width: '12%', height: '15%' }}>
               
               {/* Fotoğraf Çerçevesi */}
               <div className={`w-[45%] h-[60%] transition-all duration-1000 ease-in-out border-2 shadow-[0_5px_15px_rgba(0,0,0,0.3)] z-30 origin-bottom ${roomMode === 'trip' ? 'bg-gray-300 border-gray-400 rotate-x-[75deg] translate-y-[10px] opacity-90' : 'bg-white border-white -rotate-6'}`}>
                  {roomMode === 'trip' ? (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs opacity-40 transform rotate-180">🔒</span>
                     </div>
                  ) : (
                     <div className="absolute inset-0 p-0.5">
                        <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-sm" alt="Mutlu Anı" />
                     </div>
                  )}
               </div>

               {/* Kahve Fincanı & Duman */}
               <div className="relative w-[20%] h-[30%] mb-1 z-30">
                  {roomMode === 'trip' && (
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none z-40">
                        <div className="w-1 h-6 bg-orange-500 blur-[2px] rounded-full animate-pulse opacity-80"></div>
                        <div className="w-1.5 h-8 bg-red-500 blur-[2px] rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-5 bg-yellow-400 blur-[2px] rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.4s' }}></div>
                     </div>
                  )}
                  {/* Fincanın kendisi fotoğrafın içinde olduğu için sadece dumanı ekliyoruz. 
                      Eğer fotoğrafta fincan yoksa sahte bir tane çizebiliriz: */}
                  <div className="w-full h-full bg-white rounded-b-md rounded-t-sm shadow-md relative">
                      <div className="absolute top-0 -right-2 w-2 h-3 border-2 border-white rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* E) YERDEKİ PELUŞ OYUNCAK (Görünmez Tıklama Alanı & Vurma Efekti) */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes hit-wiggle {
                0% { transform: scale(1) rotate(0deg); }
                20% { transform: scale(0.9) rotate(-10deg); }
                40% { transform: scale(1.1) rotate(10deg); }
                60% { transform: scale(0.95) rotate(-5deg); }
                80% { transform: scale(1.05) rotate(5deg); }
                100% { transform: scale(1) rotate(0deg); }
              }
              .animate-hit { animation: hit-wiggle 0.5s ease-in-out; }
            `}} />
            
            {/* Fotoğraftaki peluşun tam üzerine denk gelen tıklanabilir sarsıntı alanı */}
            <div 
              onClick={hitPlush} 
              className={`absolute z-30 cursor-pointer ${isPlushHit ? 'animate-hit' : ''}`} 
              style={{ bottom: '12%', right: '15%', width: '15%', height: '15%' }}
              title="Stres Peluşu (Vur!)"
            >
               {/* Sadece animasyon tetiklenince görünen ekstra çizgi film vuruş efekti eklenebilir */}
               {isPlushHit && (
                  <div className="absolute -top-4 -right-4 text-2xl animate-ping">💢</div>
               )}
            </div>

            {/* ========================================= */}
            {/* 3. ATMOSFER FİLTRELERİ (Odanın Ruh Halii) */}
            {/* ========================================= */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-40 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
               <div className="absolute inset-0 bg-[#0f172a]/60 mix-blend-multiply"></div>
               {/* Yağmur Çizgileri */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen animate-pulse"></div>
            </div>

            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-40 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
               <div className="absolute inset-0 bg-yellow-500/10 mix-blend-overlay"></div>
               {/* Güneş Işığı Hüzmesi */}
               <div className="absolute top-[10%] right-[30%] w-[400px] h-[600px] bg-yellow-100/15 blur-[80px] rounded-full transform -rotate-45"></div>
            </div>

         </div>
      </div>

    </main>
  );
}