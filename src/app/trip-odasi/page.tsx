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
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-[#0f0f1a] flex flex-col items-center justify-center font-sans">
      
      {/* ÜST ARAYÜZ (GÜVERCİN VE MOD) */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-[200] pointer-events-auto">
        <Link href="/home" onClick={() => playSound("click")} className="px-5 py-2.5 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors shadow-lg">
          ← Odadan Çık
        </Link>
        
        <div className="flex items-center gap-3">
          {currentUser === "Emircan" && roomMode === 'trip' && !pigeonActive && (
             <button onClick={() => setIsWritingNote(true)} className="px-5 py-2.5 bg-pink-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.5)] animate-pulse hover:bg-pink-600 border border-pink-400">
               Gönül Al 🕊️
             </button>
          )}
          <div className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md border shadow-lg ${roomMode === 'trip' ? 'bg-black/50 text-indigo-300 border-indigo-500/30' : 'bg-white/50 text-pink-600 border-pink-400/50'}`}>
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
      {/* 🏰 CSS İLE ÇİZİLMİŞ GERÇEK PRENSES/GAMER ODASI */}
      {/* ============================================================================== */}
      <div className="relative w-full max-w-[1200px] h-[750px] bg-gradient-to-b from-[#fdf2f8] to-[#fbcfe8] rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border-[12px] border-[#3E2723]">
         
         {/* 1. DUVARLAR VE ZEMİN (PARKE) */}
         {/* Duvar Kağıdı Çizgileri */}
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/vertical-cloth.png')]"></div>
         
         {/* Ahşap Zemin */}
         <div className="absolute bottom-0 w-full h-[250px] bg-[#D4A373] border-t-8 border-[#B5835A] shadow-[inset_0_20px_50px_rgba(0,0,0,0.2)] flex items-start justify-center overflow-hidden">
            <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
         </div>

         {/* Pofuduk Pembe Halı */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[160px] bg-[#fff0f5] rounded-[100px] blur-sm shadow-xl opacity-90 border-4 border-white/50"></div>


         {/* 2. ORTA DUVAR: PENCERE */}
         <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[280px] h-[350px] bg-[#87CEEB] border-[16px] border-white rounded-t-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden">
            {/* Dışarıdaki Manzara (Trip/Barışık) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
               <img src="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1000&auto=format&fit=crop" alt="Rain" className="w-full h-full object-cover blur-[2px] brightness-50" />
               <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
            </div>
            <div className={`absolute inset-0 transition-opacity duration-1000 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
               <img src="https://images.unsplash.com/photo-1590419690008-905895e8fd0d?q=80&w=1000&auto=format&fit=crop" alt="Sun" className="w-full h-full object-cover brightness-110" />
            </div>
            {/* Pencere Çıtaları */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-3 bg-white"></div>
            <div className="absolute top-[60%] left-0 right-0 h-3 -translate-y-1/2 bg-white"></div>
         </div>


         {/* 3. SOL TARAF: PRENSES YATAĞI VE KİTAPLIK */}
         {/* Duvar Kitaplığı */}
         <div className="absolute top-16 left-16 w-[160px] h-[120px]">
            <div className="absolute bottom-0 w-full h-4 bg-white rounded-sm shadow-md"></div>
            {/* Kitaplar */}
            <div className="absolute bottom-4 left-4 w-6 h-20 bg-pink-400 rounded-t-sm shadow-sm rotate-[-5deg]"></div>
            <div className="absolute bottom-4 left-12 w-8 h-24 bg-purple-400 rounded-t-sm shadow-sm"></div>
            <div className="absolute bottom-4 left-24 w-5 h-16 bg-blue-300 rounded-t-sm shadow-sm rotate-[10deg]"></div>
            {/* Küçük Saksı */}
            <div className="absolute bottom-4 right-2 w-10 h-10 bg-green-500 rounded-full blur-[2px]"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 bg-[#8B5A2B] rounded-b-md"></div>
         </div>

         {/* Yatak */}
         <div className="absolute bottom-[80px] left-10 w-[300px] h-[220px]">
            {/* Yatak Başlığı */}
            <div className="absolute bottom-0 left-0 w-[80px] h-[220px] bg-pink-300 rounded-t-full shadow-lg border-4 border-pink-400"></div>
            {/* Yatak Kasası ve Yatak */}
            <div className="absolute bottom-0 left-10 w-[260px] h-[100px] bg-white rounded-r-3xl shadow-xl border-b-8 border-gray-200"></div>
            {/* Pofuduk Pembe Yorgan */}
            <div className="absolute bottom-0 left-[60px] w-[220px] h-[110px] bg-pink-400 rounded-tl-3xl rounded-r-3xl shadow-[0_10px_20px_rgba(236,72,153,0.4)]"></div>
            {/* Yastıklar */}
            <div className="absolute bottom-[90px] left-[40px] w-[60px] h-[40px] bg-white rounded-2xl shadow-md rotate-[-10deg]"></div>
            <div className="absolute bottom-[80px] left-[70px] w-[60px] h-[40px] bg-pink-100 rounded-2xl shadow-md rotate-[5deg]"></div>
            {/* Yere Düşen Yorgan Ucu */}
            <div className="absolute -bottom-4 right-10 w-[100px] h-[40px] bg-pink-400 rounded-b-3xl transform skew-x-12"></div>
         </div>


         {/* 4. SAĞ TARAF: ÇALIŞMA/GAMER MASASI VE REELS PANOSU */}
         {/* Reels Panosu (Duvarda) */}
         <div className="absolute top-12 right-12 w-[320px] h-[280px] bg-[#D4A373] border-[10px] border-[#8B5A2B] rounded-xl shadow-2xl p-4 overflow-y-auto custom-scrollbar z-20">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 pointer-events-none"></div>
            
            {/* Çöp Kutusu Butonu (Panonun köşesinde) */}
            <button onClick={() => setConfirmTrash(true)} className="absolute -bottom-2 -right-2 w-12 h-14 bg-red-500 rounded-lg shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-30 border-2 border-white" title="Panoyu Temizle">
               <span className="text-xl">🗑️</span>
            </button>
            {confirmTrash && (
               <div className="absolute bottom-12 right-0 bg-white p-3 rounded-xl shadow-xl border-2 border-red-500 z-50 w-40 text-center">
                  <p className="text-[10px] font-bold mb-2">Çöpe at?</p>
                  <div className="flex gap-1">
                     <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-gray-200 rounded text-[9px] py-1 font-bold">İptal</button>
                     <button onClick={emptyTrash} className="flex-1 bg-red-500 text-white rounded text-[9px] py-1 font-bold">At</button>
                  </div>
               </div>
            )}

            {/* Reel Notları */}
            {reels.length === 0 ? (
               <div className="h-full flex items-center justify-center opacity-50 text-[#5C4033] font-bold text-center text-sm">Pano bomboş.</div>
            ) : (
               <div className="flex flex-col gap-3 relative z-10">
                  {reels.map(reel => (
                    <a href={reel.url} target="_blank" rel="noopener noreferrer" key={reel.id} className="block bg-[#FEFAE0] p-3 rounded-lg shadow-md rotate-[-2deg] hover:rotate-1 transition-transform relative border border-[#e6debc]">
                       <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-sm border border-red-800"></div>
                       <p className="font-serif text-[#3E2723] text-xs leading-relaxed mt-1">{reel.note || "Bir video bırakıldı..."}</p>
                    </a>
                  ))}
               </div>
            )}
         </div>

         {/* Reels Ekleme Inputu (Panonun altında duvarda duran not defteri gibi) */}
         {currentUser === "Efsun" && (
            <div className="absolute top-[400px] right-12 w-[320px] bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-md border border-white/50 z-20">
               <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Reels Linki..." className="w-full bg-transparent border-b border-gray-400 pb-1 mb-2 text-xs outline-none text-gray-800" />
               <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="İğneleyici notun..." className="w-full bg-transparent border-b border-gray-400 pb-1 mb-2 text-xs outline-none text-gray-800" />
               <button onClick={handleAddReel} className="w-full py-1.5 bg-[#8B5A2B] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#6b4420]">Panoya İğnele</button>
            </div>
         )}


         {/* MASANIN KENDİSİ */}
         <div className="absolute bottom-[60px] right-10 w-[420px] h-[180px] z-30">
            
            {/* Masa Ayakları */}
            <div className="absolute top-4 left-4 w-4 h-[176px] bg-gray-300 rounded-b-md shadow-lg border-r border-gray-400"></div>
            <div className="absolute top-4 right-4 w-4 h-[176px] bg-gray-300 rounded-b-md shadow-lg border-l border-gray-400"></div>
            
            {/* Masa Üst Yüzeyi */}
            <div className="absolute top-0 left-0 w-full h-[24px] bg-white rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.2)] border-b-4 border-gray-200"></div>
            
            {/* Pembe Gamer Koltuğu */}
            <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[100px] h-[140px] z-40">
               {/* Tekerlekler ve Ayak */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-10 bg-gray-800"></div>
               <div className="absolute bottom-0 left-2 w-20 h-2 bg-gray-600 rounded-full"></div>
               {/* Oturak ve Sırtlık */}
               <div className="absolute bottom-10 left-0 w-full h-8 bg-pink-500 rounded-full shadow-lg border-b-4 border-pink-700"></div>
               <div className="absolute bottom-14 left-2 w-[84px] h-[100px] bg-pink-400 rounded-t-3xl shadow-inner border-4 border-pink-500"></div>
            </div>

            {/* BİLGİSAYAR EKRANI (İçinde Spotify Var!) */}
            <div className={`absolute bottom-[24px] left-1/2 -translate-x-1/2 w-[280px] h-[200px] bg-gray-900 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-[8px] border-gray-800 flex flex-col transition-colors duration-1000 ${roomMode === 'trip' ? 'shadow-red-500/20' : 'shadow-pink-500/20'}`}>
               
               {/* Monitör Ayaklığı */}
               <div className="absolute -bottom-[32px] left-1/2 -translate-x-1/2 w-10 h-[24px] bg-gray-700"></div>
               <div className="absolute -bottom-[32px] left-1/2 -translate-x-1/2 w-[100px] h-[8px] bg-gray-600 rounded-t-md"></div>

               {/* Ekranın İçi (Spotify) */}
               <div className="flex-1 w-full h-full bg-[#020617] relative overflow-hidden flex items-center justify-center">
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
                      <p className="text-[9px] font-bold tracking-widest uppercase text-white/40">Şarkı Bekleniyor...</p>
                    </div>
                  )}
               </div>

               {/* Spotify Link Ekleme Inputu (PC'nin altına açılır) */}
               {currentUser === "Efsun" && !spotifyUrl && (
                  <div className="absolute top-[105%] left-0 w-full flex gap-1 z-50">
                     <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify linki..." className="flex-1 bg-white border border-gray-300 rounded p-1 text-[9px] outline-none text-black" />
                     <button onClick={handleSpotifySubmit} className="bg-green-500 text-white px-2 rounded text-[9px] font-bold">Çal</button>
                  </div>
               )}
            </div>

            {/* MASANIN ÜSTÜNDEKİ EŞYALAR (Tavşan, Kahve, Çiçek, Çerçeve) */}
            
            {/* Tavşan 🐰 */}
            <div onClick={handleBunnyClick} className={`absolute bottom-[24px] left-4 w-16 h-16 cursor-pointer transition-transform duration-300 z-30 ${bunnyBounce ? '-translate-y-8 scale-110' : 'hover:scale-105'}`} title="Stres Tavşanı">
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit.png" alt="Tavşan" className="w-full h-full object-contain drop-shadow-md" />
            </div>

            {/* Çiçek 🌸 */}
            <div className="absolute bottom-[24px] right-[70px] w-12 h-12 z-30 pointer-events-none">
               {roomMode === 'trip' ? (
                   <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Wilted%20Flower.png" alt="Solgun Çiçek" className="w-full h-full object-contain drop-shadow-md" />
               ) : (
                   <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Blossom.png" alt="Canlı Çiçek" className="w-full h-full object-contain drop-shadow-md" />
               )}
            </div>

            {/* Kahve ☕ */}
            <div onClick={handleCoffeeClick} className="absolute bottom-[20px] right-2 w-14 h-14 cursor-pointer group z-30" title="Kahve">
               {roomMode === 'trip' && coffeeClickCount < 5 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 opacity-60 pointer-events-none">
                     <div className="w-1 h-6 bg-white/80 blur-[2px] rounded-full animate-pulse"></div>
                     <div className="w-1 h-8 bg-white/80 blur-[2px] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
               )}
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Hot%20Beverage.png" alt="Kahve" className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform" />
            </div>

            {/* Çerçeve 🖼️ */}
            <div className={`absolute bottom-[24px] left-[70px] w-[50px] h-[65px] transition-all duration-1000 ease-in-out border-2 shadow-lg z-30 ${roomMode === 'trip' ? 'bg-gray-300 border-gray-400 rotate-x-[60deg] skew-x-12 translate-y-2 opacity-80' : 'bg-white border-gray-200 -rotate-6'}`}>
               {roomMode === 'trip' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-xl opacity-50 drop-shadow-sm">🔒</span>
                  </div>
               ) : (
                  <div className="absolute inset-0 p-1 pb-4">
                     <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-sm border border-gray-200" alt="Mutlu Anı" />
                     <div className="absolute bottom-0 left-0 w-full text-center">
                        <span className="font-serif text-[#3E2723] text-[6px] italic font-bold">E&E🤍</span>
                     </div>
                  </div>
               )}
            </div>

            {/* Klavye (Masanın üstünde çizim) */}
            <div className="absolute bottom-[28px] left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-gray-200 rounded-md border border-gray-300 shadow-sm flex items-center justify-center rotate-x-[40deg]">
               <div className="w-[110px] h-[20px] bg-gray-300 rounded grid grid-cols-6 gap-0.5 p-0.5 opacity-50">
                  {/* Klavye tuşu hissiyatı */}
                  {[...Array(18)].map((_, i) => <div key={i} className="bg-white rounded-[1px]"></div>)}
               </div>
            </div>

         </div>


         {/* ============================================================================== */}
         {/* 🌧️ ODA IŞIKLANDIRMASI (TRİP / BARIŞMA MODU FİLTRESİ) */}
         {/* ============================================================================== */}
         <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-50 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-blue-950/40 mix-blend-multiply"></div>
            {/* CSS Yağmur Çizgileri */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-screen animate-pulse"></div>
         </div>

         <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-50 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-orange-300/10 mix-blend-overlay"></div>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-200/20 blur-[100px] rounded-full"></div>
         </div>

      </div>

    </main>
  );
}