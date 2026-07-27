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
  
  const [bunnyBounce, setBunnyBounce] = useState(false);
  const [coffeeClickCount, setCoffeeClickCount] = useState(0);

  // 2.5D Paralaks (Fare takibi)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // Paralaks Efekti Hesaplaması
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20; 
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const x = (touch.clientX / window.innerWidth - 0.5) * 30; 
    const y = (touch.clientY / window.innerHeight - 0.5) * 30;
    setMousePosition({ x, y });
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

  return (
    <main 
      className="fixed inset-0 w-full h-full overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* --- ARAYÜZ (ODANIN DIŞINDA, EKRANA SABİT) --- */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-[200] pointer-events-auto">
        <Link href="/home" onClick={() => playSound("click")} className="px-4 py-2 bg-black/40 text-white rounded-xl font-bold backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
          ← Odadan Çık
        </Link>
        
        <div className="flex items-center gap-3">
          {currentUser === "Emircan" && roomMode === 'trip' && !pigeonActive && (
             <button onClick={() => setIsWritingNote(true)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg animate-pulse hover:bg-red-700 transition-colors border border-red-400">
               Gönül Al 🕊️
             </button>
          )}
          <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border backdrop-blur-md ${roomMode === 'trip' ? 'bg-black/80 text-red-400 border-red-500/50' : 'bg-white/80 text-green-700 border-green-500/50'}`}>
             {roomMode === 'trip' ? 'TRİP MODU ⛈️' : 'BARIŞILDI ☀️'}
          </div>
        </div>
      </div>

      {/* --- GÜVERCİN VE MODALLAR --- */}
      {pigeonActive && (
         <div className="absolute inset-0 z-[150] pointer-events-none flex items-center justify-center">
            <div onClick={() => currentUser === 'Efsun' && setIsReadingNote(true)} className={`pointer-events-auto cursor-pointer animate-bounce absolute top-1/4 bg-white/90 backdrop-blur-md border-2 border-pink-400 p-6 rounded-[40px] shadow-[0_0_50px_rgba(255,105,180,0.5)] flex items-center gap-4 hover:scale-110 transition-transform`}>
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
            <div className="bg-white p-6 rounded-[32px] max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-pink-200">
               <h3 className="text-lg font-black text-pink-600 uppercase tracking-widest text-center">Gönül Alma Notu</h3>
               <textarea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Prensesin gönlünü alacak tatlı bir şeyler yaz..." className="w-full h-32 bg-pink-50 border border-pink-200 rounded-2xl p-3 text-sm text-gray-800 outline-none resize-none font-medium"></textarea>
               <div className="flex gap-2">
                  <button onClick={() => setIsWritingNote(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200">İptal</button>
                  <button onClick={sendPigeon} className="flex-1 py-3 bg-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-pink-600">Güvercini Sal 🕊️</button>
               </div>
            </div>
         </div>
      )}

      {isReadingNote && (
         <div className="fixed inset-0 z-[160] bg-black/80 flex items-center justify-center p-4 animate-in zoom-in-95">
            <div className="bg-[#FFF0F5] border-4 border-pink-300 p-8 rounded-2xl max-w-md w-full shadow-2xl relative text-gray-800 font-serif">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs">❤️</div>
               <span className="text-4xl text-pink-300 block mb-2">"</span>
               <p className="text-base leading-relaxed mb-6 font-medium whitespace-pre-wrap">{peaceMessage}</p>
               <div className="text-right text-sm italic text-pink-600 font-bold mb-6">- Emircan</div>
               <div className="flex gap-3 font-sans">
                  <button onClick={() => setIsReadingNote(false)} className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-400">Hala Tripliyim ⛈️</button>
                  <button onClick={acceptPeace} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-green-600">Affettim (Güneş Açsın) ☀️</button>
               </div>
            </div>
         </div>
      )}

      {/* ============================================================================== */}
      {/* 🏡 GERÇEK PRENSES ODASI (Arka Plan ve Hava Durumu) */}
      {/* ============================================================================== */}
      
      {/* Odanın Fotoğrafı (Paralaks ile hareket eder) */}
      <div 
         className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-transform duration-75 ease-out z-0"
         style={{
            // Harika bir aesthetic, kitaplık, bilgisayar masası, loş yatak odası görseli
            backgroundImage: "url('https://images.unsplash.com/photo-1615876234886-fdba0f5c1b5c?q=80&w=2500&auto=format&fit=crop')",
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) scale(1.05)`
         }}
      >
         {/* TRİP MODU: Karanlık Filtre ve Yağmur Efekti */}
         <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-blue-950/70 mix-blend-multiply"></div>
            {/* Şık ve kasmayan CSS/GIF yağmur efekti */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://media.giphy.com/media/Il9f7ZhytEiI0/giphy.gif')] bg-cover mix-blend-screen pointer-events-none"></div>
         </div>

         {/* BARIŞMA MODU: Güneşli ve Sıcak Filtre */}
         <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-orange-300/20 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-200/30 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4"></div>
         </div>
      </div>


      {/* ============================================================================== */}
      {/* 💻 ETKİLEŞİMLİ ARAYÜZLER (Odanın Üstünde Süzülen Şık Paneller) */}
      {/* ============================================================================== */}
      <div className="absolute inset-0 z-10 p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between pointer-events-none">
         
         {/* SOL PANEL: SPOTIFY LAF SOKMA KÖŞESİ (Glassmorphism) */}
         <div className={`pointer-events-auto w-full md:w-[350px] mb-6 md:mb-0 rounded-3xl backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-1000 p-6 ${roomMode === 'trip' ? 'bg-black/60' : 'bg-white/40'}`}>
            <h3 className={`font-black uppercase tracking-widest text-center text-sm mb-4 transition-colors duration-1000 ${roomMode === 'trip' ? 'text-red-400' : 'text-pink-600'}`}>
               {roomMode === 'trip' ? "Laf Sokma Köşesi" : "Günün Şarkısı"}
            </h3>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/30 flex items-center justify-center relative shadow-inner">
               {spotifyUrl ? (
                 <>
                   <iframe src={getEmbedUrl(spotifyUrl)} width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                   {currentUser === "Efsun" && (
                      <button onClick={clearSpotify} className="absolute -top-2 -right-2 w-10 h-10 bg-red-600 text-white rounded-full font-bold shadow-lg flex items-center justify-center hover:scale-110 border-2 border-white">X</button>
                   )}
                 </>
               ) : (
                 <div className="text-center p-4">
                   <span className="text-5xl block mb-2 opacity-50">🎧</span>
                   <p className={`text-xs font-bold tracking-widest uppercase ${roomMode === 'trip' ? 'text-white/50' : 'text-black/50'}`}>Şarkı Asılmadı</p>
                 </div>
               )}
            </div>
            {currentUser === "Efsun" && !spotifyUrl && (
               <div className="mt-5 flex flex-col gap-3">
                  <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify linki..." className={`w-full border rounded-xl p-3 text-sm outline-none transition-colors ${roomMode === 'trip' ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-pink-200 text-black'}`} />
                  <button onClick={handleSpotifySubmit} className="w-full bg-pink-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-pink-600 shadow-md">Duvarda Çal</button>
               </div>
            )}
         </div>

         {/* SAĞ PANEL: REELS PANOSU VE ÇÖP KUTUSU (Mantar Pano Görünümlü) */}
         <div className="pointer-events-auto w-full md:w-[400px] flex flex-col items-center">
            
            <div className="w-full h-[450px] bg-[#D4A373] border-[12px] border-[#8B5A2B] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative p-5 overflow-y-auto custom-scrollbar">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 pointer-events-none"></div>
               {reels.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-50 text-[#5C4033] font-bold text-center text-lg">Pano bomboş.</div>
               ) : (
                  <div className="flex flex-col gap-4 relative z-10">
                     {reels.map(reel => (
                       <a href={reel.url} target="_blank" rel="noopener noreferrer" key={reel.id} className="block bg-[#FEFAE0] p-4 rounded-xl shadow-lg rotate-[-1deg] hover:rotate-1 transition-transform relative group border border-[#e6debc]">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full shadow-sm border-2 border-red-800"></div>
                          <p className="font-serif text-[#3E2723] text-sm leading-relaxed mt-2">{reel.note || "Bir video bırakıldı..."}</p>
                       </a>
                     ))}
                  </div>
               )}
            </div>

            <div className="mt-6 w-full flex justify-between items-end gap-4">
               {currentUser === "Efsun" && (
                 <div className={`flex-1 p-4 rounded-2xl backdrop-blur-xl border transition-colors shadow-lg ${roomMode === 'trip' ? 'bg-black/60 border-white/10' : 'bg-white/60 border-pink-200'}`}>
                    <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Reels Linki..." className={`w-full bg-transparent border-b pb-2 mb-3 text-sm outline-none ${roomMode === 'trip' ? 'border-white/20 text-white' : 'border-black/20 text-black'}`} />
                    <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="İğneleyici notun..." className={`w-full bg-transparent border-b pb-2 mb-4 text-sm outline-none ${roomMode === 'trip' ? 'border-white/20 text-white' : 'border-black/20 text-black'}`} />
                    <button onClick={handleAddReel} className="w-full py-2.5 bg-[#8B5A2B] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#6b4420] shadow-md">İğnele</button>
                 </div>
               )}
               
               <div className="relative">
                 <button onClick={() => setConfirmTrash(true)} className={`w-20 h-24 rounded-b-2xl rounded-t-sm border-4 flex flex-col items-center justify-start pt-2 transition-all hover:scale-105 shadow-xl ${roomMode === 'trip' ? 'bg-[#0f172a] border-white/20' : 'bg-[#D4A373] border-[#8B5A2B]'}`}>
                    <div className={`w-24 h-4 absolute -top-4 rounded-sm ${roomMode === 'trip' ? 'bg-white/20' : 'bg-[#8B5A2B]'}`}></div>
                    <span className="text-4xl mt-3 opacity-50 drop-shadow-md">🗑️</span>
                 </button>
                 {confirmTrash && (
                    <div className="absolute bottom-full right-0 mb-4 bg-white border-2 border-red-500 p-5 rounded-2xl shadow-2xl w-56 text-center z-50">
                       <p className="text-xs font-bold text-black mb-4">Tüm tripleri çöpe atıp panoyu temizle?</p>
                       <div className="flex gap-2">
                          <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-gray-200 text-black rounded-xl text-xs py-2 font-bold hover:bg-gray-300">Vazgeç</button>
                          <button onClick={emptyTrash} className="flex-1 bg-red-500 text-white rounded-xl text-xs py-2 font-bold hover:bg-red-600 shadow-md">Çöpe At</button>
                       </div>
                    </div>
                 )}
               </div>
            </div>
         </div>

      </div>

      {/* ============================================================================== */}
      {/* 🧸 ALT PANEL: MASADAKİ OBJELER (Ekranda Altta Sabit Duran Objeler) */}
      {/* ============================================================================== */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-end gap-6 md:gap-12 bg-black/20 backdrop-blur-md border border-white/10 px-8 py-4 rounded-[40px] shadow-2xl">
          
          {/* Tavşan */}
          <div onClick={handleBunnyClick} className={`w-20 h-20 md:w-28 md:h-28 cursor-pointer transition-transform duration-300 ${bunnyBounce ? '-translate-y-8 scale-110' : 'hover:scale-105'}`}>
             <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit.png" alt="Tavşan" className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
          </div>

          {/* Çiçek */}
          <div className="w-16 h-16 md:w-24 md:h-24 pointer-events-none">
             {roomMode === 'trip' ? (
                 <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Wilted%20Flower.png" alt="Solgun Çiçek" className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
             ) : (
                 <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Blossom.png" alt="Canlı Çiçek" className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
             )}
          </div>

          {/* Kahve */}
          <div onClick={handleCoffeeClick} className="w-16 h-16 md:w-24 md:h-24 cursor-pointer relative group">
             {roomMode === 'trip' && coffeeClickCount < 5 && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-60 pointer-events-none">
                   <div className="w-1 h-8 bg-white/70 blur-sm rounded-full animate-pulse"></div>
                   <div className="w-1 h-12 bg-white/70 blur-sm rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-1 h-6 bg-white/70 blur-sm rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
             )}
             <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hot%20Beverage.png" alt="Kahve" className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform" />
          </div>

          {/* Anı Çerçevesi */}
          <div className={`w-[80px] h-[100px] md:w-[100px] md:h-[130px] transition-all duration-1000 ease-in-out border-2 shadow-2xl relative ${roomMode === 'trip' ? 'bg-gray-300 border-gray-400 rotate-12 translate-y-2 opacity-80' : 'bg-white border-gray-200 -rotate-3'}`}>
             {roomMode === 'trip' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-2xl opacity-50 drop-shadow-sm">🔒</span>
                </div>
             ) : (
                <div className="absolute inset-0 p-1.5 pb-6">
                   <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-sm border border-gray-200" alt="Mutlu Anı" />
                   <div className="absolute bottom-1 left-0 w-full text-center">
                      <span className="font-serif text-[#3E2723] text-[9px] italic font-bold">Seninle her an... 🤍</span>
                   </div>
                </div>
             )}
          </div>

      </div>
    </main>
  );
}