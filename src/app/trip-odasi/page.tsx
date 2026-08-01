// app/trip-odasi/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/utils/audio";

type ReelNote = { id: string; url: string; note: string };

// Takımyıldızları için sabit koordinatlar (Yıldızların ekranda düzgün dağılması için)
const STAR_COORDS = [
  { x: 15, y: 25 }, { x: 35, y: 55 }, { x: 55, y: 15 }, { x: 75, y: 45 }, { x: 85, y: 75 },
  { x: 25, y: 80 }, { x: 45, y: 85 }, { x: 10, y: 60 }, { x: 65, y: 65 }, { x: 90, y: 20 }
];

export default function AstroTripRoomPage() {
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
  
  // Stres Meteoru State'i
  const [meteorHealth, setMeteorHealth] = useState(5);
  const [meteorHitAnim, setMeteorHitAnim] = useState(false);

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
    playSound("over"); // Karadelik yutma sesi gibi düşün
    setReels([]);
    setConfirmTrash(false);
    updateRoomState({ reels: [] });
  };

  const sendComet = () => {
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

  const hitMeteor = () => {
    if (meteorHealth <= 0) return;
    playSound("click");
    setMeteorHitAnim(true);
    setTimeout(() => setMeteorHitAnim(false), 200);
    
    setMeteorHealth(prev => prev - 1);
    
    if (meteorHealth - 1 === 0) {
        playSound("success"); // Patlama efekti
        setTimeout(() => setMeteorHealth(5), 5000); // 5 saniye sonra meteor yeniden oluşur
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

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-300 animate-pulse font-bold tracking-widest uppercase">Kozmik Ağa Bağlanılıyor...</div>;

  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-black flex flex-col items-center justify-center font-sans text-white">
      
      {/* ============================================================================== */}
      {/* 🌌 ARKA PLAN VE ATMOSFER (TRİP / BARIŞMA) */}
      {/* ============================================================================== */}
      
      {/* Trip Modu: Kızıl/Mor Karanlık Fırtına ve Kara Delik efekti */}
      <div className={`absolute inset-0 transition-opacity duration-1000 z-0 ${roomMode === 'trip' ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3b0718] via-[#0a0005] to-black"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 blur-[100px] rounded-full animate-pulse"></div>
         {/* Hafif statik / fırtına hissi */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-screen"></div>
      </div>

      {/* Barışma Modu: Kuzey Işıkları ve Pırıl Pırıl Yıldızlar */}
      <div className={`absolute inset-0 transition-opacity duration-1000 z-0 ${roomMode === 'peace' ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#07243b] via-[#020010] to-black"></div>
         {/* Aurora Efektleri */}
         <div className="absolute top-[10%] left-[10%] w-[50vw] h-[30vh] bg-green-500/10 blur-[120px] rounded-full transform -rotate-45"></div>
         <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vh] bg-blue-500/10 blur-[120px] rounded-full transform rotate-12"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 mix-blend-screen"></div>
      </div>


      {/* ============================================================================== */}
      {/* 🛸 ÜST ARAYÜZ */}
      {/* ============================================================================== */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-[200] pointer-events-auto">
        <Link href="/home" onClick={() => playSound("click")} className="px-5 py-2.5 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] text-xs uppercase tracking-widest">
          ← Kapsüle Dön
        </Link>
        
        <div className="flex items-center gap-3">
          {currentUser === "Emircan" && roomMode === 'trip' && !pigeonActive && (
             <button onClick={() => setIsWritingNote(true)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.5)] animate-pulse hover:scale-105 border border-purple-400 transition-transform">
               Dilek Yıldızı Gönder 🌠
             </button>
          )}
          <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border shadow-lg transition-colors duration-1000 ${roomMode === 'trip' ? 'bg-red-900/30 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-blue-900/30 text-blue-300 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}>
             {roomMode === 'trip' ? 'FIRINANIN İÇİ ⛈️' : 'HUZUR YÖRÜNGESİ ✨'}
          </div>
        </div>
      </div>


      {/* ============================================================================== */}
      {/* 🌠 MODALLAR VE DİLEK YILDIZI (POSTACI GÜVERCİN) */}
      {/* ============================================================================== */}
      
      {/* Kuyruklu Yıldız Animasyonu */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes comet-fly {
          0% { transform: translate(-10vw, -10vh) rotate(45deg) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translate(50vw, 50vh) rotate(45deg) scale(1.2); opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(110vw, 110vh) rotate(45deg) scale(0.8); opacity: 0; }
        }
        .animate-comet { animation: comet-fly 4s linear infinite; }
      `}} />

      {pigeonActive && (
         <div className="absolute inset-0 z-[150] pointer-events-none overflow-hidden">
            <div 
              onClick={() => currentUser === 'Efsun' && setIsReadingNote(true)} 
              className={`absolute top-0 left-0 pointer-events-auto cursor-pointer animate-comet flex items-center justify-center group`}
            >
               {/* Yıldızın Kendisi ve Işık Kuyruğu */}
               <div className="relative w-12 h-12 flex items-center justify-center z-10 hover:scale-125 transition-transform">
                  <span className="text-4xl drop-shadow-[0_0_20px_rgba(255,255,255,1)]">🌠</span>
                  <div className="absolute -top-10 -left-10 w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-45 blur-[2px] opacity-70"></div>
               </div>
               
               {currentUser === 'Efsun' && (
                 <div className="absolute top-12 whitespace-nowrap bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[8px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    Yakala!
                 </div>
               )}
            </div>
         </div>
      )}

      {isWritingNote && (
         <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0f172a] p-6 rounded-[32px] max-w-sm w-full shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col gap-4 border border-blue-500/30 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
               <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest text-center mt-2">Kozmik Mesaj Gönder</h3>
               <textarea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Yıldızların arasından süzülecek tatlı bir şeyler yaz..." className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none resize-none font-medium focus:border-blue-500/50 transition-colors"></textarea>
               <div className="flex gap-3">
                  <button onClick={() => setIsWritingNote(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-white/50 hover:bg-white/10 transition-colors">İptal</button>
                  <button onClick={sendComet} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:bg-blue-500 transition-colors">Yıldızı Fırlat 🌠</button>
               </div>
            </div>
         </div>
      )}

      {isReadingNote && (
         <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
            <div className="bg-[#0f172a] border border-blue-400/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] relative text-white font-serif overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full"></div>
               
               <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-600 rounded-full border-4 border-[#0f172a] shadow-[0_0_15px_rgba(37,99,235,0.8)] flex items-center justify-center text-white text-sm">✨</div>
               <span className="text-5xl text-blue-400/30 block mb-2 leading-none">"</span>
               <p className="text-sm leading-relaxed mb-6 font-medium whitespace-pre-wrap relative z-10">{peaceMessage}</p>
               <div className="text-right text-xs italic text-blue-300 font-bold mb-8 relative z-10">- Emircan</div>
               <div className="flex gap-3 font-sans relative z-10">
                  <button onClick={() => setIsReadingNote(false)} className="flex-1 py-3 bg-white/5 border border-white/10 text-white/70 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">Karanlıkta Kal ⛈️</button>
                  <button onClick={acceptPeace} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:bg-blue-500 transition-colors">Güneşi Aç ☀️</button>
               </div>
            </div>
         </div>
      )}


      {/* ============================================================================== */}
      {/* 🛰️ ETKİLEŞİMLİ UZAY İSTASYONU MODÜLLERİ */}
      {/* ============================================================================== */}
      
      {/* SOL: MÜZİK UYDUSU (Eski Laf Sokma Duvarı) */}
      <div className="absolute z-20 flex flex-col items-center" style={{ top: '25%', left: '10%', width: '300px' }}>
         
         <div className="relative flex flex-col items-center group">
            {/* Uydu Sinyal Animasyonu */}
            {spotifyUrl && (
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-white/10 animate-ping opacity-20 pointer-events-none ${roomMode === 'trip' ? 'border-red-500' : 'border-blue-500'}`}></div>
            )}
            
            {/* Holografik Ekran */}
            <div className={`w-full bg-black/40 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] border transition-colors duration-1000 ${roomMode === 'trip' ? 'border-red-500/20' : 'border-blue-400/20'}`}>
               <h3 className="text-[9px] font-black uppercase tracking-widest text-center text-white/50 mb-3 flex items-center justify-center gap-2">
                 <span>📡</span> Frekans Yayını
               </h3>

               <div className="w-full h-[100px] rounded-xl overflow-hidden relative">
                  {spotifyUrl ? (
                    <>
                      <iframe src={getEmbedUrl(spotifyUrl)} width="100%" height="100%" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                      {currentUser === "Efsun" && (
                         <button onClick={clearSpotify} className="absolute -top-2 -right-2 w-6 h-6 bg-red-600/80 backdrop-blur-sm text-white rounded-full text-[10px] font-bold shadow-lg flex items-center justify-center hover:scale-110 z-50 border border-white/20">X</button>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center opacity-50">
                      <span className="text-2xl mb-1">🔇</span>
                      <p className="text-[8px] font-bold tracking-widest uppercase">Sinyal Yok</p>
                    </div>
                  )}
               </div>

               {currentUser === "Efsun" && !spotifyUrl && (
                  <div className="mt-3 flex gap-2 w-full">
                     <input type="text" value={newSpotify} onChange={(e) => setNewSpotify(e.target.value)} placeholder="Spotify link..." className="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] outline-none text-white placeholder:text-white/30 focus:border-blue-400/50 transition-colors" />
                     <button onClick={handleSpotifySubmit} className="bg-white/20 text-white px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/30 transition-colors">Yayınla</button>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* SAĞ: TAKIMYILDIZI (Eski Reels Panosu) */}
      <div className="absolute z-20" style={{ top: '15%', right: '10%', width: '400px', height: '400px' }}>
         <div className="w-full h-full relative">
            <h3 className="absolute -top-6 right-0 text-[9px] font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
               Takımyıldızlarımız <span>✨</span>
            </h3>

            {/* Arka plan silik çizgiler (Radar hissi) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] rounded-full [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] pointer-events-none"></div>

            {/* Çöp Kutusu (Karadelik) */}
            <button onClick={() => setConfirmTrash(true)} className="absolute -bottom-4 -right-4 w-12 h-12 bg-black border border-red-500/30 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-center hover:scale-110 hover:border-red-500 transition-all z-30 group" title="Yıldızları Yut">
               <div className="absolute inset-0 rounded-full bg-red-500/10 opacity-0 group-hover:opacity-100 animate-ping"></div>
               <span className="text-xl">🕳️</span>
            </button>
            
            {confirmTrash && (
               <div className="absolute -bottom-16 right-0 bg-black/80 backdrop-blur-md p-3 rounded-xl shadow-xl border border-red-500/50 z-50 w-36 text-center">
                  <p className="text-[9px] font-bold mb-2 uppercase tracking-widest text-red-400">Yutulsun mu?</p>
                  <div className="flex gap-2">
                     <button onClick={() => setConfirmTrash(false)} className="flex-1 bg-white/10 text-white rounded-lg text-[9px] py-1.5 font-bold hover:bg-white/20">İptal</button>
                     <button onClick={emptyTrash} className="flex-1 bg-red-600 text-white rounded-lg text-[9px] py-1.5 font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)]">Evet</button>
                  </div>
               </div>
            )}

            {/* Yıldızlar ve Bağlantı Çizgileri */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {reels.map((reel, index) => {
                if (index === 0) return null;
                const prev = STAR_COORDS[(index - 1) % STAR_COORDS.length];
                const curr = STAR_COORDS[index % STAR_COORDS.length];
                return (
                  <line 
                    key={`line-${reel.id}`} 
                    x1={`${prev.x}%`} y1={`${prev.y}%`} 
                    x2={`${curr.x}%`} y2={`${curr.y}%`} 
                    stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4"
                  />
                );
              })}
            </svg>

            {reels.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center opacity-30 text-white font-bold text-xs uppercase tracking-widest">Boşluk...</div>
            ) : (
               reels.map((reel, index) => {
                 const coord = STAR_COORDS[index % STAR_COORDS.length];
                 return (
                   <a 
                     href={reel.url} target="_blank" rel="noopener noreferrer" 
                     key={reel.id} 
                     className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] hover:scale-150 transition-transform group flex items-center justify-center cursor-pointer"
                     style={{ left: `${coord.x}%`, top: `${coord.y}%`, transform: 'translate(-50%, -50%)' }}
                   >
                      <div className="absolute w-8 h-8 rounded-full border border-white/20 animate-ping opacity-50 pointer-events-none"></div>
                      <div className="absolute top-6 whitespace-nowrap bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                         {reel.note || "Bilinmeyen Yıldız"}
                      </div>
                   </a>
                 );
               })
            )}

            {/* Yıldız Ekleme Çekmecesi */}
            {currentUser === "Efsun" && (
               <div className="absolute top-[105%] right-0 w-[250px] bg-black/60 backdrop-blur-md p-3 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 z-20">
                  <input type="text" value={newReelUrl} onChange={(e) => setNewReelUrl(e.target.value)} placeholder="Bağlantı (URL)..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2 mb-2 text-[9px] outline-none text-white focus:border-white/30 transition-colors" />
                  <input type="text" value={newReelNote} onChange={(e) => setNewReelNote(e.target.value)} placeholder="Kısa bir not..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2 mb-2 text-[9px] outline-none text-white focus:border-white/30 transition-colors" />
                  <button onClick={handleAddReel} className="w-full py-2 bg-white/10 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-white/20 transition-colors shadow-sm">Gökyüzüne Ekle ✨</button>
               </div>
            )}
         </div>
      </div>


      {/* ============================================================================== */}
      {/* 🌍 GEZEGEN VE SİLUET (Eski Çerçeve) */}
      {/* ============================================================================== */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none z-10 flex justify-center">
         {/* Gezegen Yüzeyi */}
         <div className={`w-full h-full rounded-t-[300px] bg-gradient-to-t from-black via-[#0f172a] to-[#1e293b] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden border-t border-white/10 transition-colors duration-1000 ${roomMode === 'trip' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/moon-crater.png')] opacity-30 mix-blend-overlay"></div>
            
            {/* Gölgeli Fotoğraf (Siluet) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[120px] h-[150px] opacity-80 mix-blend-screen overflow-hidden rounded-t-full border-t border-white/20">
               {roomMode === 'trip' ? (
                  <div className="w-full h-full bg-black/80 flex items-center justify-center">
                    <span className="text-white/20 text-xs uppercase tracking-widest font-bold">Karanlık</span>
                  </div>
               ) : (
                  <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-60" alt="Birlikte" />
               )}
            </div>
         </div>
      </div>


      {/* ============================================================================== */}
      {/* ☄️ SİNİR BOZUCU METEOR (Eski Peluş Tavşan) */}
      {/* ============================================================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes meteor-float {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -30px) rotate(45deg); }
          50% { transform: translate(-10px, -50px) rotate(90deg); }
          75% { transform: translate(-30px, -20px) rotate(135deg); }
          100% { transform: translate(0, 0) rotate(180deg); }
        }
        .animate-meteor { animation: meteor-float 10s ease-in-out infinite alternate; }
        .meteor-hit { transform: scale(0.8); filter: brightness(2); }
      `}} />

      {meteorHealth > 0 && (
         <div 
           onClick={hitMeteor}
           className="absolute z-30 cursor-pointer animate-meteor flex flex-col items-center justify-center"
           style={{ bottom: '30%', right: '35%', transition: 'all 0.2s' }}
           title="Stres Meteoru (Parçala!)"
         >
            {/* Çatlaklar cana göre artar */}
            <div className={`relative flex items-center justify-center ${meteorHitAnim ? 'meteor-hit' : 'hover:scale-110'} transition-transform`}>
               <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] grayscale opacity-80" style={{ transform: `scale(${0.8 + meteorHealth * 0.1})` }}>
                  🥔
               </span>
               <div className="absolute text-white/50 text-[10px] font-black">{meteorHealth}</div>
            </div>
         </div>
      )}

    </main>
  );
}