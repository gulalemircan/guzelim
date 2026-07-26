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
  
  // Güvercin & Not Stateleri
  const [pigeonActive, setPigeonActive] = useState(false);
  const [peaceMessage, setPeaceMessage] = useState("");
  const [isWritingNote, setIsWritingNote] = useState(false);
  const [isReadingNote, setIsReadingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  // Input Stateleri
  const [newSpotify, setNewSpotify] = useState("");
  const [newReelUrl, setNewReelUrl] = useState("");
  const [newReelNote, setNewReelNote] = useState("");
  const [confirmTrash, setConfirmTrash] = useState(false);
  
  // Masa Objeleri Etkileşimleri
  const [bunnyBounce, setBunnyBounce] = useState(false);
  const [coffeeClickCount, setCoffeeClickCount] = useState(0);

  // Odaya Bakış (Kamera) Stateleri
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

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

  const handleBunnyClick = () => {
    playSound("click");
    setBunnyBounce(true);
    setTimeout(() => setBunnyBounce(false), 400);
  };

  const handleCoffeeClick = () => {
    if (roomMode === 'trip' && coffeeClickCount < 5) {
       playSound("click");
       setCoffeeClickCount(prev => prev + 1);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * -10;
    setRotation({ x: y, y: x });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const x = (touch.clientX / window.innerWidth - 0.5) * 40; 
    const y = (touch.clientY / window.innerHeight - 0.5) * -15;
    setRotation({ x: y, y: x });
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

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 animate-pulse">Odaya Giriliyor...</div>;

  const roomDepth = 1500;

  return (
    <main 
      className="fixed inset-0 w-full h-full overflow-hidden bg-black"
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      
      {/* --- ARAYÜZ (ODANIN DIŞINDA, EKRANA SABİT) --- */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-50 pointer-events-auto">
        <Link href="/home" onClick={() => playSound("click")} className="px-4 py-2 bg-black/40 text-white rounded-xl font-bold backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
          ← Odadan Çık
        </Link>
        
        <div className="flex items-center gap-3">
          {currentUser === "Emircan" && roomMode === 'trip' && !pigeonActive && (
             <button onClick={() => setIsWritingNote(true)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg animate-pulse hover:bg-red-700 transition-colors border border-red-400">
               Gönül Al 🕊️
             </button>
          )}
          <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border backdrop-blur-md ${roomMode === 'trip' ? 'bg-black/50 text-red-400 border-red-500/30' : 'bg-white/50 text-green-700 border-green-500/30'}`}>
             {roomMode === 'trip' ? 'TRİP MODU ⛈️' : 'BARIŞILDI ☀️'}
          </div>
        </div>
      </div>

      {/* --- GÜVERCİN VE MODALLAR --- */}
      {pigeonActive && (
         <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center">
            <div onClick={() => currentUser === 'Efsun' && setIsReadingNote(true)} className={`pointer-events-auto cursor-pointer animate-bounce absolute top-1/4 bg-card border-2 border-primary p-4 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center gap-3 hover:scale-110 transition-transform`}>
               <span className="text-4xl">🕊️</span>
               <div>
                  <p className="text-xs font-black text-primary uppercase">Emircan'dan Mektup Var!</p>
                  <p className="text-[10px] text-text/70">Okumak için dokun...</p>
               </div>
            </div>
         </div>
      )}

      {isWritingNote && (
         <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-card border border-primary/30 p-6 rounded-[32px] max-w-sm w-full shadow-2xl flex flex-col gap-4">
               <h3 className="text-lg font-black text-primary uppercase tracking-widest text-center">Gönül Alma Notu</h3>
               <textarea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Prensesin gönlünü alacak tatlı bir şeyler yaz..." className="w-full h-32 bg-background border border-primary/20 rounded-2xl p-3 text-sm text-text outline-none resize-none font-medium"></textarea>
               <div className="flex gap-2">
                  <button onClick={() => setIsWritingNote(false)} className="flex-1 py-3 bg-background border border-primary/20 rounded-xl text-xs font-bold text-text/70">İptal</button>
                  <button onClick={sendPigeon} className="flex-1 py-3 bg-primary text-background rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Güvercini Sal 🕊️</button>
               </div>
            </div>
         </div>
      )}

      {isReadingNote && (
         <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 animate-in zoom-in-95">
            <div className="bg-[#FEFAE0] border-4 border-[#8B5A2B] p-8 rounded-sm max-w-md w-full shadow-2xl relative text-[#3E2723] font-serif">
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-md"></div>
               <span className="text-4xl text-[#8B0000]/20 block mb-2">"</span>
               <p className="text-base leading-relaxed mb-6 font-medium whitespace-pre-wrap">{peaceMessage}</p>
               <div className="text-right text-xs italic text-[#8B0000] font-bold mb-6">- Emircan</div>
               <div className="flex gap-3 font-sans">
                  <button onClick={() => setIsReadingNote(false)} className="flex-1 py-3 bg-stone-300 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider">Hala Tripliyim ⛈️</button>
                  <button onClick={acceptPeace} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg">Affettim (Güneş Açsın) ☀️</button>
               </div>
            </div>
         </div>
      )}


      {/* ============================================================================== */}
      {/* 🏡 GERÇEK FİZİKSEL 3D ODA BAŞLANGICI */}
      {/* ============================================================================== */}
      <div 
        className="absolute w-full h-full pointer-events-auto"
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
         
         {/* 1. ZEMİN */}
         <div 
            className={`absolute bottom-0 left-0 right-0 border-t border-black/10 transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-[#0f172a]' : 'bg-[#D4A373]'}`}
            style={{ height: `${roomDepth}px`, transformOrigin: 'bottom', transform: 'rotateX(90deg)' }}
         >
            <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] transition-opacity duration-1000 ${roomMode === 'peace' ? 'opacity-30' : 'opacity-5'}`}></div>
         </div>

         {/* 2. TAVAN */}
         <div 
            className={`absolute top-0 left-0 right-0 transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-[#020617]' : 'bg-[#FFFBF0]'}`}
            style={{ height: `${roomDepth}px`, transformOrigin: 'top', transform: 'rotateX(-90deg)' }}
         >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 blur-[100px] rounded-full"></div>
         </div>

         {/* 3. SOL DUVAR */}
         <div 
            className={`absolute top-0 bottom-0 left-0 transition-colors duration-1000 overflow-hidden flex items-center justify-center ${roomMode === 'trip' ? 'bg-[#1e293b]' : 'bg-[#FFE3E1]'}`}
            style={{ width: `${roomDepth}px`, transformOrigin: 'left', transform: 'rotateY(90deg)' }}
         >
            <div className="absolute bottom-0 w-full h-12 bg-black/20"></div>
            
            <div className={`w-[400px] p-6 rounded-2xl border-[12px] shadow-2xl transition-colors duration-1000 relative z-10 ${roomMode === 'trip' ? 'border-[#0f172a] bg-[#020617]' : 'border-[#8B0000] bg-card'}`}>
                 <h3 className={`font-black uppercase tracking-widest text-center text-sm mb-4 transition-colors duration-1000 ${roomMode === 'trip' ? 'text-red-500' : 'text-pink-500'}`}>
                    {roomMode === 'trip' ? "Laf Sokma Köşesi" : "Günün Şarkısı"}
                 </h3>
                 <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/20 flex items-center justify-center relative">
                    {spotifyUrl ? (
                      <>
                        <iframe src={getEmbedUrl(spotifyUrl)} width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                        {currentUser === "Efsun" && (
                           <button onClick={clearSpotify} className="absolute -top-3 -right-3 w-10 h-10 bg-red-600 text-white rounded-full font-bold shadow-lg flex items-center justify-center hover:scale-110 border-2 border-white">X</button>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-5xl block mb-2 opacity-50">🎧</span>
                        <p className={`text-sm font-bold tracking-widest uppercase ${roomMode === 'trip' ? 'text-white/40' : 'text-text/40'}`}>Şarkı Asılmadı</p>
                      </div>
                    )}
                 </div>
                 {currentUser === "Efsun" && !spotifyUrl && (
                    <div className="mt-4 flex flex-col gap-2">
                       <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify linki..." className="w-full bg-black/10 border border-white/20 rounded-lg p-3 text-sm outline-none text-current" />
                       <button onClick={handleSpotifySubmit} className="w-full bg-green-500 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-600">Duvarda Çal</button>
                    </div>
                 )}
            </div>
         </div>

         {/* 4. SAĞ DUVAR */}
         <div 
            className={`absolute top-0 bottom-0 right-0 transition-colors duration-1000 flex flex-col items-center justify-center ${roomMode === 'trip' ? 'bg-[#1e293b]' : 'bg-[#FFE3E1]'}`}
            style={{ width: `${roomDepth}px`, transformOrigin: 'right', transform: 'rotateY(-90deg)' }}
         >
            <div className="absolute bottom-0 w-full h-12 bg-black/20"></div>
            
            <div className="relative z-10 flex flex-col items-center">
               <div className="w-[450px] h-[500px] bg-[#D4A373] border-[16px] border-[#8B5A2B] rounded-lg shadow-2xl relative p-6 overflow-y-auto custom-scrollbar">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 pointer-events-none"></div>
                  {reels.length === 0 ? (
                     <div className="h-full flex items-center justify-center opacity-40 text-[#5C4033] font-bold text-center text-lg px-4">Pano bomboş.</div>
                  ) : (
                     <div className="flex flex-col gap-5 relative z-10">
                        {reels.map(reel => (
                          <a href={reel.url} target="_blank" rel="noopener noreferrer" key={reel.id} className="block bg-[#FEFAE0] p-4 rounded-md shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform relative group">
                             <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full shadow-sm border-2 border-red-700"></div>
                             <p className="font-serif text-[#3E2723] text-sm leading-relaxed mt-2">{reel.note || "Bir video bırakıldı..."}</p>
                          </a>
                        ))}
                     </div>
                  )}
               </div>

               <div className="mt-6 w-[450px] flex justify-between items-end">
                  {currentUser === "Efsun" && (
                    <div className={`w-[320px] p-4 rounded-2xl border backdrop-blur-sm transition-colors ${roomMode === 'trip' ? 'bg-black/20 border-white/10' : 'bg-white/50 border-primary/20'}`}>
                       <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Reels Linki..." className="w-full bg-transparent border-b border-current/20 pb-2 mb-3 text-sm outline-none text-current" />
                       <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="İğneleyici notun..." className="w-full bg-transparent border-b border-current/20 pb-2 mb-3 text-sm outline-none text-current" />
                       <button onClick={handleAddReel} className="w-full py-2 bg-[#8B5A2B] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#6b4420]">İğnele</button>
                    </div>
                  )}
                  <div className="relative">
                    <button onClick={() => setConfirmTrash(true)} className={`w-20 h-24 rounded-b-2xl rounded-t-sm border-4 flex flex-col items-center justify-start pt-2 transition-all hover:scale-105 ${roomMode === 'trip' ? 'bg-[#0f172a] border-white/20' : 'bg-[#D4A373] border-[#8B5A2B]'}`}>
                       <div className={`w-24 h-3 absolute -top-3 rounded-sm ${roomMode === 'trip' ? 'bg-white/20' : 'bg-[#8B5A2B]'}`}></div>
                       <span className="text-3xl mt-2 opacity-50">🗑️</span>
                    </button>
                    {confirmTrash && (
                       <div className="absolute bottom-full right-0 mb-4 bg-white border-2 border-red-500 p-4 rounded-2xl shadow-xl w-48 text-center z-50">
                          <p className="text-xs font-bold text-black mb-3">Tüm tripleri çöpe at?</p>
                          <div className="flex gap-2">
                             <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-gray-200 text-black rounded-md text-[10px] py-1">Vazgeç</button>
                             <button onClick={emptyTrash} className="flex-1 bg-red-500 text-white rounded-md text-[10px] font-bold py-1">At</button>
                          </div>
                       </div>
                    )}
                  </div>
               </div>
            </div>
         </div>

         {/* 5. ARKA DUVAR (Pencere ve Masanın Tamamı) */}
         <div 
            className={`absolute inset-0 transition-colors duration-1000 flex flex-col items-center justify-center ${roomMode === 'trip' ? 'bg-[#334155]' : 'bg-[#FFF5E4]'}`}
            style={{ transform: `translateZ(-${roomDepth}px)`, transformStyle: 'preserve-3d' }}
         >
            <div className="absolute bottom-0 w-full h-12 bg-black/20 z-0"></div>
            
            {/* ARKA DUVARDAKİ PENCERE */}
            <div className={`absolute top-10 w-[500px] h-[550px] border-[24px] rounded-t-full shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-1000 ${roomMode === 'trip' ? 'border-[#0f172a]' : 'border-white'}`}>
                <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
                   <img src="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop" alt="Rain" className="w-full h-full object-cover blur-[2px] brightness-50" />
                   <div className="absolute inset-0 bg-white/5 backdrop-blur-[4px] flex items-center justify-center">
                      <span className="text-white/20 text-xs tracking-[8px] uppercase font-bold text-center">Soğuk ve<br/>Buğulu</span>
                   </div>
                </div>
                
                <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
                   <img src="https://images.unsplash.com/photo-1590419690008-905895e8fd0d?q=80&w=1000&auto=format&fit=crop" alt="Sun" className="w-full h-full object-cover brightness-110" />
                   <div className="absolute inset-0 bg-yellow-400/20 mix-blend-overlay pointer-events-none"></div>
                </div>

                <div className={`absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-[#0f172a]' : 'bg-white'}`}></div>
                <div className={`absolute top-[60%] left-0 right-0 h-4 -translate-y-1/2 transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-[#0f172a]' : 'bg-white'}`}></div>
            </div>

            {/* 🔥 YENİ, GÖRÜNÜR VE FİZİKSEL MASA 🔥 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] z-30 flex flex-col items-center">
               
               {/* Masanın Üst Yüzeyi (Derinlik Hissi) */}
               <div 
                  className="w-[900px] h-[250px] bg-[#5C4033] border-[6px] border-[#3E2723] rounded-t-[40px] shadow-[inset_0_50px_100px_rgba(0,0,0,0.8)] relative"
                  style={{ transform: 'perspective(800px) rotateX(45deg)', transformOrigin: 'bottom' }}
               >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-60 rounded-t-[34px]"></div>
               </div>

               {/* Masanın Ön Kalınlığı ve Çekmece */}
               <div className="w-[1000px] h-[150px] bg-[#3A2518] shadow-[0_30px_50px_rgba(0,0,0,0.9)] rounded-b-2xl flex items-center justify-center border-t border-black/40 z-20 -mt-1 relative">
                  <div className="w-[500px] h-[60px] bg-[#2A1B12] rounded-lg shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center border border-black/30">
                     <div className="w-40 h-3 bg-black/60 rounded-full shadow-[0_2px_4px_rgba(255,255,255,0.1)]"></div>
                  </div>
               </div>

               {/* --- OBJELER (Masanın Üzerine Sabitlenmiş 3D Grafikler) --- */}
               <div className="absolute top-[30px] left-0 w-full h-full pointer-events-none flex justify-around px-20 z-30">
                  
                  {/* Tavşan */}
                  <div onClick={handleBunnyClick} className={`pointer-events-auto cursor-pointer w-40 h-40 transition-transform duration-300 ${bunnyBounce ? '-translate-y-12 scale-110' : 'hover:scale-105'} self-end mb-[120px]`}>
                      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit.png" alt="Tavşan" className="w-full h-full object-contain drop-shadow-[0_20px_15px_rgba(0,0,0,0.6)]" />
                  </div>

                  {/* Çiçek */}
                  <div className="w-32 h-32 self-end mb-[160px]">
                      {roomMode === 'trip' ? (
                          <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Wilted%20Flower.png" alt="Solgun Çiçek" className="w-full h-full object-contain drop-shadow-[0_15px_10px_rgba(0,0,0,0.5)]" />
                      ) : (
                          <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Blossom.png" alt="Canlı Çiçek" className="w-full h-full object-contain drop-shadow-[0_15px_10px_rgba(0,0,0,0.5)]" />
                      )}
                  </div>

                  {/* Kahve ve Buhar */}
                  <div onClick={handleCoffeeClick} className="pointer-events-auto cursor-pointer w-32 h-32 self-end mb-[130px] relative group">
                      {roomMode === 'trip' && coffeeClickCount < 5 && (
                         <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-2 opacity-70 pointer-events-none">
                            <div className="w-2 h-12 bg-white/60 blur-md rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-16 bg-white/60 blur-md rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-10 bg-white/60 blur-md rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                         </div>
                      )}
                      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hot%20Beverage.png" alt="Kahve" className="w-full h-full object-contain drop-shadow-[0_20px_15px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform" />
                  </div>

                  {/* Gerçekçi Polaroid Çerçeve */}
                  <div className="pointer-events-auto w-[160px] h-[200px] self-end mb-[140px] transition-all duration-1000 ease-in-out cursor-pointer"
                       style={{ 
                          transform: roomMode === 'trip' ? 'perspective(500px) rotateX(60deg) rotateZ(-10deg) translateY(40px)' : 'perspective(500px) rotateX(10deg) rotateZ(5deg)'
                       }}
                  >
                      {/* Trip Modundayken Arkası Gözüken Kilitli Kısım */}
                      <div className={`absolute inset-0 bg-[#E5E5E5] flex flex-col items-center justify-center transition-opacity duration-700 border-4 border-gray-300 rounded-sm shadow-2xl ${roomMode === 'trip' ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}>
                         <span className="text-4xl opacity-50 drop-shadow-md">🔒</span>
                         <span className="text-gray-500 text-[10px] font-bold mt-2 uppercase tracking-widest">Kilitli Anı</span>
                      </div>
                      
                      {/* Barışınca Gözüken Ön Yüz */}
                      <div className="absolute inset-0 bg-white p-3 pb-12 shadow-[0_20px_30px_rgba(0,0,0,0.6)] border border-gray-200">
                         <div className="w-full h-full bg-gray-200 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="Mutlu Anı" />
                            <div className="absolute bottom-2 right-2 text-white/90 font-serif text-[10px] italic drop-shadow-md">E & E</div>
                         </div>
                         <div className="absolute bottom-4 left-0 w-full text-center">
                            <span className="font-serif text-[#3E2723] text-sm italic font-bold">Seninle her an... 🤍</span>
                         </div>
                      </div>
                  </div>

               </div>
            </div>

         </div>
      </div>
    </main>
  );
}