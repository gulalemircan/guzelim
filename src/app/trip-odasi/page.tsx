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
  
  // YENİ: Peluşa vurma animasyonu state'i
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

  // YENİ: Peluşa vurma fonksiyonu
  const hitPlush = () => {
    if (roomMode === 'trip') {
      playSound("click"); // Vurma efekti (tokat/gıcırdama gibi bir ses de koyabilirsin)
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

  if (isLoading) return <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-pink-300 animate-pulse font-bold">Prensesin Odasına Giriliyor...</div>;

  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-black flex flex-col items-center justify-center font-sans">
      
      {/* ÜST ARAYÜZ (GÜVERCİN VE MOD) */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-[200] pointer-events-auto">
        <Link href="/home" onClick={() => playSound("click")} className="px-5 py-2.5 bg-black/40 text-white rounded-2xl font-bold backdrop-blur-md border border-white/20 hover:bg-black/60 transition-colors shadow-lg">
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
      {/* 🏡 YENİ VE GERÇEKÇİ 2.5D ODA TASARIMI */}
      {/* ============================================================================== */}
      
      {/* Odayı yatayda sığdırmak için responsive container (Mobilde scroll edilebilir veya scale edilebilir) */}
      <div className="relative w-full max-w-[1200px] h-full lg:h-[800px] min-h-[600px] bg-[#EAE3E3] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-auto overflow-y-hidden lg:overflow-hidden flex-shrink-0" style={{ perspective: '1000px' }}>
         
         <div className="absolute top-0 left-0 w-[1200px] h-full relative">
            
            {/* 1. ARKA PLAN: Duvar Çıtaları (Paneling) ve Işık */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#EFE8E8] to-[#E3DBD7] z-0"></div>
            {/* Duvar Panelleri (Klasik Görünüm) */}
            <div className="absolute top-10 left-[2%] w-[25%] h-[60%] border-2 border-white/50 rounded-sm shadow-[1px_1px_3px_rgba(0,0,0,0.05)] z-0"></div>
            <div className="absolute top-10 left-[30%] w-[35%] h-[60%] border-2 border-white/50 rounded-sm shadow-[1px_1px_3px_rgba(0,0,0,0.05)] z-0"></div>
            <div className="absolute top-10 right-[2%] w-[30%] h-[60%] border-2 border-white/50 rounded-sm shadow-[1px_1px_3px_rgba(0,0,0,0.05)] z-0"></div>

            {/* Süpürgelik (Baseboard) */}
            <div className="absolute bottom-[20%] w-full h-[4%] bg-white border-t border-gray-200 shadow-sm z-0"></div>

            {/* Ahşap Parke Zemin */}
            <div className="absolute bottom-0 w-full h-[20%] bg-[#D5BCA4] shadow-[inset_0_20px_50px_rgba(0,0,0,0.1)] z-0 overflow-hidden" style={{ transform: 'rotateX(20deg)', transformOrigin: 'bottom' }}>
                <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            </div>

            {/* Pembe Halı */}
            <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[60%] h-[12%] bg-[#FCE4EC] rounded-full blur-[2px] shadow-lg border-2 border-white/40 z-10 opacity-90"></div>


            {/* ========================================= */}
            {/* 2. SOL BÖLGE: SPOTIFY LAF SOKMA DUVARI */}
            {/* ========================================= */}
            <div className="absolute bottom-[25%] left-[5%] w-[25%] h-[60%] bg-white rounded-t-xl shadow-[5px_10px_30px_rgba(0,0,0,0.15)] flex flex-col items-center border border-gray-100 z-20">
               {/* Duvarın/Dolabın Taç Kısmı */}
               <div className="w-[105%] h-6 bg-[#f8f8f8] absolute -top-3 rounded-t-md shadow-sm border-b border-gray-200"></div>
               
               <h3 className="mt-8 text-primary font-bold text-xs uppercase tracking-widest text-center border-b border-primary/20 pb-2 w-[80%]">
                 Ruh Halim
               </h3>

               {/* Spotify Ekranı */}
               <div className={`mt-4 w-[85%] h-[60%] bg-[#121212] rounded-xl shadow-inner border-[4px] border-gray-800 flex flex-col transition-colors duration-1000 ${roomMode === 'trip' ? 'shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'shadow-[0_0_20px_rgba(236,72,153,0.2)]'}`}>
                  <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
                    {spotifyUrl ? (
                      <>
                        <iframe src={getEmbedUrl(spotifyUrl)} width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                        {currentUser === "Efsun" && (
                           <button onClick={clearSpotify} className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold shadow-lg flex items-center justify-center hover:scale-110 z-50">X</button>
                        )}
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl block mb-1 opacity-50">🎵</span>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-white/40">Şarkı Yok</p>
                      </div>
                    )}
                  </div>
               </div>

               {currentUser === "Efsun" && !spotifyUrl && (
                  <div className="mt-4 w-[85%] flex flex-col gap-2">
                     <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify linki..." className="w-full bg-gray-100 border border-gray-300 rounded p-2 text-[10px] outline-none text-black" />
                     <button onClick={handleSpotifySubmit} className="bg-primary text-white p-2 rounded text-[10px] font-bold shadow-md">Duvara As</button>
                  </div>
               )}
            </div>


            {/* ========================================= */}
            {/* 3. ORTA BÖLGE: MANTAR REELS PANOSU */}
            {/* ========================================= */}
            <div className="absolute top-[20%] left-[35%] w-[30%] h-[45%] bg-[#D4A373] border-[12px] border-[#8B5A2B] rounded-sm shadow-2xl p-4 overflow-y-auto custom-scrollbar z-20">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 pointer-events-none"></div>
               
               <button onClick={() => setConfirmTrash(true)} className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-lg shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-30 border-2 border-white" title="Panoyu Temizle">
                  <span className="text-lg">🗑️</span>
               </button>
               
               {confirmTrash && (
                  <div className="absolute bottom-10 right-0 bg-white p-3 rounded-xl shadow-xl border-2 border-red-500 z-50 w-40 text-center">
                     <p className="text-[10px] font-bold mb-2 text-black">Çöpe at?</p>
                     <div className="flex gap-1">
                        <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-gray-200 text-black rounded text-[10px] py-1 font-bold">İptal</button>
                        <button onClick={emptyTrash} className="flex-1 bg-red-500 text-white rounded text-[10px] py-1 font-bold">At</button>
                     </div>
                  </div>
               )}

               {reels.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-50 text-[#5C4033] font-bold text-center text-sm">Pano bomboş.</div>
               ) : (
                  <div className="flex flex-col gap-3 relative z-10">
                     {reels.map(reel => (
                       <a href={reel.url} target="_blank" rel="noopener noreferrer" key={reel.id} className="block bg-[#FEFAE0] p-3 rounded-sm shadow-md rotate-[-2deg] hover:rotate-1 transition-transform relative border border-[#e6debc]">
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm border border-red-800"></div>
                          <p className="font-serif text-[#3E2723] text-xs leading-relaxed mt-1">{reel.note || "Bir video bırakıldı..."}</p>
                       </a>
                     ))}
                  </div>
               )}
            </div>

            {/* Reels Ekleme Çekmecesi */}
            {currentUser === "Efsun" && (
               <div className="absolute top-[68%] left-[35%] w-[30%] bg-white/80 backdrop-blur-md p-3 rounded-xl shadow-md border border-white z-20">
                  <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Reels Linki..." className="w-full bg-transparent border-b border-gray-400 pb-1 mb-2 text-[10px] outline-none text-black" />
                  <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="İğneleyici notun..." className="w-full bg-transparent border-b border-gray-400 pb-1 mb-2 text-[10px] outline-none text-black" />
                  <button onClick={handleAddReel} className="w-full py-2 bg-[#8B5A2B] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#6b4420] shadow-sm">Panoya İğnele</button>
               </div>
            )}


            {/* ========================================= */}
            {/* 4. ORTA-SAĞ BÖLGE: PENCERE */}
            {/* ========================================= */}
            <div className="absolute top-[15%] right-[25%] w-[15%] h-[40%] bg-[#87CEEB] border-[10px] border-white rounded-t-full shadow-[inset_0_10px_20px_rgba(0,0,0,0.2)] overflow-hidden z-10">
               {/* Manzaralar */}
               <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
                  <img src="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop" alt="Rain" className="w-full h-full object-cover brightness-50" />
                  <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
               </div>
               <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
                  <img src="https://images.unsplash.com/photo-1590419690008-905895e8fd0d?q=80&w=1000&auto=format&fit=crop" alt="Sun" className="w-full h-full object-cover brightness-110" />
               </div>
               
               {/* YENİ: Camdaki Buğu Efekti (Sadece Trip Modunda) */}
               <div className={`absolute inset-0 backdrop-blur-md bg-white/40 transition-opacity duration-1000 pointer-events-none ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}></div>

               {/* Pencere Çıtaları */}
               <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-white"></div>
               <div className="absolute top-[60%] left-0 right-0 h-2 -translate-y-1/2 bg-white"></div>
            </div>


            {/* ========================================= */}
            {/* 5. SAĞ BÖLGE: YATAK VE KOMODİN */}
            {/* ========================================= */}
            
            {/* Yatak Başlığı (Headboard) */}
            <div className="absolute bottom-[20%] right-[2%] w-[22%] h-[35%] bg-[#FCE4EC] border-4 border-white rounded-t-sm shadow-md z-10"></div>
            
            {/* Yatak Gövdesi */}
            <div className="absolute bottom-[10%] right-[2%] w-[22%] h-[15%] bg-white border-b-[6px] border-gray-200 shadow-xl z-20 flex flex-col justify-end">
               {/* Yatak Ayakları */}
               <div className="absolute -bottom-[10px] left-[10%] w-2 h-4 bg-gray-400 rounded-b-sm"></div>
               <div className="absolute -bottom-[10px] right-[10%] w-2 h-4 bg-gray-400 rounded-b-sm"></div>
               
               {/* Pembe Desenli Yorgan (Sarkık) */}
               <div className="w-[105%] h-[80%] bg-[#F8BBD0] -ml-[2.5%] rounded-t-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] relative overflow-hidden">
                   <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')]"></div>
               </div>
            </div>

            {/* Yastıklar */}
            <div className="absolute bottom-[23%] right-[7%] w-[12%] h-[6%] bg-[#F48FB1] rounded-full shadow-md z-30 transform -rotate-3"></div>
            
            {/* Komodin (Nightstand) */}
            <div className="absolute bottom-[10%] right-[25%] w-[10%] h-[15%] bg-[#FCE4EC] border-2 border-white rounded-sm shadow-xl z-20 flex flex-col gap-1 p-1">
               <div className="flex-1 bg-white/50 border border-white rounded-sm flex items-center justify-center">
                  <div className="w-4 h-1 bg-yellow-400/80 rounded-full shadow-sm"></div>
               </div>
               <div className="flex-1 bg-white/50 border border-white rounded-sm flex items-center justify-center">
                  <div className="w-4 h-1 bg-yellow-400/80 rounded-full shadow-sm"></div>
               </div>
            </div>

            {/* KOMODİN ÜSTÜ: Çerçeve ve Kahve Fincanı */}
            {/* Çerçeve 🖼️ */}
            <div className={`absolute bottom-[26%] right-[29%] w-[4%] h-[6%] transition-all duration-1000 ease-in-out border-2 shadow-lg z-30 origin-bottom ${roomMode === 'trip' ? 'bg-gray-300 border-gray-400 rotate-x-[75deg] translate-y-[10px] opacity-80' : 'bg-white border-white -rotate-12'}`}>
               {roomMode === 'trip' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-[10px] opacity-30 drop-shadow-sm transform rotate-180">🔒</span>
                  </div>
               ) : (
                  <div className="absolute inset-0 p-0.5">
                     <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-sm" alt="Mutlu Anı" />
                  </div>
               )}
            </div>

            {/* Kahve Fincanı ☕ */}
            <div className="absolute bottom-[25.5%] right-[26%] w-[3%] h-[4%] z-30">
               {/* YENİ: Trip modunda fincandan çıkan alevler/dumanlar */}
               {roomMode === 'trip' && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none z-40">
                     <div className="w-1 h-4 bg-orange-500 blur-[2px] rounded-full animate-pulse"></div>
                     <div className="w-1 h-5 bg-red-500 blur-[2px] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                     <div className="w-1 h-3 bg-yellow-400 blur-[2px] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
               )}
               <div className="w-full h-full bg-white rounded-b-md rounded-t-sm shadow-md relative">
                   <div className="absolute top-1 -right-1 w-1.5 h-2 border border-gray-300 rounded-full"></div>
               </div>
            </div>


            {/* ========================================= */}
            {/* 6. ZEMİN: PELUŞ OYUNCAK (STRES TAVŞANI) */}
            {/* ========================================= */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes hit-wiggle {
                0% { transform: scale(1) rotate(0deg); }
                20% { transform: scale(0.9) rotate(-15deg); }
                40% { transform: scale(1.1) rotate(15deg); }
                60% { transform: scale(0.95) rotate(-10deg); }
                80% { transform: scale(1.05) rotate(5deg); }
                100% { transform: scale(1) rotate(0deg); }
              }
              .animate-hit {
                animation: hit-wiggle 0.5s ease-in-out;
              }
            `}} />
            
            <div 
              onClick={hitPlush} 
              className={`absolute bottom-[6%] left-[45%] w-[8%] h-[10%] cursor-pointer z-30 transition-transform ${isPlushHit ? 'animate-hit' : 'hover:scale-105'}`} 
              title="Stres Peluşu (Vur!)"
            >
               {/* Peluş ikonu olarak tavşan kullanıldı */}
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit.png" alt="Peluş" className="w-full h-full object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,0.3)]" />
            </div>

            {/* ============================================================================== */}
            {/* 🌧️ ODA IŞIKLANDIRMASI (TRİP / BARIŞMA MODU FİLTRESİ) */}
            {/* ============================================================================== */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-50 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
               <div className="absolute inset-0 bg-[#0f172a]/60 mix-blend-multiply"></div>
               {/* CSS Yağmur Çizgileri */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen animate-pulse"></div>
            </div>

            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-50 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
               <div className="absolute inset-0 bg-yellow-500/5 mix-blend-overlay"></div>
               {/* Güneş Işığı Hüzmesi */}
               <div className="absolute top-[10%] right-[15%] w-[400px] h-[600px] bg-yellow-100/20 blur-[80px] rounded-full transform -rotate-45"></div>
            </div>

         </div>
      </div>

    </main>
  );
}